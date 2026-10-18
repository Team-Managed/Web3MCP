import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { render } from 'ink-testing-library';
import { Keypair } from '@solana/web3.js';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ChatScreen, TransactionReview } from '../dist/tui/index.js';
import { discoverWalletPaths } from '../dist/tui/wallet-paths.js';

const tick = () => new Promise(resolve => setTimeout(resolve, 25));

test('startup opens chat and / opens the command menu', async () => {
  const app = render(React.createElement(ChatScreen, { rpcUrl: 'https://api.devnet.solana.com' }));
  await tick();
  assert.match(app.lastFrame(), /Model not set/);
  assert.match(app.lastFrame(), /Wallet read only/);
  assert.match(app.lastFrame(), /Web3MCP Compatible Host/);
  app.stdin.write('/');
  await tick();
  app.stdin.write('\r');
  await tick();
  assert.match(app.lastFrame(), /Web3MCP Compatible Host commands/);
  assert.match(app.lastFrame(), /\/model/);
  assert.doesNotMatch(app.lastFrame(), /\/provider|\/key|\/setup/);
  app.unmount();
});

test('slash commands appear while typing and a partial command completes on Enter', async () => {
  const app = render(React.createElement(ChatScreen, { rpcUrl: 'https://api.devnet.solana.com' }));
  try {
    await tick();
    app.stdin.write('/mo');
    await tick();
    assert.match(app.lastFrame(), /\/model  Configure provider, key, and model/);
    assert.doesNotMatch(app.lastFrame(), /\/wallet  Connect a local keypair/);
    app.stdin.write('\r');
    await tick();
    assert.match(app.lastFrame(), /Choose model provider/);
  } finally {
    app.unmount();
  }
});

test('Tab fills a slash command before its argument is typed', async () => {
  const app = render(React.createElement(ChatScreen, { rpcUrl: 'https://api.devnet.solana.com' }));
  try {
    await tick();
    app.stdin.write('/mo');
    await tick();
    app.stdin.write('\t');
    await tick();
    app.stdin.write(' gpt-6-luna');
    await tick();
    app.stdin.write('\r');
    await tick();
    assert.match(app.lastFrame(), /Model gpt-6-luna \(openai\)/);
  } finally {
    app.unmount();
  }
});

test('slash completions support arrow selection and Enter', async () => {
  const app = render(React.createElement(ChatScreen, { rpcUrl: 'https://api.devnet.solana.com' }));
  try {
    await tick();
    app.stdin.write('/');
    await tick();
    app.stdin.write('\u001b[B');
    await tick();
    assert.match(app.lastFrame(), /❯ \/wallet/);
    app.stdin.write('\r');
    await tick();
    assert.match(app.lastFrame(), /Wallet keypair/);
  } finally { app.unmount(); }
});

test('/model guides provider, existing key, and model selection', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ object: 'list', data: [
    { id: 'gpt-6-luna', object: 'model' },
  ] }), { status: 200, headers: { 'content-type': 'application/json' } });
  const app = render(React.createElement(ChatScreen, {
    rpcUrl: 'https://api.devnet.solana.com', provider: 'openai', apiKey: 'test-key',
  }));
  try {
    await tick();
    app.stdin.write('/model');
    await tick();
    app.stdin.write('\r');
    await tick();
    assert.match(app.lastFrame(), /Choose model provider/);
    app.stdin.write('\r');
    await tick();
    assert.match(app.lastFrame(), /API key for openai/);
    app.stdin.write('\r');
    await tick();
    assert.match(app.lastFrame(), /Models visible to openai/);
    assert.match(app.lastFrame(), /gpt-6-luna/);
    await tick();
    app.stdin.write('\r');
    await tick();
    assert.match(app.lastFrame(), /Model gpt-6-luna \(openai\)/);
  } finally {
    app.unmount();
    globalThis.fetch = originalFetch;
  }
});

