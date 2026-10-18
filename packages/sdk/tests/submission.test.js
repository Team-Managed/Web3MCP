import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair, SystemProgram, Transaction } from '@solana/web3.js';
import crypto from 'node:crypto';
import { utils } from '@coral-xyz/anchor';
import { Web3McpSdk, TransactionConfirmationUnknownError } from '../dist/index.js';

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
  let confirmationThrows = false;
  let broadcastThrows = false;
  const connection = {
    getBlockHeight: async () => height,
    sendRawTransaction: async () => { sends++; if (broadcastThrows) throw new Error('fetch failed'); return 'sig'; },
    confirmTransaction: async () => {
      if (confirmationThrows) throw new Error('RPC timed out');
      return { value: { err: confirmationError } };
    },
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
  confirmationThrows = true;
  await assert.rejects(sdk.submitSignedTransaction(prepared, signed), error => {
    assert.ok(error instanceof TransactionConfirmationUnknownError);
    assert.equal(error.signature, 'sig');
    assert.match(error.message, /check its status before retrying/i);
    return true;
  });
  broadcastThrows = true;
  await assert.rejects(sdk.submitSignedTransaction(prepared, signed), error => {
    assert.ok(error instanceof TransactionConfirmationUnknownError);
    assert.equal(error.signature, utils.bytes.bs58.encode(signed.signature));
    return true;
  });
});

test('submission sends the verified signed bytes if a caller mutates the transaction during RPC wait', async () => {
  const { signer, prepared } = fixture();
  const signed = new Transaction().add(...prepared.transaction.instructions);
  signed.feePayer = signer.publicKey;
  signed.recentBlockhash = prepared.transaction.recentBlockhash;
  signed.sign(signer);
  const reviewedBytes = Buffer.from(signed.serialize());
  let sentBytes;
  const sdk = new Web3McpSdk({ connection: {
    getBlockHeight: async () => {
      signed.instructions[0] = SystemProgram.transfer({ fromPubkey: signer.publicKey,
        toPubkey: Keypair.generate().publicKey, lamports: 999 });
      signed.sign(signer);
      return 50;
    },
    sendRawTransaction: async bytes => { sentBytes = bytes; return 'signature'; },
    confirmTransaction: async () => ({ value: { err: null } }),
  } });
  await sdk.submitSignedTransaction(prepared, signed);
  assert.deepEqual(sentBytes, reviewedBytes);
});
