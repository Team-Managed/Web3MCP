import test from 'node:test';
import assert from 'node:assert/strict';
import { validateConfig } from '../src/validator.js';
import { MAX_CONFIG_PAYLOAD_BYTES } from '../src/account.js';

const programId = '11111111111111111111111111111111';
const publicKey = { type: 'string', pattern: '^[1-9A-HJ-NP-Za-km-z]{32,44}$' };
const u64 = { type: 'string', pattern: '^[1-9][0-9]*$' };

function config() {
  return {
    standard: 'web3mcp', version: '0.1.0', programId,
    idl: {
      address: programId,
      metadata: { name: 'fixture', version: '0.1.0', spec: '0.1.0' },
      instructions: [{
        name: 'deposit', discriminator: [1, 2, 3, 4, 5, 6, 7, 8],
        accounts: [
          { name: 'owner', signer: true, writable: true },
          { name: 'vault', writable: true, pda: { seeds: [
            { kind: 'const', value: [118, 97, 117, 108, 116] },
            { kind: 'account', path: 'owner' },
          ] } },
          { name: 'system_program', address: programId },
        ],
        args: [{ name: 'amount', type: 'u64' }],
      }],
      accounts: [{ name: 'Vault', discriminator: [8, 7, 6, 5, 4, 3, 2, 1] }],
      types: [{ name: 'Vault', type: { kind: 'struct', fields: [
        { name: 'owner', type: 'pubkey' }, { name: 'balance', type: 'u64' },
      ] } }],
    },
    tools: [
      {
        name: 'deposit', inputSchema: { type: 'object', properties: { amount: u64 }, required: ['amount'], additionalProperties: false },
        solana: { kind: 'instruction', instruction: 'deposit', accounts: {
          owner: { source: 'signer' }, vault: { source: 'idl' }, system_program: { source: 'program', address: programId },
        }, effects: { stateChanging: true, financial: true } },
      },
      {
        name: 'get_vault', inputSchema: { type: 'object', properties: { vaultAddress: publicKey }, required: ['vaultAddress'], additionalProperties: false },
        solana: { kind: 'accountRead', account: 'Vault', accounts: { vault: { source: 'input', input: 'vaultAddress' } } },
      },
    ],
  };
}

test('accepts a complete modern Anchor IDL and exact executable bindings', () => {
  assert.equal(validateConfig(config()).valid, true);
});

const badCases = [
  ['missing IDL address', (c) => { delete c.idl.address; }],
  ['missing IDL metadata', (c) => { delete c.idl.metadata; }],
  ['wrong IDL address', (c) => { c.idl.address = 'BPFLoaderUpgradeab1e11111111111111111111111'; }],
  ['missing instruction discriminator', (c) => { delete c.idl.instructions[0].discriminator; }],
  ['missing instruction account binding', (c) => { delete c.tools[0].solana.accounts.vault; }],
  ['extra instruction account binding', (c) => { c.tools[0].solana.accounts.extra = { source: 'signer' }; }],
  ['missing argument', (c) => { delete c.tools[0].inputSchema.properties.amount; c.tools[0].inputSchema.required = []; }],
  ['optional argument', (c) => { c.tools[0].inputSchema.required = []; }],
  ['wrong argument type', (c) => { c.tools[0].inputSchema.properties.amount = publicKey; }],
  ['signer account bound to program', (c) => { c.tools[0].solana.accounts.owner = { source: 'program', address: programId }; }],
  ['fixed program address mismatch', (c) => { c.tools[0].solana.accounts.system_program.address = 'BPFLoaderUpgradeab1e11111111111111111111111'; }],
  ['missing PDA seeds', (c) => { delete c.idl.instructions[0].accounts[1].pda; }],
  ['unsupported PDA seed', (c) => { c.idl.instructions[0].accounts[1].pda.seeds[1] = { kind: 'arg', path: 'amount' }; }],
  ['sixteen PDA seeds before the bump', (c) => { c.idl.instructions[0].accounts[1].pda.seeds = Array.from({ length: 16 }, () => ({ kind: 'const', value: [1] })); }],
  ['missing read type', (c) => { c.idl.types = []; }],
  ['duplicate readable struct fields', (c) => { c.idl.types[0].type.fields.push({ name: 'balance', type: 'u64' }); }],
  ['multiple read addresses', (c) => { c.tools[1].solana.accounts.second = { source: 'input', input: 'vaultAddress' }; }],
  ['read address bound to number', (c) => { c.tools[1].inputSchema.properties.vaultAddress = u64; }],
  ['unused account-read input', (c) => { c.tools[1].inputSchema.properties.confirm = { type: 'boolean' }; c.tools[1].inputSchema.required.push('confirm'); }],
  ['required property absent from properties', (c) => { c.tools[0].inputSchema.required.push('ghost'); }],
  ['duplicate required property', (c) => { c.tools[0].inputSchema.required.push('amount'); }],
  ['duplicate IDL instructions', (c) => { c.idl.instructions.push(structuredClone(c.idl.instructions[0])); }],
  ['nested IDL instruction accounts', (c) => { c.idl.instructions[0].accounts[0].accounts = []; }],
  ['object-valued nested IDL instruction accounts', (c) => { c.idl.instructions[0].accounts[0].accounts = {}; }],
  ['empty IDL fixed address', (c) => { c.idl.instructions[0].accounts[0].address = ''; }],
  ['numeric optional account flag', (c) => { c.idl.instructions[0].accounts[0].optional = 0; }],
  ['null optional account flag', (c) => { c.idl.instructions[0].accounts[0].optional = null; }],
  ['optional account', (c) => { c.idl.instructions[0].accounts[0].optional = true; }],
];

for (const [label, mutate] of badCases) {
  test(`rejects ${label}`, () => {
    const candidate = config();
    mutate(candidate);
    assert.equal(validateConfig(candidate).valid, false, label);
  });
}

test('rejects raw JSON larger than the on-chain payload limit', () => {
  const raw = JSON.stringify(config()).padEnd(MAX_CONFIG_PAYLOAD_BYTES + 1, ' ');
  for (const input of [raw, Buffer.from(raw)]) {
    const result = validateConfig(input);
    assert.equal(result.valid, false);
    assert.match(result.errors.join(' '), /64 KiB|65,536|65536/);
  }
});

test('rejects malformed UTF-8 in a raw JSON buffer', () => {
  const candidate = config();
  candidate.tools[0].description = 'marker';
  const raw = Buffer.from(JSON.stringify(candidate));
  const index = raw.indexOf('marker');
  assert.notEqual(index, -1);
  raw[index] = 0xff;
  const result = validateConfig(raw);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /UTF-8/i);
});

test('rejects duplicate decoded JSON member names at every depth', () => {
  const raw = JSON.stringify(config());
  const duplicateTopLevel = raw.replace('"programId":', '"programId":"11111111111111111111111111111111","programId":');
  const duplicateNested = raw.replace('"source":"signer"', '"source":"input","\\u0073ource":"signer"');
  for (const duplicate of [duplicateTopLevel, duplicateNested]) {
    for (const input of [duplicate, Buffer.from(duplicate)]) {
      const result = validateConfig(input);
      assert.equal(result.valid, false);
      assert.match(result.errors.join(' '), /duplicate/i);
    }
  }
});
