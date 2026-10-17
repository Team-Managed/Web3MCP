import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair, SystemProgram, Transaction } from '@solana/web3.js';
import * as publisher from '../programs/reference-vault/scripts/publish.js';

test('publisher retries RPC 429s with one signed transaction', async () => {
  const payer = Keypair.generate();
  const rawTransactions = [];
  let signCount = 0;
  let confirmCount = 0;
  const wallet = {
    publicKey: payer.publicKey,
    async signTransaction(transaction) {
      signCount++;
      transaction.sign(payer);
      return transaction;
    },
  };
  const connection = {
    async getLatestBlockhash() { return { blockhash: '11111111111111111111111111111111', lastValidBlockHeight: 100 }; },
    async sendRawTransaction(raw) {
      rawTransactions.push(Buffer.from(raw));
      if (rawTransactions.length === 1) throw new Error('429 Too Many Requests');
      return 'accepted';
    },
    async confirmTransaction() {
      confirmCount++;
      if (confirmCount === 1) throw new Error('429 Too Many Requests');
      return { value: { err: null } };
    },
  };
  const method = {
    async transaction() {
      return new Transaction().add(SystemProgram.transfer({ fromPubkey: payer.publicKey, toPubkey: payer.publicKey, lamports: 1 }));
    },
  };

  const signature = await publisher.sendPublishedTransaction(method, { connection, wallet });
  assert.equal(typeof signature, 'string');
  assert.equal(signCount, 1);
  assert.equal(rawTransactions.length, 2);
  assert.deepEqual(rawTransactions[0], rawTransactions[1]);
  assert.equal(confirmCount, 2);
});
