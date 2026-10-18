import { validateToolInput } from '@web3mcp/protocol/validator';
import { PublicKey } from '@solana/web3.js';
import {
  ValidationError,
  AccountSecurityError,
  AccountDiscriminatorMismatchError,
} from '../errors.js';
import { formatDecodedValue } from './coder.js';
import { resolveToolContext } from '../tools/registry.js';

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
  const { context: targetContext, tool: targetTool } = resolveToolContext(programs, toolName, options.programId);

  if (targetTool.solana?.kind !== 'accountRead') {
    throw new ValidationError(`Tool '${toolName}' is not an accountRead tool.`);
  }

  // 1. Validate arguments against inputSchema
  const inputResult = validateToolInput(targetTool, args);
  if (!inputResult.valid) {
    throw new ValidationError(`Invalid arguments for tool '${toolName}': ${inputResult.errors.join('; ')}`);
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
  const accountInfo = await connection.getAccountInfo(inputPubkey, commitment);
  if (!accountInfo) {
    return {
      exists: false,
      address: inputPubkey.toBase58(),
      account: accountTypeName,
      data: null,
    };
  }

  // 3. Verify Account Ownership
  if (accountInfo.owner.toBase58() !== programId) {
    throw new AccountSecurityError(
      `Account '${inputPubkey.toBase58()}' is not owned by program '${programId}'. Owner: '${accountInfo.owner.toBase58()}'.`
    );
  }

  // 4. Verify the validated IDL discriminator, including Anchor custom discriminators.
  const accountDefinition = targetContext.idl?.accounts?.find(account => account.name === accountTypeName);
  if (!Array.isArray(accountDefinition?.discriminator) || accountDefinition.discriminator.length !== 8) {
    throw new ValidationError(`Account '${accountTypeName}' has no validated 8-byte IDL discriminator.`);
  }
  const expectedDiscriminator = Buffer.from(accountDefinition.discriminator);

  if (accountInfo.data.length < 8) {
    throw new AccountDiscriminatorMismatchError(
      `Account data length ${accountInfo.data.length} is shorter than 8-byte Anchor discriminator.`
    );
  }

  const accountDiscriminator = accountInfo.data.subarray(0, 8);
  if (!accountDiscriminator.equals(expectedDiscriminator)) {
    throw new AccountDiscriminatorMismatchError(
      `Account '${inputPubkey.toBase58()}' discriminator mismatch: expected ${expectedDiscriminator.toString('hex')}, got ${accountDiscriminator.toString('hex')}.`
    );
  }

  // 5. Dynamic Borsh Decode via runtime accounts coder
  let decoded;
  try {
    const rawDecoded = targetContext.coders.accounts.decode(accountTypeName, accountInfo.data);
    decoded = formatDecodedValue(rawDecoded);
  } catch (err) {
    throw new ValidationError(`Failed to decode account '${accountTypeName}': ${err.message}`, err);
  }

  return {
    exists: true,
    address: inputPubkey.toBase58(),
    account: accountTypeName,
    data: decoded,
  };
}
