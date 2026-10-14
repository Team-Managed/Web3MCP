import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import crypto from 'node:crypto';

import { parseConfigAccount, serializeConfigAccount, CONFIG_ACCOUNT_DISCRIMINATOR, PublicationStatus } from '../src/account.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_AUTHORITY = '11111111111111111111111111111111';

test('04: serializes and parses valid published config account binary layout', () => {
  const minimalJson = readFileSync(join(__dirname, '../fixtures/valid/minimal.json'), 'utf8');

  const binary = serializeConfigAccount({
    authority: TEST_AUTHORITY,
    status: PublicationStatus.Published,
    configUtf8: minimalJson,
  });

  const parsed = parseConfigAccount(binary);
  assert.equal(parsed.status, PublicationStatus.Published);
  assert.equal(parsed.authority, TEST_AUTHORITY);
  assert.equal(parsed.configJson, minimalJson);
  assert.deepEqual(parsed.config.tools, []);
});

test('04: fails closed on Uninitialized (0) or Uploading (1) status', () => {
  const minimalJson = '{"standard":"web3mcp","version":"0.1.0"}';

  const uninitializedBinary = serializeConfigAccount({
    authority: TEST_AUTHORITY,
    status: PublicationStatus.Uninitialized,
    configUtf8: minimalJson,
  });

  assert.throws(
    () => parseConfigAccount(uninitializedBinary),
    /Uninitialized/i
  );

  const uploadingBinary = serializeConfigAccount({
    authority: TEST_AUTHORITY,
    status: PublicationStatus.Uploading,
    configUtf8: minimalJson,
  });

  assert.throws(
    () => parseConfigAccount(uploadingBinary),
    /Uploading/i
  );
});

test('04: fails closed on digest mismatch', () => {
  const minimalJson = '{"standard":"web3mcp","version":"0.1.0"}';
  const binary = serializeConfigAccount({
    authority: TEST_AUTHORITY,
    status: PublicationStatus.Published,
    configUtf8: minimalJson,
  });

  // Tamper with a payload byte in the binary
  binary[binary.length - 1] ^= 0xff;

  assert.throws(
    () => parseConfigAccount(binary),
    /digest mismatch/i
  );
});

test('04: fails closed on config exceeding 64 KiB limit', () => {
  const oversizedJson = JSON.stringify({ data: 'x'.repeat(66 * 1024) });

  assert.throws(
    () => serializeConfigAccount({
      authority: TEST_AUTHORITY,
      status: PublicationStatus.Published,
      configUtf8: oversizedJson,
    }),
    /64 KiB/i
  );
});

test('04: fails closed on discriminator mismatch', () => {
  const minimalJson = '{"standard":"web3mcp","version":"0.1.0"}';
  const binary = serializeConfigAccount({
    authority: TEST_AUTHORITY,
    status: PublicationStatus.Published,
    configUtf8: minimalJson,
  });

  // Corrupt discriminator
  binary[0] ^= 0xaa;

  assert.throws(
    () => parseConfigAccount(binary),
    /discriminator/i
  );
});

test('04: parses pre-generated golden valid-published.bin fixture file', () => {
  const fixturePath = join(__dirname, '../fixtures/binary/valid-published.bin');
  const binaryData = readFileSync(fixturePath);

  const parsed = parseConfigAccount(binaryData);
  assert.equal(parsed.status, PublicationStatus.Published);
  assert.equal(parsed.authority, TEST_AUTHORITY);
  assert.equal(parsed.config.standard, 'web3mcp');
  assert.equal(parsed.config.version, '0.1.0');
});

test('04: rejects bytes beyond the declared config payload', () => {
  const binary = serializeConfigAccount({
    authority: TEST_AUTHORITY,
    status: PublicationStatus.Published,
    configUtf8: '{"standard":"web3mcp"}',
  });

  assert.throws(() => parseConfigAccount(Buffer.concat([binary, Buffer.from([0])])), /length mismatch/i);
});
