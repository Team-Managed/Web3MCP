import { validateToolInput } from '@web3mcp/protocol/validator';
import crypto from 'node:crypto';
import { PublicKey, Transaction, TransactionInstruction, VersionedTransaction } from '@solana/web3.js';
import { AccountResolutionError, ValidationError } from '../errors.js';
import { formatArgForCoder } from '../accounts/coder.js';
import { resolveInstructionAccounts } from './resolver.js';
import { resolveToolContext } from '../tools/registry.js';
import type { InstructionOptions } from '../types.js';

export function resolveFeePayer(options: InstructionOptions): PublicKey {
  const rawSigner = options.signer || options.wallet;
  if (!rawSigner) throw new AccountResolutionError('A wallet public key is required as transaction fee payer.');
  if (rawSigner instanceof PublicKey) return rawSigner;
  if (typeof rawSigner === 'string') {
    try { return new PublicKey(rawSigner); }
    catch (error) { throw new ValidationError(`Invalid signer public key '${rawSigner}': ${error instanceof Error ? error.message : String(error)}`); }
  }
  if (typeof rawSigner === 'object' && 'publicKey' in rawSigner && rawSigner.publicKey instanceof PublicKey) {
    return rawSigner.publicKey;
  }
  throw new ValidationError('Invalid signer public key.');
}

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
  const { context: targetContext, tool: targetTool } = resolveToolContext(programs, toolName, options.programId);

  if (targetTool.solana?.kind !== 'instruction') {
    throw new ValidationError(`Tool '${toolName}' is not an instruction tool.`);
  }

  // 1. Validate arguments against tool's inputSchema
  const inputResult = validateToolInput(targetTool, args);
  if (!inputResult.valid) {
    throw new ValidationError(`Invalid arguments for tool '${toolName}': ${inputResult.errors.join('; ')}`);
  }

  // 2. Resolve target instruction from embedded IDL
  const instructionName = targetTool.solana.instruction;
  const idlInstructions = targetContext.idl?.instructions || [];
  const idlInstruction = idlInstructions.find((ix) => ix.name === instructionName);
  if (!idlInstruction) {
    throw new ValidationError(`Instruction '${instructionName}' is not defined in program IDL.`);
  }

  // 3. Resolve signer public key
  const signerPubkey = resolveFeePayer(options);

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

  // 8. Prepare the transaction once; approval and signing use this same message.
  const transaction = new Transaction().add(instruction);
  transaction.feePayer = signerPubkey;
  const latestBlockhash = await connection.getLatestBlockhash(options.commitment || defaultCommitment);
  transaction.recentBlockhash = latestBlockhash.blockhash;
  const messageHash = crypto.createHash('sha256').update(transaction.serializeMessage()).digest('hex');

  // 9. Live RPC Simulation
  let simulation = null;
  if (options.simulate !== false) {
    const simResult = await connection.simulateTransaction(new VersionedTransaction(transaction.compileMessage()), {
      commitment: options.commitment || defaultCommitment,
      replaceRecentBlockhash: false,
      sigVerify: false,
    });
    simulation = {
      err: simResult.value.err,
      logs: simResult.value.logs,
      unitsConsumed: simResult.value.unitsConsumed,
      returnData: simResult.value.returnData,
    };
  }

  let estimatedFeeLamports = null;
  try {
    const fee = await connection.getFeeForMessage(transaction.compileMessage(), options.commitment || defaultCommitment);
    estimatedFeeLamports = fee.value;
  } catch {
    // Fee is an estimate; the approval UI must show when it is unavailable.
  }

  return {
    tool: targetTool.name,
    programId: targetContext.programId,
    instruction,
    transaction,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    messageHash,
    simulation,
    estimatedFeeLamports,
    effects: targetTool.solana.effects || null,
    accounts: accountsSummary,
  };
}
