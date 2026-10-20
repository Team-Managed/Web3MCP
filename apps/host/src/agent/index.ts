import { Keypair, PublicKey } from '@solana/web3.js';
import { Web3McpSdk } from '@web3mcp/sdk';
import { createLlmClient, CreateLlmClientOptions } from '../llm/index.js';
import { createSystemPrompt } from './prompt.js';
import { handleSlashCommand, CommandResult } from './commands.js';
import { executeAgentTurn, ApprovalHandler } from './loop.js';

export interface Web3McpAgentOptions {
  host: Web3McpSdk;
  llmClient?: any;
  llmOptions?: CreateLlmClientOptions;
  model?: string;
  provider?: 'openai' | 'anthropic' | 'gemini' | 'groq' | 'ollama';
  apiKey?: string;
  signer?: Keypair | null;
  programId?: string;
  onApprovalRequest?: ApprovalHandler;
  onDiscoverProgram?: (reference: string) => Promise<{ programId: string; toolNames: string[] }>;
}

/**
 * High-leverage Web3MCP conversational agent orchestrator.
 * Manages grounded multi-turn conversation state, executes read tools autonomously,
 * halts on state-changing transactions for wallet review and signing, and processes slash commands.
 */
export class Web3McpAgent {
  host: Web3McpSdk;
  llmClient: any;
  signer: Keypair | null;
  programId?: string;
  onApprovalRequest?: ApprovalHandler;
  onDiscoverProgram?: (reference: string) => Promise<{ programId: string; toolNames: string[] }>;
  messages: Array<any>;

  constructor({
    host,
    llmClient,
    llmOptions,
    model,
    provider,
    apiKey,
    signer = null,
    programId,
    onApprovalRequest,
    onDiscoverProgram,
  }: Web3McpAgentOptions) {
    if (!host) {
      throw new Error('Web3McpAgent requires an active Web3McpSdk instance.');
    }
    this.host = host;
    this.signer = signer;
    this.programId = programId;
    this.onApprovalRequest = onApprovalRequest;
    this.onDiscoverProgram = onDiscoverProgram;

    const resolvedLlmOptions: CreateLlmClientOptions = {
      ...(llmOptions || {}),
      ...(model ? { model } : {}),
      ...(provider ? { provider } : {}),
      ...(apiKey ? { apiKey } : {}),
    };
    this.llmClient = llmClient || createLlmClient(resolvedLlmOptions);
    this.messages = [];
    this.initSystemPrompt();
  }

  private initSystemPrompt(preserveHistory = false): void {
    let tools: any[] = [];
    try {
      tools = this.programId ? this.host.getTools(this.programId) : this.host.getTools();
    } catch {
      tools = [];
    }
    const systemContent = createSystemPrompt({
      programId: this.programId,
      signerAddress: this.signer ? this.signer.publicKey.toBase58() : undefined,
      tools,
      canDiscoverPrograms: Boolean(this.onDiscoverProgram),
    });
    if (preserveHistory && this.messages.length) this.messages[0] = { role: 'system', content: systemContent };
    else this.messages = [{ role: 'system', content: systemContent }];
  }

  /**
   * Resets the conversational history back to the grounding system prompt.
   */
  clearHistory(): void {
    this.initSystemPrompt();
  }

  setSigner(signer: Keypair | null): void {
    this.signer = signer;
    this.initSystemPrompt(true);
  }

  setProgramId(programId: string): void {
    this.programId = programId;
    this.initSystemPrompt(true);
  }

  /**
   * Returns current conversation messages.
   */
  getHistory(): Array<any> {
    return [...this.messages];
  }

  /**
   * Handles interactive slash commands or returns handled: false if standard prompt.
   *
   * @param input Raw user string
   * @returns Command result
   */
  async handleCommand(input: string): Promise<CommandResult> {
    if (!input.trimStart().startsWith('/')) return { handled: false };
    let tools: Array<any> = [];
    if (/^\/tools(?:\s|$)/i.test(input.trim())) {
      try { tools = this.host.getTools(this.programId); } catch { /* A pending or failed discovery has no tools. */ }
    }
    return handleSlashCommand(input, {
      connection: this.host.connection,
      programId: this.programId,
      signerPubkey: this.signer ? this.signer.publicKey : null,
      tools,
      clearHistory: () => this.clearHistory(),
    });
  }

  /**
   * Sends a user prompt to the agent, streaming response tokens and resolving tool calls.
   *
   * @param userInput User text input
   * @param onToken Optional streaming token callback
   * @param onProgress Optional tool and lifecycle progress callback
   * @returns Final assistant response
   */
  async prompt(
    userInput: string,
    onToken?: (token: string) => void,
    onProgress?: (event: import('./loop.js').AgentProgressEvent) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const cmdResult = await this.handleCommand(userInput);
    if (cmdResult.handled) {
      return cmdResult.output || '';
    }

    this.messages.push({ role: 'user', content: userInput });

    return executeAgentTurn({
      messages: this.messages,
      llmClient: this.llmClient,
      host: this.host,
      signer: this.signer,
      programId: this.programId,
      onToken,
      onApprovalRequest: this.onApprovalRequest,
      onDiscoverProgram: this.onDiscoverProgram ? async reference => {
        const result = await this.onDiscoverProgram!(reference);
        this.setProgramId(result.programId);
        return result;
      } : undefined,
      onProgress,
      signal,
    });
  }
}

export * from './prompt.js';
export * from './commands.js';
export * from './loop.js';
