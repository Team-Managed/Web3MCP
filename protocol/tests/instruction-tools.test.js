import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { validateConfigSchema } from '../src/validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test('02: validates a well-formed instruction tool fixture', () => {
  const fixturePath = join(__dirname, '../fixtures/valid/reference-instruction.json');
  const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));

  const result = validateConfigSchema(fixture);
  assert.equal(result.valid, true, `Validation failed: ${JSON.stringify(result.errors)}`);
});

test('02: rejects invalid tool names not matching ^[a-z][a-z0-9_]{0,63}$', () => {
  const baseFixture = {
    standard: 'web3mcp',
    version: '0.1.0',
    programId: '11111111111111111111111111111111',
    idl: { version: '0.1.0', name: 'test', instructions: [] },
    tools: [
      {
        name: 'Invalid-Name-With-Dashes',
        inputSchema: { type: 'object', properties: {}, required: [], additionalProperties: false },
        solana: {
          kind: 'instruction',
          instruction: 'test',
          accounts: {},
          effects: { stateChanging: true, financial: false },
        },
      },
    ],
  };

  const result = validateConfigSchema(baseFixture);
  assert.equal(result.valid, false);
  assert.ok(result.errors?.some((e) => e.includes('name')));
});

test('02: rejects unsupported inputSchema property types', () => {
  const invalidTypeFixture = {
    standard: 'web3mcp',
    version: '0.1.0',
    programId: '11111111111111111111111111111111',
    idl: { version: '0.1.0', name: 'test', instructions: [] },
    tools: [
      {
        name: 'test_tool',
        inputSchema: {
          type: 'object',
          properties: {
            unsupportedArray: { type: 'array', items: { type: 'string' } },
          },
          required: [],
          additionalProperties: false,
        },
        solana: {
          kind: 'instruction',
          instruction: 'test',
          accounts: {},
          effects: { stateChanging: true, financial: false },
        },
      },
    ],
  };

  const result = validateConfigSchema(invalidTypeFixture);
  assert.equal(result.valid, false);
});

test('02: rejects invalid account resolution source', () => {
  const invalidSourceFixture = {
    standard: 'web3mcp',
    version: '0.1.0',
    programId: '11111111111111111111111111111111',
    idl: { version: '0.1.0', name: 'test', instructions: [] },
    tools: [
      {
        name: 'test_tool',
        inputSchema: { type: 'object', properties: {}, required: [], additionalProperties: false },
        solana: {
          kind: 'instruction',
          instruction: 'test',
          accounts: {
            badAccount: { source: 'oracle' },
          },
          effects: { stateChanging: true, financial: false },
        },
      },
    ],
  };

  const result = validateConfigSchema(invalidSourceFixture);
  assert.equal(result.valid, false);
  assert.ok(result.errors?.some((e) => e.includes('source')));
});

test('02: rejects instruction tools missing required effects', () => {
  const missingEffectsFixture = {
    standard: 'web3mcp',
    version: '0.1.0',
    programId: '11111111111111111111111111111111',
    idl: { version: '0.1.0', name: 'test', instructions: [] },
    tools: [
      {
        name: 'test_tool',
        inputSchema: { type: 'object', properties: {}, required: [], additionalProperties: false },
        solana: {
          kind: 'instruction',
          instruction: 'test',
          accounts: {},
        },
      },
    ],
  };

  const result = validateConfigSchema(missingEffectsFixture);
  assert.equal(result.valid, false);
});

test('02: rejects duplicate tool names in the tools array', () => {
  const duplicateFixture = {
    standard: 'web3mcp',
    version: '0.1.0',
    programId: '11111111111111111111111111111111',
    idl: { version: '0.1.0', name: 'test', instructions: [] },
    tools: [
      {
        name: 'deposit',
        inputSchema: { type: 'object', properties: {}, required: [], additionalProperties: false },
        solana: {
          kind: 'instruction',
          instruction: 'deposit_1',
          accounts: {},
          effects: { stateChanging: true, financial: true },
        },
      },
      {
        name: 'deposit',
        inputSchema: { type: 'object', properties: {}, required: [], additionalProperties: false },
        solana: {
          kind: 'instruction',
          instruction: 'deposit_2',
          accounts: {},
          effects: { stateChanging: true, financial: true },
        },
      },
    ],
  };

  const result = validateConfigSchema(duplicateFixture);
  assert.equal(result.valid, false);
  assert.ok(result.errors?.some((e) => e.includes('duplicate tool name')));
});
