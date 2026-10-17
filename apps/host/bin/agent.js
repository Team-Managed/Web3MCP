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
import { createSpinner, c, theme, renderTerminalMarkdown } from '../dist/ui/index.js';

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
${c.bold}Web3MCP Interactive Agent CLI${c.reset}

${c.bold}Usage:${c.reset}
  web3mcp-agent [options]
  npm run host:agent -- [options]

${c.bold}Options:${c.reset}
  --program <programId> Target Solana program ID (default: Reference Vault)
  --keypair <path>      Path to local Solana keypair JSON (default: ~/.config/solana/id.json)
  --rpc <url>           Solana RPC endpoint (default: https://api.devnet.solana.com)
  --provider <name>     LLM provider: gemini | openai | anthropic | groq | ollama
  --model <modelName>   Target LLM model (required - e.g. gemini-2.5-flash, gpt-4o, claude-3-5-sonnet)
  --api-key <key>       API key override for the LLM provider
  -h, --help            Show this help screen

${c.bold}Slash Commands:${c.reset}
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
    console.error(`\n${c.brightRed}Error: No model specified.${c.reset}`);
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
      console.warn(`${c.yellow}Warning: Failed to load keypair at ${keypairPath}: ${err.message}${c.reset}`);
    }
  } else if (keypairPath && process.stdin.isTTY) {
    const rlInit = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise((resolve) => {
      rlInit.question(
        `\n${c.yellow}No Solana wallet found at '${keypairPath}'.${c.reset}\n? Would you like to generate a new Devnet keypair and request 1 SOL airdrop? [Y/n] > `,
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
        console.log(`${c.brightGreen}Generated keypair:${c.reset} ${keypair.publicKey.toBase58()}`);
        console.log(`${c.gray}Saved to: ${savedPath}${c.reset}`);
        try {
          const airdropSpinner = createSpinner('Requesting 1 SOL Devnet airdrop from faucet...');
          await requestDevnetAirdrop(connection, keypair.publicKey, 1);
          airdropSpinner.succeed('1 SOL Devnet airdrop confirmed');
        } catch (airdropErr) {
          console.log(`\n${c.yellow}Airdrop notice: ${airdropErr.message} (faucet: https://faucet.solana.com)${c.reset}`);
        }
      } catch (genErr) {
        console.warn(`${c.yellow}Failed to generate keypair: ${genErr.message}${c.reset}`);
      }
    }
  }

  const host = new Web3McpHost({ connection });

  const shortProg = programId.length > 20 ? programId.slice(0, 8) + '...' + programId.slice(-6) : programId;
  const discoverySpinner = createSpinner(`Discovering tools for ${shortProg}...`);
  let tools = [];
  try {
    await host.discover(programId);
    tools = host.getTools(programId);
    discoverySpinner.succeed(`Discovered ${tools.length} on-chain tools`);
  } catch (err) {
    discoverySpinner.fail(`Failed to discover program: ${err.message}`);
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

  const divider = '─'.repeat(Math.min(process.stdout.columns || 80, 72));
  const shortSigner = signer ? signer.publicKey.toBase58() : 'None (Read-only)';

  // Claude Code minimalist startup header
  console.log('');
  console.log(`${c.bold}${c.brightWhite}● Web3MCP Agent${c.reset}  ${c.gray}(Solana Devnet)${c.reset}`);
  console.log(`  ${c.gray}Program${c.reset}   ${programId}`);
  console.log(`  ${c.gray}Wallet${c.reset}    ${shortSigner}${signer ? ` ${c.gray}(Connected)${c.reset}` : ''}`);
  console.log(`  ${c.gray}Model${c.reset}     ${model} ${c.gray}(via ${provider})${c.reset}`);
  console.log('');
  console.log(`  ${c.bold}Discovered Tools (${tools.length}):${c.reset}`);
  for (const t of tools) {
    const badge = t.solana?.kind === 'accountRead' ? theme.readBadge() : theme.writeBadge();
    const desc = t.description || '';
    console.log(`  • ${c.bold}${t.name.padEnd(14)}${c.reset} ${badge}  ${c.gray}${desc}${c.reset}`);
  }
  console.log('');
  console.log(`  ${c.gray}Commands: /help, /tools, /balance, /keygen, /clear, /exit${c.reset}`);
  console.log(c.gray + divider + c.reset);
  console.log(`${c.gray}${model} | devnet | ${shortProg}${c.reset}`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `> `,
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
          console.log('\n' + cmdResult.output + '\n');
        }
        if (cmdResult.shouldExit) {
          rl.close();
          process.exit(0);
        }
        console.log(c.gray + divider + c.reset);
        console.log(`${c.gray}${model} | devnet | ${shortProg}${c.reset}`);
        rl.prompt();
        return;
      }

      let activeSpinner = null;
      let streamBuffer = '';
      let isFirstOutputLine = true;

      const onProgress = (event) => {
        if (event.type === 'thinking') {
          if (activeSpinner) activeSpinner.stop();
          activeSpinner = createSpinner(`Thinking...`);
        } else if (event.type === 'tool_call') {
          if (activeSpinner) {
            activeSpinner.stop();
            activeSpinner = null;
          }
          const badge = event.kind === 'accountRead' ? theme.readBadge() : theme.writeBadge();
          const argEntries = Object.entries(event.args || {});
          const argSummary = argEntries
            .map(([k, v]) => {
              const str = String(v);
              const val = str.length > 24 ? str.slice(0, 10) + '...' + str.slice(-8) : str;
              return `${k}: "${val}"`;
            })
            .join(', ');

          console.log(`\n● Calling tool ${c.bold}${event.tool}${c.reset} ${badge}(${argSummary})...`);
        } else if (event.type === 'tool_result') {
          if (activeSpinner) {
            activeSpinner.stop();
            activeSpinner = null;
          }
          if (event.success) {
            console.log(`  ${c.brightGreen}✔${c.reset} ${c.gray}Query resolved successfully${c.reset}`);
          } else {
            console.log(`  ${c.brightRed}✖${c.reset} ${c.brightRed}Query failed: ${event.summary}${c.reset}`);
          }
        } else if (event.type === 'simulating') {
          if (activeSpinner) activeSpinner.stop();
          activeSpinner = createSpinner(`Simulating instruction on Solana RPC...`);
        } else if (event.type === 'simulation_result') {
          if (activeSpinner) {
            if (event.success) {
              activeSpinner.succeed(`Simulation passed (${event.unitsConsumed || 0} CUs)`);
            } else {
              activeSpinner.fail(`Simulation failed`);
            }
            activeSpinner = null;
          }
        } else if (event.type === 'broadcasting') {
          if (activeSpinner) activeSpinner.stop();
          activeSpinner = createSpinner(`Broadcasting transaction to Solana Devnet...`);
        } else if (event.type === 'broadcast_confirmed') {
          if (activeSpinner) {
            activeSpinner.succeed(`Transaction confirmed on Solana Devnet`);
            activeSpinner = null;
          }
          console.log(`  ${c.gray}Explorer:${c.reset} ${event.explorerUrl}`);
        }
      };

      const onToken = (token) => {
        if (activeSpinner) {
          activeSpinner.stop();
          activeSpinner = null;
          console.log('');
        }

        streamBuffer += token;
        const newlineIndex = streamBuffer.lastIndexOf('\n');

        if (newlineIndex !== -1) {
          const completedChunk = streamBuffer.slice(0, newlineIndex);
          streamBuffer = streamBuffer.slice(newlineIndex + 1);

          const lines = completedChunk.split('\n');
          for (let l of lines) {
            if (isFirstOutputLine && l.trim()) {
              l = `● ${l}`;
              isFirstOutputLine = false;
            }
            process.stdout.write(renderTerminalMarkdown(l) + '\n');
          }
        }
      };

      await agent.prompt(trimmed, onToken, onProgress);

      if (activeSpinner) {
        activeSpinner.stop();
        activeSpinner = null;
      }

      if (streamBuffer) {
        let finalLine = streamBuffer;
        if (isFirstOutputLine && finalLine.trim()) {
          finalLine = `● ${finalLine}`;
        }
        process.stdout.write(renderTerminalMarkdown(finalLine) + '\n');
        streamBuffer = '';
      }

      console.log('');
      console.log(c.gray + divider + c.reset);
      console.log(`${c.gray}${model} | devnet | ${shortProg}${c.reset}`);
    } catch (err) {
      console.error(`\n${c.brightRed}Error: ${err.message}${c.reset}\n`);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    console.log(`\nSession closed. Goodbye!\n`);
    process.exit(0);
  });
}

main().catch((err) => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
