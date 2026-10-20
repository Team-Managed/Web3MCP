import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { render } from 'ink-testing-library';
import { Keypair } from '@solana/web3.js';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ChatScreen, TransactionReview, safeReviewText } from '../dist/tui/index.js';
import { discoverWalletPaths } from '../dist/tui/wallet-paths.js';

const tick = () => new Promise(resolve => setTimeout(resolve, 25));
const waitFor = async predicate => {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (predicate()) return;
    await tick();
  }
  assert.fail('Timed out waiting for the terminal action to complete.');
};
const chatStream = delta => new Response(`data: ${JSON.stringify({ id: 'test', object: 'chat.completion.chunk', choices: [{ index: 0, delta, finish_reason: null }] })}\n\ndata: [DONE]\n\n`,
  { headers: { 'content-type': 'text/event-stream' } });

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

test('Enter executes a selected narrowed slash suggestion', async () => {
  const app = render(React.createElement(ChatScreen, { rpcUrl: 'https://api.devnet.solana.com' }));
  try {
    await tick();
    app.stdin.write('/to');
    await tick();
    app.stdin.write('\u001b[B');
    await tick();
    assert.match(app.lastFrame(), /❯ \/tools/);
    app.stdin.write('\r');
    await tick();
    assert.match(app.lastFrame(), /No program loaded/);
  } finally { app.unmount(); }
});

test('/clear keeps the model conversation for the next prompt', async () => {
  const previousFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (_url, init) => { requests.push(JSON.parse(init.body)); return chatStream({ content: 'Done.' }); };
  const sdk = { toOpenAiTools: () => [], getTools: () => [] };
  const app = render(React.createElement(ChatScreen, { sdk, rpcUrl: 'http://localhost:8899', provider: 'ollama', model: 'test' }));
  try {
    await tick();
    app.stdin.write('first question');
    await tick();
    app.stdin.write('\r');
    await new Promise(resolve => setTimeout(resolve, 100));
    app.stdin.write('/clear');
    await tick();
    app.stdin.write('\r');
    await tick();
    assert.match(app.lastFrame(), /model context kept/i);
    app.stdin.write('second question');
    await tick();
    app.stdin.write('\r');
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal(requests.length, 2);
    assert.ok(requests[1].messages.some(message => message.role === 'user' && message.content === 'first question'));
    assert.match(app.lastFrame(), /second question/);
  } finally { app.unmount(); globalThis.fetch = previousFetch; }
});

test('preload discovery cannot replace a newer chat discovery', async () => {
  const previousFetch = globalThis.fetch;
  const a = Keypair.generate().publicKey.toBase58();
  const b = Keypair.generate().publicKey.toBase58();
  let finishA;
  let calls = 0;
  globalThis.fetch = async () => ++calls === 1
    ? chatStream({ tool_calls: [{ index: 0, id: 'discover', function: { name: 'web3mcp_host_discover_program', arguments: JSON.stringify({ reference: b }) } }] })
    : chatStream({ content: 'Ready.' });
  const sdk = { discover: id => id === a ? new Promise(resolve => { finishA = resolve; }) : Promise.resolve(),
    getTools: id => [{ name: id === a ? 'old_tool' : 'new_tool', solana: { kind: 'accountRead' } }],
    toOpenAiTools: () => [] };
  const app = render(React.createElement(ChatScreen, { sdk, programId: a, rpcUrl: 'http://localhost:8899', provider: 'openai', model: 'test', apiKey: 'test' }));
  try {
    await tick();
    app.stdin.write(`Use ${b}`);
    await tick();
    app.stdin.write('\r');
    await new Promise(resolve => setTimeout(resolve, 150));
    assert.match(app.lastFrame(), new RegExp(`Program ${b}`));
    finishA();
    await tick();
    assert.match(app.lastFrame(), new RegExp(`Program ${b}`));
    assert.match(app.lastFrame(), /Tools 1/);
  } finally { app.unmount(); globalThis.fetch = previousFetch; }
});

