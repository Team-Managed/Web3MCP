import { Keypair } from '@solana/web3.js';
import { Web3McpSdk, TransactionConfirmationUnknownError } from '@web3mcp/sdk';
import { compactToolResult } from '../llm/compactor.js';
import { formatReviewCard, promptApproval } from '../wallet/review-card.js';

export interface ApprovalRequest {
  tool: string;
  programId: string;
  accounts: Array<any>;
  simulation: any;
  estimatedFeeLamports?: number | null;
  effects: any;
  instruction: any;
  messageHash: string;
  arguments: Record<string, unknown>;
}

export type ApprovalHandler = (req: ApprovalRequest) => Promise<boolean>;

export type AgentProgressEvent =
  | { type: 'thinking'; turn: number }
  | { type: 'discovery_result'; programId: string; toolNames: string[] }
  | { type: 'tool_call'; tool: string; kind: 'accountRead' | 'instruction'; args: Record<string, unknown> }
  | { type: 'tool_result'; tool: string; success: boolean; summary?: string }
  | { type: 'simulating'; tool: string }
  | { type: 'simulation_result'; tool: string; success: boolean; unitsConsumed?: number }
  | { type: 'broadcasting'; tool: string }
  | { type: 'broadcast_confirmed'; tool: string; signature: string; explorerUrl?: string };

export type AgentProgressHandler = (event: AgentProgressEvent) => void;

export interface AgentToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  extra_content?: unknown;
}

export interface ExecuteTurnParams {
  messages: Array<any>;
  llmClient: {
    chat: (params: {
      messages: Array<any>;
      tools?: Array<any>;
      onToken?: (token: string) => void;
      signal?: AbortSignal;
    }) => Promise<{ role: string; content: string; toolCalls?: Array<AgentToolCall> }>;
  };
  host: Web3McpSdk;
  signer?: Keypair | null;
  programId?: string;
  onDiscoverProgram?: (reference: string) => Promise<{ programId: string; toolNames: string[] }>;
  onToken?: (token: string) => void;
  onApprovalRequest?: ApprovalHandler;
  onProgress?: AgentProgressHandler;
  signal?: AbortSignal;
  maxTurns?: number;
}

/**
 * Executes a conversational agent turn: queries LLM, routes tool calls,
 * intercepts instructions for human wallet approval, signs approved transactions,
 * and feeds compacted summaries back to the model.
 *
 * @param params Turn execution parameters
 * @returns Final assistant message string
 */
