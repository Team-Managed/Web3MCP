import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Connection } from '@solana/web3.js';
import { Web3McpHost } from '../dist/index.js';
import { Web3McpAgent } from '../dist/agent/index.js';
import { loadKeypair } from '../dist/wallet/index.js';

// Attempt to load .env if available
try {
  if (typeof process.loadEnvFile === 'function') {
    const rootEnv = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(rootEnv)) {
      process.loadEnvFile(rootEnv);
    }
  }
} catch {
  // Ignore env loading errors
}

describe('Web3McpAgent: Live End-to-End Devnet Rehearsal (Ticket 04)', { timeout: 120000 }, () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  const provider = process.env.GEMINI_API_KEY ? 'gemini' : 'openai';
  const model = process.env.GEMINI_MODEL || process.env.LLM_MODEL || (provider === 'gemini' ? 'gemini-3.8-flash' : 'gpt-4o');

  const programId = 'GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv';
  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

  it('runs complete multi-turn lifecycle against live Reference Vault on Devnet', async () => {
    if (!apiKey) {
      console.log('Skipping live Devnet LLM rehearsal: No GEMINI_API_KEY or OPENAI_API_KEY found.');
      return;
    }

    const signer = loadKeypair();
    const connection = new Connection(rpcUrl, 'confirmed');
    const host = new Web3McpHost({ connection });

    // Step 1: Discover on-chain tools
    await host.discover(programId);
    const tools = host.getTools(programId);
    assert.ok(tools.length >= 3, 'Should discover at least 3 tools from reference vault');

    let approvedDepositHandled = false;
    let rejectedWithdrawHandled = false;

    const agent = new Web3McpAgent({
      host,
      signer,
      programId,
      provider,
      model,
      apiKey,
      onApprovalRequest: async (req) => {
        if (req.tool === 'deposit') {
          approvedDepositHandled = true;
          return true; // Approve deposit
        }
        if (req.tool === 'withdraw') {
          rejectedWithdrawHandled = true;
          return false; // Decline withdrawal
        }
        return false;
      },
    });

    // --- Turn 1: Autonomous Read ---
    // User asks for current vault balance
    const readResponse = await agent.prompt(
      `Please check my vault balance. My wallet address is ${signer.publicKey.toBase58()}.`
    );
    assert.ok(readResponse, 'Agent should provide a non-empty response for vault balance check');
    assert.ok(
      agent.getHistory().some((m) => m.role === 'tool' && m.content.includes('Vault')),
      'Conversation history should contain tool response for get_vault'
    );

    // --- Turn 2: Approved Write ---
    // User deposits 1,000 lamports
    const depositResponse = await agent.prompt(
      'Please deposit 1000 lamports into my personal vault.'
    );
    assert.equal(approvedDepositHandled, true, 'Approval callback should have been invoked for deposit');
    assert.ok(
      depositResponse.includes('explorer.solana.com') ||
      agent.getHistory().some((m) => m.role === 'tool' && m.content.includes('explorer.solana.com')),
      'Response or tool history should contain Solana Explorer confirmation URL'
    );

    // --- Turn 3: State Verification ---
    // User asks for updated balance
    const verifyResponse = await agent.prompt(
      'What is my vault balance now after the deposit?'
    );
    assert.ok(verifyResponse, 'Agent should report updated balance');

    // --- Turn 4: Rejected Write ---
    // User asks to withdraw 1,000 lamports but declines transaction approval
    const withdrawResponse = await agent.prompt(
      'Please withdraw 1000 lamports from my vault.'
    );
    assert.equal(rejectedWithdrawHandled, true, 'Approval callback should have been invoked for withdraw');
    assert.ok(
      agent.getHistory().some((m) => m.role === 'tool' && m.content.includes('declined')),
      'Conversation history should contain declined status for withdraw'
    );
    assert.ok(
      withdrawResponse.toLowerCase().includes('reject') ||
      withdrawResponse.toLowerCase().includes('decline') ||
      withdrawResponse.toLowerCase().includes('cancel') ||
      withdrawResponse.toLowerCase().includes('not') ||
      withdrawResponse.toLowerCase().includes('refuse'),
      'Agent should politely acknowledge the user rejection'
    );
  });
});
