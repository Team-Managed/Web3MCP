import crypto from 'node:crypto';
import Ajv from 'ajv';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { deriveConfigPda } from '@web3mcp/protocol/pda';
import { validateConfig } from '@web3mcp/protocol/validator';
import { parseConfigAccount } from '@web3mcp/protocol/account';
import {
  DiscoveryError,
  ConfigValidationError,
  ToolNotFoundError,
  ValidationError,
  AccountSecurityError,
  AccountDiscriminatorMismatchError,
  Web3McpHostError,
} from './errors.js';

function formatDecodedValue(val) {
  if (val === null || val === undefined) return val;
  if (typeof val === 'object') {
    if (val._bn || val.constructor?.name === 'BN' || (typeof val.toString === 'function' && typeof val.toNumber === 'function')) {
      return val.toString(10);
    }
    if (val.toBase58 && typeof val.toBase58 === 'function') {
      return val.toBase58();
    }
    if (Array.isArray(val)) {
      return val.map(formatDecodedValue);
    }
    const formatted = {};
    for (const [k, v] of Object.entries(val)) {
      formatted[k] = formatDecodedValue(v);
    }
    return formatted;
  }
  return val;
}

// Resolve Borsh coders across ESM / CJS module structures
const BorshInstructionCoder =
  anchor.BorshInstructionCoder || anchor.default?.BorshInstructionCoder;
const BorshAccountsCoder =
  anchor.BorshAccountsCoder || anchor.default?.BorshAccountsCoder;

/**
 * Web3MCP Host: Generic runtime for discovering, querying, and preparing
 * Solana program tools directly from on-chain accounts.
 */
