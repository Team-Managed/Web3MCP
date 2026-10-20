import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Web3McpSdk } from '@web3mcp/sdk';
import { publishConfig } from '../reference-programs/reference-vault/scripts/publish.js';

describe('generic host against the current local reference program', () => {
  const url = process.env.ANCHOR_PROVIDER_URL || 'http://127.0.0.1:8899';
  if (!/^https?:\/\/(127\.0\.0\.1|localhost|0\.0\.0\.0)(:\d+)?\/?$/.test(url)) {
    throw new Error('Integration tests require a local validator RPC URL');
  }

  it('discovers, prepares, writes, and reads using only published config', async () => {
    const connection = new Connection(url, 'confirmed');
    const signer = Keypair.generate();
    const airdrop = await connection.requestAirdrop(signer.publicKey, LAMPORTS_PER_SOL);
    await connection.confirmTransaction(airdrop, 'confirmed');
    const { programId } = await publishConfig({ url });
    const host = new Web3McpSdk({ connection });

    await host.discover(programId);
    assert.deepEqual(host.getTools(programId).map((tool) => tool.name).sort(),
      ['deposit', 'get_vault', 'get_vault_by_owner', 'initialize', 'withdraw']);

    const [vaultAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), signer.publicKey.toBuffer()],
      new PublicKey(programId),
    );
    const before = await host.executeRead('get_vault', { vaultAddress: vaultAddress.toBase58() }, { programId });
    assert.equal(before.exists, false);
    assert.equal(before.address, vaultAddress.toBase58());

    const prepared = await host.prepareInstruction('initialize', {}, {
      programId,
      signer: signer.publicKey,
    });
    assert.equal(prepared.simulation.err, null);
    assert.ok(Number.isInteger(prepared.estimatedFeeLamports));
    prepared.transaction.sign(signer);
    await host.submitSignedTransaction(prepared, prepared.transaction);

    const after = await host.executeRead('get_vault', { vaultAddress: vaultAddress.toBase58() }, { programId });
    assert.equal(after.exists, true);
    assert.equal(after.data.owner, signer.publicKey.toBase58());
    assert.equal(after.data.balance, '0');
  });
});
