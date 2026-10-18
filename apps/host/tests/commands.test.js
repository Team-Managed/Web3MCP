import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair } from '@solana/web3.js';
import { handleSlashCommand } from '../dist/agent/index.js';

test('chat cannot silently replace the connected wallet with /keygen', async () => {
  const result = await handleSlashCommand('/keygen /private/tmp', { connection: {}, clearHistory: () => {} });
  assert.match(result.output, /unknown command/i);
});

test('/balance reports the selected RPC balance without claiming Devnet', async () => {
  const signerPubkey = Keypair.generate().publicKey;
  const result = await handleSlashCommand('/balance', {
    connection: { getBalance: async () => 1000000000 }, signerPubkey, clearHistory: () => {},
  });
  assert.match(result.output, /1\.0000 SOL/);
  assert.doesNotMatch(result.output, /Devnet/);
});
