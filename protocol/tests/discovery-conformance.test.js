import test from 'node:test';
import assert from 'node:assert/strict';
import { serializeConfigAccount, PublicationStatus } from '../src/account.js';
import { deriveConfigPda } from '../src/pda.js';
import { validateDiscoveredConfig } from '../src/validator.js';

const programId = '11111111111111111111111111111111';
const otherProgram = 'BPFLoaderUpgradeab1e11111111111111111111111';
const config = {
  standard: 'web3mcp',
  version: '0.1.0',
  programId,
  idl: { address: programId, metadata: { name: 'fixture', version: '0.1.0', spec: '0.1.0' }, instructions: [] },
  tools: [],
};
const data = serializeConfigAccount({
  authority: programId,
  status: PublicationStatus.Published,
  configUtf8: JSON.stringify(config),
});

function discovery(overrides = {}) {
  return {
    programId,
    programAccount: { executable: true },
    configAddress: deriveConfigPda(programId).pda,
    configAccount: { owner: programId, data },
    ...overrides,
  };
}

test('accepts an executable program and its owned canonical published config', () => {
  assert.equal(validateDiscoveredConfig(discovery()).valid, true);
});

test('rejects plain JSON bytes at the canonical PDA even when the manifest is valid', () => {
  const result = validateDiscoveredConfig(discovery({
    configAccount: { owner: programId, data: Buffer.from(JSON.stringify(config)) },
  }));
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /published Config PDA account/i);
});

test('rejects a config account owned by another program', () => {
  const result = validateDiscoveredConfig(discovery({ configAccount: { owner: otherProgram, data } }));
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /owner/i);
});

test('rejects a config at the wrong address', () => {
  const result = validateDiscoveredConfig(discovery({ configAddress: otherProgram }));
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /PDA/i);
});

test('rejects a nonexecutable target program', () => {
  const result = validateDiscoveredConfig(discovery({ programAccount: { executable: false } }));
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /executable/i);
});

test('rejects a manifest claiming another program ID', () => {
  const mismatched = { ...config, programId: otherProgram };
  const accountData = serializeConfigAccount({
    authority: programId,
    status: PublicationStatus.Published,
    configUtf8: JSON.stringify(mismatched),
  });
  const result = validateDiscoveredConfig(discovery({ configAccount: { owner: programId, data: accountData } }));
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /programId/i);
});

test('rejects an embedded IDL addressed to another program', () => {
  const mismatched = { ...config, idl: { ...config.idl, address: otherProgram } };
  const accountData = serializeConfigAccount({
    authority: programId,
    status: PublicationStatus.Published,
    configUtf8: JSON.stringify(mismatched),
  });
  const result = validateDiscoveredConfig(discovery({ configAccount: { owner: programId, data: accountData } }));
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /IDL address/i);
});