test('/model masks a new key and saves it only after model selection', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ object: 'list', data: [
    { id: 'gpt-6-luna', object: 'model' },
  ] }), { status: 200, headers: { 'content-type': 'application/json' } });
  const saved = [];
  const credentialStore = { get: async () => '', set: async (provider, key) => { saved.push([provider, key]); } };
  const app = render(React.createElement(ChatScreen, { rpcUrl: 'https://api.devnet.solana.com', credentialStore }));
  try {
    await tick();
    app.stdin.write('/model');
    await tick();
    app.stdin.write('\r');
    await tick();
    app.stdin.write('\r');
    await tick();
    assert.match(app.lastFrame(), /API key for openai/);
    app.stdin.write('sk-test-secret');
    await tick();
    assert.doesNotMatch(app.lastFrame(), /sk-test-secret/);
    app.stdin.write('\r');
    await tick();
    assert.match(app.lastFrame(), /Models visible to openai/);
    assert.doesNotMatch(app.lastFrame(), /sk-test-secret/);
    assert.deepEqual(saved, []);
    await tick();
    app.stdin.write('\r');
    await tick();
    assert.deepEqual(saved, [['openai', 'sk-test-secret']]);
  } finally {
    app.unmount();
    globalThis.fetch = originalFetch;
  }
});

test('canceling /model keeps the active configuration and does not save a draft key', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ object: 'list', data: [{ id: 'other-model', object: 'model' }] }),
    { status: 200, headers: { 'content-type': 'application/json' } });
  const saved = [];
  const app = render(React.createElement(ChatScreen, {
    rpcUrl: 'https://api.devnet.solana.com', model: 'current-model', provider: 'openai',
    credentialStore: { get: async () => '', set: async (provider, key) => { saved.push([provider, key]); } },
  }));
  try {
    await tick();
    app.stdin.write('/model');
    await tick();
    app.stdin.write('\r');
    await tick();
    app.stdin.write('\r');
    await tick();
    app.stdin.write('draft-secret');
    await tick();
    app.stdin.write('\r');
    await tick();
    assert.match(app.lastFrame(), /Models visible to openai/);
    app.stdin.write('\u001b');
    await tick();
    assert.match(app.lastFrame(), /Model current-model \(openai\)/);
    assert.deepEqual(saved, []);
  } finally { app.unmount(); globalThis.fetch = originalFetch; }
});

