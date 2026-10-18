import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair, PublicKey } from '@solana/web3.js';
import { serializeConfigAccount, PublicationStatus } from '@web3mcp/protocol/account';
import { deriveConfigPda } from '@web3mcp/protocol/pda';
import { Web3McpSdk } from '../dist/index.js';

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
