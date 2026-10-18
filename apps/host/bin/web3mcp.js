#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

const usage = `Web3MCP Compatible Host — chat with a Solana program's on-chain tools

Usage: web3mcp [options]

Options:
  --program <id>       Optionally preload a Solana program
  --model <name>       Optionally prefill the model
  --provider <name>    gemini | openai | anthropic | groq | ollama
  --rpc <url>          Solana RPC URL (default: Devnet)
  --keypair <path>     Optionally prefill local wallet JSON path
  --help               Show this help
  --version            Show package version

Chat opens first. Type / to see command suggestions, Tab to complete, or Enter for the full menu.
Use /model to choose a provider, enter or reuse a saved API key, and select a model.
Use /wallet to choose a detected wallet or enter a path; use /rpc for the Solana endpoint.
Mention a program ID or .sns name in chat.
Each simulated transaction requires an explicit s to sign with the selected keypair.
`;

try {
  const { values } = parseArgs({
    options: {
      program: { type: 'string' }, model: { type: 'string' }, provider: { type: 'string' },
      rpc: { type: 'string' }, keypair: { type: 'string' },
      help: { type: 'boolean', short: 'h' }, version: { type: 'boolean', short: 'v' },
    },
  });
  if (values.help) {
    process.stdout.write(usage);
  } else if (values.version) {
    const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    process.stdout.write(`${pkg.version}\n`);
  } else {
    if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('Chat requires an interactive terminal.');
    const envFile = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envFile) && process.loadEnvFile) process.loadEnvFile(envFile);
    const programId = values.program;
    const provider = values.provider || process.env.LLM_PROVIDER ||
      (process.env.OPENAI_API_KEY ? 'openai' : process.env.GEMINI_API_KEY ? 'gemini' : process.env.ANTHROPIC_API_KEY ? 'anthropic' : process.env.GROQ_API_KEY ? 'groq' : 'openai');
    if (!['gemini', 'openai', 'anthropic', 'groq', 'ollama'].includes(provider)) throw new Error(`Unsupported model provider '${provider}'.`);
    const model = values.model || process.env.LLM_MODEL || process.env[`${provider.toUpperCase()}_MODEL`];
    const rpcUrl = values.rpc || process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    const endpoint = new URL(rpcUrl);
    if (!['http:', 'https:'].includes(endpoint.protocol)) throw new Error('RPC endpoint must use HTTP or HTTPS.');

    const { Connection, PublicKey } = await import('@solana/web3.js');
    if (programId) new PublicKey(programId);
    const { Web3McpSdk } = await import('@web3mcp/sdk');
    const { loadKeypairFromFile } = await import('../dist/wallet/index.js');
    const { startChat } = await import('../dist/tui/index.js');
    const { keychainCredentials } = await import('../dist/tui/credentials.js');
    const keypairPath = values.keypair || process.env.SOLANA_KEYPAIR || process.env.ANCHOR_WALLET || '';
    const signer = keypairPath ? loadKeypairFromFile(keypairPath) : null;
    let apiKey = process.env[`${provider.toUpperCase()}_API_KEY`] || '';
    try { apiKey = await keychainCredentials.get(provider) || apiKey; } catch { /* A locked or unavailable store leaves env/UI entry available. */ }
    const sdk = new Web3McpSdk({ connection: new Connection(rpcUrl, 'confirmed') });
    const app = startChat({ sdk, programId, rpcUrl, model, provider, apiKey, credentialStore: keychainCredentials, signer, walletPath: keypairPath });
    await app.waitUntilExit();
  }
} catch (error) {
  process.stderr.write(`web3mcp: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
