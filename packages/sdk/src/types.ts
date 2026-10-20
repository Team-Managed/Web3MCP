import type { Commitment, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';

export interface Web3McpTool {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
  solana: { kind: 'accountRead' | 'instruction'; [key: string]: unknown };
}

export interface DiscoveredProgram {
  programId: string;
  configPda: string;
  config: { standard: string; version: string; programId: string; idl: unknown; tools: Web3McpTool[] };
  idl: unknown;
  tools: Web3McpTool[];
  /** Digest of the program deployment and serialized config at discovery. */
  snapshot: string;
}

export type WalletPublicKey = PublicKey | string | { publicKey: PublicKey };
export interface ReadOptions {
  programId?: string;
  commitment?: Commitment;
  signer?: WalletPublicKey;
}
export interface InstructionOptions extends ReadOptions {
  wallet?: WalletPublicKey;
  simulate?: boolean;
}
export interface AccountReadResult {
  exists: boolean;
  address: string;
  account: string;
  data: Record<string, unknown> | null;
}
export interface PreparedInstruction {
  tool: string;
  programId: string;
  /** Discovery snapshot used to prepare the reviewed transaction. */
  snapshot: string;
  instruction: TransactionInstruction;
  transaction: Transaction;
  lastValidBlockHeight: number;
  messageHash: string;
  simulation: { err: unknown; logs?: string[] | null; unitsConsumed?: number } | null;
  estimatedFeeLamports: number | null;
  effects: { stateChanging?: boolean; financial?: boolean; summary?: string } | null;
  accounts: Array<{ name: string; pubkey: string; isSigner: boolean; isWritable: boolean }>;
}
