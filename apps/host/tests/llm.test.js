import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createLlmClient, listAvailableModels, compactToolResult, LlmError, OpenAiCompatibleDriver, AnthropicDriver } from '../dist/llm/index.js';

describe('Web3McpHost: Universal LLM Client & Log Compaction (Ticket 01)', () => {
  it('fails closed when no model is specified', () => {
    assert.throws(
      () => createLlmClient({ provider: 'gemini', apiKey: 'test_key' }),
      (err) => {
        assert.ok(err instanceof LlmError);
        assert.ok(err.message.includes('No model specified'));
        return true;
      }
    );
  });

  it('configures Ollama provider with local endpoint without requiring an API key', () => {
    const client = createLlmClient({
      provider: 'ollama',
      model: 'llama3',
    });

    assert.ok(client instanceof OpenAiCompatibleDriver);
    assert.equal(client.model, 'llama3');
    assert.equal(client.client.baseURL, 'http://localhost:11434/v1');
  });

  it('configures Groq provider using Groq OpenAI-compatible endpoint', () => {
    const client = createLlmClient({
      provider: 'groq',
      apiKey: 'gsk_test_key',
      model: 'llama-3.3-70b-versatile',
    });

    assert.ok(client instanceof OpenAiCompatibleDriver);
    assert.equal(client.model, 'llama-3.3-70b-versatile');
    assert.equal(client.client.baseURL, 'https://api.groq.com/openai/v1');
  });

  it('configures Anthropic provider with custom model override', () => {
    const client = createLlmClient({
      provider: 'anthropic',
      apiKey: 'sk-ant-test_key',
      model: 'claude-3-haiku-20240307',
    });

    assert.ok(client instanceof AnthropicDriver);
    assert.equal(client.model, 'claude-3-haiku-20240307');
  });

  it('fails closed when required API key is missing for OpenAI, Anthropic, or Gemini', () => {
    // Preserve current env
    const origOpenAi = process.env.OPENAI_API_KEY;
    const origAnthropic = process.env.ANTHROPIC_API_KEY;
    const origGemini = process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      assert.throws(
        () => createLlmClient({ provider: 'openai', model: 'gpt-4o' }),
        (err) => {
          assert.ok(err instanceof LlmError);
          assert.ok(err.message.includes('OPENAI_API_KEY is not set'));
          return true;
        }
      );

      assert.throws(
        () => createLlmClient({ provider: 'anthropic', model: 'claude-3-5-sonnet' }),
        (err) => {
          assert.ok(err instanceof LlmError);
          assert.ok(err.message.includes('ANTHROPIC_API_KEY is not set'));
          return true;
        }
      );

      assert.throws(
        () => createLlmClient({ provider: 'gemini', model: 'gemini-2.5-flash' }),
        (err) => {
          assert.ok(err instanceof LlmError);
          assert.ok(err.message.includes('GEMINI_API_KEY is not set'));
          return true;
        }
      );
    } finally {
      if (origOpenAi) process.env.OPENAI_API_KEY = origOpenAi;
      if (origAnthropic) process.env.ANTHROPIC_API_KEY = origAnthropic;
      if (origGemini) process.env.GEMINI_API_KEY = origGemini;
    }
  });

  it('configures Gemini provider using Google OpenAI-compatible endpoint', () => {
    const client = createLlmClient({
      provider: 'gemini',
      apiKey: 'test_gemini_key',
      model: 'gemini-2.5-flash',
    });

    assert.equal(client.model, 'gemini-2.5-flash');
    assert.equal(client.client.baseURL, 'https://generativelanguage.googleapis.com/v1beta/openai/');
  });

  it('uses current OpenAI completion parameters for a reasoning model without changing other providers', async () => {
    const requests = [];
    const openai = createLlmClient({ provider: 'openai', model: 'gpt-6-luna', apiKey: 'test' });
    const groq = createLlmClient({ provider: 'groq', model: 'llama-test', apiKey: 'test' });
    for (const driver of [openai, groq]) {
      driver.client.chat.completions.create = async request => {
        requests.push(request);
        return (async function* () { yield { choices: [{ delta: { content: 'ok' } }] }; })();
      };
      await driver.chat({ messages: [{ role: 'user', content: 'hi' }] });
    }
    assert.equal(requests[0].max_completion_tokens, 1024);
    assert.equal('max_tokens' in requests[0], false);
    assert.equal('temperature' in requests[0], false);
    assert.equal('reasoning_effort' in requests[0], false);
    assert.equal(requests[1].max_tokens, 1024);
    assert.equal(requests[1].temperature, 0.2);
  });

  it('uses supported reasoning effort for Luna and Sol function tools only', async () => {
    const requests = [];
    for (const [provider, model] of [
      ['openai', 'gpt-6-luna'], ['openai', 'gpt-6-sol'],
      ['openai', 'gpt-6-astra'], ['groq', 'llama-test'],
    ]) {
      const driver = createLlmClient({ provider, model, apiKey: 'test' });
      driver.client.chat.completions.create = async request => {
        requests.push(request);
        return (async function* () { yield { choices: [{ delta: { content: 'ok' } }] }; })();
      };
      await driver.chat({ messages: [{ role: 'user', content: 'hi' }], tools: [
        { type: 'function', function: { name: 'discover', description: 'Find tools', parameters: { type: 'object', properties: {} } } },
      ] });
    }
    assert.equal(requests[0].reasoning_effort, 'none');
    assert.equal(requests[1].reasoning_effort, 'none');
    assert.equal('reasoning_effort' in requests[2], false);
    assert.equal('reasoning_effort' in requests[3], false);
  });

  it('lists models offered to the configured OpenAI key', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      assert.match(String(input), /\/v1\/models$/);
      assert.equal(new Headers(init.headers).get('authorization'), 'Bearer test-key');
      return new Response(JSON.stringify({ object: 'list', data: [
        { id: 'gpt-6-luna', object: 'model' }, { id: 'gpt-4o-mini', object: 'model' },
      ] }), { status: 200, headers: { 'content-type': 'application/json' } });
    };
    try {
      const models = await listAvailableModels({ provider: 'openai', apiKey: 'test-key',
        baseURL: 'https://models.test/v1' });
      assert.deepEqual(models, ['gpt-4o-mini', 'gpt-6-luna']);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('rejects malformed streamed tool arguments from OpenAI-compatible models', async () => {
    const driver = new OpenAiCompatibleDriver({ apiKey: 'test', model: 'test' });
    driver.client.chat.completions.create = async () => (async function* () {
      yield { choices: [{ delta: { tool_calls: [{ index: 0, id: 'call-1', function: { name: 'initialize', arguments: '{bad' } }] } }] };
    })();
    await assert.rejects(driver.chat({ messages: [{ role: 'user', content: 'initialize' }] }), /invalid JSON arguments/);
  });

  it('rejects malformed streamed tool arguments from Anthropic models', async () => {
    const driver = new AnthropicDriver({ apiKey: 'test', model: 'test' });
    driver.client.messages.create = async () => (async function* () {
      yield { type: 'content_block_start', content_block: { type: 'tool_use', id: 'call-1', name: 'initialize' } };
      yield { type: 'content_block_delta', delta: { type: 'input_json_delta', partial_json: '{bad' } };
      yield { type: 'content_block_stop' };
    })();
    await assert.rejects(driver.chat({ messages: [{ role: 'user', content: 'initialize' }] }), /invalid JSON arguments/);
  });

  it('compacts simulation result into a token-efficient summary', () => {
    const rawSimulationResult = {
      tool: 'deposit',
      programId: 'GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv',
      instruction: { programId: '...', keys: [], data: Buffer.alloc(16) },
      simulation: {
        err: null,
        unitsConsumed: 4563,
        logs: [
          'Program GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv invoke [1]',
          'Program log: Instruction: Deposit',
          'Program 11111111111111111111111111111111 invoke [2]',
          'Program 11111111111111111111111111111111 success',
          'Program GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv consumed 4563 of 200000 compute units',
          'Program GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv success',
        ],
      },
      effects: {
        stateChanging: true,
        financial: true,
        summary: 'Deposits lamports from user to vault',
      },
      accounts: [
        { name: 'owner', pubkey: 'CniPSdkA...', isSigner: true, isWritable: true },
        { name: 'vault', pubkey: '7Nm9VsUW...', isSigner: false, isWritable: true },
      ],
    };

    const compacted = compactToolResult('deposit', rawSimulationResult);

    assert.equal(compacted.tool, 'deposit');
    assert.equal(compacted.status, 'simulated_success');
    assert.equal(compacted.computeUnits, 4563);
    assert.deepEqual(compacted.effects, rawSimulationResult.effects);
    assert.equal(compacted.accounts.length, 2);
    // Verifies raw simulation logs array was pruned from the LLM prompt payload
    assert.equal(compacted.logs, undefined);
  });

  it('compacts accountRead result into plain structured JSON', () => {
    const rawReadResult = {
      exists: true,
      account: 'Vault',
      address: '7Nm9VsUWReKcBrheRDDjPqv6qB3Ag9UwXCabnd11TwXB',
      data: {
        owner: 'CniPSdkAUaNTfZZUSKvAKU2VJuWecRjqvGhDmQjGSZEG',
        balance: '30000000',
        bump: 255,
      },
    };

    const compacted = compactToolResult('get_vault', rawReadResult);

    assert.equal(compacted.tool, 'get_vault');
    assert.equal(compacted.exists, true);
    assert.equal(compacted.account, 'Vault');
    assert.equal(compacted.address, rawReadResult.address);
    assert.deepEqual(compacted.data, rawReadResult.data);
  });
});
