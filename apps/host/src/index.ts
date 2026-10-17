import { Connection, Commitment } from '@solana/web3.js';
import { Web3McpHostError } from './errors.js';
import { discoverProgram } from './discovery/index.js';
import { queryTools, findTool } from './tools/registry.js';
import { formatOpenAiTools } from './tools/schema.js';
import { readAccount } from './accounts/reader.js';
import { prepareAndSimulateInstruction } from './instructions/simulator.js';

export interface Web3McpHostOptions {
  connection?: Connection;
  commitment?: Commitment;
}

/**
 * Web3MCP Host: Generic runtime for discovering, querying, and preparing
 * Solana program tools directly from on-chain accounts.
 */
export class Web3McpHost {
  connection: Connection;
  commitment: Commitment;
  programs: Map<string, any>;

  /**
   * @param options
   */
  constructor({ connection, commitment = 'confirmed' }: Web3McpHostOptions = {}) {
    if (!connection) {
      throw new Web3McpHostError('Web3McpHost requires an active @solana/web3.js Connection instance.');
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
   * @returns {Promise<{ programId: string, configPda: string, config: any, idl: any, coders: any, tools: any[] }>}
   */
  async discover(programId) {
    const context = await discoverProgram(this.connection, programId, this.commitment);
    this.programs.set(programId, context);
    return context;
  }

  /**
   * Retrieves registered tool descriptors across all discovered programs or for a specific programId.
   *
   * @param {string} [programId] Optional programId to filter tools
   * @returns {any[]} Array of protocol-compliant tool descriptors
   */
  getTools(programId?: string) {
    return queryTools(this.programs, programId);
  }

  /**
   * Retrieves a specific tool descriptor by name.
   *
   * @param name Tool name
   * @param programId Optional programId to scope the search
   * @returns Tool descriptor
   */
  getTool(name: string, programId?: string) {
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
    return formatOpenAiTools(tools);
  }

  /**
   * Executes an accountRead tool by querying live Solana RPC, verifying account ownership
   * and 8-byte Anchor discriminator, and decoding data via runtime Borsh coders.
   *
   * @param {string} toolName Name of the tool to execute
   * @param {Record<string, any>} [args={}] Tool arguments
   * @param {object} [options] Query options
   * @returns {Promise<{ exists: boolean, address: string, account: string, data: any }>}
   */
  async executeRead(toolName, args = {}, options = {}) {
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
   * @returns {Promise<{ tool: string, programId: string, instruction: any, simulation: any, effects: any, accounts: any[] }>}
   */
  async prepareInstruction(toolName, args = {}, options = {}) {
    return prepareAndSimulateInstruction({
      connection: this.connection,
      programs: this.programs,
      toolName,
      args,
      options,
      defaultCommitment: this.commitment,
    });
  }
}

export * from './errors.js';
export * from './llm/index.js';
export * from './wallet/index.js';
export * from './agent/index.js';
