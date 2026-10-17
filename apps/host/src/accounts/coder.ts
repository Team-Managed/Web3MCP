import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { ConfigValidationError } from '../errors.js';

const BN = anchor.BN || anchor.default?.BN;

export const BorshInstructionCoder =
  anchor.BorshInstructionCoder || anchor.default?.BorshInstructionCoder;
export const BorshAccountsCoder =
  anchor.BorshAccountsCoder || anchor.default?.BorshAccountsCoder;

export function normalizeAccountName(name) {
  return String(name).replace(/_/g, '').toLowerCase();
}

export function formatArgForCoder(val, typeDef) {
  if (val === undefined || val === null) return val;
  if (typeof typeDef === 'string') {
    if (['u64', 'u128', 'i64', 'i128'].includes(typeDef)) {
      return new BN(String(val));
    }
    if (['u8', 'u16', 'u32', 'i8', 'i16', 'i32'].includes(typeDef)) {
      return Number(val);
    }
    if (typeDef === 'pubkey') {
      return new PublicKey(val);
    }
    if (typeDef === 'bool') {
      return Boolean(val);
    }
    if (typeDef === 'bytes') {
      return Buffer.from(val);
    }
  }
  return val;
}

export function formatDecodedValue(val) {
  if (val === null || val === undefined) return val;
  if (typeof val === 'object') {
    if (
      val._bn ||
      val.constructor?.name === 'BN' ||
      (typeof val.toString === 'function' && typeof val.toNumber === 'function')
    ) {
      return val.toString(10);
    }
    if (val.toBase58 && typeof val.toBase58 === 'function') {
      return val.toBase58();
    }
    if (Array.isArray(val)) {
      return val.map(formatDecodedValue);
    }
    const formatted = {};
    for (const [k, v] of Object.entries(val)) {
      formatted[k] = formatDecodedValue(v);
    }
    return formatted;
  }
  return val;
}

/**
 * Dynamically instantiates runtime Anchor Borsh coders from on-chain IDL.
 *
 * @param {any} idl Anchor IDL object
 * @returns {{ instruction: any, instructions: any, accounts: any }|null}
 */
export function createRuntimeCoders(idl) {
  if (!idl) return null;
  try {
    const ixCoder = new BorshInstructionCoder(idl);
    const accCoder = new BorshAccountsCoder(idl);
    return {
      instruction: ixCoder,
      instructions: ixCoder,
      accounts: accCoder,
    };
  } catch (err) {
    throw new ConfigValidationError(`Failed to initialize runtime Borsh coders from IDL: ${err.message}`, err);
  }
}
