import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { PassThrough } from 'node:stream';
import { Keypair } from '@solana/web3.js';
import {
  loadKeypair,
  generateKeypairToFile,
  formatReviewCard,
  promptApproval,
  WalletError,
} from '../dist/wallet/index.js';

describe('Web3McpHost: Terminal Wallet Signer & Review Card', () => {
  it('loads a Solana Keypair from a valid json file', () => {
    const tempKeypair = Keypair.generate();
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'web3mcp-wallet-test-'));
    const tempPath = path.join(tempDir, 'test-id.json');

    try {
      fs.writeFileSync(tempPath, JSON.stringify(Array.from(tempKeypair.secretKey)), 'utf8');

      const loaded = loadKeypair(tempPath);
      assert.ok(loaded instanceof Keypair);
      assert.equal(loaded.publicKey.toBase58(), tempKeypair.publicKey.toBase58());
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('fails closed when keypair file does not exist', () => {
    assert.throws(
      () => loadKeypair('/non/existent/path/to/keypair.json'),
      (err) => {
        assert.ok(err instanceof WalletError);
        assert.ok(err.message.includes('not found'));
        return true;
      }
    );
  });

  it('formats a high-contrast terminal review card with accounts, privileges, and effects', () => {
    const card = formatReviewCard({
      tool: 'deposit',
      programId: 'GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv',
      accounts: [
        { name: 'owner', pubkey: 'CniPSdkAUaNTfZZUSKvAKU2VJuWecRjqvGhDmQjGSZEG', isSigner: true, isWritable: true },
        { name: 'vault', pubkey: '7Nm9VsUWReKcBrheRDDjPqv6qB3Ag9UwXCabnd11TwXB', isSigner: false, isWritable: true },
      ],
      simulation: {
        err: null,
        unitsConsumed: 4563,
        logs: [
          'Program log: Instruction: Deposit',
          'Program consumed 4563 of 200000 compute units',
          'Program success',
        ],
      },
      effects: {
        financial: true,
        summary: 'Deposits lamports from user to vault',
      },
      fee: 5000,
    });

    assert.ok(card.includes('TRANSACTION APPROVAL REQUIRED'));
    assert.ok(card.includes('Tool:             deposit'));
    assert.ok(card.includes('GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv'));
    assert.ok(card.includes('FINANCIAL WRITE'));
    assert.ok(card.includes('owner'));
    assert.ok(card.includes('SIGNER, WRITABLE'));
    assert.ok(card.includes('vault'));
    assert.ok(card.includes('READONLY, WRITABLE') || card.includes('WRITABLE'));
    assert.ok(card.includes('SUCCESS'));
    assert.ok(card.includes('4563 CUs consumed'));
  });

  it('does not invent a network fee when the estimate is unavailable', () => {
    const card = formatReviewCard({ tool: 'deposit', programId: Keypair.generate().publicKey.toBase58() });
    assert.match(card, /Estimated Fee:.*unavailable/);
  });

  it('promptApproval resolves true when user inputs "y" or "yes"', async () => {
    const input = new PassThrough();
    const output = new PassThrough();

    const promptPromise = promptApproval('TEST CARD', { input, output });
    input.write('y\n');

    const result = await promptPromise;
    assert.equal(result, true);
  });

  it('promptApproval resolves false when user inputs "n", empty, or declines', async () => {
    const input = new PassThrough();
    const output = new PassThrough();

    const promptPromise = promptApproval('TEST CARD', { input, output });
    input.write('n\n');

    const result = await promptPromise;
    assert.equal(result, false);
  });

  it('generates and writes a valid keypair with 0600 permissions', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'web3mcp-keygen-test-'));
    const tempPath = path.join(tempDir, 'new-id.json');

    try {
      const { keypair, path: savedPath } = generateKeypairToFile({ customPath: tempPath });
      assert.equal(savedPath, tempPath);
      assert.ok(keypair instanceof Keypair);
      assert.ok(fs.existsSync(tempPath));

      const stats = fs.statSync(tempPath);
      assert.equal(stats.mode & 0o777, 0o600);

      const reloaded = loadKeypair(tempPath);
      assert.equal(reloaded.publicKey.toBase58(), keypair.publicKey.toBase58());

      // Fails when file exists and overwrite is false
      assert.throws(
        () => generateKeypairToFile({ customPath: tempPath, overwrite: false }),
        /already exists/
      );

      fs.chmodSync(tempPath, 0o644);
      const replacement = generateKeypairToFile({ customPath: tempPath, overwrite: true });
      assert.notEqual(replacement.keypair.publicKey.toBase58(), keypair.publicKey.toBase58());
      assert.equal(fs.statSync(tempPath).mode & 0o777, 0o600);
      assert.equal(loadKeypair(tempPath).publicKey.toBase58(), replacement.keypair.publicKey.toBase58());
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
