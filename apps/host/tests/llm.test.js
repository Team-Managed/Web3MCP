import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createLlmClient, compactToolResult, LlmError, OpenAiCompatibleDriver, AnthropicDriver } from '../src/llm.js';

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
