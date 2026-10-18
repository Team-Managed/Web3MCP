import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { Keypair, SystemProgram, Transaction } from '@solana/web3.js';
import { executeAgentTurn, Web3McpAgent } from '../dist/agent/index.js';
import { TransactionConfirmationUnknownError } from '@web3mcp/sdk';

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

test('agent never executes tools proposed on its final allowed turn', async () => {
  const signer = Keypair.generate();
  const { host, getSubmissions } = hostFixture(signer);
  const messages = [];
  const result = await executeAgentTurn({ messages, llmClient: model('deposit'), host, signer,
    onApprovalRequest: async () => true, maxTurns: 1 });
  assert.match(result, /final requested tools were not executed/i);
  assert.equal(getSubmissions(), 0);
  assert.match(messages.find(message => message.role === 'tool').content, /before tool execution/i);
});

test('confirmed writes use genesis hash for Explorer links on custom RPC endpoints', async () => {
  const signer = Keypair.generate();
  const { host } = hostFixture(signer);
  host.connection = { rpcEndpoint: 'https://paid-rpc.example/v1', getGenesisHash: async () => 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG' };
  const events = [];
  await executeAgentTurn({ messages: [], llmClient: model('deposit'), host, signer,
    onApprovalRequest: async () => true, onProgress: event => events.push(event) });
  assert.equal(events.find(event => event.type === 'broadcast_confirmed').explorerUrl,
    'https://explorer.solana.com/tx/confirmed-signature?cluster=devnet');
});

test('host discovery names do not collide with a published program tool', async () => {
  const programId = Keypair.generate().publicKey.toBase58();
  let seen;
  await executeAgentTurn({ messages: [], programId,
    host: { toOpenAiTools: () => [{ type: 'function', function: { name: 'web3mcp_host_discover_program' } }] },
    onDiscoverProgram: async () => ({ programId, toolNames: ['web3mcp_host_discover_program'] }),
    llmClient: { chat: async ({ tools }) => {
      seen = tools.map(tool => tool.function.name);
      return { content: 'Ready.' };
    } },
  });
  assert.deepEqual(seen, ['web3mcp_host_discover_program_1', 'web3mcp_host_discover_program']);
});

test('agent preserves a submitted signature when RPC confirmation is uncertain', async () => {
  const signer = Keypair.generate();
  const { host } = hostFixture(signer);
  host.submitSignedTransaction = async () => { throw new TransactionConfirmationUnknownError('known-signature'); };
  const messages = [];
  const progress = [];
  await executeAgentTurn({ messages, llmClient: model('deposit'), host, signer,
    onApprovalRequest: async () => true, onProgress: event => progress.push(event) });
  const outcome = JSON.parse(messages.find(message => message.role === 'tool').content);
  assert.equal(outcome.status, 'confirmation_unknown');
  assert.equal(outcome.signature, 'known-signature');
  assert.match(progress.find(event => event.type === 'tool_result').summary, /known-signature/);
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

test('agent supplies the selected wallet address to signer-sourced account reads', async () => {
  const signer = Keypair.generate();
  let options;
  let turn = 0;
  await executeAgentTurn({ signer, messages: [],
    host: {
      toOpenAiTools: () => [],
      getTool: () => ({ solana: { kind: 'accountRead' } }),
      executeRead: async (_name, _args, readOptions) => { options = readOptions; return { exists: false }; },
    },
    llmClient: { chat: async () => ++turn === 1
      ? { content: '', toolCalls: [{ id: 'read', name: 'get_account', arguments: {} }] }
      : { content: 'Done.' } },
  });
  assert.equal(options.signer.toBase58(), signer.publicKey.toBase58());
});

test('agent resolves a PDA from a published instruction before reading it', async () => {
  const signer = Keypair.generate();
  const programId = Keypair.generate().publicKey.toBase58();
  const vaultAddress = Keypair.generate().publicKey.toBase58();
  const calls = [];
  let turn = 0;
  const answer = await executeAgentTurn({ signer, programId, messages: [],
    host: {
      toOpenAiTools: () => [{ type: 'function', function: { name: 'get_vault' } }],
      resolveToolAccounts: (name, args, options) => {
        calls.push({ name, args, options });
        return [{ name: 'vault', pubkey: vaultAddress, isSigner: false, isWritable: true }];
      },
      getTool: () => ({ solana: { kind: 'accountRead' } }),
      executeRead: async (_name, args) => { assert.equal(args.vaultAddress, vaultAddress); return { exists: false, address: vaultAddress }; },
    },
    llmClient: { chat: async ({ tools }) => {
      turn++;
      assert.ok(tools.some(tool => tool.function.name === 'web3mcp_host_resolve_accounts'));
      if (turn === 1) return { content: '', toolCalls: [{ id: 'resolve', name: 'web3mcp_host_resolve_accounts', arguments: { tool: 'initialize', arguments: {} } }] };
      if (turn === 2) return { content: '', toolCalls: [{ id: 'read', name: 'get_vault', arguments: { vaultAddress } }] };
      return { content: 'Your vault does not exist yet.' };
    } },
  });
  assert.equal(answer, 'Your vault does not exist yet.');
  assert.equal(calls[0].options.signer.toBase58(), signer.publicKey.toBase58());
});

test('agent stops repeated identical read validation failures with the actual error', async () => {
  let turns = 0;
  const answer = await executeAgentTurn({ messages: [],
    host: {
      toOpenAiTools: () => [{ type: 'function', function: { name: 'get_vault' } }],
      getTool: () => ({ solana: { kind: 'accountRead' } }),
      executeRead: async () => { throw new Error('vaultAddress is not a 32-byte public key'); },
    },
    llmClient: { chat: async () => { turns++; return { content: '', toolCalls: [
      { id: `read-${turns}`, name: 'get_vault', arguments: { vaultAddress: 'wallet' } },
    ] }; } },
  });
  assert.match(answer, /vaultAddress is not a 32-byte public key/);
  assert.doesNotMatch(answer, /maximum conversation turn limit/);
  assert.equal(turns, 2);
});

test('repeated read failure answers all calls in the pending model batch', async () => {
  let turns = 0;
  const messages = [];
  await executeAgentTurn({ messages,
    host: {
      toOpenAiTools: () => [{ type: 'function', function: { name: 'get_vault' } }],
      getTool: () => ({ solana: { kind: 'accountRead' } }),
      executeRead: async () => { throw new Error('bad vault address'); },
    },
    llmClient: { chat: async () => ({ content: '', toolCalls: ++turns === 1
      ? [{ id: 'first', name: 'get_vault', arguments: {} }]
      : [{ id: 'second', name: 'get_vault', arguments: {} }, { id: 'third', name: 'get_vault', arguments: {} }] }) },
  });
  assert.deepEqual(messages.filter(message => message.role === 'tool').map(message => message.tool_call_id), ['first', 'second', 'third']);
  assert.match(messages.at(-1).content, /Skipped after a repeated read failure/);
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

test('a shared tool name cannot switch from one program to another in the same model turn', async () => {
  const firstProgram = Keypair.generate().publicKey.toBase58();
  const secondProgram = Keypair.generate().publicKey.toBase58();
  let reads = 0;
  let turns = 0;
  const messages = [];
  await executeAgentTurn({ messages, programId: firstProgram,
    host: {
      toOpenAiTools: () => [{ type: 'function', function: { name: 'get_vault' } }],
      getTool: () => { reads++; throw new Error('Should not execute'); },
    },
    onDiscoverProgram: async () => ({ programId: secondProgram, toolNames: ['get_vault'] }),
    llmClient: { chat: async () => ++turns === 1
      ? { content: '', toolCalls: [
        { id: 'switch', name: 'web3mcp_host_discover_program', arguments: { reference: secondProgram } },
        { id: 'stale', name: 'get_vault', arguments: {} },
      ] }
      : { content: 'Ready.' } },
  });
  assert.equal(reads, 0);
  assert.match(messages.find(message => message.tool_call_id === 'stale').content, /not advertised for this turn/);
});

test('ordinary prompts and /tools tolerate a program whose discovery has not completed', async () => {
  const agent = new Web3McpAgent({
    host: { connection: {}, getTools: () => { throw new Error('Program not discovered'); } },
    llmClient: { chat: async () => ({ content: 'Ready.' }) },
    programId: Keypair.generate().publicKey.toBase58(),
  });
  assert.deepEqual(await agent.handleCommand('Discover another program'), { handled: false });
  assert.match((await agent.handleCommand('/tools')).output, /No tools discovered/);
});
