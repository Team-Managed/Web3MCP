import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { validateConfig } from '../src/validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test('rejects a Base58-shaped program ID that does not decode to 32 bytes', () => {
  const fixture = JSON.parse(readFileSync(join(__dirname, '../fixtures/valid/minimal.json'), 'utf8'));
  fixture.programId = 'z'.repeat(44);
  const result = validateConfig(fixture);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /programId/i);
});

test('05: rejects invalid fixtures in fixtures/invalid/ with fail-closed errors', () => {
  const invalidDir = join(__dirname, '../fixtures/invalid');
  const files = readdirSync(invalidDir).filter((f) => f.endsWith('.json'));
  assert.ok(files.length >= 7, `Expected at least 7 invalid fixtures, found ${files.length}`);

  for (const file of files) {
    const filePath = join(invalidDir, file);
    const fixture = JSON.parse(readFileSync(filePath, 'utf8'));

    const result = validateConfig(fixture);
    assert.equal(
      result.valid,
      false,
      `Expected fixture ${file} to fail validation, but it passed.`
    );
    assert.ok(
      result.errors && result.errors.length > 0,
      `Expected error reasons for ${file}`
    );
  }
});

test('05: rejects instruction tool referencing non-existent IDL instruction', () => {
  const fixture = {
    standard: 'web3mcp',
    version: '0.1.0',
    programId: '11111111111111111111111111111111',
    idl: {
      version: '0.1.0',
      name: 'vault',
      instructions: [{ name: 'deposit', accounts: [], args: [] }],
    },
    tools: [
      {
        name: 'withdraw_tool',
        inputSchema: { type: 'object', properties: {}, required: [], additionalProperties: false },
        solana: {
          kind: 'instruction',
          instruction: 'withdraw_nonexistent', // NOT IN IDL
          accounts: {},
          effects: { stateChanging: true, financial: true },
        },
      },
    ],
  };

  const result = validateConfig(fixture);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('withdraw_nonexistent')));
});

test('05: rejects accountRead tool referencing non-existent IDL account', () => {
  const fixture = {
    standard: 'web3mcp',
    version: '0.1.0',
    programId: '11111111111111111111111111111111',
    idl: {
      version: '0.1.0',
      name: 'vault',
      instructions: [],
      accounts: [{ name: 'Vault' }],
    },
    tools: [
      {
        name: 'get_user_state',
        inputSchema: { type: 'object', properties: {}, required: [], additionalProperties: false },
        solana: {
          kind: 'accountRead',
          account: 'UserState_nonexistent', // NOT IN IDL
          accounts: { target: { source: 'idl' } },
        },
      },
    ],
  };

  const result = validateConfig(fixture);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('UserState_nonexistent')));
});

test('05: rejects input-sourced account referencing non-existent inputSchema property', () => {
  const fixture = {
    standard: 'web3mcp',
    version: '0.1.0',
    programId: '11111111111111111111111111111111',
    idl: {
      version: '0.1.0',
      name: 'vault',
      instructions: [{ name: 'deposit', accounts: [], args: [] }],
    },
    tools: [
      {
        name: 'deposit',
        inputSchema: {
          type: 'object',
          properties: {
            amount: { type: 'string', pattern: '^[1-9][0-9]*$' },
          },
          required: ['amount'],
          additionalProperties: false,
        },
        solana: {
          kind: 'instruction',
          instruction: 'deposit',
          accounts: {
            payer: {
              source: 'input',
              input: 'nonexistent_account_param', // NOT IN inputSchema.properties
            },
          },
          effects: { stateChanging: true, financial: true },
        },
      },
    ],
  };

  const result = validateConfig(fixture);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('nonexistent_account_param')));
});
