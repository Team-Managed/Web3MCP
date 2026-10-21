import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair } from '@solana/web3.js';
import { Web3McpSdk } from '../dist/index.js';
import { executeAgentTurn } from '../dist/agent/index.js';

test('account reads use the advertised input address without guessing a PDA', async () => {
  const address = Keypair.generate().publicKey.toBase58();
  const programId = Keypair.generate().publicKey.toBase58();
  const requested = [];
  const host = new Web3McpSdk({
    connection: {
      getAccountInfo: async (pubkey) => {
        requested.push(pubkey.toBase58());
        return null;
      },
    },
  });
  host.programs.set(programId, {
    programId,
    tools: [{
      name: 'read_account',
      inputSchema: {
        type: 'object',
        properties: { address: { type: 'string' } },
        required: ['address'],
        additionalProperties: false,
      },
      solana: { kind: 'accountRead', account: 'Account', accounts: { account: { source: 'input', input: 'address' } } },
    }],
  });

  const result = await host.executeRead('read_account', { address }, { programId });
  assert.deepEqual(requested, [address]);
  assert.deepEqual(result, { exists: false, address, account: 'Account', data: null });
});

test('failed simulation never reaches wallet approval', async () => {
  let approvalCalls = 0;
  let turns = 0;
  const messages = [];
  const host = {
    toOpenAiTools: () => [],
    getTool: () => ({ solana: { kind: 'instruction' } }),
    prepareInstruction: async () => ({ simulation: { err: { InstructionError: [0, 'Custom'] } } }),
  };
  await executeAgentTurn({
    messages,
    llmClient: {
      chat: async () => ++turns === 1
        ? { role: 'assistant', content: '', toolCalls: [{ id: 'call_1', name: 'write', arguments: {} }] }
        : { role: 'assistant', content: 'The transaction failed simulation.' },
    },
    host,
    signer: Keypair.generate(),
    programId: Keypair.generate().publicKey.toBase58(),
    onApprovalRequest: async () => { approvalCalls++; return true; },
  });

  assert.equal(approvalCalls, 0);
  assert.match(messages.find((message) => message.role === 'tool').content, /Simulation failed/);
});

test('instruction preparation enforces protocol u64 bounds before RPC', async () => {
  const programId = Keypair.generate().publicKey.toBase58();
  const host = new Web3McpSdk({ connection: {} });
  host.programs.set(programId, {
    programId,
    tools: [{
      name: 'deposit',
      inputSchema: {
        type: 'object',
        properties: { amount: { type: 'string', pattern: '^[1-9][0-9]*$' } },
        required: ['amount'],
        additionalProperties: false,
      },
      solana: { kind: 'instruction', instruction: 'deposit' },
    }],
  });

  await assert.rejects(
    () => host.prepareInstruction('deposit', { amount: '18446744073709551616' }, { programId }),
    /u64 maximum/,
  );
});
