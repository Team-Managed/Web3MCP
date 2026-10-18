import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadPreferences, savePreferences } from '../dist/tui/preferences.js';

test('CLI preferences survive a restart without writing an API key', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'web3mcp-preferences-'));
  const file = path.join(directory, 'settings.json');
  try {
    savePreferences({ provider: 'openai', model: 'gpt-6-luna', walletPath: '/wallet.json',
      rpcUrl: 'https://api.devnet.solana.com', apiKey: 'do-not-write' }, file);
    assert.deepEqual(loadPreferences(file), { provider: 'openai', model: 'gpt-6-luna',
      walletPath: '/wallet.json', rpcUrl: 'https://api.devnet.solana.com' });
    assert.doesNotMatch(readFileSync(file, 'utf8'), /do-not-write|apiKey/);
    assert.equal(statSync(file).mode & 0o777, 0o600);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