test('/wallet loads a pasted keypair path and shows only its public address', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'web3mcp-tui-'));
  const walletFile = path.join(directory, 'wallet.json');
  const wallet = Keypair.generate();
  writeFileSync(walletFile, JSON.stringify([...wallet.secretKey]), { mode: 0o600 });
  const app = render(React.createElement(ChatScreen, { rpcUrl: 'https://api.devnet.solana.com' }));
  try {
    await tick();
    app.stdin.write('/wallet');
    await tick();
    app.stdin.write('\r');
    await tick();
    app.stdin.write(walletFile);
    await tick();
    app.stdin.write('\r');
    await tick();
    assert.match(app.lastFrame(), new RegExp(wallet.publicKey.toBase58()));
    assert.doesNotMatch(app.lastFrame(), /secretKey/);
  } finally {
    app.unmount();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('/wallet detects local keypairs and selects one with arrow keys', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'web3mcp-wallets-'));
  const solanaDirectory = path.join(directory, '.config', 'solana');
  const { mkdirSync } = await import('node:fs');
  mkdirSync(solanaDirectory, { recursive: true });
  const first = Keypair.generate();
  const second = Keypair.generate();
  const firstPath = path.join(solanaDirectory, 'id.json');
  const secondPath = path.join(solanaDirectory, 'other.json');
  writeFileSync(firstPath, JSON.stringify([...first.secretKey]), { mode: 0o600 });
  writeFileSync(secondPath, JSON.stringify([...second.secretKey]), { mode: 0o600 });
  const walletPaths = discoverWalletPaths(directory, {});
  assert.deepEqual(walletPaths, [firstPath, secondPath]);
  const app = render(React.createElement(ChatScreen, { rpcUrl: 'https://api.devnet.solana.com', walletPaths }));
  try {
    await tick();
    app.stdin.write('/wallet');
    await tick();
    app.stdin.write('\r');
    await tick();
    assert.match(app.lastFrame(), /id\.json/);
    assert.match(app.lastFrame(), /other\.json/);
    app.stdin.write('json');
    await tick();
    assert.match(app.lastFrame(), /other\.json/);
    app.stdin.write('\u001b[B');
    await tick();
    app.stdin.write('\r');
    await tick();
    assert.match(app.lastFrame(), new RegExp(second.publicKey.toBase58()));
  } finally {
    app.unmount();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('/wallet rejects an invalid typed path instead of silently choosing a suggestion', async () => {
  const app = render(React.createElement(ChatScreen, {
    rpcUrl: 'https://api.devnet.solana.com', walletPaths: ['/private/tmp/suggested-wallet.json'],
  }));
  try {
    await tick();
    app.stdin.write('/wallet');
    await tick();
    app.stdin.write('\r');
    await tick();
    app.stdin.write('/private/tmp/missing-wallet.json');
    await tick();
    app.stdin.write('\r');
    await tick();
    assert.match(app.lastFrame(), /Wallet keypair/);
    assert.match(app.lastFrame(), /missing-wallet\.json/);
    assert.doesNotMatch(app.lastFrame(), /Wallet [1-9A-HJ-NP-Za-km-z]{32,44}/);
  } finally { app.unmount(); }
});

test('a preloaded program discovers tools before a model is selected', async () => {
  const programId = '11111111111111111111111111111111';
  const discovered = [];
  const sdk = { discover: async id => { discovered.push(id); }, getTools: () => [{ name: 'get_vault' }] };
  const app = render(React.createElement(ChatScreen, { sdk, programId, rpcUrl: 'https://api.devnet.solana.com' }));
  try {
    await tick();
    assert.deepEqual(discovered, [programId]);
    assert.match(app.lastFrame(), /Tools 1/);
    assert.match(app.lastFrame(), /Model not set/);
  } finally { app.unmount(); }
});

test('chat screen discovers tools and keeps program, model, and wallet status visible', async () => {
  let discoveries = 0;
  const sdk = {
    connection: {},
    discover: async () => { discoveries++; },
    getTools: () => [{ name: 'read_account', description: 'Read', solana: { kind: 'accountRead' } }],
  };
  const app = render(React.createElement(ChatScreen, {
    sdk, programId: '11111111111111111111111111111111', rpcUrl: 'http://localhost:8899',
    model: 'test-model', provider: 'ollama', signer: null,
  }));
  await tick();
  const frame = app.lastFrame();
  assert.match(frame, /Web3MCP Compatible Host/);
  assert.match(frame, /Tools 1/);
  assert.match(frame, /read only/);
  assert.match(frame, /test-model/);
  assert.equal(discoveries, 1);
  app.unmount();
});

test('transaction review rejects Enter and requires explicit s to sign', async () => {
  const request = {
    tool: 'deposit', programId: '11111111111111111111111111111111',
    arguments: { amount: '1' }, accounts: [], effects: { summary: 'Deposits funds', financial: true },
    simulation: { err: null, unitsConsumed: 1 }, estimatedFeeLamports: 5000, messageHash: 'abc', instruction: { data: Buffer.from([1]) },
  };
  let decision;
  const app = render(React.createElement(TransactionReview, { request, onDecision: value => { decision = value; } }));
  await tick();
  assert.match(app.lastFrame(), /Estimated fee 5000 lamports/);
  app.stdin.write('\r');
  await tick();
  assert.equal(decision, false);
  app.unmount();
  decision = undefined;
  const approved = render(React.createElement(TransactionReview, { request, onDecision: value => { decision = value; } }));
  await tick();
  approved.stdin.write('s');
  await tick();
  assert.equal(decision, true);
  approved.unmount();
});
