import test, { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Web3McpHost } from '../src/index.js';
import { ValidationError, ToolNotFoundError } from '../src/errors.js';

describe('Web3McpHost: Dynamic Account Resolution & Instruction Simulation (Ticket 04)', () => {
  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');
  const host = new Web3McpHost({ connection });

  // Known live Reference Vault on Solana Devnet
  const referenceVaultProgramId = 'GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv';
  // Known active vault owner on Devnet with funded personal vault
  const activeOwnerPubkey = new PublicKey('CniPSdkAUaNTfZZUSKvAKU2VJuWecRjqvGhDmQjGSZEG');

  before(async () => {
    await host.discover(referenceVaultProgramId);
  });

  it('prepares and simulates a deposit instruction against live Devnet RPC', async () => {
    const result = await host.prepareInstruction(
      'deposit',
      { amount: '1000000' },
      { signer: activeOwnerPubkey }
    );

    assert.equal(result.tool, 'deposit');
    assert.equal(result.programId, referenceVaultProgramId);
    assert.ok(result.instruction, 'Instruction must be constructed');
    assert.equal(result.instruction.programId.toBase58(), referenceVaultProgramId);

    // Verify resolved accounts ordering and flags per Anchor IDL
    assert.equal(result.accounts.length, 3);

    // 1. owner (signer, writable)
    assert.equal(result.accounts[0].name, 'owner');
    assert.equal(result.accounts[0].pubkey, activeOwnerPubkey.toBase58());
    assert.equal(result.accounts[0].isSigner, true);
    assert.equal(result.accounts[0].isWritable, true);

    // 2. vault (derived PDA from seeds ["vault", owner], writable, non-signer)
    const [expectedVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), activeOwnerPubkey.toBuffer()],
      new PublicKey(referenceVaultProgramId)
    );
    assert.equal(result.accounts[1].name, 'vault');
    assert.equal(result.accounts[1].pubkey, expectedVaultPda.toBase58());
    assert.equal(result.accounts[1].isSigner, false);
    assert.equal(result.accounts[1].isWritable, true);

    // 3. systemProgram (program, non-signer, non-writable)
    assert.equal(result.accounts[2].name, 'system_program');
    assert.equal(result.accounts[2].pubkey, '11111111111111111111111111111111');
    assert.equal(result.accounts[2].isSigner, false);
    assert.equal(result.accounts[2].isWritable, false);

    // Verify binary instruction data
    assert.equal(result.instruction.data.length, 16, '8-byte discriminator + 8-byte u64 amount');

    // Verify live Devnet transaction simulation
    assert.ok(result.simulation, 'Simulation results must be returned');
    assert.equal(result.simulation.err, null, 'Simulation should succeed without error');
    assert.ok(result.simulation.unitsConsumed > 0, 'Compute units should be consumed');
    assert.ok(Array.isArray(result.simulation.logs), 'Simulation logs must be an array');
    const logsText = result.simulation.logs.join('\n');
    assert.ok(logsText.includes('Instruction: Deposit'), 'Logs should contain Instruction: Deposit');
    assert.ok(logsText.includes('success'), 'Logs should confirm success');

    // Verify declared publisher effects
    assert.deepEqual(result.effects, {
      stateChanging: true,
      financial: true,
      summary: 'Deposits lamports from user to vault',
    });
  });

  it('prepares and simulates a withdraw instruction with live simulation output', async () => {
    const result = await host.prepareInstruction(
      'withdraw',
      { amount: '500000' },
      { signer: activeOwnerPubkey }
    );

    assert.equal(result.tool, 'withdraw');
    assert.ok(result.instruction);
    assert.equal(result.instruction.keys.length, 3);
    assert.ok(result.simulation);
    assert.equal(result.simulation.err, null);
    const logsText = result.simulation.logs.join('\n');
    assert.ok(logsText.includes('Instruction: Withdraw'));
  });

  it('prepares an initialize instruction deriving the personal vault PDA', async () => {
    // Generate a fresh random pubkey to derive a non-existent vault PDA
    const freshKeypair = Keypair.generate();
    const [expectedVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), freshKeypair.publicKey.toBuffer()],
      new PublicKey(referenceVaultProgramId)
    );

    const result = await host.prepareInstruction(
      'initialize',
      {},
      { signer: freshKeypair.publicKey, simulate: false }
    );

    assert.equal(result.tool, 'initialize');
    assert.equal(result.accounts[0].pubkey, freshKeypair.publicKey.toBase58());
    assert.equal(result.accounts[0].isSigner, true);
    assert.equal(result.accounts[1].pubkey, expectedVaultPda.toBase58());
    assert.equal(result.accounts[1].isSigner, false);
    assert.equal(result.accounts[1].isWritable, true);
    assert.equal(result.simulation, null, 'Simulation should be skipped when simulate=false');
  });

  it('fails closed when arguments violate inputSchema', async () => {
    // Negative number violates pattern ^[1-9][0-9]*$
    await assert.rejects(
      async () => {
        await host.prepareInstruction('deposit', { amount: '-500' }, { signer: activeOwnerPubkey });
      },
      (err) => {
        assert.ok(err instanceof ValidationError);
        assert.ok(err.message.includes('Invalid arguments for tool'));
        return true;
      }
    );

    // Undeclared extra property violates additionalProperties: false
    await assert.rejects(
      async () => {
        await host.prepareInstruction('deposit', { amount: '1000', hackedParam: true }, { signer: activeOwnerPubkey });
      },
      (err) => {
        assert.ok(err instanceof ValidationError);
        assert.ok(err.message.includes('additional'));
        return true;
      }
    );
  });

  it('fails closed when required signer is missing for a signer account', async () => {
    await assert.rejects(
      async () => {
        await host.prepareInstruction('deposit', { amount: '1000000' });
      },
      (err) => {
        assert.ok(err instanceof ValidationError);
        assert.ok(err.message.includes('Signer is required for instruction account'));
        return true;
      }
    );
  });

  it('fails closed when invoking an accountRead tool via prepareInstruction', async () => {
    await assert.rejects(
      async () => {
        await host.prepareInstruction('get_vault', { vaultOwner: activeOwnerPubkey.toBase58() });
      },
      (err) => {
        assert.ok(err instanceof ValidationError);
        assert.ok(err.message.includes('is not an instruction tool'));
        return true;
      }
    );
  });

  it('fails closed on unknown tool name', async () => {
    await assert.rejects(
      async () => {
        await host.prepareInstruction('non_existent_instruction', {});
      },
      (err) => {
        assert.ok(err instanceof ToolNotFoundError);
        return true;
      }
    );
  });
});
