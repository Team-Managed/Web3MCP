import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Connection, Keypair, SystemProgram } from '@solana/web3.js';
import { Web3McpHost } from '../dist/index.js';
import { DiscoveryError, Web3McpHostError } from '../dist/errors.js';

describe('Web3McpHost: Program Discovery (Ticket 01)', () => {
  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');

  // Deployed Devnet Reference Vault
  const REFERENCE_PROGRAM_ID = 'GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv';
  const EXPECTED_CONFIG_PDA = 'HfA1ExZS1cgYR5k5GEJmsQfyAcDK2J9NPi7p97dU3WLD';

  it('instantiates Web3McpHost with connection', () => {
    const host = new Web3McpHost({ connection });
    assert.ok(host);
    assert.equal(host.connection, connection);
  });

  it('discovers live on-chain Reference Vault on Devnet via pure RPC', async () => {
    const host = new Web3McpHost({ connection });
    const discovery = await host.discover(REFERENCE_PROGRAM_ID);

    assert.equal(discovery.programId, REFERENCE_PROGRAM_ID);
    assert.equal(discovery.configPda, EXPECTED_CONFIG_PDA);
    assert.ok(discovery.config, 'Expected validated config object');
    assert.equal(discovery.config.standard, 'web3mcp');
    assert.equal(discovery.config.version, '0.1.0');
    assert.equal(discovery.config.programId, REFERENCE_PROGRAM_ID);
    assert.ok(discovery.config.idl, 'Expected embedded IDL');
    const idlName = discovery.config.idl.metadata?.name || discovery.config.idl.name;
    assert.equal(idlName, 'reference_vault');
    assert.ok(discovery.coders, 'Expected initialized runtime coders');
    assert.ok(discovery.coders.instruction, 'Expected instruction coder');
    assert.ok(discovery.coders.accounts, 'Expected accounts coder');

    // Verify discovered tools registered in memory
    assert.ok(Array.isArray(discovery.tools));
    const toolNames = discovery.tools.map((t) => t.name);
    assert.ok(toolNames.includes('get_vault'), 'Expected get_vault tool');
    assert.ok(toolNames.includes('initialize'), 'Expected initialize tool');
    assert.ok(toolNames.includes('deposit'), 'Expected deposit tool');
    assert.ok(toolNames.includes('withdraw'), 'Expected withdraw tool');
  });

  it('fails closed when program ID does not exist on-chain', async () => {
    const host = new Web3McpHost({ connection });
    const dummyKeypair = Keypair.generate();

    await assert.rejects(
      async () => {
        await host.discover(dummyKeypair.publicKey.toBase58());
      },
      (err) => {
        assert.ok(err instanceof Web3McpHostError, 'Expected Web3McpHostError subclass');
        assert.ok(err instanceof DiscoveryError, 'Expected DiscoveryError');
        assert.match(err.message, /does not exist on-chain/i);
        return true;
      }
    );
  });

  it('fails closed when account is not an executable program', async () => {
    const host = new Web3McpHost({ connection });

    // The Config PDA exists on devnet, but is a data account (executable: false)
    await assert.rejects(
      async () => {
        await host.discover(EXPECTED_CONFIG_PDA);
      },
      (err) => {
        assert.ok(err instanceof Web3McpHostError, 'Expected Web3McpHostError subclass');
        assert.ok(err instanceof DiscoveryError, 'Expected DiscoveryError');
        assert.match(err.message, /not an executable program/i);
        return true;
      }
    );
  });

  it('fails closed when executable program has no Config PDA', async () => {
    const host = new Web3McpHost({ connection });
    // Token Program (executable, but does not implement Web3MCP Config PDA)
    const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

    await assert.rejects(
      async () => {
        await host.discover(TOKEN_PROGRAM_ID);
      },
      (err) => {
        assert.ok(err instanceof Web3McpHostError, 'Expected Web3McpHostError subclass');
        assert.ok(err instanceof DiscoveryError, 'Expected DiscoveryError');
        assert.match(err.message, /Config PDA does not exist/i);
        return true;
      }
    );
  });
});
