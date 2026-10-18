import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair, SystemProgram, Transaction } from '@solana/web3.js';
import crypto from 'node:crypto';
import { Web3McpSdk } from '../dist/index.js';

function fixture() {
  const signer = Keypair.generate();
  const transaction = new Transaction({
    feePayer: signer.publicKey,
    recentBlockhash: Keypair.generate().publicKey.toBase58(),
  }).add(SystemProgram.transfer({ fromPubkey: signer.publicKey, toPubkey: Keypair.generate().publicKey, lamports: 1 }));
  const prepared = {
    transaction,
    messageHash: crypto.createHash('sha256').update(transaction.serializeMessage()).digest('hex'),
    simulation: { err: null },
    lastValidBlockHeight: 100,
  };
  return { signer, prepared };
}

test('signed submission rejects changed messages and expired blockhashes before RPC broadcast', async () => {
  let sends = 0;
  let height = 50;
  let confirmationError = null;
  const connection = {
    getBlockHeight: async () => height,
    sendRawTransaction: async () => { sends++; return 'sig'; },
    confirmTransaction: async () => ({ value: { err: confirmationError } }),
  };
  const sdk = new Web3McpSdk({ connection });
  const { signer, prepared } = fixture();
  const signed = new Transaction().add(...prepared.transaction.instructions);
  signed.feePayer = signer.publicKey;
  signed.recentBlockhash = prepared.transaction.recentBlockhash;
  signed.sign(signer);
  const changed = new Transaction().add(SystemProgram.transfer({ fromPubkey: signer.publicKey, toPubkey: Keypair.generate().publicKey, lamports: 2 }));
  changed.feePayer = signer.publicKey;
  changed.recentBlockhash = prepared.transaction.recentBlockhash;
  changed.sign(signer);
  await assert.rejects(sdk.submitSignedTransaction(prepared, changed), /changed/i);
  await assert.rejects(sdk.submitSignedTransaction({ ...prepared, simulation: { err: 'failed' } }, signed), /simulation/i);
  const damaged = Transaction.from(signed.serialize());
  damaged.signatures[0].signature = Buffer.alloc(64);
  await assert.rejects(sdk.submitSignedTransaction(prepared, damaged), /signature/i);
  height = 101;
  await assert.rejects(sdk.submitSignedTransaction(prepared, signed), /expired/i);
  assert.equal(sends, 0);
  height = 50;
  const result = await sdk.submitSignedTransaction(prepared, signed);
  assert.equal(result.signature, 'sig');
  assert.equal(sends, 1);
  confirmationError = 'InstructionError';
  await assert.rejects(sdk.submitSignedTransaction(prepared, signed), /confirmation/i);
});
