import { PublicKey } from '@solana/web3.js';
import { AccountResolutionError } from '../errors.js';
import { normalizeAccountName } from '../accounts/coder.js';

/**
 * Resolves the ordered accounts and keys required for an instruction according to ADR 0008 & ADR 0009.
 * Handles 4-tier resolution:
 *  1. Signer accounts
 *  2. Input argument accounts
 *  3. Program accounts
 *  4. IDL PDA accounts derived from constant, account, or argument seeds.
 *
 * @param {object} params
 * @param {any} params.idlInstruction IDL instruction definition
 * @param {Record<string, any>} [params.toolAccounts={}] Account mappings from tool descriptor
 * @param {string} params.programId Target program ID
 * @param {Record<string, any>} [params.args={}] Tool arguments
 * @param {PublicKey|null} [params.signerPubkey=null] Resolved signer public key
 * @returns {{ keys: Array<{ pubkey: PublicKey, isSigner: boolean, isWritable: boolean }>, accountsSummary: Array<{ name: string, pubkey: string, isSigner: boolean, isWritable: boolean }> }}
 */
export function resolveInstructionAccounts({ idlInstruction, toolAccounts = {}, programId, args = {}, signerPubkey = null }) {
  const resolvedAccounts = new Map();

  const findBinding = (accountName) => {
    if (toolAccounts[accountName]) return toolAccounts[accountName];
    const norm = normalizeAccountName(accountName);
    for (const [k, v] of Object.entries(toolAccounts)) {
      if (normalizeAccountName(k) === norm) return v;
    }
    return null;
  };

  const idlAccountsList = idlInstruction.accounts || [];

  // Pass 1: Resolve non-PDA accounts (signer, input, program, explicit address)
  for (const acc of idlAccountsList) {
    const binding = findBinding(acc.name);
    if (binding) {
      if (binding.source === 'signer') {
        if (!signerPubkey) {
          throw new AccountResolutionError(`Signer is required for instruction account '${acc.name}'.`);
        }
        resolvedAccounts.set(acc.name, signerPubkey);
      } else if (binding.source === 'input') {
        const rawVal = args[binding.input];
        if (!rawVal) {
          throw new AccountResolutionError(`Missing required input argument '${binding.input}' for account '${acc.name}'.`);
        }
        try {
          resolvedAccounts.set(acc.name, new PublicKey(rawVal));
        } catch (err) {
          throw new AccountResolutionError(`Invalid public key for input argument '${binding.input}': ${err.message}`);
        }
      } else if (binding.source === 'program') {
        const addr = binding.address || acc.address || programId;
        resolvedAccounts.set(acc.name, new PublicKey(addr));
      }
    } else {
      if (acc.address) {
        resolvedAccounts.set(acc.name, new PublicKey(acc.address));
      } else if (Boolean(acc.signer ?? acc.isSigner) && signerPubkey) {
        resolvedAccounts.set(acc.name, signerPubkey);
      }
    }
  }

  // Pass 2: Resolve PDA accounts (source: "idl" or acc.pda defined)
  for (const acc of idlAccountsList) {
    const binding = findBinding(acc.name);
    const isIdlSource = binding && binding.source === 'idl';
    if (isIdlSource || (acc.pda && !resolvedAccounts.has(acc.name))) {
      if (!acc.pda || !Array.isArray(acc.pda.seeds)) {
        throw new AccountResolutionError(`Account '${acc.name}' declared with source 'idl' has no PDA seeds defined in IDL.`);
      }

      const seedBuffers = [];
      for (let i = 0; i < acc.pda.seeds.length; i++) {
        const seed = acc.pda.seeds[i];
        if (seed.kind === 'const') {
          if (Array.isArray(seed.value)) {
            seedBuffers.push(Buffer.from(seed.value));
          } else if (typeof seed.value === 'string') {
            seedBuffers.push(Buffer.from(seed.value, 'utf8'));
          } else {
            throw new AccountResolutionError(`Unsupported const seed value type at seed index ${i} for account '${acc.name}'.`);
          }
        } else if (seed.kind === 'account') {
          const pathName = seed.path;
          let refPubkey = resolvedAccounts.get(pathName);
          if (!refPubkey) {
            const norm = normalizeAccountName(pathName);
            for (const [k, v] of resolvedAccounts.entries()) {
              if (normalizeAccountName(k) === norm) {
                refPubkey = v;
                break;
              }
            }
          }
          if (!refPubkey) {
            throw new AccountResolutionError(
              `Cannot derive PDA for '${acc.name}': referenced account seed '${pathName}' has not been resolved.`
            );
          }
          seedBuffers.push(refPubkey.toBuffer());
        } else if (seed.kind === 'arg') {
          const pathName = seed.path;
          const argVal = args[pathName];
          if (argVal === undefined || argVal === null) {
            throw new AccountResolutionError(
              `Cannot derive PDA for '${acc.name}': referenced argument seed '${pathName}' is missing.`
            );
          }
          const argDef = (idlInstruction.args || []).find((a) => a.name === pathName);
          const argType = argDef?.type || 'string';
          if (argType === 'u64' || argType === 'u128') {
            const b = Buffer.alloc(8);
            b.writeBigUInt64LE(BigInt(argVal));
            seedBuffers.push(b);
          } else if (argType === 'u32') {
            const b = Buffer.alloc(4);
            b.writeUInt32LE(Number(argVal));
            seedBuffers.push(b);
          } else if (argType === 'pubkey') {
            seedBuffers.push(new PublicKey(argVal).toBuffer());
          } else {
            seedBuffers.push(Buffer.from(String(argVal), 'utf8'));
          }
        } else {
          throw new AccountResolutionError(`Unsupported seed kind '${seed.kind}' for account '${acc.name}'.`);
        }
      }

      const derivingProgram = acc.pda.program
        ? new PublicKey(acc.pda.program.address || programId)
        : new PublicKey(programId);

      const [derivedPda] = PublicKey.findProgramAddressSync(seedBuffers, derivingProgram);
      resolvedAccounts.set(acc.name, derivedPda);
    }
  }

  // Build the ordered TransactionInstruction keys
  const keys = [];
  const accountsSummary = [];

  for (const acc of idlAccountsList) {
    let pubkey = resolvedAccounts.get(acc.name);
    if (!pubkey) {
      const norm = normalizeAccountName(acc.name);
      for (const [k, v] of resolvedAccounts.entries()) {
        if (normalizeAccountName(k) === norm) {
          pubkey = v;
          break;
        }
      }
    }

    if (!pubkey) {
      throw new AccountResolutionError(`Account '${acc.name}' could not be resolved for instruction '${idlInstruction.name}'.`);
    }

    const binding = findBinding(acc.name);
    const isSigner = Boolean(
      acc.signer ??
      acc.isSigner ??
      (binding && binding.source === 'signer')
    );
    const isWritable = Boolean(acc.writable ?? acc.isMut);

    keys.push({
      pubkey,
      isSigner,
      isWritable,
    });

    accountsSummary.push({
      name: acc.name,
      pubkey: pubkey.toBase58(),
      isSigner,
      isWritable,
    });
  }

  return { keys, accountsSummary };
}
