import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export interface CommandTool {
  name: string;
  description?: string;
  solana?: {
    kind?: string;
  };
}

export interface CommandContext {
  connection: Connection;
  programId?: string;
  signerPubkey?: PublicKey | null;
  tools?: Array<CommandTool>;
  clearHistory: () => void;
}

export interface CommandResult {
  handled: boolean;
  output?: string;
  shouldExit?: boolean;
}

/**
 * Handles terminal slash commands.
 *
 * @param input Raw user input string
 * @param context Command execution context
 * @returns Command execution result
 */
export async function handleSlashCommand(input: string, context: CommandContext): Promise<CommandResult> {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) {
    return { handled: false };
  }

  const [cmd, ...cmdArgs] = trimmed.split(' ');

  switch (cmd.toLowerCase()) {
    case '/help': {
      const output = [
        'Available Slash Commands:',
        '  /tools     - List all discovered on-chain Web3MCP tools and descriptions',
        '  /balance   - Check connected wallet SOL balance on the selected RPC',
        '  /clear     - Reset the conversation context and message history',
        '  /help      - Display this list of available commands',
        '  /exit      - Exit the interactive agent session',
      ].join('\n');
      return { handled: true, output };
    }

    case '/tools': {
      const tools = context.tools || [];
      if (tools.length === 0) {
        return { handled: true, output: 'No tools discovered. Run with a valid --program <programId>.' };
      }
      const lines = [`Discovered Tools (${tools.length}):`];
      for (const t of tools) {
        const kind = t.solana?.kind === 'accountRead' ? '📖 READ' : '✍️ WRITE';
        lines.push(`  • ${t.name.padEnd(20)} [${kind}] - ${t.description || 'No description'}`);
      }
      return { handled: true, output: lines.join('\n') };
    }

    case '/balance': {
      if (!context.signerPubkey) {
        return { handled: true, output: 'No local wallet configured. Run with --keypair <path>.' };
      }
      try {
        const lamports = await context.connection.getBalance(context.signerPubkey, 'confirmed');
        const sol = (lamports / LAMPORTS_PER_SOL).toFixed(4);
        return {
          handled: true,
          output: `Wallet: ${context.signerPubkey.toBase58()}\nBalance: ${sol} SOL (${lamports} lamports)`,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { handled: true, output: `Failed to fetch balance: ${msg}` };
      }
    }

    case '/clear': {
      context.clearHistory();
      return { handled: true, output: 'Conversation context cleared.' };
    }

    case '/exit':
    case '/quit': {
      return { handled: true, shouldExit: true, output: 'Goodbye!' };
    }

    default: {
      return {
        handled: true,
        output: `Unknown command '${cmd}'. Type /help for available commands.`,
      };
    }
  }
}
