import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { PassThrough } from 'node:stream';
import { Keypair, TransactionInstruction, PublicKey } from '@solana/web3.js';
import {
  loadKeypair,
  formatReviewCard,
  promptApproval,
  signAndBroadcastTransaction,
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

  it('signAndBroadcastTransaction fails closed when signer or connection is missing', async () => {
    await assert.rejects(
      () =>
        signAndBroadcastTransaction({
          connection: null,
          instruction: new TransactionInstruction({ keys: [], programId: PublicKey.default }),
          signer: Keypair.generate(),
        }),
      (err) => {
        assert.ok(err instanceof WalletError);
        assert.ok(err.message.includes('Missing active Solana connection'));
        return true;
      }
    );

    await assert.rejects(
      () =>
        signAndBroadcastTransaction({
          connection: {},
          instruction: new TransactionInstruction({ keys: [], programId: PublicKey.default }),
          signer: null,
        }),
      (err) => {
        assert.ok(err instanceof WalletError);
        assert.ok(err.message.includes('valid Keypair instance is required'));
        return true;
      }
    );
  });
});
