#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline';
import { Connection } from '@solana/web3.js';
import { Web3McpHost } from '../dist/index.js';
import { Web3McpAgent } from '../dist/agent/index.js';
import {
  loadKeypairFromFile,
  generateKeypairToFile,
  requestDevnetAirdrop,
} from '../dist/wallet/index.js';

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

function printHelp() {
  console.log(`
Web3MCP Interactive Agent CLI
Usage:
  web3mcp-agent [options]
  npm run host:agent -- [options]

Options:
  --program <programId> Target Solana program ID (default: Reference Vault)
  --keypair <path>      Path to local Solana keypair JSON file (default: ~/.config/solana/id.json)
  --rpc <url>           Solana RPC endpoint (default: https://api.devnet.solana.com)
  --provider <name>     LLM provider: gemini | openai | anthropic | groq | ollama
  --model <modelName>   Target LLM model (required - e.g. gemini-2.5-flash, gpt-4o, claude-3-5-sonnet-20241022)
  --api-key <key>       API key override for the LLM provider
  -h, --help            Show this help screen

Slash Commands:
  /tools                List all discovered tools and signatures
  /balance              Check local wallet SOL balance on Devnet
  /keygen               Generate a fresh Devnet keypair and request 1 SOL airdrop
  /clear                Reset agent conversation history
  /help                 Show command guide
  /exit, /quit          Exit the interactive session
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('-h') || args.includes('--help')) {
    printHelp();
    process.exit(0);
  }

  // Parse arguments
  let programId = 'GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv'; // Default to reference vault
  let keypairPath = process.env.SOLANA_KEYPAIR || process.env.ANCHOR_WALLET || path.resolve(os.homedir(), '.config/solana/id.json');
  let rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  let provider = process.env.LLM_PROVIDER;
  let model = process.env.LLM_MODEL;
  let apiKey = process.env.LLM_API_KEY;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--program') {
      programId = args[++i];
    } else if (arg === '--keypair') {
      keypairPath = args[++i];
    } else if (arg === '--rpc') {
      rpcUrl = args[++i];
    } else if (arg === '--provider') {
      provider = args[++i];
    } else if (arg === '--model') {
      model = args[++i];
    } else if (arg === '--api-key') {
      apiKey = args[++i];
    }
  }

  // Auto-detect provider if omitted
  if (!provider) {
    if (process.env.GEMINI_API_KEY) {
      provider = 'gemini';
      model = model || process.env.GEMINI_MODEL;
    } else if (process.env.OPENAI_API_KEY) {
      provider = 'openai';
      model = model || process.env.OPENAI_MODEL;
    } else if (process.env.ANTHROPIC_API_KEY) {
      provider = 'anthropic';
      model = model || process.env.ANTHROPIC_MODEL;
    } else if (process.env.GROQ_API_KEY) {
      provider = 'groq';
      model = model || process.env.GROQ_MODEL;
    } else {
      provider = 'gemini';
    }
  }

  // Fail closed if no model is explicitly specified (User directive: never pick a model for them)
  if (!model) {
    console.error(`\n❌ Error: No model specified.`);
    console.error(`Please provide an explicit model name via --model <modelName> or LLM_MODEL in .env.`);
    console.error(`Examples:`);
    console.error(`  --model gemini-2.5-flash`);
    console.error(`  --model gpt-4o`);
    console.error(`  --model claude-3-5-sonnet-20241022\n`);
    process.exit(1);
  }

  const connection = new Connection(rpcUrl, 'confirmed');

  // Load keypair if present, or prompt to generate one if missing
  let signer = null;
  if (keypairPath && fs.existsSync(keypairPath)) {
    try {
      signer = loadKeypairFromFile(keypairPath);
    } catch (err) {
      console.warn(`⚠️  Warning: Failed to load keypair at ${keypairPath}: ${err.message}`);
    }
  } else if (keypairPath && process.stdin.isTTY) {
    const rlInit = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise((resolve) => {
      rlInit.question(
        `\n⚠️  No Solana wallet found at '${keypairPath}'.\n? Would you like to generate a new Devnet keypair and request 1 SOL airdrop? [Y/n] › `,
        (ans) => {
          rlInit.close();
          resolve(ans.trim().toLowerCase());
        }
      );
    });

    if (answer === '' || answer === 'y' || answer === 'yes') {
      try {
        const { keypair, path: savedPath } = generateKeypairToFile({ customPath: keypairPath });
        signer = keypair;
        console.log(`✨ Generated keypair: ${keypair.publicKey.toBase58()}`);
        console.log(`📁 Saved to: ${savedPath}`);
        try {
          process.stdout.write('💧 Requesting 1 SOL Devnet airdrop...');
          await requestDevnetAirdrop(connection, keypair.publicKey, 1);
          console.log(' Confirmed!');
        } catch (airdropErr) {
          console.log(`\n⚠️  Airdrop notice: ${airdropErr.message} (faucet: https://faucet.solana.com)`);
        }
      } catch (genErr) {
        console.warn(`⚠️  Failed to generate keypair: ${genErr.message}`);
      }
    }
  }

  const host = new Web3McpHost({ connection });

  console.log(`\nDiscovering on-chain Web3MCP tools for program ${programId}...`);
  let tools = [];
  try {
    await host.discover(programId);
    tools = host.getTools(programId);
  } catch (err) {
    console.error(`❌ Failed to discover program: ${err.message}`);
    process.exit(1);
  }

  const agent = new Web3McpAgent({
    host,
    signer,
    programId,
    provider: provider,
    model,
    apiKey,
  });

  // Display session banner
  const width = 72;
  console.log('\n' + '═'.repeat(width));
  console.log('  Web3MCP Interactive Agent CLI (Solana Devnet)');
  console.log('═'.repeat(width));
  console.log(`  Program ID:  ${programId}`);
  console.log(`  Signer:      ${signer ? signer.publicKey.toBase58() : 'None (Read-only mode)'}`);
  console.log(`  RPC:         ${rpcUrl}`);
  console.log(`  Provider:    ${provider}`);
  console.log(`  Model:       ${model}`);
  console.log(`  Tools (${tools.length}):`);
  for (const t of tools) {
    const kind = t.solana?.kind === 'accountRead' ? '📖 READ ' : '✍️ WRITE';
    console.log(`    • ${t.name.padEnd(20)} [${kind}]`);
  }
  console.log('═'.repeat(width));
  console.log('Type your question or request. Commands: /tools, /balance, /keygen, /clear, /help, /exit\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '\nweb3mcp › ',
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      rl.prompt();
      return;
    }

    try {
      const cmdResult = await agent.handleCommand(trimmed);
      if (cmdResult.handled) {
        if (cmdResult.output) {
          console.log(cmdResult.output);
        }
        if (cmdResult.shouldExit) {
          rl.close();
          process.exit(0);
        }
        rl.prompt();
        return;
      }

      process.stdout.write('\n');
      await agent.prompt(trimmed, (token) => {
        process.stdout.write(token);
      });
      process.stdout.write('\n');
    } catch (err) {
      console.error(`\n❌ Error: ${err.message}\n`);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    console.log('\nSession closed. Goodbye!\n');
    process.exit(0);
  });
}

main().catch((err) => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
