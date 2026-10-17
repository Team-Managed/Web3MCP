import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import {
  Keypair,
  Transaction,
  Connection,
  TransactionInstruction,
  Commitment,
  PublicKey,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new WalletError(`Failed to load keypair from '${targetPath}': ${message}`, err);
  }
}

export const loadKeypairFromFile = loadKeypair;

export interface GenerateKeypairOptions {
  customPath?: string;
  overwrite?: boolean;
}

export interface GeneratedKeypairResult {
  keypair: Keypair;
  path: string;
}

/**
 * Generates a fresh Solana Keypair and saves it to a file with 0600 permissions.
 *
 * @param options Keypair generation options
 * @returns Generated keypair and target path
 */
export function generateKeypairToFile(options: GenerateKeypairOptions = {}): GeneratedKeypairResult {
  const defaultPath = path.join(os.homedir(), '.config/solana/id.json');
  const targetPath = options.customPath
    ? path.resolve(options.customPath)
    : process.env.SOLANA_KEYPAIR_PATH
    ? path.resolve(process.env.SOLANA_KEYPAIR_PATH)
    : defaultPath;

  if (fs.existsSync(targetPath) && !options.overwrite) {
    throw new WalletError(
      `Keypair file already exists at '${targetPath}'. Pass overwrite: true to replace it.`
    );
  }

  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const keypair = Keypair.generate();
  const secretKeyArray = Array.from(keypair.secretKey);
  fs.writeFileSync(targetPath, JSON.stringify(secretKeyArray), { mode: 0o600 });

  return { keypair, path: targetPath };
}

/**
 * Requests an airdrop of SOL on Solana Devnet and waits for confirmation.
 *
 * @param connection Solana RPC connection
 * @param pubkey Recipient public key
 * @param sol Amount of SOL to request (default: 1)
 * @returns Confirmed new balance in lamports
 */
export async function requestDevnetAirdrop(
  connection: Connection,
  pubkey: PublicKey,
  sol = 1
): Promise<number> {
  if (!connection) throw new WalletError('Missing active Solana connection.');
  if (!pubkey) throw new WalletError('Missing recipient public key for airdrop.');

  try {
    const lamports = sol * LAMPORTS_PER_SOL;
    const signature = await connection.requestAirdrop(pubkey, lamports);
    const latestBlockhash = await connection.getLatestBlockhash('confirmed');
    await connection.confirmTransaction(
      {
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      },
      'confirmed'
    );
    return connection.getBalance(pubkey, 'confirmed');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new WalletError(`Airdrop request failed on Devnet: ${message}`, err);
  }
}

export interface SignAndBroadcastParams {
  connection: Connection;
  instruction?: TransactionInstruction;
  transaction?: Transaction;
  lastValidBlockHeight?: number;
  expectedMessageHash?: string;
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
  transaction,
  lastValidBlockHeight,
  expectedMessageHash,
  signer,
  commitment = 'confirmed',
}: SignAndBroadcastParams): Promise<BroadcastResult> {
  if (!connection) throw new WalletError('Missing active Solana connection.');
  if (!transaction && !instruction) throw new WalletError('Missing transaction to sign.');
  if (!signer || !(signer instanceof Keypair)) {
    throw new WalletError('A valid Keypair instance is required to sign transactions.');
  }

  try {
    const tx = transaction || new Transaction().add(instruction!);
    if (transaction) {
      if (!tx.feePayer?.equals(signer.publicKey) || !tx.recentBlockhash || lastValidBlockHeight === undefined) {
        throw new WalletError('Prepared transaction is missing its approved fee payer or blockhash.');
      }
    } else {
      tx.feePayer = signer.publicKey;
      const latestBlockhash = await connection.getLatestBlockhash(commitment);
      tx.recentBlockhash = latestBlockhash.blockhash;
      lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
    }

    const messageHash = crypto.createHash('sha256').update(tx.serializeMessage()).digest('hex');
    if (expectedMessageHash && messageHash !== expectedMessageHash) {
      throw new WalletError('Prepared transaction changed after approval.');
    }

    tx.sign(signer);

    const rawTransaction = tx.serialize();
    const signature = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: false,
      preflightCommitment: commitment,
    });

    const confirmation = await connection.confirmTransaction(
      {
        signature,
        blockhash: tx.recentBlockhash,
        lastValidBlockHeight: lastValidBlockHeight!,
      },
      commitment
    );
    if (confirmation.value.err) {
      throw new WalletError(`Transaction confirmed with error: ${JSON.stringify(confirmation.value.err)}`);
    }

    return {
      signature,
      explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    };
  } catch (err) {
    throw new WalletError(`Transaction submission failed on Devnet: ${err.message}`, err);
  }
}