export async function executeAgentTurn({
  messages,
  llmClient,
  host,
  signer,
  programId,
  onDiscoverProgram,
  onToken,
  onApprovalRequest,
  onProgress,
  signal,
  maxTurns = 5,
}: ExecuteTurnParams): Promise<string> {
  let activeProgramId = programId;
  let turnsCount = 0;
  const readFailures = new Set<string>();

  while (turnsCount < maxTurns) {
    signal?.throwIfAborted();
    turnsCount++;
    const tools = onDiscoverProgram && !activeProgramId ? [] : host.toOpenAiTools(activeProgramId);
    const advertisedNames = new Set(tools.map((tool: any) => tool.function?.name));
    const hostName = (base: string) => {
      let name = base;
      for (let suffix = 1; advertisedNames.has(name); suffix++) name = `${base}_${suffix}`;
      advertisedNames.add(name);
      return name;
    };
    const resolverName = tools.length && typeof host.resolveToolAccounts === 'function'
      ? hostName('web3mcp_host_resolve_accounts') : null;
    const discoveryName = onDiscoverProgram ? hostName('web3mcp_host_discover_program') : null;
    if (resolverName) {
      tools.unshift({ type: 'function', function: {
        name: resolverName,
        description: 'Resolve account addresses, including IDL-defined PDAs, for a published instruction tool using the selected wallet public key. Does not sign, simulate, or submit. Use the returned PDA for accountRead tools that require its address.',
        parameters: { type: 'object', properties: {
          tool: { type: 'string', description: 'Published instruction tool name' },
          arguments: { type: 'object', description: 'Arguments for that instruction tool', additionalProperties: true },
        }, required: ['tool'], additionalProperties: false },
      } } as any);
    }
    if (discoveryName) {
      tools.unshift({ type: 'function', function: {
        name: discoveryName,
        description: 'Resolve a Solana program ID or .sns name, validate its Web3MCP config PDA, and register its published tools for the next turn.',
        parameters: { type: 'object', properties: { reference: { type: 'string', description: 'Solana program ID or .sns name' } }, required: ['reference'], additionalProperties: false },
      } } as any);
    }

    onProgress?.({ type: 'thinking', turn: turnsCount });

    const response = await llmClient.chat({
      messages,
      tools,
      onToken,
      signal,
    });
    signal?.throwIfAborted();

    const assistantMsg: any = {
      role: 'assistant',
      content: response.content || '',
    };

    if (response.toolCalls && response.toolCalls.length > 0) {
      assistantMsg.tool_calls = response.toolCalls.map((tc: AgentToolCall) => ({
        id: tc.id,
        type: 'function',
        function: {
          name: tc.name,
          arguments: JSON.stringify(tc.arguments),
        },
        ...(tc.extra_content ? { extra_content: tc.extra_content } : {}),
      }));
    }

    messages.push(assistantMsg);

    if (!response.toolCalls || response.toolCalls.length === 0) {
      return response.content;
    }

    if (turnsCount === maxTurns) {
      for (const call of response.toolCalls) messages.push({ role: 'tool', tool_call_id: call.id,
        content: JSON.stringify({ error: 'Conversation turn limit reached before tool execution.' }) });
      return 'Reached maximum conversation turn limit. The final requested tools were not executed; check the preceding results for any earlier transactions.';
    }

    // Process all proposed tool calls
    let discoveredThisTurn = false;
    for (const [callIndex, toolCall] of response.toolCalls.entries()) {
      signal?.throwIfAborted();
      const toolName = toolCall.name;
      const toolArgs = toolCall.arguments || {};

      if (toolName === discoveryName && onDiscoverProgram) {
        try {
          if (typeof toolArgs.reference !== 'string' || !toolArgs.reference.trim()) throw new Error('A program ID or .sns name is required.');
          const found = await onDiscoverProgram(toolArgs.reference);
          activeProgramId = found.programId;
          discoveredThisTurn = true;
          onProgress?.({ type: 'discovery_result', programId: found.programId, toolNames: found.toolNames });
          messages.push({ role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify(found) });
        } catch (err: any) {
          if (signal?.aborted) throw err;
          messages.push({ role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify({ error: err.message }) });
        }
        continue;
      }

      if (onDiscoverProgram && !activeProgramId) {
        messages.push({ role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify({ error: 'Discover a program before calling its tools.' }) });
        continue;
      }
      if (onDiscoverProgram && (discoveredThisTurn || !advertisedNames.has(toolName))) {
        messages.push({ role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify({ error: `Tool '${toolName}' was not advertised for this turn. Discover the program first.` }) });
        continue;
      }

      if (toolName === resolverName && advertisedNames.has(toolName)) {
        try {
          if (typeof toolArgs.tool !== 'string' || !toolArgs.tool.trim()) throw new Error('A published instruction tool name is required.');
          const args = toolArgs.arguments ?? {};
          if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Instruction arguments must be an object.');
          const accounts = host.resolveToolAccounts(toolArgs.tool, args as Record<string, unknown>, {
            programId: activeProgramId, ...(signer ? { signer: signer.publicKey } : {}),
          });
          messages.push({ role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify({ accounts }) });
        } catch (err: any) {
          if (signal?.aborted) throw err;
          messages.push({ role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify({ error: err.message }) });
        }
        continue;
      }

      let descriptor: any;
      try {
        descriptor = host.getTool(toolName, activeProgramId);
      } catch (err: any) {
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify({ error: `Tool '${toolName}' not found: ${err.message}` }),
        });
        continue;
      }

      const toolKind: 'accountRead' | 'instruction' = descriptor.solana?.kind || 'accountRead';
      onProgress?.({ type: 'tool_call', tool: toolName, kind: toolKind, args: toolArgs });

      if (toolKind === 'accountRead') {
        try {
          const rawResult = await host.executeRead(toolName, toolArgs, {
            programId: activeProgramId,
            ...(signer ? { signer: signer.publicKey } : {}),
          });
          const compacted = compactToolResult(toolName, rawResult);
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(compacted),
          });
          onProgress?.({ type: 'tool_result', tool: toolName, success: true });
        } catch (err: any) {
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: err.message }),
          });
          onProgress?.({ type: 'tool_result', tool: toolName, success: false, summary: err.message });
          const failure = `${toolName}: ${err.message}`;
          if (readFailures.has(failure)) {
            for (const pending of response.toolCalls.slice(callIndex + 1)) messages.push({ role: 'tool', tool_call_id: pending.id,
              content: JSON.stringify({ error: 'Skipped after a repeated read failure.' }) });
            return `I could not complete ${toolName}: ${err.message}. I stopped retrying the same failed read.`;
          }
          readFailures.add(failure);
        }
      } else if (toolKind === 'instruction') {
        try {
          if (!signer) throw new Error('No wallet configured; use /wallet to select a keypair before requesting a write.');
          onProgress?.({ type: 'simulating', tool: toolName });
          const prep = await host.prepareInstruction(toolName, toolArgs, {
            signer: signer?.publicKey,
            programId: activeProgramId,
          });
          signal?.throwIfAborted();

          onProgress?.({
            type: 'simulation_result',
            tool: toolName,
            success: Boolean(prep.simulation && !prep.simulation.err),
            unitsConsumed: prep.simulation?.unitsConsumed,
          });

          if (!prep.simulation || prep.simulation.err) {
            throw new Error(`Simulation failed for '${toolName}'.`);
          }

          let approved = false;

          if (onApprovalRequest) {
            approved = await onApprovalRequest({
              tool: toolName,
              programId: prep.programId,
              accounts: prep.accounts,
              simulation: prep.simulation,
              estimatedFeeLamports: prep.estimatedFeeLamports,
              effects: prep.effects,
              instruction: prep.instruction,
              messageHash: prep.messageHash,
              arguments: toolArgs,
            });
          } else {
            const card = formatReviewCard({
              tool: toolName,
              programId: prep.programId,
              accounts: prep.accounts,
              simulation: prep.simulation,
              effects: prep.effects,
              fee: prep.estimatedFeeLamports,
              messageHash: prep.messageHash,
              args: toolArgs,
            });
            approved = await promptApproval(card);
          }

          if (approved) {
            signal?.throwIfAborted();
            if (!signer) {
              throw new Error('Cannot sign transaction: no signer keypair configured on host.');
            }
            onProgress?.({ type: 'broadcasting', tool: toolName });
            prep.transaction.sign(signer);
            const broadcastResult = await host.submitSignedTransaction(prep, prep.transaction);
            let explorerUrl: string | undefined;
            try {
              const genesis = await host.connection.getGenesisHash();
              const cluster = ({
                EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG: 'devnet',
                '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d': 'mainnet-beta',
                '4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY': 'testnet',
              } as Record<string, string>)[genesis];
              if (cluster) explorerUrl = `https://explorer.solana.com/tx/${broadcastResult.signature}?cluster=${cluster}`;
            } catch { /* A confirmed signature remains valid when Explorer network lookup fails. */ }

            onProgress?.({
              type: 'broadcast_confirmed',
              tool: toolName,
              signature: broadcastResult.signature,
              explorerUrl,
            });

            const compacted = compactToolResult(toolName, {
              ...prep,
              confirmedSignature: broadcastResult.signature,
              explorerUrl,
            });

            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(compacted),
            });
          } else {
            // User rejected transaction in wallet approval prompt
            const declinedResult = compactToolResult(toolName, {
              ...prep,
              declined: true,
              error: 'Transaction rejected by user.',
            });
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(declinedResult),
            });
          }
        } catch (err: any) {
          if (signal?.aborted) throw err;
          const uncertain = err instanceof TransactionConfirmationUnknownError;
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(uncertain
              ? { status: 'confirmation_unknown', signature: err.signature, error: err.message }
              : { error: `Instruction preparation/signing failed: ${err.message}` }),
          });
          onProgress?.({ type: 'tool_result', tool: toolName, success: false, summary: err.message });
        }
      }
    }
  }

  return 'Reached maximum conversation turn limit.';
}
