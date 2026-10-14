# Canonical Config PDA Seeds

We standardized the Config PDA derivation seeds to `["web3mcp", "config"]` under the target program ID, replacing earlier drafts that used `agent-cap`. Using a two-part namespaced seed avoids collisions with other program PDAs and clearly identifies the account as belonging to the Web3MCP protocol standard across all Solana programs.
