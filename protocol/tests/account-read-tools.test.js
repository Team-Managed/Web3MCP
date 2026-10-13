import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { validateConfigSchema } from '../src/validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test('03: validates a well-formed accountRead tool fixture', () => {
  const fixturePath = join(__dirname, '../fixtures/valid/reference-read.json');
  const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));

  const result = validateConfigSchema(fixture);
  assert.equal(result.valid, true, `Validation failed: ${JSON.stringify(result.errors)}`);
});

test('03: rejects accountRead tool with forbidden effects field (fail-closed)', () => {
  const invalidReadFixture = {
    standard: 'web3mcp',
    version: '0.1.0',
    programId: '11111111111111111111111111111111',
    idl: { version: '0.1.0', name: 'test', instructions: [], accounts: [{ name: 'Vault' }] },
    tools: [
      {
        name: 'get_vault',
        inputSchema: { type: 'object', properties: {}, required: [], additionalProperties: false },
        solana: {
          kind: 'accountRead',
          account: 'Vault',
          accounts: { vault: { source: 'idl' } },
          effects: { stateChanging: false, financial: false }, // FORBIDDEN ON READ
        },
      },
    ],
  };

  const result = validateConfigSchema(invalidReadFixture);
  assert.equal(result.valid, false);
});

test('03: rejects accountRead tool missing required account name', () => {
  const missingAccountFixture = {
    standard: 'web3mcp',
    version: '0.1.0',
    programId: '11111111111111111111111111111111',
    idl: { version: '0.1.0', name: 'test', instructions: [], accounts: [] },
    tools: [
      {
        name: 'get_vault',
        inputSchema: { type: 'object', properties: {}, required: [], additionalProperties: false },
        solana: {
          kind: 'accountRead',
          accounts: { vault: { source: 'idl' } },
        },
      },
    ],
  };

  const result = validateConfigSchema(missingAccountFixture);
  assert.equal(result.valid, false);
});
