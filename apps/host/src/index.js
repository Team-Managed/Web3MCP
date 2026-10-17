import crypto from 'node:crypto';
import Ajv from 'ajv';
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
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

const BN = anchor.BN || anchor.default?.BN;

function normalizeAccountName(name) {
  return String(name).replace(/_/g, '').toLowerCase();
}

function formatArgForCoder(val, typeDef) {
  if (val === undefined || val === null) return val;
  if (typeof typeDef === 'string') {
    if (['u64', 'u128', 'i64', 'i128'].includes(typeDef)) {
      return new BN(String(val));
    }
    if (['u8', 'u16', 'u32', 'i8', 'i16', 'i32'].includes(typeDef)) {
      return Number(val);
    }
    if (typeDef === 'pubkey') {
      return new PublicKey(val);
    }
    if (typeDef === 'bool') {
      return Boolean(val);
    }
    if (typeDef === 'bytes') {
      return Buffer.from(val);
    }
  }
  return val;
}

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
        const ixCoder = new BorshInstructionCoder(config.idl);
        const accCoder = new BorshAccountsCoder(config.idl);
        coders = {
          instruction: ixCoder,
          instructions: ixCoder,
          accounts: accCoder,
        };
      } catch (err) {
        throw new ConfigValidationError(`Failed to initialize runtime Borsh coders from IDL: ${err.message}`, err);
      }
    }

    const context = {
      programId,
      configPda: configPdaAddress,
      config,
      idl: config.idl,
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

  /**
   * Prepares a state-changing instruction tool for wallet handoff.
   * Validates arguments, deterministically resolves accounts (signer, input, program, IDL PDA seeds),
   * encodes instruction data using dynamic Borsh coders, and simulates transaction execution on Solana RPC.
   *
   * @param {string} toolName Name of the instruction tool
   * @param {Record<string, any>} [args={}] Tool arguments
   * @param {object} [options]
   * @param {string|PublicKey|object} [options.signer] Caller's signer public key or wallet
   * @param {string|PublicKey|object} [options.wallet] Alias for options.signer
   * @param {string} [options.programId] Optional programId scoping the tool
   * @param {boolean} [options.simulate=true] Whether to run transaction simulation via RPC
   * @param {import('@solana/web3.js').Commitment} [options.commitment] Optional override commitment level
   * @returns {Promise<{ tool: string, programId: string, instruction: TransactionInstruction, simulation: any, effects: any, accounts: Array<{ name: string, pubkey: string, isSigner: boolean, isWritable: boolean }> }>}
   */
  async prepareInstruction(toolName, args = {}, options = {}) {
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

    if (targetTool.solana?.kind !== 'instruction') {
      throw new ValidationError(`Tool '${toolName}' is not an instruction tool.`);
    }

    // 1. Validate arguments against tool's inputSchema
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(targetTool.inputSchema || { type: 'object' });
    const valid = validate(args);
    if (!valid) {
      const errorMsgs = (validate.errors || []).map((e) => `${e.instancePath || '<root>'}: ${e.message}`);
      throw new ValidationError(`Invalid arguments for tool '${toolName}': ${errorMsgs.join('; ')}`);
    }

    // 2. Resolve target instruction from embedded IDL
    const instructionName = targetTool.solana.instruction;
    const idlInstructions = targetContext.idl?.instructions || [];
    const idlInstruction = idlInstructions.find((ix) => ix.name === instructionName);
    if (!idlInstruction) {
      throw new ValidationError(`Instruction '${instructionName}' is not defined in program IDL.`);
    }

    // 3. Resolve signer public key
    let signerPubkey = null;
    const rawSigner = options.signer || options.wallet;
    if (rawSigner) {
      if (rawSigner.publicKey && rawSigner.publicKey instanceof PublicKey) {
        signerPubkey = rawSigner.publicKey;
      } else if (rawSigner instanceof PublicKey) {
        signerPubkey = rawSigner;
      } else if (typeof rawSigner === 'string') {
        try {
          signerPubkey = new PublicKey(rawSigner);
        } catch (err) {
          throw new ValidationError(`Invalid signer public key '${rawSigner}': ${err.message}`);
        }
      }
    }

    // 4. Resolve Accounts according to ADR 0008 & ADR 0009
    const toolAccounts = targetTool.solana.accounts || {};
    const resolvedAccounts = new Map();

    const findBinding = (accountName) => {
      if (toolAccounts[accountName]) return toolAccounts[accountName];
      const norm = normalizeAccountName(accountName);
      for (const [k, v] of Object.entries(toolAccounts)) {
        if (normalizeAccountName(k) === norm) return v;
      }
      return null;
    };

    const idlAccountsList = idlInstruction.accounts || [];

    // Pass 1: Resolve non-PDA accounts (signer, input, program, explicit address)
    for (const acc of idlAccountsList) {
      const binding = findBinding(acc.name);
      if (binding) {
        if (binding.source === 'signer') {
          if (!signerPubkey) {
            throw new ValidationError(`Signer is required for instruction account '${acc.name}'.`);
          }
          resolvedAccounts.set(acc.name, signerPubkey);
        } else if (binding.source === 'input') {
          const rawVal = args[binding.input];
          if (!rawVal) {
            throw new ValidationError(`Missing required input argument '${binding.input}' for account '${acc.name}'.`);
          }
          try {
            resolvedAccounts.set(acc.name, new PublicKey(rawVal));
          } catch (err) {
            throw new ValidationError(`Invalid public key for input argument '${binding.input}': ${err.message}`);
          }
        } else if (binding.source === 'program') {
          const addr = binding.address || acc.address || targetContext.programId;
          resolvedAccounts.set(acc.name, new PublicKey(addr));
        }
      } else {
        if (acc.address) {
          resolvedAccounts.set(acc.name, new PublicKey(acc.address));
        } else if (Boolean(acc.signer ?? acc.isSigner) && signerPubkey) {
          resolvedAccounts.set(acc.name, signerPubkey);
        }
      }
    }

    // Pass 2: Resolve PDA accounts (source: "idl" or acc.pda defined)
    for (const acc of idlAccountsList) {
      const binding = findBinding(acc.name);
      const isIdlSource = binding && binding.source === 'idl';
      if (isIdlSource || (acc.pda && !resolvedAccounts.has(acc.name))) {
        if (!acc.pda || !Array.isArray(acc.pda.seeds)) {
          throw new ValidationError(`Account '${acc.name}' declared with source 'idl' has no PDA seeds defined in IDL.`);
        }

        const seedBuffers = [];
        for (let i = 0; i < acc.pda.seeds.length; i++) {
          const seed = acc.pda.seeds[i];
          if (seed.kind === 'const') {
            if (Array.isArray(seed.value)) {
              seedBuffers.push(Buffer.from(seed.value));
            } else if (typeof seed.value === 'string') {
              seedBuffers.push(Buffer.from(seed.value, 'utf8'));
            } else {
              throw new ValidationError(`Unsupported const seed value type at seed index ${i} for account '${acc.name}'.`);
            }
          } else if (seed.kind === 'account') {
            const pathName = seed.path;
            let refPubkey = resolvedAccounts.get(pathName);
            if (!refPubkey) {
              const norm = normalizeAccountName(pathName);
              for (const [k, v] of resolvedAccounts.entries()) {
                if (normalizeAccountName(k) === norm) {
                  refPubkey = v;
                  break;
                }
              }
            }
            if (!refPubkey) {
              throw new ValidationError(
                `Cannot derive PDA for '${acc.name}': referenced account seed '${pathName}' has not been resolved.`
              );
            }
            seedBuffers.push(refPubkey.toBuffer());
          } else if (seed.kind === 'arg') {
            const pathName = seed.path;
            const argVal = args[pathName];
            if (argVal === undefined || argVal === null) {
              throw new ValidationError(
                `Cannot derive PDA for '${acc.name}': referenced argument seed '${pathName}' is missing.`
              );
            }
            const argDef = (idlInstruction.args || []).find((a) => a.name === pathName);
            const argType = argDef?.type || 'string';
            if (argType === 'u64' || argType === 'u128') {
              const b = Buffer.alloc(8);
              b.writeBigUInt64LE(BigInt(argVal));
              seedBuffers.push(b);
            } else if (argType === 'u32') {
              const b = Buffer.alloc(4);
              b.writeUInt32LE(Number(argVal));
              seedBuffers.push(b);
            } else if (argType === 'pubkey') {
              seedBuffers.push(new PublicKey(argVal).toBuffer());
            } else {
              seedBuffers.push(Buffer.from(String(argVal), 'utf8'));
            }
          } else {
            throw new ValidationError(`Unsupported seed kind '${seed.kind}' for account '${acc.name}'.`);
          }
        }

        const derivingProgram = acc.pda.program
          ? new PublicKey(acc.pda.program.address || targetContext.programId)
          : new PublicKey(targetContext.programId);

        const [derivedPda] = PublicKey.findProgramAddressSync(seedBuffers, derivingProgram);
        resolvedAccounts.set(acc.name, derivedPda);
      }
    }

    // Build the ordered TransactionInstruction keys
    const keys = [];
    const accountsSummary = [];

    for (const acc of idlAccountsList) {
      let pubkey = resolvedAccounts.get(acc.name);
      if (!pubkey) {
        const norm = normalizeAccountName(acc.name);
        for (const [k, v] of resolvedAccounts.entries()) {
          if (normalizeAccountName(k) === norm) {
            pubkey = v;
            break;
          }
        }
      }

      if (!pubkey) {
        throw new ValidationError(`Account '${acc.name}' could not be resolved for instruction '${instructionName}'.`);
      }

      const binding = findBinding(acc.name);
      const isSigner = Boolean(
        acc.signer ??
        acc.isSigner ??
        (binding && binding.source === 'signer')
      );
      const isWritable = Boolean(acc.writable ?? acc.isMut);

      keys.push({
        pubkey,
        isSigner,
        isWritable,
      });

      accountsSummary.push({
        name: acc.name,
        pubkey: pubkey.toBase58(),
        isSigner,
        isWritable,
      });
    }

    // 5. Format arguments for Borsh instruction coder
    const formattedArgs = {};
    for (const argDef of idlInstruction.args || []) {
      const val = args[argDef.name];
      if (val !== undefined && val !== null) {
        formattedArgs[argDef.name] = formatArgForCoder(val, argDef.type);
      }
    }

    // 6. Encode instruction data via dynamic runtime coder
    let data;
    try {
      data = targetContext.coders.instructions.encode(instructionName, formattedArgs);
    } catch (err) {
      throw new ValidationError(`Failed to encode instruction data for '${instructionName}': ${err.message}`, err);
    }

    // 7. Construct TransactionInstruction
    const instruction = new TransactionInstruction({
      programId: new PublicKey(targetContext.programId),
      keys,
      data,
    });

    // 8. Live RPC Simulation
    let simulation = null;
    if (options.simulate !== false) {
      const tx = new Transaction().add(instruction);
      tx.feePayer = signerPubkey || keys.find((k) => k.isSigner)?.pubkey || keys[0]?.pubkey;
      const latestBlockhash = await this.connection.getLatestBlockhash(options.commitment || this.commitment);
      tx.recentBlockhash = latestBlockhash.blockhash;

      const simResult = await this.connection.simulateTransaction(tx);
      simulation = {
        err: simResult.value.err,
        logs: simResult.value.logs,
        unitsConsumed: simResult.value.unitsConsumed,
        returnData: simResult.value.returnData,
      };
    }

    return {
      tool: targetTool.name,
      programId: targetContext.programId,
      instruction,
      simulation,
      effects: targetTool.solana.effects || null,
      accounts: accountsSummary,
    };
  }
}

export * from './errors.js';
export * from './llm.js';
export * from './wallet.js';
