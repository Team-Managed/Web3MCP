import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test('06: SPEC.md records the candidate account layout', () => {
  const specPath = join(__dirname, '../SPEC.md');
  assert.ok(existsSync(specPath), 'protocol/SPEC.md must exist');
  const content = readFileSync(specPath, 'utf8');
  assert.ok(content.includes('Candidate under review (v0.1.0)'));
  assert.ok(content.includes('991dc793e1358b35'));
  assert.ok(content.includes('web3mcp'));
});

test('06: CLI validator validates valid JSON fixture', () => {
  const cliPath = join(__dirname, '../bin/validate.js');
  const fixturePath = join(__dirname, '../fixtures/valid/reference-instruction.json');

  const stdout = execFileSync('node', [cliPath, fixturePath], { encoding: 'utf8' });
  assert.ok(stdout.includes('Web3MCP configuration valid'));
  assert.ok(stdout.includes('Tools discovered: 1'));
});

test('06: CLI validator validates valid binary account fixture', () => {
  const cliPath = join(__dirname, '../bin/validate.js');
  const fixturePath = join(__dirname, '../fixtures/binary/valid-published.bin');

  const stdout = execFileSync('node', [cliPath, fixturePath], { encoding: 'utf8' });
  assert.ok(stdout.includes('Web3MCP configuration valid'));
});

test('06: CLI validator exits with error on invalid fixture', () => {
  const cliPath = join(__dirname, '../bin/validate.js');
  const fixturePath = join(__dirname, '../fixtures/invalid/01-unsupported-version.json');

  assert.throws(() => {
    execFileSync('node', [cliPath, fixturePath], { encoding: 'utf8', stdio: 'pipe' });
  });
});
