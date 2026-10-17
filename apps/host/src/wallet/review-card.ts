import readline from 'node:readline';

/**
 * Formats a high-contrast terminal review card displaying transaction details,
 * account privileges, simulation status, compute units, and financial effects.
 *
 * @param {object} params
 * @param {string} params.tool Name of the instruction tool
 * @param {string} params.programId Program ID
 * @param {Array<any>} params.accounts Array of resolved accounts with privileges
 * @param {any} [params.simulation] Simulation result
 * @param {any} [params.effects] Declared publisher effects
 * @param {number} [params.fee=5000] Estimated transaction fee in lamports
 * @returns {string} Formatted review card
 */
export function formatReviewCard({ tool, programId, accounts = [], simulation, effects, fee = 5000 }) {
  const width = 74;
  const line = '─'.repeat(width);

  const lines = [];
  lines.push(`┌${line}┐`);
  lines.push(`│ ⚠️   TRANSACTION APPROVAL REQUIRED`.padEnd(width + 1) + '│');
  lines.push(`├${line}┤`);
  lines.push(`│ Tool:             ${tool}`.padEnd(width + 1) + '│');
  lines.push(`│ Program ID:       ${programId}`.padEnd(width + 1) + '│');

  if (effects) {
    const financialFlag = effects.financial ? '⚠️ FINANCIAL WRITE' : 'State change';
    lines.push(`│ Effects:          ${effects.summary || 'None'} (${financialFlag})`.padEnd(width + 1) + '│');
  }

  const feeSol = (fee / 1e9).toFixed(6);
  lines.push(`│ Estimated Fee:    ~${feeSol} SOL (${fee} lamports)`.padEnd(width + 1) + '│');
  lines.push(`├${line}┤`);
  lines.push(`│ Accounts Touched:`.padEnd(width + 1) + '│');

  for (const acc of accounts) {
    const privs = [acc.isSigner ? 'SIGNER' : '', acc.isWritable ? 'WRITABLE' : 'READONLY']
      .filter(Boolean)
      .join(', ');
    const displayAddr = acc.pubkey.length > 36 ? acc.pubkey.slice(0, 16) + '...' + acc.pubkey.slice(-12) : acc.pubkey;
    const accLine = `│   • ${acc.name.padEnd(16)}: ${displayAddr} (${privs})`;
    lines.push(accLine.padEnd(width + 1) + '│');
  }

  lines.push(`├${line}┤`);
  const statusStr = simulation?.err ? '❌ FAILED' : '✅ SUCCESS';
  const cus = simulation?.unitsConsumed ? `${simulation.unitsConsumed} CUs consumed` : '0 CUs';
  lines.push(`│ Simulation Status: ${statusStr} (${cus})`.padEnd(width + 1) + '│');

  if (simulation?.logs && simulation.logs.length > 0) {
    lines.push(`│ Key Logs:`.padEnd(width + 1) + '│');
    const relevantLogs = simulation.logs
      .filter((l) => l.includes('Instruction:') || l.includes('success') || l.includes('failed') || l.includes('consumed'))
      .slice(0, 3);
    for (const log of relevantLogs) {
      const truncated = log.length > 68 ? log.slice(0, 65) + '...' : log;
      lines.push(`│   > ${truncated}`.padEnd(width + 1) + '│');
    }
  }

  lines.push(`└${line}┘`);
  return lines.join('\n');
}

/**
 * Prompts the user interactively in the terminal for transaction approval.
 *
 * @param {string} reviewCard Formatted review card to display
 * @param {object} [io] Custom IO streams for testing
 * @returns {Promise<boolean>} Resolves to true if approved, false if rejected
 */
export async function promptApproval(reviewCard, { input = process.stdin, output = process.stdout } = {}) {
  output.write('\n' + reviewCard + '\n');

  const rl = readline.createInterface({ input, output });

  return new Promise((resolve) => {
    rl.question('? Approve and broadcast transaction to Devnet? [y/N] › ', (answer) => {
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
