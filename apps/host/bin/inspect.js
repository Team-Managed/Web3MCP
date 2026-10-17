#!/usr/bin/env node

import { Connection, PublicKey } from '@solana/web3.js';
import { Web3McpHost } from '../dist/index.js';

function printHelp() {
  console.log(`
Web3MCP Host CLI Inspector
Usage:
  web3mcp-host <programId> [options]
  web3mcp-host discover <programId> [options]
  web3mcp-host tools <programId> [--openai] [options]
  web3mcp-host read <toolName> [jsonArgs] --program <programId> [options]
  web3mcp-host prepare <toolName> [jsonArgs] --signer <pubkey> --program <programId> [options]

Commands:
  discover <programId>    Discover and inspect on-chain tools for a program (default)
  tools <programId>       List tool descriptors (or pass --openai for OpenAI function calling format)
  read <toolName>         Execute an accountRead query against live Solana RPC
  prepare <toolName>      Prepare and simulate an instruction tool on Solana RPC

Options:
  --rpc <url>             Solana RPC endpoint (default: https://api.devnet.solana.com)
  --program <programId>   Target Solana program ID
  --signer <pubkey>       Signer public key for instruction preparation
  --json                  Output raw JSON instead of human-readable text
  -h, --help              Show this help message

Examples:
  web3mcp-host GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv
  web3mcp-host tools GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv --openai
  web3mcp-host read get_vault '{"vaultOwner":"CniPSdkAUaNTfZZUSKvAKU2VJuWecRjqvGhDmQjGSZEG"}' --program GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv
  web3mcp-host prepare deposit '{"amount":"1000000"}' --signer CniPSdkAUaNTfZZUSKvAKU2VJuWecRjqvGhDmQjGSZEG --program GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    printHelp();
    process.exit(0);
  }

  // Parse flags
  let rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  let jsonMode = false;
  let openaiMode = false;
  let programId = null;
  let signer = null;

  const positionalArgs = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--rpc') {
      rpcUrl = args[++i];
    } else if (arg === '--json') {
      jsonMode = true;
    } else if (arg === '--openai') {
      openaiMode = true;
    } else if (arg === '--program') {
      programId = args[++i];
    } else if (arg === '--signer') {
      signer = args[++i];
    } else if (!arg.startsWith('-')) {
      positionalArgs.push(arg);
    }
  }

  const connection = new Connection(rpcUrl, 'confirmed');
  const host = new Web3McpHost({ connection });

  let command = 'discover';
  if (['discover', 'tools', 'read', 'prepare'].includes(positionalArgs[0])) {
    command = positionalArgs.shift();
  }

  if (!programId && positionalArgs.length > 0 && positionalArgs[0].length >= 32 && positionalArgs[0].length <= 44) {
    if (command === 'discover' || command === 'tools') {
      programId = positionalArgs.shift();
    }
  }

  if (!programId) {
    console.error('Error: Program ID is required. Pass it as an argument or via --program <programId>');
    process.exit(1);
  }

  try {
    const context = await host.discover(programId);

    if (command === 'discover') {
      const tools = host.getTools(programId);
      if (jsonMode) {
        console.log(JSON.stringify({ programId, configPda: context.configPda, tools }, null, 2));
      } else {
        console.log(`\n======================================================`);
        console.log(` Web3MCP Program Inspection`);
        console.log(`======================================================`);
        console.log(` Program ID:    ${programId}`);
        console.log(` Config PDA:    ${context.configPda}`);
        console.log(` RPC Endpoint:  ${rpcUrl}`);
        console.log(` Tools Found:   ${tools.length}`);
        console.log(`======================================================\n`);

        for (const tool of tools) {
          const kind = tool.solana?.kind;
          console.log(`🔹 [${kind.toUpperCase()}] ${tool.name}`);
          console.log(`   Description: ${tool.description}`);
          if (kind === 'instruction') {
            console.log(`   Instruction: ${tool.solana.instruction}`);
            if (tool.solana.effects) {
              console.log(`   Effects:     ${tool.solana.effects.summary} (financial: ${tool.solana.effects.financial})`);
            }
          } else if (kind === 'accountRead') {
            console.log(`   Account:     ${tool.solana.account}`);
          }
          console.log(`   Input Schema:`, JSON.stringify(tool.inputSchema.properties || {}, null, 2).replace(/\n/g, '\n   '));
          console.log();
        }
      }
    } else if (command === 'tools') {
      if (openaiMode) {
        const openaiTools = host.toOpenAiTools(programId);
        console.log(JSON.stringify(openaiTools, null, 2));
      } else {
        const tools = host.getTools(programId);
        console.log(JSON.stringify(tools, null, 2));
      }
    } else if (command === 'read') {
      const toolName = positionalArgs[0];
      if (!toolName) {
        console.error('Error: toolName is required for read command.');
        process.exit(1);
      }
      let readArgs = {};
      if (positionalArgs[1]) {
        try {
          readArgs = JSON.parse(positionalArgs[1]);
        } catch (err) {
          console.error(`Error parsing JSON arguments: ${err.message}`);
          process.exit(1);
        }
      }

      const result = await host.executeRead(toolName, readArgs, { programId });
      if (jsonMode) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`\n======================================================`);
        console.log(` Account Read: ${toolName}`);
        console.log(`======================================================`);
        console.log(` Address: ${result.address}`);
        console.log(` Account: ${result.account}`);
        console.log(` Exists:  ${result.exists}`);
        console.log(` Data:`);
        console.log(JSON.stringify(result.data, null, 2));
        console.log(`======================================================\n`);
      }
    } else if (command === 'prepare') {
      const toolName = positionalArgs[0];
      if (!toolName) {
        console.error('Error: toolName is required for prepare command.');
        process.exit(1);
      }
      let prepArgs = {};
      if (positionalArgs[1]) {
        try {
          prepArgs = JSON.parse(positionalArgs[1]);
        } catch (err) {
          console.error(`Error parsing JSON arguments: ${err.message}`);
          process.exit(1);
        }
      }

      if (!signer) {
        console.error('Error: --signer <pubkey> is required for instruction preparation.');
        process.exit(1);
      }

      const result = await host.prepareInstruction(toolName, prepArgs, {
        programId,
        signer: new PublicKey(signer),
        simulate: true,
      });

      if (jsonMode) {
        console.log(
          JSON.stringify(
            {
              tool: result.tool,
              programId: result.programId,
              accounts: result.accounts,
              effects: result.effects,
              simulation: result.simulation,
            },
            null,
            2
          )
        );
      } else {
        console.log(`\n======================================================`);
        console.log(` Prepared Instruction: ${toolName}`);
        console.log(`======================================================`);
        console.log(` Program ID: ${result.programId}`);
        console.log(` Accounts:`);
        for (const acc of result.accounts) {
          const privs = [acc.isSigner ? 'SIGNER' : '', acc.isWritable ? 'WRITABLE' : 'READONLY']
            .filter(Boolean)
            .join(', ');
          console.log(`   - ${acc.name.padEnd(16)}: ${acc.pubkey} (${privs})`);
        }
        if (result.effects) {
          console.log(` Effects:    ${result.effects.summary} (financial: ${result.effects.financial})`);
        }
        console.log(`\n Simulation Report:`);
        console.log(`   Status:          ${result.simulation.err ? 'FAILED' : 'SUCCESS'}`);
        console.log(`   Compute Units:   ${result.simulation.unitsConsumed}`);
        console.log(`   Logs:`);
        for (const log of result.simulation.logs || []) {
          console.log(`     > ${log}`);
        }
        console.log(`======================================================\n`);
      }
    }
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}\n`);
    process.exit(1);
  }
}

main();
