import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { Keypair, Transaction, Connection, TransactionInstruction, Commitment } from '@solana/web3.js';
import { WalletError } from './errors.js';

/**
 * Loads a Solana Keypair from a local file.
 * Defaults to ~/.config/solana/id.json if no path is provided.
 *
 * @param customPath Optional custom path to keypair file
 * @returns Loaded Solana Keypair
 */
export function loadKeypair(customPath?: string): Keypair {
  const defaultPath = path.join(os.homedir(), '.config/solana/id.json');
  const targetPath = customPath
    ? path.resolve(customPath)
    : process.env.SOLANA_KEYPAIR_PATH
    ? path.resolve(process.env.SOLANA_KEYPAIR_PATH)
    : defaultPath;

  if (!fs.existsSync(targetPath)) {
    throw new WalletError(
      `Solana keypair not found at '${targetPath}'. Create one with 'solana-keygen new' or pass --keypair <path>.`
    );
  }

  try {
    const rawData = fs.readFileSync(targetPath, 'utf8');
    const secretKeyArray = JSON.parse(rawData);
    const secretKey = Uint8Array.from(secretKeyArray);
    return Keypair.fromSecretKey(secretKey);
  } catch (err: any) {
    throw new WalletError(`Failed to load keypair from '${targetPath}': ${err.message}`, err);
  }
}

export const loadKeypairFromFile = loadKeypair;

export interface SignAndBroadcastParams {
  connection: Connection;
  instruction: TransactionInstruction;
  signer: Keypair;
  commitment?: Commitment;
}

export interface BroadcastResult {
  signature: string;
  explorerUrl: string;
}

/**
 * Signs and broadcasts a TransactionInstruction to Solana RPC, waiting for confirmation.
 */
export async function signAndBroadcastTransaction({
  connection,
  instruction,
  signer,
  commitment = 'confirmed',
}: SignAndBroadcastParams): Promise<BroadcastResult> {
  if (!connection) throw new WalletError('Missing active Solana connection.');
  if (!instruction) throw new WalletError('Missing TransactionInstruction to sign.');
  if (!signer || !(signer instanceof Keypair)) {
    throw new WalletError('A valid Keypair instance is required to sign transactions.');
  }

  try {
    const tx = new Transaction().add(instruction);
    tx.feePayer = signer.publicKey;

    const latestBlockhash = await connection.getLatestBlockhash(commitment);
    tx.recentBlockhash = latestBlockhash.blockhash;

    tx.sign(signer);

    const rawTransaction = tx.serialize();
    const signature = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: false,
      preflightCommitment: commitment,
    });

    await connection.confirmTransaction(
      {
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      },
      commitment
    );

    return {
      signature,
      explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    };
  } catch (err) {
    throw new WalletError(`Transaction submission failed on Devnet: ${err.message}`, err);
  }
}
