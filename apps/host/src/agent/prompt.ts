import { loadSolanaKnowledge } from './knowledge.js';

export interface SystemPromptContext {
  programId?: string;
  signerAddress?: string;
  tools?: Array<any>;
  includeKnowledge?: boolean;
  knowledgeDir?: string;
}

/**
 * Builds the grounding system prompt for the Web3MCP agent.
 *
 * @param context
 * @returns Grounded system prompt
 */
export function createSystemPrompt({
  programId,
  signerAddress,
  tools = [],
  includeKnowledge = true,
  knowledgeDir,
}: SystemPromptContext = {}): string {
  const toolList = tools
    .map((t) => {
      const kind = t.solana?.kind || 'tool';
      const annotation =
        kind === 'accountRead'
          ? ' [Read-only query: Safe to call autonomously before writes]'
          : kind === 'instruction'
          ? ' [State-changing instruction: Requires user wallet review & approval]'
          : '';
      return `• ${t.name}: ${t.description || 'No description'} (${kind})${annotation}`;
    })
    .join('\n');

  let prompt = `You are Web3MCP Agent, an AI pair programmer and transaction assistant for the Solana blockchain.
You interact with Solana programs by discovering and executing on-chain tools published through the Web3MCP protocol.

Current Context:
${programId ? `• Connected Program ID: ${programId}` : '• No specific program connected.'}
${signerAddress ? `• User Wallet Public Key: ${signerAddress}` : '• No wallet connected.'}

Discovered Tools:
${toolList || '• None discovered yet.'}

Operating Rules:
1. READ-BEFORE-WRITE: Always query current state with accountRead tools before proposing state-changing transactions.
2. WALLET HANDOFF: When an instruction tool is called, the host validates parameters, resolves accounts, and simulates the transaction on Solana RPC. The human user reviews the simulation report in a high-contrast terminal review card and explicitly approves or declines. You NEVER sign transactions.
3. HANDLING REJECTIONS: If a user declines a transaction approval request, acknowledge the refusal politely and ask how they would like to proceed. Do NOT re-submit the same transaction unless asked.
4. TOKEN AND CURRENCY UNITS: Always clarify units (e.g., 1 SOL = 1,000,000,000 lamports). Never pass decimal floats to integer parameter schemas.
5. EXPLORER LINKS: When a transaction is confirmed, provide the Solana Explorer link to the user.`;

  if (includeKnowledge) {
    try {
      const knowledge = loadSolanaKnowledge(knowledgeDir);
      if (knowledge && knowledge.combinedText) {
        prompt += `\n\n---\n\n${knowledge.combinedText}`;
      }
    } catch {
      // Graceful fallback if knowledge directory is unavailable
    }
  }

  return prompt;
}

