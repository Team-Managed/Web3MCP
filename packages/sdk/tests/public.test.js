import test from 'node:test';
import assert from 'node:assert/strict';
import { Connection } from '@solana/web3.js';
import { Web3McpSdk } from '../dist/index.js';

test('SDK exports a generic, connection-scoped runtime', () => {
  const sdk = new Web3McpSdk({ connection: new Connection('http://127.0.0.1:8899') });
  assert.deepEqual(sdk.getTools(), []);
  assert.equal(typeof sdk.discover, 'function');
  assert.equal(typeof sdk.executeRead, 'function');
  assert.equal(typeof sdk.prepareInstruction, 'function');
  assert.equal(typeof sdk.submitSignedTransaction, 'function');
});
