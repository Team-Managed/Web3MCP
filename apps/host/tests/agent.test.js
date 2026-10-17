import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Web3McpHost } from '../dist/index.js';
import {
  Web3McpAgent,
  createSystemPrompt,
  handleSlashCommand,
  executeAgentTurn,
} from '../dist/agent/index.js';

describe('Web3McpAgent: Multi-Turn Loop, Grounding & Slash Commands (Ticket 03)', () => {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const dummyProgramId = 'GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv';
  const dummySigner = Keypair.generate();

  it('fails closed when host instance is omitted', () => {
    assert.throws(
      () => new Web3McpAgent({ host: null }),
      /Web3McpAgent requires an active Web3McpHost instance/
    );
  });

  it('generates grounded system prompt containing rules, programId, and signer', () => {
    const prompt = createSystemPrompt({
      programId: dummyProgramId,
      signerAddress: dummySigner.publicKey.toBase58(),
      tools: [
        { name: 'get_vault', description: 'Query vault', solana: { kind: 'accountRead' } },
        { name: 'deposit', description: 'Deposit SOL', solana: { kind: 'instruction' } },
      ],
    });

    assert.ok(prompt.includes(dummyProgramId));
    assert.ok(prompt.includes(dummySigner.publicKey.toBase58()));
    assert.ok(prompt.includes('READ-BEFORE-WRITE'));
    assert.ok(prompt.includes('WALLET HANDOFF'));
    assert.ok(prompt.includes('HANDLING REJECTIONS'));
    assert.ok(prompt.includes('get_vault'));
    assert.ok(prompt.includes('deposit'));
  });

  it('dispatches /help slash command cleanly', async () => {
    let cleared = false;
    const result = await handleSlashCommand('/help', {
      connection,
      clearHistory: () => {
        cleared = true;
      },
    });

    assert.equal(result.handled, true);
    assert.ok(result.output.includes('/tools'));
    assert.ok(result.output.includes('/balance'));
    assert.ok(result.output.includes('/clear'));
    assert.ok(result.output.includes('/exit'));
    assert.equal(cleared, false);
  });

  it('dispatches /tools slash command with tool descriptions', async () => {
    const tools = [
      { name: 'get_vault', description: 'Fetch vault', solana: { kind: 'accountRead' } },
      { name: 'deposit', description: 'Deposit lamports', solana: { kind: 'instruction' } },
    ];
    const result = await handleSlashCommand('/tools', {
      connection,
      tools,
      clearHistory: () => {},
    });

    assert.equal(result.handled, true);
    assert.ok(result.output.includes('Discovered Tools (2)'));
    assert.ok(result.output.includes('get_vault'));
    assert.ok(result.output.includes('READ'));
    assert.ok(result.output.includes('deposit'));
    assert.ok(result.output.includes('WRITE'));
  });

  it('dispatches /clear slash command and resets conversational state', async () => {
    let cleared = false;
    const result = await handleSlashCommand('/clear', {
      connection,
      clearHistory: () => {
        cleared = true;
      },
    });

    assert.equal(result.handled, true);
    assert.equal(cleared, true);
    assert.ok(result.output.includes('cleared'));
  });

  it('dispatches /exit and /quit commands returning shouldExit: true', async () => {
    const res1 = await handleSlashCommand('/exit', {
      connection,
      clearHistory: () => {},
    });
    assert.equal(res1.handled, true);
    assert.equal(res1.shouldExit, true);

    const res2 = await handleSlashCommand('/quit', {
      connection,
      clearHistory: () => {},
    });
    assert.equal(res2.handled, true);
    assert.equal(res2.shouldExit, true);
  });

  it('dispatches /keygen to generate a new keypair and invoke setSigner', async () => {
    let newSigner = null;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'web3mcp-agent-keygen-'));
    const tempPath = path.join(tempDir, 'agent-key.json');

    try {
      const result = await handleSlashCommand(`/keygen ${tempPath}`, {
        connection,
        clearHistory: () => {},
        setSigner: (signer) => {
          newSigner = signer;
        },
      });

      assert.equal(result.handled, true);
      assert.ok(result.output.includes('Generated fresh Solana keypair'));
      assert.ok(result.output.includes(tempPath));
      assert.ok(newSigner instanceof Keypair);
      assert.ok(fs.existsSync(tempPath));
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('handles unknown slash commands with guidance', async () => {
    const result = await handleSlashCommand('/unknowncmd', {
      connection,
      clearHistory: () => {},
    });

    assert.equal(result.handled, true);
    assert.ok(result.output.includes("Unknown command '/unknowncmd'"));
    assert.ok(result.output.includes('Type /help'));
  });

  it('returns handled: false for natural language prompts', async () => {
    const result = await handleSlashCommand('What is the current vault balance?', {
      connection,
      clearHistory: () => {},
    });

    assert.equal(result.handled, false);
    assert.equal(result.output, undefined);
  });

  it('maintains conversation history and clears history upon request', () => {
    const host = new Web3McpHost({ connection });
    const agent = new Web3McpAgent({
      host,
      model: 'test-model',
      apiKey: 'test-key',
      signer: dummySigner,
      programId: dummyProgramId,
    });

    const initialHistory = agent.getHistory();
    assert.equal(initialHistory.length, 1);
    assert.equal(initialHistory[0].role, 'system');

    agent.messages.push({ role: 'user', content: 'hello' });
    agent.messages.push({ role: 'assistant', content: 'hi' });
    assert.equal(agent.getHistory().length, 3);

    agent.clearHistory();
    assert.equal(agent.getHistory().length, 1);
    assert.equal(agent.getHistory()[0].role, 'system');
  });

  it('routes wallet approval rejection back to conversation without throwing unhandled exceptions', async () => {
    const host = new Web3McpHost({ connection });
    // Pre-populate discovered program context with reference vault tools
    await host.discover(dummyProgramId);

    const messages = [{ role: 'system', content: 'System prompt' }];

    let approvalHookCalled = false;
    let approvalRequestData = null;

    // A driver that proposes a deposit instruction tool call on turn 1, then wraps up on turn 2
    let turnCount = 0;
    const testDriver = {
      chat: async () => {
        turnCount++;
        if (turnCount === 1) {
          return {
            role: 'assistant',
            content: 'I will prepare a deposit of 1000 lamports for you.',
            toolCalls: [
              {
                id: 'call_deposit_123',
                name: 'deposit',
                arguments: { amount: '1000' },
              },
            ],
          };
        }
        return {
          role: 'assistant',
          content: 'I understand you declined the deposit transaction.',
        };
      },
    };

    const finalResponse = await executeAgentTurn({
      messages,
      llmClient: testDriver,
      host,
      signer: dummySigner,
      programId: dummyProgramId,
      onApprovalRequest: async (req) => {
        approvalHookCalled = true;
        approvalRequestData = req;
        return false; // User declines approval
      },
    });

    assert.equal(approvalHookCalled, true);
    assert.equal(approvalRequestData.tool, 'deposit');
    assert.equal(approvalRequestData.programId, dummyProgramId);

    // Verify messages captured the user rejection gracefully
    const toolMessage = messages.find((m) => m.role === 'tool');
    assert.ok(toolMessage, 'Should have a tool message with rejection details');
    const parsedTool = JSON.parse(toolMessage.content);
    assert.equal(parsedTool.declined, true);
    assert.equal(parsedTool.error, 'Transaction rejected by user.');

    assert.equal(finalResponse, 'I understand you declined the deposit transaction.');
  });
});
