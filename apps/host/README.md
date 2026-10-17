# Web3MCP host

This directory contains the agent-facing host: a generic program-ID loader, on-chain config validator, LLM tool loop, Solana RPC executor, transaction review, and wallet handoff. It must not contain reference-vault-specific tool names, instruction layouts, or an imported vault IDL.

Run `npm run host:inspect -- --help` or `npm run host:agent -- --help` from the repository root. The host accepts a program ID and uses the program-owned on-chain config through RPC. The current Devnet reference config predates protocol v0.1 corrections; use the local validator integration suite for current compatibility.
