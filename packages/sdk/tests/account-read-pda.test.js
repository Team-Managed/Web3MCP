import test from 'node:test';
import assert from 'node:assert/strict';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Web3McpSdk } from '../dist/index.js';

test('accountRead derives and reads a program-owned PDA from a wallet address', async () => {
  const programId = Keypair.generate().publicKey.toBase58();
  const owner = Keypair.generate().publicKey;
  const [vault] = PublicKey.findProgramAddressSync([Buffer.from('vault'), owner.toBuffer()], new PublicKey(programId));
  let fetched;
  const sdk = new Web3McpSdk({ connection: {
    getAccountInfo: async address => { fetched = address.toBase58(); return null; },
  } });
  sdk.programs.set(programId, { programId, tools: [{ name: 'get_vault_by_owner',
    inputSchema: { type: 'object', properties: { ownerAddress: { type: 'string', pattern: '^[1-9A-HJ-NP-Za-km-z]{32,44}$' } }, required: ['ownerAddress'], additionalProperties: false },
    solana: { kind: 'accountRead', account: 'Vault', accounts: { vault: { source: 'pda', seeds: [
      { kind: 'const', value: [...Buffer.from('vault')] }, { kind: 'input', input: 'ownerAddress' },
    ] } } },
  }] });
  const result = await sdk.executeRead('get_vault_by_owner', { ownerAddress: owner.toBase58() }, { programId });
  assert.equal(result.exists, false);
  assert.equal(result.address, vault.toBase58());
  assert.equal(fetched, vault.toBase58());
});
