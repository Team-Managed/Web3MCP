import crypto from 'node:crypto';
import { PublicKey } from '@solana/web3.js';
import { parseUniqueJson } from './unique-json.js';

/**
 * Anchor account discriminator for `Web3McpConfig`:
 * sha256("account:Web3McpConfig")[0..8]
 */
export const CONFIG_ACCOUNT_DISCRIMINATOR = crypto
  .createHash('sha256')
  .update('account:Web3McpConfig')
  .digest()
  .subarray(0, 8);

// Protocol constants
export const MAX_CONFIG_PAYLOAD_BYTES = 64 * 1024; // 64 KiB maximum config size

// Field byte lengths in the Anchor binary account layout
export const DISCRIMINATOR_BYTES = 8;
export const PUBKEY_BYTES = 32;
export const STATUS_BYTES = 1;
export const LENGTH_BYTES = 4;
export const DIGEST_BYTES = 32;

// Exact header byte offsets
export const OFFSET_DISCRIMINATOR = 0;
export const OFFSET_AUTHORITY = OFFSET_DISCRIMINATOR + DISCRIMINATOR_BYTES; // 8
export const OFFSET_STATUS = OFFSET_AUTHORITY + PUBKEY_BYTES; // 40
export const OFFSET_EXPECTED_LEN = OFFSET_STATUS + STATUS_BYTES; // 41
export const OFFSET_DIGEST = OFFSET_EXPECTED_LEN + LENGTH_BYTES; // 45
export const OFFSET_VEC_LEN = OFFSET_DIGEST + DIGEST_BYTES; // 77
export const OFFSET_PAYLOAD = OFFSET_VEC_LEN + LENGTH_BYTES; // 81

export const HEADER_BYTES = OFFSET_PAYLOAD; // 81 bytes total header

export const PublicationStatus = Object.freeze({
  Uninitialized: 0,
  Uploading: 1,
  Published: 2,
});

export class ConfigAccountError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigAccountError';
  }
}

/**
 * Serializes a Web3MCP configuration account into Anchor binary layout.
 *
 * @param {object} params
 * @param {string} params.authority Base58 public key of publishing authority
 * @param {number} params.status PublicationStatus (0, 1, or 2)
 * @param {string} params.configUtf8 UTF-8 JSON payload string
 * @returns {Buffer} Serialized account data
 */
export function serializeConfigAccount({ authority, status, configUtf8 }) {
  const authorityPubkey = new PublicKey(authority);
  const configBytes = Buffer.from(configUtf8, 'utf8');

  if (configBytes.length > MAX_CONFIG_PAYLOAD_BYTES) {
    throw new ConfigAccountError(`Config payload size ${configBytes.length} exceeds 64 KiB limit (${MAX_CONFIG_PAYLOAD_BYTES} bytes)`);
  }

  const digest = crypto.createHash('sha256').update(configBytes).digest();
  const totalLen = HEADER_BYTES + configBytes.length;
  const buffer = Buffer.alloc(totalLen);

  CONFIG_ACCOUNT_DISCRIMINATOR.copy(buffer, OFFSET_DISCRIMINATOR);
  authorityPubkey.toBuffer().copy(buffer, OFFSET_AUTHORITY);
  buffer.writeUInt8(status, OFFSET_STATUS);
  buffer.writeUInt32LE(configBytes.length, OFFSET_EXPECTED_LEN);
  digest.copy(buffer, OFFSET_DIGEST);
  buffer.writeUInt32LE(configBytes.length, OFFSET_VEC_LEN);
  configBytes.copy(buffer, OFFSET_PAYLOAD);

  return buffer;
}

/**
 * Deserializes and validates an on-chain Web3MCP configuration account.
 * Enforces fail-closed validation for discriminator, status, digest, and length.
 *
 * @param {Buffer|Uint8Array} data Raw account byte buffer
 * @returns {{ authority: string, status: number, expectedLen: number, digest: string, configJson: string, config: any }}
 */
export function parseConfigAccount(data) {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);

  if (buf.length < HEADER_BYTES) {
    throw new ConfigAccountError(`Account data truncated: length ${buf.length} is less than header minimum ${HEADER_BYTES}`);
  }

  // 1. Discriminator check
  const discriminator = buf.subarray(OFFSET_DISCRIMINATOR, OFFSET_AUTHORITY);
  if (!discriminator.equals(CONFIG_ACCOUNT_DISCRIMINATOR)) {
    throw new ConfigAccountError(`Discriminator mismatch: account is not a Web3McpConfig`);
  }

  // 2. Authority
  const authority = new PublicKey(buf.subarray(OFFSET_AUTHORITY, OFFSET_STATUS)).toBase58();

  // 3. Status check (fail-closed on non-Published)
  const status = buf.readUInt8(OFFSET_STATUS);
  if (status === PublicationStatus.Uninitialized) {
    throw new ConfigAccountError(`Account status is Uninitialized (0): config has not been uploaded`);
  }
  if (status === PublicationStatus.Uploading) {
    throw new ConfigAccountError(`Account status is Uploading (1): upload is incomplete`);
  }
  if (status !== PublicationStatus.Published) {
    throw new ConfigAccountError(`Unknown publication status (${status})`);
  }

  // 4. Expected length & 64 KiB cap
  const expectedLen = buf.readUInt32LE(OFFSET_EXPECTED_LEN);
  if (expectedLen > MAX_CONFIG_PAYLOAD_BYTES) {
    throw new ConfigAccountError(`Expected config length ${expectedLen} exceeds 64 KiB limit (${MAX_CONFIG_PAYLOAD_BYTES} bytes)`);
  }

  // 5. Digest
  const digest = buf.subarray(OFFSET_DIGEST, OFFSET_VEC_LEN);

  // 6. Config Vec<u8> length & payload
  const vecLen = buf.readUInt32LE(OFFSET_VEC_LEN);
  if (vecLen !== expectedLen) {
    throw new ConfigAccountError(`Length mismatch: expected ${expectedLen} bytes, vector prefix declared ${vecLen}`);
  }

  const payloadEnd = OFFSET_PAYLOAD + vecLen;
  if (buf.length !== payloadEnd) {
    throw new ConfigAccountError(`Account length mismatch: expected ${payloadEnd} bytes, available ${buf.length}`);
  }

  const configBytes = buf.subarray(OFFSET_PAYLOAD, payloadEnd);

  // 7. SHA-256 Digest verification
  const computedHash = crypto.createHash('sha256').update(configBytes).digest();
  if (!computedHash.equals(digest)) {
    throw new ConfigAccountError(`Digest mismatch: SHA-256 hash does not match account digest`);
  }

  // 8. UTF-8 JSON decode
  let configJson;
  try {
    configJson = new TextDecoder('utf-8', { fatal: true }).decode(configBytes);
  } catch {
    throw new ConfigAccountError('Config payload is not valid UTF-8');
  }
  let config;
  try {
    config = parseUniqueJson(configJson);
  } catch (err) {
    throw new ConfigAccountError(`Failed to parse config as valid JSON: ${err.message}`);
  }

  return {
    authority,
    status,
    expectedLen,
    digest: digest.toString('hex'),
    configJson,
    config,
  };
}
