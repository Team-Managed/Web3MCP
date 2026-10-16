import test, { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { Connection, Keypair } from '@solana/web3.js';
import { Web3McpHost } from '../src/index.js';
import {
  AccountSecurityError,
  AccountDiscriminatorMismatchError,
  ValidationError,
  Web3McpHostError,
} from '../src/errors.js';

describe('Web3McpHost: Live Account Query & Dynamic Borsh Decoding (Ticket 03)', () => {
  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');
  const REFERENCE_PROGRAM_ID = 'GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv';
  const EXPECTED_CONFIG_PDA = 'HfA1ExZS1cgYR5k5GEJmsQfyAcDK2J9NPi7p97dU3WLD';

  // Deployed vault details on Devnet
  const KNOWN_VAULT_OWNER = 'CniPSdkAUaNTfZZUSKvAKU2VJuWecRjqvGhDmQjGSZEG';
  const KNOWN_VAULT_PDA = '7Nm9VsUWReKcBrheRDDjPqv6qB3Ag9UwXCabnd11TwXB';

  let host;

  before(async () => {
    host = new Web3McpHost({ connection });
    await host.discover(REFERENCE_PROGRAM_ID);
  });

  it('queries and decodes a live on-chain Vault account by owner address', async () => {
    const result = await host.executeRead('get_vault', { vaultOwner: KNOWN_VAULT_OWNER });

    assert.equal(result.exists, true);
    assert.equal(result.account, 'Vault');
    assert.equal(result.address, KNOWN_VAULT_PDA);
    assert.ok(result.data, 'Expected decoded data object');
    assert.equal(result.data.owner, KNOWN_VAULT_OWNER);
    assert.ok(typeof result.data.balance === 'string', 'Expected balance as decimal string');
    assert.equal(result.data.bump, 255);
  });

  it('queries and decodes a live on-chain Vault account by direct vault PDA address', async () => {
    const result = await host.executeRead('get_vault', { vaultOwner: KNOWN_VAULT_PDA });

    assert.equal(result.exists, true);
    assert.equal(result.account, 'Vault');
    assert.equal(result.address, KNOWN_VAULT_PDA);
    assert.equal(result.data.owner, KNOWN_VAULT_OWNER);
  });

  it('returns typed null when querying a non-existent vault', async () => {
    const randomOwner = Keypair.generate().publicKey.toBase58();
    const result = await host.executeRead('get_vault', { vaultOwner: randomOwner });

    assert.equal(result.exists, false);
    assert.equal(result.account, 'Vault');
    assert.equal(result.data, null);
    assert.ok(result.address, 'Expected derived address to be reported');
  });

  it('fails closed when input arguments violate inputSchema', async () => {
    // Missing required vaultOwner
    await assert.rejects(
      async () => host.executeRead('get_vault', {}),
      (err) => {
        assert.ok(err instanceof Web3McpHostError);
        assert.ok(err instanceof ValidationError);
        assert.match(err.message, /vaultOwner/i);
        return true;
      }
    );

    // Extra forbidden property (additionalProperties: false)
    await assert.rejects(
      async () => host.executeRead('get_vault', { vaultOwner: KNOWN_VAULT_OWNER, malicious: true }),
      (err) => {
        assert.ok(err instanceof ValidationError);
        return true;
      }
    );
  });

  it('fails closed on account ownership mismatch (AccountSecurityError)', async () => {
    // System Program address is not owned by the reference vault program
    const systemPubkey = '11111111111111111111111111111111';

    await assert.rejects(
      async () => host.executeRead('get_vault', { vaultOwner: systemPubkey }),
      (err) => {
        assert.ok(err instanceof AccountSecurityError);
        assert.match(err.message, /not owned by program/i);
        return true;
      }
    );
  });

  it('fails closed on Anchor discriminator mismatch (AccountDiscriminatorMismatchError)', async () => {
    // The Config PDA is owned by reference_vault, but its discriminator is Web3McpConfig, NOT Vault!
    await assert.rejects(
      async () => host.executeRead('get_vault', { vaultOwner: EXPECTED_CONFIG_PDA }),
      (err) => {
        assert.ok(err instanceof AccountDiscriminatorMismatchError);
        assert.match(err.message, /discriminator mismatch/i);
        return true;
      }
    );
  });
});
