import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  Keypair,
  Connection,
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
