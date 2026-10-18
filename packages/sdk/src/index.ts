import { Connection, Commitment, SendTransactionError, Transaction } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import { utils } from '@coral-xyz/anchor';
import { validateToolInput } from '@web3mcp/protocol/validator';
import crypto from 'node:crypto';
import { Web3McpHostError, ValidationError, TransactionConfirmationUnknownError } from './errors.js';
import { discoverProgram } from './discovery/index.js';
import { queryTools, findTool, resolveToolContext } from './tools/registry.js';
import { formatOpenAiTools } from './tools/schema.js';
import { readAccount } from './accounts/reader.js';
import { prepareAndSimulateInstruction } from './instructions/simulator.js';
import { resolveInstructionAccounts } from './instructions/resolver.js';
import type { AccountReadResult, DiscoveredProgram, InstructionOptions, PreparedInstruction, ReadOptions, Web3McpTool } from './types.js';

export interface Web3McpHostOptions {
  connection: Connection;
  commitment?: Commitment;
}

/**
 * Web3MCP SDK: Generic runtime for discovering, querying, and preparing
 * Solana program tools directly from on-chain accounts.
 */
export class Web3McpSdk {
  connection: Connection;
  commitment: Commitment;
  programs: Map<string, any>;

  /**
   * @param options
   */
  constructor(options: Web3McpHostOptions) {
    const { connection, commitment = 'confirmed' } = options || {};
    if (!connection) {
      throw new Web3McpHostError('Web3McpSdk requires an active @solana/web3.js Connection instance.');
    }
    this.connection = connection;
    this.commitment = commitment;

    // In-memory registry of discovered programs: programId -> ProgramContext
    this.programs = new Map();
  }

  /**
   * Discovers a Solana program's published Web3MCP tools via RPC.
   *
   * @param {string} programId Base58 Solana program ID
   * @returns {Promise<DiscoveredProgram>}
   */
  async discover(programId: string): Promise<DiscoveredProgram> {
    const context = await discoverProgram(this.connection, programId, this.commitment);
    this.programs.set(programId, context);
    return context;
  }

  /**
   * Retrieves registered tool descriptors across all discovered programs or for a specific programId.
   *
   * @param {string} [programId] Optional programId to filter tools
   * @returns {Web3McpTool[]} Array of protocol-compliant tool descriptors
   */
  getTools(programId?: string): Web3McpTool[] {
    return queryTools(this.programs, programId);
  }

  /**
   * Retrieves a specific tool descriptor by name.
   *
   * @param name Tool name
   * @param programId Optional programId to scope the search
   * @returns Tool descriptor
   */
  getTool(name: string, programId?: string): Web3McpTool {
    return findTool(this.programs, name, programId);
  }

  /**
   * Converts registered tool descriptors into the standard OpenAI tool/function calling format.
   *
   * @param programId Optional programId filter
   * @returns Array of OpenAI tool definitions
   */
  toOpenAiTools(programId?: string) {
    const tools = this.getTools(programId);
    if (!programId) {
      const names = new Set<string>();
      for (const tool of tools) {
        if (names.has(tool.name)) throw new ValidationError(`Tool '${tool.name}' exists in multiple programs; specify a program ID.`);
        names.add(tool.name);
      }
    }
    return formatOpenAiTools(tools);
  }

  /** Resolve the accounts of a published instruction tool without RPC, simulation, or signing. */
  resolveToolAccounts(toolName: string, args: Record<string, unknown> = {}, options: InstructionOptions = {}): PreparedInstruction['accounts'] {
    const { context, tool } = resolveToolContext(this.programs, toolName, options.programId);
    if (tool.solana.kind !== 'instruction') throw new ValidationError(`Tool '${toolName}' is not an instruction tool.`);
    const input = validateToolInput(tool, args);
    if (!input.valid) throw new ValidationError(`Invalid arguments for tool '${toolName}': ${input.errors.join('; ')}`);
    const instruction = context.idl.instructions.find((item: any) => item.name === tool.solana.instruction);
    if (!instruction) throw new ValidationError(`Instruction '${tool.solana.instruction}' is not defined in program IDL.`);
    const rawSigner = options.signer ?? options.wallet;
    let signerPubkey: PublicKey | null = null;
    if (rawSigner) {
      try { signerPubkey = new PublicKey('publicKey' in Object(rawSigner) ? (rawSigner as { publicKey: PublicKey }).publicKey : rawSigner as PublicKey | string); }
      catch (error) { throw new ValidationError(`Invalid signer public key: ${error instanceof Error ? error.message : String(error)}`); }
    }
    return resolveInstructionAccounts({ idlInstruction: instruction, toolAccounts: tool.solana.accounts || {},
      programId: context.programId, args, signerPubkey }).accountsSummary;
  }