export class Web3McpHost {
  /**
   * @param {object} options
   * @param {import('@solana/web3.js').Connection} options.connection Active Solana RPC connection
   * @param {import('@solana/web3.js').Commitment} [options.commitment='confirmed'] Default commitment level
   */
  constructor({ connection, commitment = 'confirmed' } = {}) {
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
   * 1. Verifies the program account is executable on-chain.
   * 2. Derives canonical Config PDA (["web3mcp", "config"]).
   * 3. Retrieves the account and validates binary layout & JSON schema via @web3mcp/protocol.
   * 4. Dynamically compiles runtime Anchor Borsh coders from the on-chain IDL.
   * 5. Registers tools in memory.
   *
   * @param {string} programId Base58 Solana program ID
   * @returns {Promise<{ programId: string, configPda: string, config: any, coders: any, tools: any[] }>}
   */
  async discover(programId) {
    let programPubkey;
    try {
      programPubkey = new PublicKey(programId);
    } catch (err) {
      throw new DiscoveryError(`Invalid Solana programId '${programId}': ${err.message}`, err);
    }

    // 1. Verify program account exists and is executable
    let programAccount;
    try {
      programAccount = await this.connection.getAccountInfo(programPubkey, this.commitment);
    } catch (err) {
      throw new DiscoveryError(`Failed to fetch program account info for '${programId}': ${err.message}`, err);
    }

    if (!programAccount) {
      throw new DiscoveryError(`Address '${programId}' does not exist on-chain.`);
    }

    if (!programAccount.executable) {
      throw new DiscoveryError(`Address '${programId}' is not an executable program.`);
    }

    // 2. Derive canonical Config PDA
    const { pda: configPdaAddress } = deriveConfigPda(programId);
    const configPdaPubkey = new PublicKey(configPdaAddress);

    // 3. Fetch Config PDA
    let configAccount;
    try {
      configAccount = await this.connection.getAccountInfo(configPdaPubkey, this.commitment);
    } catch (err) {
      throw new DiscoveryError(`Failed to fetch Config PDA for '${programId}': ${err.message}`, err);
    }

    if (!configAccount) {
      throw new DiscoveryError(`Web3MCP Config PDA does not exist for program '${programId}' at '${configPdaAddress}'.`);
    }

    // Verify Config PDA is owned by the target program
    if (configAccount.owner.toBase58() !== programId) {
      throw new DiscoveryError(
        `Config PDA owner mismatch: expected program '${programId}', got '${configAccount.owner.toBase58()}'.`
      );
    }

    // 4. Validate binary layout, SHA-256 digest, and JSON schema
    const validationResult = validateConfig(configAccount.data);
    if (!validationResult.valid) {
      throw new ConfigValidationError(
        `On-chain Web3MCP config failed protocol validation: ${validationResult.errors?.join('; ')}`
      );
    }

    const config = validationResult.config;

    // 5. Instantiate dynamic Anchor Borsh coders from on-chain IDL (ADR 0007 / ADR 0008)
    let coders = null;
    if (config.idl) {
      try {
        coders = {
          instruction: new BorshInstructionCoder(config.idl),
          accounts: new BorshAccountsCoder(config.idl),
        };
      } catch (err) {
        throw new ConfigValidationError(`Failed to initialize runtime Borsh coders from IDL: ${err.message}`, err);
      }
    }

    const context = {
      programId,
      configPda: configPdaAddress,
      config,
      coders,
      tools: Array.isArray(config.tools) ? config.tools : [],
    };

    this.programs.set(programId, context);
    return context;
  }

  /**
   * Retrieves registered tool descriptors across all discovered programs or for a specific programId.
   *
   * @param {string} [programId] Optional programId to filter tools
   * @returns {any[]} Array of protocol-compliant tool descriptors
   */
  getTools(programId) {
    if (programId) {
      const context = this.programs.get(programId);
      if (!context) {
        throw new DiscoveryError(`Program '${programId}' has not been discovered.`);
      }
      return context.tools;
    }

    const allTools = [];
    for (const context of this.programs.values()) {
      allTools.push(...context.tools);
    }
    return allTools;
  }

  /**
   * Retrieves a specific tool descriptor by name.
   *
   * @param {string} name Tool name
   * @param {string} [programId] Optional programId to scope the search
   * @returns {any} Tool descriptor
   */
  getTool(name, programId) {
    const tools = this.getTools(programId);
    const tool = tools.find((t) => t.name === name);
    if (!tool) {
      throw new ToolNotFoundError(
        programId
          ? `Tool '${name}' not found for program '${programId}'.`
          : `Tool '${name}' not found in registered tools.`
      );
    }
    return tool;
  }

  /**
   * Converts registered tool descriptors into the standard OpenAI tool/function calling format.
   *
   * @param {string} [programId] Optional programId filter
   * @returns {Array<{ type: 'function', function: { name: string, description: string, parameters: any } }>}
   */
  toOpenAiTools(programId) {
    const tools = this.getTools(programId);
    return tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }));
  }

  /**
   * Executes an accountRead tool by querying live Solana RPC, verifying account ownership
   * and 8-byte Anchor discriminator, and decoding data via runtime Borsh coders.
   *
   * @param {string} toolName Name of the tool to execute
   * @param {Record<string, any>} [args={}] Tool arguments
   * @param {object} [options]
   * @param {string} [options.programId] Optional programId scoping the tool
   * @param {import('@solana/web3.js').Commitment} [options.commitment] Optional override commitment level
   * @returns {Promise<{ exists: boolean, address: string, account: string, data: any }>}
   */
  async executeRead(toolName, args = {}, options = {}) {
    let targetContext = null;
    let targetTool = null;

    if (options.programId) {
      targetContext = this.programs.get(options.programId);
      if (!targetContext) {
        throw new DiscoveryError(`Program '${options.programId}' has not been discovered.`);
      }
      targetTool = targetContext.tools.find((t) => t.name === toolName);
    } else {
      for (const ctx of this.programs.values()) {
        const found = ctx.tools.find((t) => t.name === toolName);
        if (found) {
          targetContext = ctx;
          targetTool = found;
          break;
        }
      }
    }

    if (!targetTool) {
      throw new ToolNotFoundError(
        options.programId
          ? `Tool '${toolName}' not found for program '${options.programId}'.`
          : `Tool '${toolName}' not found in registered tools.`
      );
    }

    if (targetTool.solana?.kind !== 'accountRead') {
      throw new ValidationError(`Tool '${toolName}' is not an accountRead tool.`);
    }

    // 1. Validate arguments against inputSchema
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(targetTool.inputSchema || { type: 'object' });
    const valid = validate(args);
    if (!valid) {
      const errorMsgs = (validate.errors || []).map((e) => `${e.instancePath || '<root>'}: ${e.message}`);
      throw new ValidationError(`Invalid arguments for tool '${toolName}': ${errorMsgs.join('; ')}`);
    }

    const commitment = options.commitment || this.commitment;
    const accountTypeName = targetTool.solana.account;

    // 2. Resolve target account address from solana.accounts mapping
    const accountsMapping = targetTool.solana.accounts || {};
    let rawAddress = null;

    for (const [, binding] of Object.entries(accountsMapping)) {
      if (binding && binding.source === 'input') {
        rawAddress = args[binding.input];
        break;
      }
    }

    if (!rawAddress) {
      throw new ValidationError(`Could not resolve account address for tool '${toolName}'.`);
    }

    let inputPubkey;
    try {
      inputPubkey = new PublicKey(rawAddress);
    } catch (err) {
      throw new ValidationError(`Invalid Base58 account address '${rawAddress}': ${err.message}`);
    }

    const programId = targetContext.programId;
    const [candidatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from(accountTypeName.toLowerCase()), inputPubkey.toBuffer()],
      new PublicKey(programId)
    );

    const inputAccountInfo = await this.connection.getAccountInfo(inputPubkey, commitment);
    const candidateAccountInfo = await this.connection.getAccountInfo(candidatePda, commitment);

    let finalPubkey;
    let finalAccountInfo;

    if (inputAccountInfo && inputAccountInfo.owner.toBase58() === programId) {
      finalPubkey = inputPubkey;
      finalAccountInfo = inputAccountInfo;
    } else if (candidateAccountInfo && candidateAccountInfo.owner.toBase58() === programId) {
      finalPubkey = candidatePda;
      finalAccountInfo = candidateAccountInfo;
    } else if (inputAccountInfo && inputAccountInfo.owner.toBase58() !== programId && !candidateAccountInfo) {
      throw new AccountSecurityError(
        `Account '${inputPubkey.toBase58()}' is not owned by program '${programId}'. Owner: '${inputAccountInfo.owner.toBase58()}'.`
      );
    } else {
      return {
        exists: false,
        address: candidatePda.toBase58(),
        account: accountTypeName,
        data: null,
      };
    }

    // 3. Verify Account Ownership
    if (finalAccountInfo.owner.toBase58() !== programId) {
      throw new AccountSecurityError(
        `Account '${finalPubkey.toBase58()}' is not owned by program '${programId}'. Owner: '${finalAccountInfo.owner.toBase58()}'.`
      );
    }

    // 4. Verify 8-Byte Anchor Discriminator
    const expectedDiscriminator = crypto
      .createHash('sha256')
      .update(`account:${accountTypeName}`)
      .digest()
      .subarray(0, 8);

    if (finalAccountInfo.data.length < 8) {
      throw new AccountDiscriminatorMismatchError(
        `Account data length ${finalAccountInfo.data.length} is shorter than 8-byte Anchor discriminator.`
      );
    }

    const accountDiscriminator = finalAccountInfo.data.subarray(0, 8);
    if (!accountDiscriminator.equals(expectedDiscriminator)) {
      throw new AccountDiscriminatorMismatchError(
        `Account '${finalPubkey.toBase58()}' discriminator mismatch: expected ${expectedDiscriminator.toString('hex')}, got ${accountDiscriminator.toString('hex')}.`
      );
    }

    // 5. Dynamic Borsh Decode via runtime accounts coder
    let decoded;
    try {
      const rawDecoded = targetContext.coders.accounts.decode(accountTypeName, finalAccountInfo.data);
      decoded = formatDecodedValue(rawDecoded);
    } catch (err) {
      throw new ValidationError(`Failed to decode account '${accountTypeName}': ${err.message}`, err);
    }

    return {
      exists: true,
      address: finalPubkey.toBase58(),
      account: accountTypeName,
      data: decoded,
    };
  }
}

export * from './errors.js';
