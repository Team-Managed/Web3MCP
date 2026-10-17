import readline from 'node:readline';
import { c, isColorSupported, padVisible } from '../ui/theme.js';

export interface ReviewCardParams {
  tool: string;
  programId: string;
  accounts?: Array<any>;
  simulation?: any;
  effects?: any;
  fee?: number;
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
  fee = 5000,
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
  row(`Tool:             ${isColorSupported ? bld + tool + rst : tool}`);
  row(`Program ID:       ${isColorSupported ? bld + programId + rst : programId}`);

  if (effects) {
    const financialFlag = effects.financial ? '⚠️ FINANCIAL WRITE' : 'State change';
    const styledFinancial = isColorSupported && effects.financial ? `${red}${bld}${financialFlag}${rst}` : financialFlag;
    row(`Effects:          ${effects.summary || 'None'} (${styledFinancial})`);
  }

  const feeSol = (fee / 1e9).toFixed(6);
  row(`Estimated Fee:    ~${feeSol} SOL (${fee} lamports)`);

  // Divider
  lines.push(`${border}├${line}┤${rst}`);
  row(`${bld}Accounts Touched:${rst}`);

  for (const acc of accounts) {
    const privs = [acc.isSigner ? 'SIGNER' : '', acc.isWritable ? 'WRITABLE' : 'READONLY']
      .filter(Boolean)
      .join(', ');

    const maxAddrLen = Math.max(20, contentWidth - 34);
    const displayAddr = acc.pubkey.length > maxAddrLen
      ? acc.pubkey.slice(0, Math.floor(maxAddrLen / 2) - 2) + '...' + acc.pubkey.slice(-Math.floor(maxAddrLen / 2) + 2)
      : acc.pubkey;

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
      row(`  • ${bld}${acc.name.padEnd(14)}${rst}: ${displayAddr} (${styledPrivs})`);
    } else {
      row(`  • ${acc.name.padEnd(14)}: ${displayAddr} (${privs})`);
    }
  }

  // Divider
  lines.push(`${border}├${line}┤${rst}`);

  // Simulation status
  const statusStr = simulation?.err ? '❌ FAILED' : '✅ SUCCESS';
  const cus = simulation?.unitsConsumed ? `${simulation.unitsConsumed} CUs consumed` : '0 CUs';
  const styledStatus = isColorSupported ? (simulation?.err ? `${red}${statusStr}${rst}` : `${grn}${statusStr}${rst}`) : statusStr;
  row(`Simulation Status: ${styledStatus} (${cus})`);

  if (simulation?.logs && simulation.logs.length > 0) {
    row(`${bld}Key Logs:${rst}`);
    const relevantLogs = simulation.logs
      .filter((l: string) => l.includes('Instruction:') || l.includes('success') || l.includes('failed') || l.includes('consumed'))
      .slice(0, 3);
    for (const log of relevantLogs) {
      const maxLogLen = contentWidth - 6;
      const truncated = log.length > maxLogLen ? log.slice(0, maxLogLen - 3) + '...' : log;
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
    ? `? ${c.bold}Approve and broadcast transaction to Devnet?${c.reset} [${c.brightGreen}y${c.reset}/${c.brightRed}N${c.reset}] › `
    : '? Approve and broadcast transaction to Devnet? [y/N] › ';

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
