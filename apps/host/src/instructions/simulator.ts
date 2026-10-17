import Ajv from 'ajv';
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { DiscoveryError, ToolNotFoundError, ValidationError } from '../errors.js';
import { formatArgForCoder } from '../accounts/coder.js';
import { resolveInstructionAccounts } from './resolver.js';

/**
 * Prepares a state-changing instruction tool for wallet handoff.
 * Validates arguments, deterministically resolves accounts, encodes instruction data,
 * and simulates transaction execution on Solana RPC.
 *
 * @param {object} params
 * @param {import('@solana/web3.js').Connection} params.connection Active Solana RPC connection
 * @param {Map<string, any>} params.programs Discovered programs map
 * @param {string} params.toolName Name of the instruction tool
 * @param {Record<string, any>} [params.args={}] Tool arguments
 * @param {object} [params.options={}] Options including signer/wallet and simulate flag
 * @param {string} [params.defaultCommitment='confirmed'] Default commitment level
 * @returns {Promise<{ tool: string, programId: string, instruction: TransactionInstruction, simulation: any, effects: any, accounts: Array<{ name: string, pubkey: string, isSigner: boolean, isWritable: boolean }> }>}
 */
export async function prepareAndSimulateInstruction({
  connection,
  programs,
  toolName,
  args = {},
  options = {},
  defaultCommitment = 'confirmed',
}) {
  let targetContext = null;
  let targetTool = null;

  if (options.programId) {
    targetContext = programs.get(options.programId);
    if (!targetContext) {
      throw new DiscoveryError(`Program '${options.programId}' has not been discovered.`);
    }
    targetTool = targetContext.tools.find((t) => t.name === toolName);
  } else {
    for (const ctx of programs.values()) {
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

  // 4. Resolve Accounts
  const { keys, accountsSummary } = resolveInstructionAccounts({
    idlInstruction,
    toolAccounts: targetTool.solana.accounts || {},
    programId: targetContext.programId,
    args,
    signerPubkey,
  });

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
    const latestBlockhash = await connection.getLatestBlockhash(options.commitment || defaultCommitment);
    tx.recentBlockhash = latestBlockhash.blockhash;

    const simResult = await connection.simulateTransaction(tx);
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
