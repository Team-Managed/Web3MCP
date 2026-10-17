import Ajv from 'ajv';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { parseConfigAccount, CONFIG_ACCOUNT_DISCRIMINATOR, MAX_CONFIG_PAYLOAD_BYTES } from './account.js';
import { deriveConfigPda } from './pda.js';
import { validateIdlProfile } from './idl-profile.js';
import { PublicKey } from '@solana/web3.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const schemaPath = join(__dirname, '../schema/config.schema.json');
const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);
const U64_PATTERN = '^[1-9][0-9]*$';
const PUBLIC_KEY_PATTERN = '^[1-9A-HJ-NP-Za-km-z]{32,44}$';
const MAX_U64 = (1n << 64n) - 1n;

/** Validate arguments proposed for a previously validated tool descriptor. */
export function validateToolInput(tool, input) {
  const errors = [];
  try {
    const check = ajv.compile(tool.inputSchema);
    if (!check(input)) {
      errors.push(...(check.errors || []).map((error) => `${error.instancePath || '<root>'}: ${error.message}`));
    }
  } catch (error) {
    return { valid: false, errors: [`Invalid tool input schema: ${error.message}`] };
  }
  if (errors.length) return { valid: false, errors };

  for (const [name, property] of Object.entries(tool.inputSchema.properties)) {
    if (!Object.hasOwn(input, name)) continue;
    if (property.pattern === U64_PATTERN && BigInt(input[name]) > MAX_U64) {
      errors.push(`${name}: value exceeds u64 maximum`);
    }
    if (property.pattern === PUBLIC_KEY_PATTERN) {
      try {
        new PublicKey(input[name]);
      } catch {
        errors.push(`${name}: value is not a 32-byte public key`);
      }
    }
  }
  return errors.length ? { valid: false, errors } : { valid: true };
}

/**
 * Validates a Web3MCP configuration object against the normative JSON Schema
 * and semantic consistency rules (e.g. unique tool names).
 *
 * @param {unknown} config
 * @returns {{ valid: boolean, errors?: string[] }}
 */
export function validateConfigSchema(config) {
  const schemaValid = Boolean(validate(config));
  const errors = [];

  if (!schemaValid) {
    for (const err of validate.errors || []) {
      const path = err.instancePath || '<root>';
      errors.push(`${path}: ${err.message}`);
    }
  }

  // Semantic check: ensure tool names are unique across tools array
  if (config && typeof config === 'object' && Array.isArray(config.tools)) {
    const seenNames = new Set();
    for (let i = 0; i < config.tools.length; i++) {
      const tool = config.tools[i];
      if (tool && typeof tool.name === 'string') {
        if (seenNames.has(tool.name)) {
          errors.push(`/tools/${i}/name: duplicate tool name '${tool.name}'`);
        } else {
          seenNames.add(tool.name);
        }
      }
      if (tool?.inputSchema?.properties && Array.isArray(tool.inputSchema.required)) {
        for (const name of tool.inputSchema.required) {
          if (!Object.hasOwn(tool.inputSchema.properties, name)) {
            errors.push(`/tools/${i}/inputSchema/required: '${name}' is not defined in properties`);
          }
        }
      }
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
    };
  }

  return { valid: true };
}

/**
 * Comprehensive protocol conformance validator.
 * Accepts raw account binary buffer, JSON string, or parsed JSON object.
 * Enforces schema validation, binary integrity (if binary), IDL cross-references,
 * and account resolution consistency.
 *
 * @param {Buffer|Uint8Array|string|object} configInput
 * @returns {{ valid: boolean, errors?: string[], config?: any }}
 */
export function validateConfig(configInput) {
  let config;
  const errors = [];

  try {
    if (Buffer.isBuffer(configInput) || configInput instanceof Uint8Array) {
      const buf = Buffer.from(configInput);
      if (buf.length >= 8 && buf.subarray(0, 8).equals(CONFIG_ACCOUNT_DISCRIMINATOR)) {
        const parsedAccount = parseConfigAccount(buf);
        config = parsedAccount.config;
      } else {
        if (buf.length > MAX_CONFIG_PAYLOAD_BYTES) {
          return { valid: false, errors: ['Raw JSON config exceeds 64 KiB payload limit'] };
        }
        config = JSON.parse(buf.toString('utf8'));
      }
    } else if (typeof configInput === 'string') {
      if (Buffer.byteLength(configInput, 'utf8') > MAX_CONFIG_PAYLOAD_BYTES) {
        return { valid: false, errors: ['Raw JSON config exceeds 64 KiB payload limit'] };
      }
      config = JSON.parse(configInput);
    } else if (configInput && typeof configInput === 'object') {
      if (Buffer.byteLength(JSON.stringify(configInput), 'utf8') > MAX_CONFIG_PAYLOAD_BYTES) {
        return { valid: false, errors: ['JSON config exceeds 64 KiB payload limit'] };
      }
      config = configInput;
    } else {
      return { valid: false, errors: ['Input must be a JSON object, JSON string, or account Buffer'] };
    }
  } catch (err) {
    return { valid: false, errors: [`Failed to parse config input: ${err.message}`] };
  }

  // 1. JSON Schema validation
  const schemaResult = validateConfigSchema(config);
  if (!schemaResult.valid) {
    return schemaResult;
  }

  try {
    new PublicKey(config.programId);
  } catch {
    errors.push('/programId: value is not a 32-byte public key');
  }
  if (config.idl.address && config.idl.address !== config.programId) {
    errors.push('/idl/address: embedded IDL address does not match programId');
  }

  errors.push(...validateIdlProfile(config));

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, config };
}

/** Validate discovery metadata together with the published account bytes. */
export function validateDiscoveredConfig({ programId, programAccount, configAddress, configAccount }) {
  const errors = [];
  let canonicalProgramId;
  try {
    canonicalProgramId = new PublicKey(programId).toBase58();
  } catch {
    return { valid: false, errors: ['Invalid target programId'] };
  }

  if (!programAccount || programAccount.executable !== true) {
    errors.push('Target program account is missing or not executable');
  }
  if (!configAccount || !configAccount.data) {
    errors.push('Config account is missing');
  } else {
    try {
      if (new PublicKey(configAccount.owner).toBase58() !== canonicalProgramId) {
        errors.push('Config account owner does not match target programId');
      }
    } catch {
      errors.push('Config account owner is not a public key');
    }
  }
  try {
    if (new PublicKey(configAddress).toBase58() !== deriveConfigPda(canonicalProgramId).pda) {
      errors.push('Config account address is not the canonical PDA');
    }
  } catch {
    errors.push('Config account address is not a public key');
  }
  if (errors.length) return { valid: false, errors };

  let parsed;
  try {
    parsed = parseConfigAccount(configAccount.data);
  } catch (error) {
    return { valid: false, errors: [`Invalid published Config PDA account: ${error.message}`] };
  }
  const result = validateConfig(parsed.config);
  if (!result.valid) return result;
  if (result.config.programId !== canonicalProgramId) {
    return { valid: false, errors: ['Manifest programId does not match target programId'] };
  }
  if (result.config.idl.address && result.config.idl.address !== canonicalProgramId) {
    return { valid: false, errors: ['Embedded IDL address does not match target programId'] };
  }
  return result;
}
