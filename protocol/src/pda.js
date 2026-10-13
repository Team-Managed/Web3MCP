import { PublicKey } from '@solana/web3.js';

export const CONFIG_PDA_SEEDS = [
  Buffer.from('web3mcp', 'utf8'),
  Buffer.from('config', 'utf8'),
];

/**
 * Derives the Web3MCP Config PDA for a given target Solana program ID.
 * Normative seeds: ["web3mcp", "config"]
 *
 * @param {string} programId Base58 Solana program ID
 * @returns {{ pda: string, bump: number }} Base58 PDA address and bump seed
 */
export function deriveConfigPda(programId) {
  let pubkey;
  try {
    pubkey = new PublicKey(programId);
  } catch (err) {
    throw new Error(`Invalid Solana programId '${programId}': ${err.message}`);
  }

  const [pda, bump] = PublicKey.findProgramAddressSync(CONFIG_PDA_SEEDS, pubkey);
  return {
    pda: pda.toBase58(),
    bump,
  };
}
