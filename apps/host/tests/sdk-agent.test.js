import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { Keypair, SystemProgram, Transaction } from '@solana/web3.js';
import { executeAgentTurn } from '../dist/agent/index.js';

function model(tool) {
  let turn = 0;
  return { chat: async () => ++turn === 1
    ? { role: 'assistant', content: '', toolCalls: [{ id: 'call-1', name: tool, arguments: { amount: '1' } }] }
    : { role: 'assistant', content: 'Finished.' } };
}

function hostFixture(signer) {
  const transaction = new Transaction({ feePayer: signer.publicKey, recentBlockhash: Keypair.generate().publicKey.toBase58() })
    .add(SystemProgram.transfer({ fromPubkey: signer.publicKey, toPubkey: Keypair.generate().publicKey, lamports: 1 }));
  const prepared = {
    tool: 'deposit', programId: Keypair.generate().publicKey.toBase58(), accounts: [], effects: { summary: 'Deposit' },
    instruction: transaction.instructions[0], transaction, simulation: { err: null }, lastValidBlockHeight: 100,
    messageHash: crypto.createHash('sha256').update(transaction.serializeMessage()).digest('hex'),
  };
  let submissions = 0;
  const host = {
    toOpenAiTools: () => [],
    getTool: name => { if (name !== 'deposit') throw new Error('Missing tool'); return { solana: { kind: 'instruction' } }; },
    prepareInstruction: async () => prepared,
    submitSignedTransaction: async (reviewed, signed) => {
      assert.equal(reviewed, prepared);
      assert.ok(signed.verifySignatures(true));
      submissions++;
      return { signature: 'confirmed-signature' };
    },
  };
  return { host, prepared, getSubmissions: () => submissions };
}

test('agent rejects an instruction without signing or submitting', async () => {
  const signer = Keypair.generate();
  const { host, prepared, getSubmissions } = hostFixture(signer);
  const messages = [];
  await executeAgentTurn({ messages, llmClient: model('deposit'), host, signer, onApprovalRequest: async () => false });
  assert.equal(getSubmissions(), 0);
  assert.equal(prepared.transaction.signatures[0]?.signature, null);
  assert.match(messages.find(message => message.role === 'tool').content, /rejected by user/);
});

test('agent signs and submits only after approval through SDK handoff', async () => {
  const signer = Keypair.generate();
  const { host, getSubmissions } = hostFixture(signer);
  const messages = [];
  const response = await executeAgentTurn({ messages, llmClient: model('deposit'), host, signer, onApprovalRequest: async () => true });
  assert.equal(response, 'Finished.');
  assert.equal(getSubmissions(), 1);
});

test('agent rejects a model-invented tool before execution', async () => {
  const signer = Keypair.generate();
  const { host, getSubmissions } = hostFixture(signer);
  const messages = [];
  await executeAgentTurn({ messages, llmClient: model('invented'), host, signer, onApprovalRequest: async () => true });
  assert.equal(getSubmissions(), 0);
  assert.match(messages.find(message => message.role === 'tool').content, /not found/i);
});

test('model discovers a program and receives its published tools on the next turn', async () => {
  const programId = Keypair.generate().publicKey.toBase58();
  const calls = [];
  const host = {
    toOpenAiTools: id => id ? [{ type: 'function', function: { name: 'get_vault', parameters: { type: 'object', properties: {} } } }] : [],
    getTool: (name, id) => {
      assert.equal(id, programId);
      assert.equal(name, 'get_vault');
      return { solana: { kind: 'accountRead' } };
    },
    executeRead: async (name, args, options) => {
      calls.push({ name, args, options });
      return { exists: true, data: { balance: '1' } };
    },
  };
  let turn = 0;
  const llmClient = { chat: async ({ tools }) => {
    turn++;
    const names = tools.map(tool => tool.function.name);
    if (turn === 1) {
      assert.deepEqual(names, ['web3mcp_host_discover_program']);
      return { content: '', toolCalls: [{ id: 'discover', name: names[0], arguments: { reference: programId } }] };
    }
    assert.deepEqual(names, ['web3mcp_host_discover_program', 'get_vault']);
    return turn === 2
      ? { content: '', toolCalls: [{ id: 'read', name: 'get_vault', arguments: {} }] }
      : { content: 'Vault read.' };
  } };
  const messages = [];
  const discovered = [];
  const answer = await executeAgentTurn({ messages, host, llmClient,
    onDiscoverProgram: async reference => {
      assert.equal(reference, programId);
      return { programId, toolNames: ['get_vault'] };
    },
    onProgress: event => { if (event.type === 'discovery_result') discovered.push(event); },
  });
  assert.equal(answer, 'Vault read.');
  assert.deepEqual(calls, [{ name: 'get_vault', args: {}, options: { programId } }]);
  assert.deepEqual(discovered, [{ type: 'discovery_result', programId, toolNames: ['get_vault'] }]);
});

test('newly discovered tools cannot run before the model receives their definitions', async () => {
  const programId = Keypair.generate().publicKey.toBase58();
  let reads = 0;
  const host = {
    toOpenAiTools: id => id ? [{ type: 'function', function: { name: 'get_vault' } }] : [],
    executeRead: async () => { reads++; },
  };
  let turn = 0;
  const messages = [];
  await executeAgentTurn({ messages, host, onDiscoverProgram: async () => ({ programId, toolNames: ['get_vault'] }),
    llmClient: { chat: async () => ++turn === 1
      ? { content: '', toolCalls: [
        { id: 'discover', name: 'web3mcp_host_discover_program', arguments: { reference: programId } },
        { id: 'guessed', name: 'get_vault', arguments: {} },
      ] }
      : { content: 'Done.' } },
  });
  assert.equal(reads, 0);
  assert.match(messages.find(message => message.tool_call_id === 'guessed').content, /not advertised/);
});
