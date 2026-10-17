import { Keypair } from '@solana/web3.js';
import { Web3McpHost } from '../index.js';
import { compactToolResult } from '../llm/compactor.js';
import { formatReviewCard, promptApproval } from '../wallet/review-card.js';
import { signAndBroadcastTransaction } from '../wallet/signer.js';

export interface ApprovalRequest {
  tool: string;
  programId: string;
  accounts: Array<any>;
  simulation: any;
  effects: any;
  instruction: any;
}

export type ApprovalHandler = (req: ApprovalRequest) => Promise<boolean>;

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
  host: Web3McpHost;
  signer?: Keypair | null;
  programId?: string;
  onToken?: (token: string) => void;
  onApprovalRequest?: ApprovalHandler;
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
  onToken,
  onApprovalRequest,
  maxTurns = 5,
}: ExecuteTurnParams): Promise<string> {
  const tools = host.toOpenAiTools(programId);
  let turnsCount = 0;

  while (turnsCount < maxTurns) {
    turnsCount++;

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
    for (const toolCall of response.toolCalls) {
      const toolName = toolCall.name;
      const toolArgs = toolCall.arguments || {};

      let descriptor: any;
      try {
        descriptor = host.getTool(toolName, programId);
      } catch (err: any) {
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify({ error: `Tool '${toolName}' not found: ${err.message}` }),
        });
        continue;
      }

      if (descriptor.solana?.kind === 'accountRead') {
        try {
          const rawResult = await host.executeRead(toolName, toolArgs, { programId });
          const compacted = compactToolResult(toolName, rawResult);
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(compacted),
          });
        } catch (err: any) {
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: err.message }),
          });
        }
      } else if (descriptor.solana?.kind === 'instruction') {
        try {
          const prep = await host.prepareInstruction(toolName, toolArgs, {
            signer: signer?.publicKey,
            programId,
          });

          let approved = false;

          if (onApprovalRequest) {
            approved = await onApprovalRequest({
              tool: toolName,
              programId: prep.programId,
              accounts: prep.accounts,
              simulation: prep.simulation,
              effects: prep.effects,
              instruction: prep.instruction,
            });
          } else {
            const card = formatReviewCard({
              tool: toolName,
              programId: prep.programId,
              accounts: prep.accounts,
              simulation: prep.simulation,
              effects: prep.effects,
            });
            approved = await promptApproval(card);
          }

          if (approved) {
            if (!signer) {
              throw new Error('Cannot sign transaction: no signer keypair configured on host.');
            }
            const broadcastResult = await signAndBroadcastTransaction({
              connection: host.connection,
              instruction: prep.instruction,
              signer,
            });

            const compacted = compactToolResult(toolName, {
              ...prep,
              confirmedSignature: broadcastResult.signature,
              explorerUrl: broadcastResult.explorerUrl,
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
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: `Instruction preparation/signing failed: ${err.message}` }),
          });
        }
      }
    }
  }

  return 'Reached maximum conversation turn limit.';
}
