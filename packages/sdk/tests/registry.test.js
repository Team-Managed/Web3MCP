import test from 'node:test';
import assert from 'node:assert/strict';
import { Connection } from '@solana/web3.js';
import { Web3McpSdk } from '../dist/index.js';

test('duplicate tool names require a program ID', () => {
  const sdk = new Web3McpSdk({ connection: new Connection('http://127.0.0.1:8899') });
  sdk.programs.set('first', { tools: [{ name: 'read', solana: { kind: 'accountRead' } }] });
  sdk.programs.set('second', { tools: [{ name: 'read', solana: { kind: 'accountRead' } }] });
  assert.throws(() => sdk.getTool('read'), /multiple programs/i);
  assert.throws(() => sdk.toOpenAiTools(), /multiple programs/i);
  assert.equal(sdk.getTool('read', 'second').name, 'read');
});
