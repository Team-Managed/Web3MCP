import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import crypto from 'node:crypto';
import { utils } from '@coral-xyz/anchor';
import { serializeConfigAccount, PublicationStatus } from '@web3mcp/protocol/account';
import { deriveConfigPda } from '@web3mcp/protocol/pda';
import { Web3McpSdk, TransactionConfirmationUnknownError } from '../dist/index.js';

function fixture() {
  const signer = Keypair.generate();
  const programId = Keypair.generate().publicKey.toBase58();
  const transaction = new Transaction({
    feePayer: signer.publicKey,
    recentBlockhash: Keypair.generate().publicKey.toBase58(),
  }).add(new TransactionInstruction({ programId: new PublicKey(programId), keys: [], data: Buffer.from([1]) }));
  const prepared = {
    programId,
    commitment: 'confirmed',
    transaction,
    messageHash: crypto.createHash('sha256').update(transaction.serializeMessage()).digest('hex'),
    simulation: { err: null },
    lastValidBlockHeight: 100,
  };
  const configPda = deriveConfigPda(programId).pda;
  const config = { standard: 'web3mcp', version: '0.1.0', programId,
    idl: { address: programId, metadata: { name: 'fixture', version: '0.1.0', spec: '0.1.0' }, instructions: [] }, tools: [] };
  const configData = serializeConfigAccount({ authority: programId, status: PublicationStatus.Published, configUtf8: JSON.stringify(config) });
  const accounts = new Map([
    [programId, { executable: true, owner: SystemProgram.programId, data: Buffer.from([1]) }],
    [configPda, { owner: new PublicKey(programId), data: configData }],
  ]);
  return { signer, prepared, accounts, programId, configPda };
}

test('signed submission rejects changed messages and expired blockhashes before RPC broadcast', async () => {
  let sends = 0;
  let height = 50;
  let confirmationError = null;
  let confirmationThrows = false;
  let broadcastThrows = false;
  const { signer, prepared, accounts, programId } = fixture();
  const connection = {
    getAccountInfo: async address => accounts.get(address.toBase58()) || null,
    getBlockHeight: async () => height,
    sendRawTransaction: async () => { sends++; if (broadcastThrows) throw new Error('fetch failed'); return 'sig'; },
    confirmTransaction: async () => {
      if (confirmationThrows) throw new Error('RPC timed out');
      return { value: { err: confirmationError } };
    },
  };
  const sdk = new Web3McpSdk({ connection });
  prepared.snapshot = (await sdk.discover(programId)).snapshot;
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
  const { signer, prepared, accounts, programId } = fixture();
  const signed = new Transaction().add(...prepared.transaction.instructions);
  signed.feePayer = signer.publicKey;
  signed.recentBlockhash = prepared.transaction.recentBlockhash;
  signed.sign(signer);
  const reviewedBytes = Buffer.from(signed.serialize());
  let sentBytes;
  const sdk = new Web3McpSdk({ connection: {
    getAccountInfo: async address => accounts.get(address.toBase58()) || null,
    getBlockHeight: async () => {
      signed.instructions[0] = SystemProgram.transfer({ fromPubkey: signer.publicKey,
        toPubkey: Keypair.generate().publicKey, lamports: 999 });
      signed.sign(signer);
      return 50;
    },
    sendRawTransaction: async bytes => { sentBytes = bytes; return 'signature'; },
    confirmTransaction: async () => ({ value: { err: null } }),
  } });
  prepared.snapshot = (await sdk.discover(programId)).snapshot;
  await sdk.submitSignedTransaction(prepared, signed);
  assert.deepEqual(sentBytes, reviewedBytes);
});

test('submission rejects a changed config or program before broadcast', async () => {
  const { signer, prepared, accounts, programId, configPda } = fixture();
  let broadcasts = 0;
  const sdk = new Web3McpSdk({ connection: {
    getAccountInfo: async address => accounts.get(address.toBase58()) || null,
    getBlockHeight: async () => 50,
    sendRawTransaction: async () => { broadcasts++; return 'sig'; },
  } });
  prepared.snapshot = (await sdk.discover(programId)).snapshot;
  const signed = new Transaction().add(...prepared.transaction.instructions);
  signed.feePayer = signer.publicKey;
  signed.recentBlockhash = prepared.transaction.recentBlockhash;
  signed.sign(signer);
  accounts.set(configPda, { ...accounts.get(configPda), data: Buffer.concat([accounts.get(configPda).data, Buffer.from([0])]) });
  await assert.rejects(sdk.submitSignedTransaction(prepared, signed), /config changed/i);
  assert.equal(broadcasts, 0);
  accounts.set(configPda, { ...accounts.get(configPda), data: accounts.get(configPda).data.subarray(0, -1) });
  accounts.set(programId, { ...accounts.get(programId), data: Buffer.from([2]) });
  await assert.rejects(sdk.submitSignedTransaction(prepared, signed), /config changed/i);
  assert.equal(broadcasts, 0);
});

test('submission checks and broadcasts at the prepared commitment', async () => {
  const { signer, prepared, accounts, programId } = fixture();
  prepared.commitment = 'processed';
  const seen = [];
  const sdk = new Web3McpSdk({ connection: {
    getAccountInfo: async (address, commitment) => { seen.push(commitment); return accounts.get(address.toBase58()) || null; },
    getBlockHeight: async commitment => { seen.push(commitment); return 50; },
    sendRawTransaction: async (_bytes, options) => { seen.push(options.preflightCommitment); return 'signature'; },
    confirmTransaction: async (_strategy, commitment) => { seen.push(commitment); return { value: { err: null } }; },
  }, commitment: 'confirmed' });
  prepared.snapshot = (await sdk.discover(programId)).snapshot;
  seen.length = 0;
  const signed = new Transaction().add(...prepared.transaction.instructions);
  signed.feePayer = signer.publicKey;
  signed.recentBlockhash = prepared.transaction.recentBlockhash;
  signed.sign(signer);
  await sdk.submitSignedTransaction(prepared, signed);
  assert.ok(seen.length > 0);
  assert.deepEqual([...new Set(seen)], ['processed']);
});