  /**
   * Executes an accountRead tool by querying live Solana RPC, verifying account ownership
   * and 8-byte Anchor discriminator, and decoding data via runtime Borsh coders.
   *
   * @param {string} toolName Name of the tool to execute
   * @param {Record<string, any>} [args={}] Tool arguments
   * @param {object} [options] Query options
   * @returns {Promise<AccountReadResult>}
   */
  async executeRead(toolName: string, args: Record<string, unknown> = {}, options: ReadOptions = {}): Promise<AccountReadResult> {
    return readAccount({
      connection: this.connection,
      programs: this.programs,
      toolName,
      args,
      options,
      defaultCommitment: this.commitment,
    });
  }

  /**
   * Prepares a state-changing instruction tool for wallet handoff.
   * Validates arguments, deterministically resolves accounts, encodes instruction data,
   * and simulates transaction execution on Solana RPC.
   *
   * @param {string} toolName Name of the instruction tool
   * @param {Record<string, any>} [args={}] Tool arguments
   * @param {object} [options] Instruction options
   * @returns {Promise<PreparedInstruction>}
   */
  async prepareInstruction(toolName: string, args: Record<string, unknown> = {}, options: InstructionOptions = {}): Promise<PreparedInstruction> {
    return prepareAndSimulateInstruction({
      connection: this.connection,
      programs: this.programs,
      toolName,
      args,
      options,
      defaultCommitment: this.commitment,
    });
  }

  /** Broadcast only a wallet-signed copy of the reviewed, successfully simulated message. */
  async submitSignedTransaction(prepared: Pick<PreparedInstruction, 'transaction' | 'messageHash' | 'simulation' | 'lastValidBlockHeight'>,
    signedTransaction: Transaction): Promise<{ signature: string }> {
    if (!prepared?.simulation || prepared.simulation.err) {
      throw new Web3McpHostError('A successful simulation is required before submission.');
    }
    if (!Number.isSafeInteger(prepared.lastValidBlockHeight) || !prepared.transaction?.recentBlockhash) {
      throw new Web3McpHostError('Prepared transaction has no valid blockhash lifetime.');
    }
    const expected = crypto.createHash('sha256').update(prepared.transaction.serializeMessage()).digest('hex');
    const actual = crypto.createHash('sha256').update(signedTransaction.serializeMessage()).digest('hex');
    if (expected !== prepared.messageHash || actual !== expected) {
      throw new Web3McpHostError('Signed transaction message changed after review.');
    }
    if (!signedTransaction.verifySignatures(true)) {
      throw new Web3McpHostError('Signed transaction has missing or invalid required signatures.');
    }
    const signedBytes = Buffer.from(signedTransaction.serialize());
    const signedSignature = utils.bytes.bs58.encode(signedTransaction.signature!);
    const reviewedBlockhash = prepared.transaction.recentBlockhash;
    if (await this.connection.getBlockHeight(this.commitment) > prepared.lastValidBlockHeight) {
      throw new Web3McpHostError('Prepared transaction blockhash expired; prepare and review again.');
    }
    let signature;
    try {
      signature = await this.connection.sendRawTransaction(signedBytes, {
        skipPreflight: false,
        preflightCommitment: this.commitment,
      });
    } catch (error) {
      if (error instanceof SendTransactionError) throw error;
      throw new TransactionConfirmationUnknownError(signedSignature, error);
    }
    let result;
    try {
      result = await this.connection.confirmTransaction({
        signature,
        blockhash: reviewedBlockhash,
        lastValidBlockHeight: prepared.lastValidBlockHeight,
      }, this.commitment);
    } catch (error) {
      throw new TransactionConfirmationUnknownError(signature, error);
    }
    if (result.value.err) {
      throw new Web3McpHostError(`Transaction ${signature} failed during confirmation: ${JSON.stringify(result.value.err)}`);
    }
    return { signature };
  }
}

export * from './errors.js';
export type * from './types.js';
