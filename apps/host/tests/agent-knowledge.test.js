import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import {
  loadSolanaKnowledge,
  resolveKnowledgeDirectory,
  formatSolanaKnowledgeForPrompt,
  createSystemPrompt,
} from '../src/agent/index.js';

describe('Web3MCP Agent: Solana Modular Domain Knowledge', () => {
  it('locates and resolves the apps/host/knowledge directory', () => {
    const dir = resolveKnowledgeDirectory();
    assert.ok(fs.existsSync(dir), `Knowledge directory should exist: ${dir}`);
    assert.ok(fs.existsSync(path.join(dir, 'KNOWLEDGE.md')), 'KNOWLEDGE.md must exist');
  });

  it('verifies all 7 split knowledge files exist in the directory', () => {
    const dir = resolveKnowledgeDirectory();
    const expectedFiles = [
      'KNOWLEDGE.md',
      'account-model.md',
      'token-model.md',
      'transaction-mechanics.md',
      'defi-patterns.md',
      'error-recovery.md',
      'security-awareness.md',
    ];

    for (const file of expectedFiles) {
      const filePath = path.join(dir, file);
      assert.ok(fs.existsSync(filePath), `Expected split knowledge file missing: ${file}`);
      const content = fs.readFileSync(filePath, 'utf-8');
      assert.ok(content.length > 200, `File ${file} should contain substantive operational content`);
      assert.ok(content.includes('---'), `File ${file} should contain frontmatter header`);
    }
  });

  it('loads all 7 domain modules into structured memory', () => {
    const knowledge = loadSolanaKnowledge(undefined, false);

    assert.ok(knowledge.domains.overview.includes('Solana Operational Knowledge'));
    assert.ok(knowledge.domains.accountModel.includes('Program Derived Addresses'));
    assert.ok(knowledge.domains.tokenModel.includes('Token Extensions (Token-2022)'));
    assert.ok(knowledge.domains.transactionMechanics.includes('Compute Budget'));
    assert.ok(knowledge.domains.defiPatterns.includes('Automated Market Makers'));
    assert.ok(knowledge.domains.errorRecovery.includes('Diagnostic Triage Loop'));
    assert.ok(knowledge.domains.securityAwareness.includes('Wallet Drain Detection'));

    assert.ok(knowledge.combinedText.length > 2000, 'Combined text should contain rich operational instructions');
  });

  it('strips YAML frontmatter headers when formatting for prompt', () => {
    const knowledge = loadSolanaKnowledge(undefined, false);
    // Combined text should not repeat the YAML header tags
    assert.ok(!knowledge.combinedText.includes('name: web3mcp-solana-knowledge'));
    assert.ok(knowledge.combinedText.includes('### Solana Domain Operational Knowledge'));
  });

  it('injects domain knowledge into createSystemPrompt by default', () => {
    const prompt = createSystemPrompt({
      programId: 'TestProgram11111111111111111111111111111111',
      tools: [
        { name: 'read_pool', description: 'Inspect pool state', solana: { kind: 'accountRead' } },
        { name: 'swap_tokens', description: 'Execute swap', solana: { kind: 'instruction' } },
      ],
    });

    // Check base rules
    assert.ok(prompt.includes('READ-BEFORE-WRITE'));
    assert.ok(prompt.includes('WALLET HANDOFF'));

    // Check inline tool annotations
    assert.ok(prompt.includes('[Read-only query: Safe to call autonomously before writes]'));
    assert.ok(prompt.includes('[State-changing instruction: Requires user wallet review & approval]'));

    // Check knowledge injection
    assert.ok(prompt.includes('Solana Domain Operational Knowledge'));
    assert.ok(prompt.includes('Constant Product Invariant'));
    assert.ok(prompt.includes('Compute Budget'));
    assert.ok(prompt.includes('Associated Token Accounts'));
    assert.ok(prompt.includes('ConstraintMut'));
  });

  it('allows disabling knowledge injection with includeKnowledge: false', () => {
    const prompt = createSystemPrompt({
      programId: 'TestProgram11111111111111111111111111111111',
      includeKnowledge: false,
    });

    assert.ok(prompt.includes('READ-BEFORE-WRITE'));
    assert.ok(!prompt.includes('Solana Domain Operational Knowledge'));
    assert.ok(!prompt.includes('Constant Product Invariant'));
  });
});
