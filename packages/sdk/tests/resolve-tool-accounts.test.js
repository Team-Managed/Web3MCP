import test from 'node:test';
import assert from 'node:assert/strict';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Web3McpSdk, AccountResolutionError } from '../dist/index.js';

test('resolves a published instruction PDA for a wallet without RPC or signing', () => {
  const programId = Keypair.generate().publicKey.toBase58();
  const signer = Keypair.generate().publicKey;
  const sdk = new Web3McpSdk({ connection: new Connection('https://api.devnet.solana.com') });
  sdk.programs.set(programId, { programId, idl: { instructions: [{ name: 'initialize', args: [], accounts: [
    { name: 'owner', signer: true },
    { name: 'vault', pda: { seeds: [{ kind: 'const', value: 'vault' }, { kind: 'account', path: 'owner' }] } },
  ] }] }, tools: [{ name: 'initialize', inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    solana: { kind: 'instruction', instruction: 'initialize', accounts: { owner: { source: 'signer' }, vault: { source: 'idl' } } } }] });
  const accounts = sdk.resolveToolAccounts('initialize', {}, { programId, signer });
  const [expected] = PublicKey.findProgramAddressSync([Buffer.from('vault'), signer.toBuffer()], new PublicKey(programId));
  assert.equal(accounts.find(account => account.name === 'vault').pubkey, expected.toBase58());
  assert.throws(() => sdk.resolveToolAccounts('initialize', { unexpected: true }, { programId, signer }), /Invalid arguments/);
  assert.throws(() => sdk.resolveToolAccounts('initialize', {}, { programId }), AccountResolutionError);
});

test('instruction preparation requires an explicit fee payer before RPC', async () => {
  const programId = Keypair.generate().publicKey.toBase58();
  const sdk = new Web3McpSdk({ connection: { getLatestBlockhash: async () => { throw new Error('RPC must not be called'); } } });
  sdk.programs.set(programId, { programId, idl: { instructions: [{ name: 'ping', args: [], accounts: [] }] },
    tools: [{ name: 'ping', inputSchema: { type: 'object', properties: {}, required: [], additionalProperties: false },
      solana: { kind: 'instruction', instruction: 'ping', accounts: {} } }] });
  await assert.rejects(sdk.prepareInstruction('ping', {}, { programId }), AccountResolutionError);
});
