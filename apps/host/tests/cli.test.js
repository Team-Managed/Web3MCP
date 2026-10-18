import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('one web3mcp command exposes help without a TTY', () => {
  const result = spawnSync(process.execPath, ['bin/web3mcp.js', '--help'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Web3MCP Compatible Host/);
  assert.match(result.stdout, /Usage: web3mcp \[options\]/);
  assert.match(result.stdout, /Chat opens first/);
  assert.match(result.stdout, /Tab to complete/);
  assert.match(result.stdout, /\/model to choose a provider/);
});

test('non-TTY chat exits without opening a wallet or RPC connection', () => {
  const result = spawnSync(process.execPath, ['bin/web3mcp.js'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /interactive terminal/i);
});
