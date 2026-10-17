import { PublicKey } from '@solana/web3.js';
import { deriveConfigPda } from '@web3mcp/protocol/pda';
import { validateConfig } from '@web3mcp/protocol/validator';
import { DiscoveryError, ConfigValidationError } from '../errors.js';
import { createRuntimeCoders } from '../accounts/coder.js';

/**
 * Discovers a Solana program's published Web3MCP tools via RPC.
 *
 * 1. Verifies the program account is executable on-chain.
 * 2. Derives canonical Config PDA (["web3mcp", "config"]).
 * 3. Retrieves the account and validates binary layout & JSON schema via @web3mcp/protocol.
 * 4. Dynamically compiles runtime Anchor Borsh coders from the on-chain IDL.
 *
 * @param {import('@solana/web3.js').Connection} connection Active Solana RPC connection
 * @param {string} programId Base58 Solana program ID
 * @param {import('@solana/web3.js').Commitment} [commitment='confirmed'] Commitment level
 * @returns {Promise<{ programId: string, configPda: string, config: any, idl: any, coders: any, tools: any[] }>}
 */
export async function discoverProgram(connection, programId, commitment = 'confirmed') {
  let programPubkey;
  try {
    programPubkey = new PublicKey(programId);
  } catch (err) {
    throw new DiscoveryError(`Invalid Solana programId '${programId}': ${err.message}`, err);
  }

  // 1. Verify program account exists and is executable
  let programAccount;
  try {
    programAccount = await connection.getAccountInfo(programPubkey, commitment);
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
    configAccount = await connection.getAccountInfo(configPdaPubkey, commitment);
  } catch (err) {
    throw new DiscoveryError(`Failed to fetch Config PDA for '${programId}': ${err.message}`, err);
  }

  if (!configAccount) {
    throw new DiscoveryError(
      `Web3MCP Config PDA does not exist for program '${programId}' at '${configPdaAddress}'.`
    );
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
  const coders = createRuntimeCoders(config.idl);

  return {
    programId,
    configPda: configPdaAddress,
    config,
    idl: config.idl,
    coders,
    tools: Array.isArray(config.tools) ? config.tools : [],
  };
}
