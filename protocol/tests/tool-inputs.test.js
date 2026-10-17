import test from 'node:test';
import assert from 'node:assert/strict';
import { validateToolInput } from '../src/validator.js';

const tool = {
  inputSchema: {
    type: 'object',
    properties: {
      amount: { type: 'string', pattern: '^[1-9][0-9]*$' },
      recipient: { type: 'string', pattern: '^[1-9A-HJ-NP-Za-km-z]{32,44}$' },
    },
    required: ['amount', 'recipient'],
    additionalProperties: false,
  },
};

test('accepts a maximum u64 and a 32-byte public key', () => {
  assert.equal(validateToolInput(tool, { amount: '18446744073709551615', recipient: '11111111111111111111111111111111' }).valid, true);
});

test('rejects an integer larger than u64 despite matching the decimal pattern', () => {
  const result = validateToolInput(tool, { amount: '18446744073709551616', recipient: '11111111111111111111111111111111' });
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /u64/i);
});

test('rejects an oversized u64 before converting it to BigInt', () => {
  const result = validateToolInput(tool, { amount: '1'.repeat(100_000), recipient: '11111111111111111111111111111111' });
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /u64/i);
});

test('rejects a Base58 string that does not decode to a public key', () => {
  const result = validateToolInput(tool, { amount: '1', recipient: 'z'.repeat(44) });
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /public key/i);
});

test('rejects missing or extra arguments', () => {
  assert.equal(validateToolInput(tool, { amount: '1' }).valid, false);
  assert.equal(validateToolInput(tool, { amount: '1', recipient: '11111111111111111111111111111111', extra: true }).valid, false);
});
