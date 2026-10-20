# Native LLM Seam and Interactive Wallet Handoff

## Decision

The example Web3MCP Compatible Host CLI keeps its model loop and terminal UI in `apps/host/`. It imports generic Solana discovery, account reads, and transaction preparation from `@web3mcp/sdk`. Other Node.js hosts can use the SDK without importing this CLI. No MCP server or client is part of the v0.1 path.

The CLI passes validated published tools to a selected model through its LLM adapter. It supports OpenAI-compatible and Anthropic tool-calling APIs without an agent framework in the runtime core. Publisher descriptions are untrusted and do not grant signing authority.

For an instruction tool, the host asks the SDK to validate arguments, resolve accounts, construct the transaction, and simulate it. The terminal shows the program, arguments, accounts and privileges, fee estimate when available, declared effects, simulation result, and message hash. The user must explicitly approve the displayed transaction. The host then signs with the selected local keypair; the SDK checks that the signed message matches the prepared message before submission. A refusal produces a tool result without signing.

## Consequences

- The model never receives the private key and cannot bypass the host's approval callback.
- A successful simulation is useful evidence about execution at that point in time, not proof of safety or future success.
- Model and wallet settings are host concerns. The protocol does not mandate a provider, terminal UI, or keypair location.
