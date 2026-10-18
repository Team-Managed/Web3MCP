import { Connection, PublicKey } from '@solana/web3.js';
import { safeResolve } from '@bonfida/spl-name-service/domain';

export type ProgramReference = { kind: 'program' | 'domain'; value: string };

const ADDRESS = '[1-9A-HJ-NP-Za-km-z]{32,44}';
const DOMAIN = '[a-z0-9-]+(?:\\.[a-z0-9-]+)*\\.(?:sns|sol)';
const TOKEN = `(?:${ADDRESS}|${DOMAIN})`;

function asReference(value: string): ProgramReference | null {
  if (/\.(?:sns|sol)$/i.test(value)) return { kind: 'domain', value: value.toLowerCase() };
  try {
    const address = new PublicKey(value);
    return address.toBase58() === value ? { kind: 'program', value } : null;
  } catch {
    return null;
  }
}

/** Select a program only when the user's request identifies it unambiguously. */
export function extractProgramReference(message: string): ProgramReference | null {
  const explicit = new RegExp(`\\bprogram(?:\\s+id)?(?:\\s+is|\\s*:)?\\s+(${TOKEN})\\b`, 'i').exec(message);
  if (explicit) {
    const selected = asReference(explicit[1]);
    if (selected) return selected;
  }
  const matches = [...message.matchAll(new RegExp(`(?<![\\w.-])(${TOKEN})(?![\\w-])`, 'gi'))]
    .map(match => asReference(match[1])).filter((value): value is ProgramReference => value !== null);
  const unique = [...new Map(matches.map(value => [`${value.kind}:${value.value}`, value])).values()];
  if (unique.length > 1) throw new Error('Multiple addresses or names found. State the target as “program ID <address>”.');
  return unique[0] || null;
}

/** Name lookup is separate from protocol discovery; the SDK still validates executable program and config ownership. */
export async function resolveProgramReference(
  reference: ProgramReference,
  resolveName: (name: string) => Promise<string> = async name => {
    const connection = new Connection(process.env.SNS_RPC_URL || 'https://api.mainnet-beta.solana.com', 'confirmed');
    return (await safeResolve(connection, name)).toBase58();
  },
): Promise<string> {
  if (reference.kind === 'program') return reference.value;
  if (reference.value.endsWith('.sol')) {
    throw new Error('.sol resolution is not supported by the current SNS SDK. Use a .sns name or the program ID.');
  }
  const address = await resolveName(reference.value);
  return new PublicKey(address).toBase58();
}
