import readline from 'node:readline';
import { c, isColorSupported, padVisible } from '../ui/theme.js';

function safeText(value: unknown, limit = 800): string {
  return String(value ?? '').replace(/[\x00-\x1f\x7f-\x9f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, ' ').slice(0, limit);
}

export interface ReviewCardParams {
  tool: string;
  programId: string;
  accounts?: Array<any>;
  simulation?: any;
  effects?: any;
  fee?: number | null;
  messageHash?: string;
  args?: Record<string, unknown>;
}

export interface PromptApprovalOptions {
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
}

/**
 * Formats a clean terminal review card displaying transaction details,
 * account privileges, simulation status, compute units, and financial effects.
 *
 * @param params Review card parameters
 * @returns Formatted review card
 */
export function formatReviewCard({
  tool,
  programId,
  accounts = [],
  simulation,
  effects,
  fee = null,
  messageHash,
  args,
}: ReviewCardParams): string {
  const termCols = typeof process !== 'undefined' && process.stdout?.columns ? process.stdout.columns : 80;
  const width = Math.min(Math.max(62, termCols - 4), 72);
  const contentWidth = width - 2;
  const line = '─'.repeat(width);

  const border = isColorSupported ? c.gray : '';
  const rst = isColorSupported ? c.reset : '';
  const bld = isColorSupported ? c.bold : '';
  const ylw = isColorSupported ? c.brightYellow : '';
  const grn = isColorSupported ? c.brightGreen : '';
  const red = isColorSupported ? c.brightRed : '';
  const gry = isColorSupported ? c.gray : '';
  const mag = isColorSupported ? c.purple : '';

  const lines: string[] = [];

  function row(content: string): void {
    lines.push(`${border}│${rst} ${padVisible(content, contentWidth)} ${border}│${rst}`);
  }

  // Top border
  lines.push(`${border}╭${line}╮${rst}`);

  // Header Banner
  const headerText = '⚠️   TRANSACTION APPROVAL REQUIRED';
  if (isColorSupported) {
    row(`${bld}${ylw}${headerText}${rst}`);
  } else {
    row(headerText);
  }

  // Divider
  lines.push(`${border}├${line}┤${rst}`);

  // Core metadata
  row(`Tool:             ${isColorSupported ? bld + safeText(tool) + rst : safeText(tool)}`);
  row(`Program ID:       ${isColorSupported ? bld + safeText(programId) + rst : safeText(programId)}`);
  if (args && Object.keys(args).length > 0) {
    row(`Arguments:        ${safeText(JSON.stringify(args))}`);
  }
  if (messageHash) {
    row(`Message SHA-256:  ${safeText(messageHash.slice(0, 32))}`);
    row(`                 ${safeText(messageHash.slice(32))}`);
  }

  if (effects) {
    const financialFlag = effects.financial ? '⚠️ FINANCIAL WRITE' : 'State change';
    const styledFinancial = isColorSupported && effects.financial ? `${red}${bld}${financialFlag}${rst}` : financialFlag;
    row(`Effects:          ${safeText(effects.summary || 'None')} (${styledFinancial})`);
  }

  row(fee == null ? 'Estimated Fee:    unavailable' : `Estimated Fee:    ~${(fee / 1e9).toFixed(6)} SOL (${fee} lamports)`);

  // Divider
  lines.push(`${border}├${line}┤${rst}`);
  row(`${bld}Accounts Touched:${rst}`);

  for (const acc of accounts) {
    const privs = [acc.isSigner ? 'SIGNER' : '', acc.isWritable ? 'WRITABLE' : 'READONLY']
      .filter(Boolean)
      .join(', ');

    let styledPrivs = privs;
    if (isColorSupported) {
      styledPrivs = [
        acc.isSigner ? `${bld}SIGNER${rst}` : '',
        acc.isWritable ? `${ylw}WRITABLE${rst}` : `${gry}READONLY${rst}`,
      ]
        .filter(Boolean)
        .join(', ');
    }

    if (isColorSupported) {
      row(`  • ${bld}${safeText(acc.name, 40)}${rst} (${styledPrivs})`);
    } else {
      row(`  • ${safeText(acc.name, 40)} (${privs})`);
    }
    row(`    ${safeText(acc.pubkey, 80)}`);
  }

  // Divider
  lines.push(`${border}├${line}┤${rst}`);

  // Simulation status
  const statusStr = simulation?.err ? '❌ FAILED' : '✅ SUCCESS';
  const cus = simulation?.unitsConsumed ? `${safeText(simulation.unitsConsumed)} CUs consumed` : '0 CUs';
  const styledStatus = isColorSupported ? (simulation?.err ? `${red}${statusStr}${rst}` : `${grn}${statusStr}${rst}`) : statusStr;
  row(`Simulation Status: ${styledStatus} (${cus})`);

  if (simulation?.logs && simulation.logs.length > 0) {
    row(`${bld}Key Logs:${rst}`);
    const relevantLogs = simulation.logs
      .filter((l: string) => l.includes('Instruction:') || l.includes('success') || l.includes('failed') || l.includes('consumed'))
      .slice(0, 3);
    for (const log of relevantLogs) {
      const maxLogLen = contentWidth - 6;
      const cleanLog = safeText(log);
      const truncated = cleanLog.length > maxLogLen ? cleanLog.slice(0, maxLogLen - 3) + '...' : cleanLog;
      row(`  ${gry}> ${truncated}${rst}`);
    }
  }

  // Bottom border
  lines.push(`${border}╰${line}╯${rst}`);
  return lines.join('\n');
}

/**
 * Prompts the user interactively in the terminal for transaction approval.
 */
export async function promptApproval(
  reviewCard: string,
  { input = process.stdin, output = process.stdout }: PromptApprovalOptions = {}
): Promise<boolean> {
  output.write('\n' + reviewCard + '\n');

  const rl = readline.createInterface({ input, output });
  const promptText = isColorSupported
    ? `? ${c.bold}Approve and broadcast this transaction?${c.reset} [${c.brightGreen}y${c.reset}/${c.brightRed}N${c.reset}] › `
    : '? Approve and broadcast this transaction? [y/N] › ';

  return new Promise<boolean>((resolve) => {
    rl.question(promptText, (answer) => {
      rl.close();
      const trimmed = (answer || '').trim().toLowerCase();
      if (trimmed === 'y' || trimmed === 'yes') {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    rl.on('SIGINT', () => {
      rl.close();
      resolve(false);
    });
  });
}
