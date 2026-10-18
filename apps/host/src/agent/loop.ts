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
    }) => Promise<{ role: string; content: string; toolCalls?: Array<AgentToolCall> }>;
  };
  host: Web3McpSdk;
  signer?: Keypair | null;
  programId?: string;
  onDiscoverProgram?: (reference: string) => Promise<{ programId: string; toolNames: string[] }>;
  onToken?: (token: string) => void;
  onApprovalRequest?: ApprovalHandler;
  onProgress?: AgentProgressHandler;
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
  maxTurns = 5,
}: ExecuteTurnParams): Promise<string> {
  let activeProgramId = programId;
  let turnsCount = 0;

  while (turnsCount < maxTurns) {
    turnsCount++;
    const tools = onDiscoverProgram && !activeProgramId ? [] : host.toOpenAiTools(activeProgramId);
    if (onDiscoverProgram) {
      if (tools.some((tool: any) => tool.function?.name === 'web3mcp_host_discover_program')) {
        throw new Error('Program tool conflicts with the host discovery tool.');
      }
      tools.unshift({ type: 'function', function: {
        name: 'web3mcp_host_discover_program',
        description: 'Resolve a Solana program ID or .sns name, validate its Web3MCP config PDA, and register its published tools for the next turn.',
        parameters: { type: 'object', properties: { reference: { type: 'string', description: 'Solana program ID or .sns name' } }, required: ['reference'], additionalProperties: false },
      } } as any);
    }
    const advertisedNames = new Set(tools.map((tool: any) => tool.function?.name));

    onProgress?.({ type: 'thinking', turn: turnsCount });

    const response = await llmClient.chat({
      messages,
      tools,
      onToken,
    });

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

    // Process all proposed tool calls
    let discoveredThisTurn = false;
    for (const toolCall of response.toolCalls) {
      const toolName = toolCall.name;
      const toolArgs = toolCall.arguments || {};

      if (toolName === 'web3mcp_host_discover_program' && onDiscoverProgram) {
        try {
          if (typeof toolArgs.reference !== 'string' || !toolArgs.reference.trim()) throw new Error('A program ID or .sns name is required.');
          const found = await onDiscoverProgram(toolArgs.reference);
          activeProgramId = found.programId;
          discoveredThisTurn = true;
          onProgress?.({ type: 'discovery_result', programId: found.programId, toolNames: found.toolNames });
          messages.push({ role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify(found) });
        } catch (err: any) {
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
        }
      } else if (toolKind === 'instruction') {
        try {
          if (!signer) throw new Error('No wallet configured; use /wallet to select a keypair before requesting a write.');
          onProgress?.({ type: 'simulating', tool: toolName });
          const prep = await host.prepareInstruction(toolName, toolArgs, {
            signer: signer?.publicKey,
            programId: activeProgramId,
          });

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
            if (!signer) {
              throw new Error('Cannot sign transaction: no signer keypair configured on host.');
            }
            onProgress?.({ type: 'broadcasting', tool: toolName });
            prep.transaction.sign(signer);
            const broadcastResult = await host.submitSignedTransaction(prep, prep.transaction);
            const explorerUrl = host.connection.rpcEndpoint?.includes('devnet')
              ? `https://explorer.solana.com/tx/${broadcastResult.signature}?cluster=devnet`
              : undefined;

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