test('a retained agent adopts a program after preload finishes', async () => {
  const previousFetch = globalThis.fetch;
  const programId = Keypair.generate().publicKey.toBase58();
  let finishDiscovery;
  const requests = [];
  globalThis.fetch = async (_url, init) => { requests.push(JSON.parse(init.body)); return chatStream({ content: 'Ready.' }); };
  const sdk = { discover: () => new Promise(resolve => { finishDiscovery = resolve; }),
    getTools: () => [{ name: 'get_vault', solana: { kind: 'accountRead' } }],
    toOpenAiTools: id => id === programId ? [{ type: 'function', function: { name: 'get_vault' } }] : [] };
  const app = render(React.createElement(ChatScreen, { sdk, programId, rpcUrl: 'http://localhost:8899', provider: 'ollama', model: 'test' }));
  try {
    await tick();
    app.stdin.write('first'); await tick(); app.stdin.write('\r');
    await new Promise(resolve => setTimeout(resolve, 100));
    finishDiscovery(); await tick();
    app.stdin.write('second'); await tick(); app.stdin.write('\r');
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal(requests.length, 2);
    assert.ok(requests[1].tools.some(tool => tool.function.name === 'get_vault'));
  } finally { app.unmount(); globalThis.fetch = previousFetch; }
});

test('OpenAI-compatible local endpoint can chat without an API key', async () => {
  const previousFetch = globalThis.fetch;
  const previousUrl = process.env.OPENAI_BASE_URL;
  const previousKey = process.env.OPENAI_API_KEY;
  const previousCompatKey = process.env.OPENAI_COMPAT_API_KEY;
  let requests = 0;
  let authorization;
  process.env.OPENAI_BASE_URL = 'http://127.0.0.1:8080/v1';
  process.env.OPENAI_API_KEY = 'real-provider-key';
  delete process.env.OPENAI_COMPAT_API_KEY;
  globalThis.fetch = async (_url, init) => { requests++; authorization = new Headers(init.headers).get('authorization'); return chatStream({ content: 'Local reply.' }); };
  const sdk = { toOpenAiTools: () => [], getTools: () => [] };
  const app = render(React.createElement(ChatScreen, { sdk, rpcUrl: 'http://localhost:8899', provider: 'openai', model: 'local-model' }));
  try {
    await tick();
    app.stdin.write('hi');
    await tick();
    app.stdin.write('\r');
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal(requests, 1);
    assert.doesNotMatch(authorization || '', /real-provider-key/);
    assert.match(app.lastFrame(), /Local reply/);
  } finally {
    app.unmount(); globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.OPENAI_BASE_URL; else process.env.OPENAI_BASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previousKey;
    if (previousCompatKey === undefined) delete process.env.OPENAI_COMPAT_API_KEY; else process.env.OPENAI_COMPAT_API_KEY = previousCompatKey;
  }
});

test('Ctrl+C aborts an active model request', async () => {
  const previousFetch = globalThis.fetch;
  let aborted = false;
  globalThis.fetch = async (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => {
    aborted = true; reject(new Error('aborted'));
  }, { once: true }));
  const sdk = { toOpenAiTools: () => [], getTools: () => [] };
  const app = render(React.createElement(ChatScreen, { sdk, rpcUrl: 'http://localhost:8899', provider: 'ollama', model: 'test' }));
  try {
    await tick();
    app.stdin.write('hi');
    await tick();
    app.stdin.write('\r');
    await tick();
    app.stdin.write('\u0003');
    await tick();
    assert.equal(aborted, true);
  } finally { app.unmount(); globalThis.fetch = previousFetch; }
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
  const preferences = [];
  const credentialStore = { get: async () => '', set: async (provider, key) => { saved.push([provider, key]); } };
  const app = render(React.createElement(ChatScreen, { rpcUrl: 'https://api.devnet.solana.com', credentialStore,
    onSettingsChange: settings => preferences.push(settings) }));
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
    await waitFor(() => app.lastFrame()?.includes('*'.repeat('sk-test-secret'.length)));
    assert.doesNotMatch(app.lastFrame(), /sk-test-secret/);
    app.stdin.write('\r');
    await tick();
    assert.match(app.lastFrame(), /Models visible to openai/);
    assert.doesNotMatch(app.lastFrame(), /sk-test-secret/);
    assert.deepEqual(saved, []);
    await tick();
    app.stdin.write('\r');
    await waitFor(() => saved.length === 1 && preferences.length > 0);
    assert.deepEqual(saved, [['openai', 'sk-test-secret']]);
    assert.equal(preferences.at(-1).model, 'gpt-6-luna');
    assert.equal(preferences.at(-1).provider, 'openai');
    assert.equal('apiKey' in preferences.at(-1), false);
  } finally {
    app.unmount();
    globalThis.fetch = originalFetch;
  }
});

