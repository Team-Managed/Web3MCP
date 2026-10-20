import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { serializeConfigAccount, PublicationStatus } from '@web3mcp/protocol/account';
import { deriveConfigPda } from '@web3mcp/protocol/pda';
import { Web3McpSdk } from '../dist/index.js';
import { readFileSync } from 'node:fs';

test('discovers an executable program and its owned config using only RPC and program ID', async () => {
  const programId = Keypair.generate().publicKey.toBase58();
  const pda = deriveConfigPda(programId).pda;
  const config = {
    standard: 'web3mcp', version: '0.1.0', programId,
    idl: { address: programId, metadata: { name: 'fixture', version: '0.1.0', spec: '0.1.0' }, instructions: [] },
    tools: [],
  };
  const data = serializeConfigAccount({ authority: programId, status: PublicationStatus.Published, configUtf8: JSON.stringify(config) });
  const requested = [];
  const connection = { getAccountInfo: async address => {
    requested.push(address.toBase58());
    if (address.toBase58() === programId) return { executable: true };
    if (address.toBase58() === pda) return { owner: new PublicKey(programId), data };
    return null;
  } };
  const sdk = new Web3McpSdk({ connection });
  const discovered = await sdk.discover(programId);
  assert.deepEqual(requested, [programId, pda]);
  assert.equal(discovered.programId, programId);
  assert.deepEqual(sdk.getTools(programId), []);
});

test('one SDK discovers independent program-owned tool catalogs without target code', async () => {
  const ids = [Keypair.generate().publicKey.toBase58(), Keypair.generate().publicKey.toBase58()];
  const accounts = new Map();
  for (const [index, programId] of ids.entries()) {
    const config = JSON.parse(readFileSync(new URL('../../../protocol/fixtures/valid/reference-read.json', import.meta.url), 'utf8'));
    config.programId = programId;
    config.idl.address = programId;
    config.idl.metadata.name = index ? 'counter' : 'vault';
    const accountName = index ? 'Counter' : 'Vault';
    config.idl.accounts[0].name = accountName;
    config.idl.types[0].name = accountName;
    config.tools[0].name = index ? 'get_counter' : 'get_vault';
    config.tools[0].solana.account = accountName;
    accounts.set(programId, { executable: true, data: Buffer.alloc(0), owner: new PublicKey('BPFLoader1111111111111111111111111111111111') });
    accounts.set(deriveConfigPda(programId).pda, { owner: new PublicKey(programId), data: serializeConfigAccount({
      authority: programId, status: PublicationStatus.Published, configUtf8: JSON.stringify(config),
    }) });
  }
  const sdk = new Web3McpSdk({ connection: { getAccountInfo: async address => accounts.get(address.toBase58()) || null } });
  await Promise.all(ids.map(id => sdk.discover(id)));
  assert.deepEqual(sdk.getTools(ids[0]).map(tool => tool.name), ['get_vault']);
  assert.deepEqual(sdk.getTools(ids[1]).map(tool => tool.name), ['get_counter']);
  const result = await sdk.executeRead('get_counter', { vaultAddress: Keypair.generate().publicKey.toBase58() }, { programId: ids[1] });
  assert.equal(result.account, 'Counter');
  assert.equal(result.exists, false);
});

test('discovery snapshot changes when upgradeable ProgramData slot changes', async () => {
  const programId = Keypair.generate().publicKey.toBase58();
  const programDataAddress = Keypair.generate().publicKey;
  const loader = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');
  const programData = Buffer.alloc(36);
  programData.writeUInt32LE(2, 0);
  programDataAddress.toBuffer().copy(programData, 4);
  let slot = 1n;
  const config = { standard: 'web3mcp', version: '0.1.0', programId,
    idl: { address: programId, metadata: { name: 'fixture', version: '0.1.0', spec: '0.1.0' }, instructions: [] }, tools: [] };
  const configData = serializeConfigAccount({ authority: programId, status: PublicationStatus.Published, configUtf8: JSON.stringify(config) });
  const pda = deriveConfigPda(programId).pda;
  const connection = { getAccountInfo: async address => {
    if (address.toBase58() === programId) return { executable: true, owner: loader, data: programData };
    if (address.toBase58() === pda) return { owner: new PublicKey(programId), data: configData };
    if (address.equals(programDataAddress)) {
      const header = Buffer.alloc(12);
      header.writeUInt32LE(3, 0);
      header.writeBigUInt64LE(slot, 4);
      return { owner: loader, data: header };
    }
    return null;
  } };
  const sdk = new Web3McpSdk({ connection });
  const before = (await sdk.discover(programId)).snapshot;
  slot = 2n;
  const after = (await sdk.discover(programId)).snapshot;
  assert.notEqual(before, after);
});

test('stale config blocks write preparation before simulation', async () => {
  const programId = Keypair.generate().publicKey.toBase58();
  const pda = deriveConfigPda(programId).pda;
  const config = JSON.parse(readFileSync(new URL('../../../protocol/fixtures/valid/reference-instruction.json', import.meta.url), 'utf8'));
  config.programId = programId;
  config.idl.address = programId;
  const configData = serializeConfigAccount({ authority: programId, status: PublicationStatus.Published, configUtf8: JSON.stringify(config) });
  const accounts = new Map([
    [programId, { executable: true, owner: SystemProgram.programId, data: Buffer.from([1]) }],
    [pda, { owner: new PublicKey(programId), data: configData }],
  ]);
  const sdk = new Web3McpSdk({ connection: {
    getAccountInfo: async address => accounts.get(address.toBase58()) || null,
    getLatestBlockhash: async () => { throw new Error('simulation must not start'); },
  } });
  await sdk.discover(programId);
  accounts.set(pda, { ...accounts.get(pda), data: Buffer.concat([configData, Buffer.from([0])]) });
  await assert.rejects(sdk.prepareInstruction('deposit', { amount: '1', flag: true,
    recipient: Keypair.generate().publicKey.toBase58() }, { programId, signer: Keypair.generate().publicKey }), /config changed/i);
});
