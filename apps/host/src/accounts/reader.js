import crypto from 'node:crypto';
import Ajv from 'ajv';
import { PublicKey } from '@solana/web3.js';
import {
  DiscoveryError,
  ToolNotFoundError,
  ValidationError,
  AccountSecurityError,
  AccountDiscriminatorMismatchError,
} from '../errors.js';
import { formatDecodedValue } from './coder.js';

/**
 * Executes an accountRead tool by querying live Solana RPC, verifying account ownership
 * and 8-byte Anchor discriminator, and decoding data via runtime Borsh coders.
 *
 * @param {object} params
 * @param {import('@solana/web3.js').Connection} params.connection Active Solana RPC connection
 * @param {Map<string, any>} params.programs Discovered programs map
 * @param {string} params.toolName Name of the tool to execute
 * @param {Record<string, any>} [params.args={}] Tool arguments
 * @param {object} [params.options={}] Query options
 * @param {string} [params.defaultCommitment='confirmed'] Default commitment
 * @returns {Promise<{ exists: boolean, address: string, account: string, data: any }>}
 */
export async function readAccount({ connection, programs, toolName, args = {}, options = {}, defaultCommitment = 'confirmed' }) {
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

  const commitment = options.commitment || defaultCommitment;
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

  const inputAccountInfo = await connection.getAccountInfo(inputPubkey, commitment);
  const candidateAccountInfo = await connection.getAccountInfo(candidatePda, commitment);

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
