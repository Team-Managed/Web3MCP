import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair, PublicKey } from '@solana/web3.js';
import { Web3McpSdk } from '../dist/index.js';

test('account reads honor the validated discriminator published in the IDL', async () => {
  const programId = Keypair.generate().publicKey.toBase58();
  const address = Keypair.generate().publicKey.toBase58();
  const discriminator = [8, 7, 6, 5, 4, 3, 2, 1];
  const sdk = new Web3McpSdk({ connection: {
    getAccountInfo: async () => ({ owner: new PublicKey(programId), data: Buffer.from([...discriminator, 0]) }),
  } });
  sdk.programs.set(programId, {
    programId,
    idl: { accounts: [{ name: 'Vault', discriminator }] },
    coders: { accounts: { decode: () => ({ balance: 1 }) } },
    tools: [{ name: 'get_vault', inputSchema: {
      type: 'object', properties: { address: { type: 'string' } }, required: ['address'], additionalProperties: false,
    }, solana: { kind: 'accountRead', account: 'Vault', accounts: { vault: { source: 'input', input: 'address' } } } }],
  });

  const result = await sdk.executeRead('get_vault', { address }, { programId });
  assert.deepEqual(result.data, { balance: 1 });
});
