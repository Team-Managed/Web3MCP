import { PublicKey } from '@solana/web3.js';

const U64_PATTERN = '^[1-9][0-9]*$';
const PUBLIC_KEY_PATTERN = '^[1-9A-HJ-NP-Za-km-z]{32,44}$';
const READ_FIELD_TYPES = new Set(['u8', 'u16', 'u32', 'u64', 'bool', 'pubkey']);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isPubkeyProperty(property) {
  return property?.type === 'string' && property.pattern === PUBLIC_KEY_PATTERN;
}

function isByteArray(value, length) {
  return Array.isArray(value) && value.length === length && value.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255);
}

function validPubkey(value) {
  try {
    return new PublicKey(value).toBase58() === value;
  } catch {
    return false;
  }
}

function validateAddressBinding(binding, inputSchema, path, errors) {
  if (binding.source === 'input') {
    if (!isPubkeyProperty(inputSchema.properties[binding.input]) || !inputSchema.required.includes(binding.input)) {
      errors.push(`${path}: input '${binding.input}' must be a required publicKey property`);
    }
  } else if (binding.source === 'program' && !validPubkey(binding.address)) {
    errors.push(`${path}: fixed address is not a 32-byte public key`);
  }
}

function validateInstruction(tool, instruction, path, errors) {
  if (!isByteArray(instruction.discriminator, 8) || !Array.isArray(instruction.accounts) || !Array.isArray(instruction.args)) {
    errors.push(`${path}: IDL instruction requires an 8-byte discriminator, flat accounts, and args`);
    return;
  }
  const idlAccountNames = instruction.accounts.map((account) => account?.name);
  const bindings = tool.solana.accounts;
  if (new Set(idlAccountNames).size !== idlAccountNames.length || idlAccountNames.some((name) => typeof name !== 'string')) {
    errors.push(`${path}: IDL instruction account names are missing or duplicated`);
    return;
  }
  if (Object.keys(bindings).length !== idlAccountNames.length || idlAccountNames.some((name) => !Object.hasOwn(bindings, name))) {
    errors.push(`${path}: account bindings must exactly match the IDL instruction accounts`);
  }

  for (const account of instruction.accounts) {
    const binding = bindings[account.name];
    if (!binding) continue;
    const accountPath = `${path}/accounts/${account.name}`;
    if (account.optional || Object.hasOwn(account, 'accounts') || !isRecord(account) || typeof account.writable !== 'boolean' && account.writable !== undefined ||
        typeof account.signer !== 'boolean' && account.signer !== undefined) {
      errors.push(`${accountPath}: unsupported or malformed IDL account`);
      continue;
    }
    validateAddressBinding(binding, tool.inputSchema, accountPath, errors);
    if (account.signer === true && binding.source !== 'signer') {
      errors.push(`${accountPath}: signer account must use the wallet signer`);
    }
    if (binding.source === 'signer' && account.signer !== true) {
      errors.push(`${accountPath}: wallet signer binding requires an IDL signer account`);
    }
    if (Object.hasOwn(account, 'address') && (!validPubkey(account.address) || binding.source !== 'program' || account.address !== binding.address)) {
      errors.push(`${accountPath}: fixed address differs from IDL address or binding source`);
    }
    if (binding.source === 'idl') {
      const seeds = account.pda?.seeds;
      if (!Array.isArray(seeds) || seeds.length === 0 || seeds.length > 15 || account.pda.program !== undefined) {
        errors.push(`${accountPath}: IDL PDA must have supported seeds under the target program`);
        continue;
      }
      for (const seed of seeds) {
        if (seed?.kind === 'const' && isByteArray(seed.value, seed.value?.length) && seed.value.length <= 32) continue;
        if (seed?.kind === 'account' && typeof seed.path === 'string' &&
            idlAccountNames.includes(seed.path) && bindings[seed.path] && bindings[seed.path].source !== 'idl') continue;
        errors.push(`${accountPath}: unsupported or unresolved IDL PDA seed`);
      }
    }
  }

  const argNames = instruction.args.map((arg) => arg?.name);
  if (new Set(argNames).size !== argNames.length || argNames.some((name) => typeof name !== 'string')) {
    errors.push(`${path}: IDL argument names are missing or duplicated`);
  }
  for (const arg of instruction.args) {
    if (!isRecord(arg) || typeof arg.name !== 'string') continue;
    const property = tool.inputSchema.properties[arg.name];
    if (!property || !tool.inputSchema.required.includes(arg.name)) {
      errors.push(`${path}/args/${arg.name}: IDL argument must be a required tool input`);
      continue;
    }
    const matches = arg.type === 'u64' ? property.type === 'string' && property.pattern === U64_PATTERN
      : arg.type === 'bool' ? property.type === 'boolean'
      : arg.type === 'pubkey' ? isPubkeyProperty(property)
      : false;
    if (!matches) errors.push(`${path}/args/${arg.name}: unsupported or mismatched IDL argument type`);
  }
  const accountInputs = new Set(Object.values(bindings).filter((binding) => binding.source === 'input').map((binding) => binding.input));
  for (const name of Object.keys(tool.inputSchema.properties)) {
    if (!argNames.includes(name) && !accountInputs.has(name)) {
      errors.push(`${path}/inputSchema/${name}: input is unused by the instruction`);
    }
  }
}

