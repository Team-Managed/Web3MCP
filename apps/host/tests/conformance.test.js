import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Connection, PublicKey } from '@solana/web3.js';
import { Web3McpHost } from '../dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Web3McpHost: Conformance, CLI & E2E Devnet Verification (Ticket 05)', () => {
  const referenceVaultProgramId = 'GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv';
  const activeOwnerPubkey = 'CniPSdkAUaNTfZZUSKvAKU2VJuWecRjqvGhDmQjGSZEG';
  const cliPath = resolve(__dirname, '../bin/inspect.js');

  it('preserves strict protocol boundary: zero imports of reference-vault or target/idl in apps/host/ (ADR 0007)', () => {
    const srcDir = resolve(__dirname, '../src');
    const files = readdirSync(srcDir).filter((f) => f.endsWith('.ts') || f.endsWith('.js'));

    for (const file of files) {
      const content = readFileSync(join(srcDir, file), 'utf8');

      assert.ok(
        !content.includes('programs/reference-vault'),
        `apps/host/src/${file} must not reference 'programs/reference-vault' (ADR 0007 boundary violation)`
      );
      assert.ok(
        !content.includes('target/idl'),
        `apps/host/src/${file} must not reference 'target/idl' (ADR 0007 boundary violation)`
      );
      assert.ok(
        !content.includes('reference_vault'),
        `apps/host/src/${file} must not hardcode 'reference_vault' (ADR 0007 boundary violation)`
      );
    }
  });

  it('runs CLI inspect in JSON mode to discover live reference vault', () => {
    const stdout = execFileSync('node', [cliPath, referenceVaultProgramId, '--json'], {
      encoding: 'utf8',
    });

    const parsed = JSON.parse(stdout);
    assert.equal(parsed.programId, referenceVaultProgramId);
    assert.ok(parsed.configPda);
    assert.ok(Array.isArray(parsed.tools));
    assert.equal(parsed.tools.length, 4);

    const toolNames = parsed.tools.map((t) => t.name);
    assert.ok(toolNames.includes('get_vault'));
    assert.ok(toolNames.includes('initialize'));
    assert.ok(toolNames.includes('deposit'));
    assert.ok(toolNames.includes('withdraw'));
  });

  it('runs CLI tools command with --openai to export function definitions', () => {
    const stdout = execFileSync('node', [cliPath, 'tools', referenceVaultProgramId, '--openai'], {
      encoding: 'utf8',
    });

    const parsed = JSON.parse(stdout);
    assert.ok(Array.isArray(parsed));
    assert.equal(parsed.length, 4);

    for (const item of parsed) {
      assert.equal(item.type, 'function');
      assert.ok(item.function.name);
      assert.ok(item.function.description);
      assert.ok(item.function.parameters);
      assert.equal(item.function.parameters.type, 'object');
    }
  });

  it('runs CLI read command against Devnet and outputs valid account data', () => {
    const argsJson = JSON.stringify({ vaultOwner: activeOwnerPubkey });
    const stdout = execFileSync(
      'node',
      [cliPath, 'read', 'get_vault', argsJson, '--program', referenceVaultProgramId, '--json'],
      { encoding: 'utf8' }
    );

    const parsed = JSON.parse(stdout);
    assert.equal(parsed.exists, true);
    assert.equal(parsed.account, 'Vault');
    assert.ok(parsed.address);
    assert.equal(parsed.data.owner, activeOwnerPubkey);
    assert.ok(typeof parsed.data.balance === 'string');
    assert.ok(BigInt(parsed.data.balance) >= 0n);
  });

  it('runs CLI prepare command against Devnet and outputs valid simulation report', () => {
    const argsJson = JSON.stringify({ amount: '1000000' });
    const stdout = execFileSync(
      'node',
      [
        cliPath,
        'prepare',
        'deposit',
        argsJson,
        '--signer',
        activeOwnerPubkey,
        '--program',
        referenceVaultProgramId,
        '--json',
      ],
      { encoding: 'utf8' }
    );

    const parsed = JSON.parse(stdout);
    assert.equal(parsed.tool, 'deposit');
    assert.equal(parsed.programId, referenceVaultProgramId);
    assert.equal(parsed.accounts.length, 3);
    assert.equal(parsed.simulation.err, null);
    assert.ok(parsed.simulation.unitsConsumed > 0);
  });

  it('completes full end-to-end host runtime workflow via programmatic API', async () => {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');
    const host = new Web3McpHost({ connection });

    // Step 1: Pure RPC Discovery
    const ctx = await host.discover(referenceVaultProgramId);
    assert.equal(ctx.programId, referenceVaultProgramId);

    // Step 2: Get Protocol Tools & OpenAI Tools
    const tools = host.getTools();
    const openaiTools = host.toOpenAiTools();
    assert.equal(tools.length, 4);
    assert.equal(openaiTools.length, 4);

    // Step 3: Execute Account Read (fail-closed, discriminator-verified)
    const readResult = await host.executeRead('get_vault', { vaultOwner: activeOwnerPubkey });
    assert.equal(readResult.exists, true);
    assert.equal(readResult.data.owner, activeOwnerPubkey);

    // Step 4: Prepare & Simulate Instruction (deterministic account resolution)
    const prepResult = await host.prepareInstruction('deposit', { amount: '2000000' }, {
      signer: new PublicKey(activeOwnerPubkey),
      simulate: true,
    });
    assert.equal(prepResult.tool, 'deposit');
    assert.equal(prepResult.simulation.err, null);
    assert.ok(prepResult.simulation.unitsConsumed > 0);
    assert.equal(prepResult.instruction.keys.length, 3);
  });
});