test('/model keeps a custom endpoint key separate from the OpenAI key', async () => {
  const previousFetch = globalThis.fetch;
  const previousUrl = process.env.OPENAI_BASE_URL;
  const previousKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_BASE_URL = 'https://gateway.example/v1';
  process.env.OPENAI_API_KEY = 'provider-only-key';
  const saved = [];
  let authorization;
  let requestedUrl;
  globalThis.fetch = async (url, init) => {
    requestedUrl = String(url);
    authorization = new Headers(init.headers).get('authorization');
    return new Response(JSON.stringify({ object: 'list', data: [{ id: 'gateway-model', object: 'model' }] }),
      { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const app = render(React.createElement(ChatScreen, { rpcUrl: 'http://localhost:8899',
    credentialStore: { get: async () => '', set: async (account, key) => saved.push([account, key]) } }));
  try {
    await tick(); app.stdin.write('/model'); await tick(); app.stdin.write('\r'); await tick();
    app.stdin.write('\r'); await tick();
    assert.match(app.lastFrame(), /API key for openai/);
    app.stdin.write('gateway-key');
    await waitFor(() => app.lastFrame()?.includes('*'.repeat('gateway-key'.length)));
    app.stdin.write('\r'); await tick();
    assert.match(requestedUrl, /^https:\/\/gateway\.example\/v1\/models/);
    assert.equal(authorization, 'Bearer gateway-key');
    app.stdin.write('\r'); await waitFor(() => saved.length === 1);
    assert.deepEqual(saved, [['openai-compatible:https://gateway.example/v1', 'gateway-key']]);
  } finally {
    app.unmount(); globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.OPENAI_BASE_URL; else process.env.OPENAI_BASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previousKey;
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
  const preferences = [];
  writeFileSync(walletFile, JSON.stringify([...wallet.secretKey]), { mode: 0o600 });
  const app = render(React.createElement(ChatScreen, { rpcUrl: 'https://api.devnet.solana.com',
    onSettingsChange: settings => preferences.push(settings) }));
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
    assert.equal(preferences.at(-1).walletPath, walletFile);
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

test('failed program preload leaves chat able to discover another program', async () => {
  const programId = '11111111111111111111111111111111';
  const sdk = { discover: async () => { throw new Error('Missing config'); }, getTools: () => { throw new Error('Not discovered'); } };
  const app = render(React.createElement(ChatScreen, { sdk, programId, rpcUrl: 'https://api.devnet.solana.com' }));
  try {
    await tick();
    assert.match(app.lastFrame(), /Discovery failed/);
    assert.match(app.lastFrame(), /Program mention an ID or \.sns name in chat/);
    app.stdin.write('/tools');
    await tick();
    app.stdin.write('\r');
    await tick();
    assert.match(app.lastFrame(), /No program loaded/);
  } finally { app.unmount(); }
});

test('old program discovery cannot restore tools after RPC changes', async () => {
  let finishDiscovery;
  const sdk = {
    discover: () => new Promise(resolve => { finishDiscovery = resolve; }),
    getTools: () => [{ name: 'old_tool' }],
  };
  const app = render(React.createElement(ChatScreen, {
    sdk, programId: '11111111111111111111111111111111', rpcUrl: 'http://localhost:8899',
  }));
  try {
    await tick();
    app.stdin.write('/rpc');
    await tick();
    app.stdin.write('\r');
    await tick();
    app.stdin.write('\u007f'.repeat('http://localhost:8899'.length));
    await tick();
    app.stdin.write('http://localhost:8898');
    await tick();
    app.stdin.write('\r');
    await tick();
    finishDiscovery();
    await tick();
    assert.match(app.lastFrame(), /Tools 0/);
    assert.match(app.lastFrame(), /Program mention an ID or \.sns name in chat/);
    assert.match(app.lastFrame(), /RPC updated; mention a program/);
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
    simulation: { err: null, unitsConsumed: 1, logs: ['Program log: Instruction: Deposit', 'Program success'] }, estimatedFeeLamports: 5000, messageHash: 'abc', instruction: { data: Buffer.from([1]) },
  };
  let decision;
  const app = render(React.createElement(TransactionReview, { request, onDecision: value => { decision = value; } }));
  await tick();
  assert.match(app.lastFrame(), /Estimated fee 5000 lamports/);
  assert.match(app.lastFrame(), /Validator logs \(2 of 2\)/);
  assert.match(app.lastFrame(), /Instruction: Deposit/);
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

test('transaction review neutralizes publisher control text', async () => {
  assert.equal(safeReviewText('deposit\u001b[2J\u001b[Hfake\u009b2J'), 'deposit [2J [Hfake 2J');
  const request = { tool: 'deposit', programId: '11111111111111111111111111111111',
    arguments: {}, accounts: [{ name: 'vault\u001b[2J', pubkey: '11111111111111111111111111111111' }],
    effects: { summary: 'Safe\u001b[2JHidden', financial: true }, simulation: { err: null, logs: [] },
    messageHash: 'abc', instruction: { data: Buffer.from([1]) } };
  const app = render(React.createElement(TransactionReview, { request, onDecision: () => {} }));
  try {
    await tick();
    assert.match(app.lastFrame(), /Safe \[2JHidden/);
    assert.match(app.lastFrame(), /vault \[2J/);
    assert.doesNotMatch(app.lastFrame(), /\u001b\[2J/);
  } finally { app.unmount(); }
});

test('transaction review displays arguments beyond 800 characters before signing', async () => {
  const request = { tool: 'deposit', programId: '11111111111111111111111111111111',
    arguments: { memo: 'x'.repeat(850), destination: 'last-visible-destination' }, accounts: [],
    simulation: { err: null, logs: [] }, messageHash: 'abc', instruction: { data: Buffer.from([1]) } };
  const app = render(React.createElement(TransactionReview, { request, onDecision: () => {} }));
  try {
    await tick();
    assert.match(app.lastFrame(), /last-visible-destination/);
    assert.doesNotMatch(app.lastFrame(), /\[truncated\]/);
  } finally { app.unmount(); }
});

test('/tools and Ctrl+T neutralize publisher terminal controls', async () => {
  const programId = Keypair.generate().publicKey.toBase58();
  const sdk = { discover: async () => {}, getTools: () => [{ name: 'read', description: 'Safe\u001b[2Jhidden' }] };
  const app = render(React.createElement(ChatScreen, { sdk, programId, rpcUrl: 'http://localhost:8899' }));
  try {
    await tick();
    app.stdin.write('/tools'); await tick(); app.stdin.write('\r'); await tick();
    assert.match(app.lastFrame(), /Safe \[2Jhidden/);
    app.stdin.write('\u0014'); await tick();
    assert.doesNotMatch(app.lastFrame(), /\u001b\[2J/);
  } finally { app.unmount(); }
});