function validateRead(tool, idl, account, path, errors) {
  if (!isByteArray(account.discriminator, 8)) {
    errors.push(`${path}: IDL account requires an 8-byte discriminator`);
  }
  const definition = Array.isArray(idl.types) && idl.types.find((type) => type?.name === account.name);
  if (!definition || definition.type?.kind !== 'struct' || !Array.isArray(definition.type.fields) ||
      definition.type.fields.some((field) => typeof field?.name !== 'string' || !READ_FIELD_TYPES.has(field.type)) ||
      new Set(definition.type.fields.map((field) => field.name)).size !== definition.type.fields.length) {
    errors.push(`${path}: read account requires a supported struct type in IDL types`);
  }
  const bindings = Object.entries(tool.solana.accounts);
  if (bindings.length !== 1) {
    errors.push(`${path}: accountRead requires exactly one address binding`);
  }
  for (const [name, binding] of bindings) {
    validateAddressBinding(binding, tool.inputSchema, `${path}/accounts/${name}`, errors);
    if (binding.source === 'idl') errors.push(`${path}/accounts/${name}: accountRead has no instruction PDA seeds to resolve`);
  }
  const accountInputs = new Set(bindings.filter(([, binding]) => binding.source === 'input').map(([, binding]) => binding.input));
  for (const name of Object.keys(tool.inputSchema.properties)) {
    if (!accountInputs.has(name)) errors.push(`${path}/inputSchema/${name}: input is unused by the account read`);
  }
}

/** Validate the Anchor 0.1 IDL profile needed to execute advertised v0.1 tools. */
export function validateIdlProfile(config) {
  const errors = [];
  const idl = config.idl;
  if (!validPubkey(idl.address) || idl.address !== config.programId ||
      !isRecord(idl.metadata) || typeof idl.metadata.name !== 'string' ||
      typeof idl.metadata.version !== 'string' || idl.metadata.spec !== '0.1.0' ||
      !Array.isArray(idl.instructions)) {
    return ['/idl: expected Anchor IDL 0.1.0 with matching address, metadata, and instructions'];
  }
  for (const [collection, values] of [['instructions', idl.instructions], ['accounts', idl.accounts], ['types', idl.types]]) {
    if (values !== undefined && (!Array.isArray(values) ||
        values.some((item) => typeof item?.name !== 'string') ||
        new Set(values.map((item) => item.name)).size !== values.length)) {
      errors.push(`/idl/${collection}: entries must have unique names`);
    }
  }
  if (errors.length) return errors;
  for (const [i, tool] of config.tools.entries()) {
    const path = `/tools/${i}`;
    if (tool.solana.kind === 'instruction') {
      const instruction = idl.instructions.find((candidate) => candidate?.name === tool.solana.instruction);
      if (!instruction) {
        errors.push(`${path}: instruction '${tool.solana.instruction}' is not defined in IDL`);
      } else {
        validateInstruction(tool, instruction, path, errors);
      }
    } else {
      const account = Array.isArray(idl.accounts) && idl.accounts.find((candidate) => candidate?.name === tool.solana.account);
      if (!account) {
        errors.push(`${path}: account '${tool.solana.account}' is not defined in IDL`);
      } else {
        validateRead(tool, idl, account, path, errors);
      }
    }
  }
  return errors;
}
