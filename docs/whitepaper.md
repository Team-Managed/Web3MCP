# Web3MCP

Read the [Web3MCP documentation](https://www.web3mcp.org/docs/latest).

## Thesis

AI agents need a reliable way to discover what a Solana program can do. Today, each agent usually needs a program-specific integration, an MCP adapter, or the project's website. Web3MCP proposes a common interface published by the program itself.

[WebMCP](https://developer.chrome.com/docs/ai/webmcp) lets a website register structured tools with a browser so an agent can use page features directly. Web3MCP applies the tool-discovery idea to Solana: a program publishes tool definitions in a program-owned account, and an agent host reads them through RPC. The executable actions remain Solana program instructions. The on-chain account stores declarations and an IDL, not an LLM or executable MCP callbacks.

## Prior Art & Comparison

| Approach | Architecture | Limitations |
| --- | --- | --- |
| **Program-specific agent libraries** | Off-chain integration code for each supported program | Integrations must be maintained as programs change. |
| **Bespoke MCP servers** | A local or remote server exposes application tools | Project-specific server code adds a trust and maintenance surface. |
| **On-chain Anchor IDLs** | A published IDL describes instructions and accounts | An IDL alone does not define Web3MCP tool schemas or execution bindings. |
| **Browser WebMCP** | A website registers browser-accessible tools | Discovery depends on the website being available to the browser. |
| **Web3MCP (this proposal)** | Program-owned config PDA stores tool descriptors, schemas, bindings, and an IDL | A compatible host can discover through RPC; writes still require wallet approval. |

## How it works

1. **Publish:** A program author publishes a versioned config in a canonical PDA (`["web3mcp", "config"]`) owned by the target program.
2. **Discover:** The model calls a generic host tool with a program ID or supported name. The host verifies executability and account ownership, then retrieves the config through Solana RPC.
3. **Register:** The host validates the config and adds its supported program tools to the model's next turn.
4. **Query (Read):** Read tools fetch and decode Solana accounts directly through RPC against verified account discriminators.
5. **Simulate & Sign (Write):** Instruction tools resolve accounts, serialize Anchor instruction data, simulate the transaction against RPC, and present the exact transaction for the user's explicit **Sign** action. The CLI signs with the selected keypair only after that action.

The host needs generic Web3MCP support, Solana RPC access, and a wallet. It needs no target-program website or program-specific MCP server. Program authors must opt in by implementing and publishing the config; an existing unrelated program does not become compatible automatically.

## Trust boundary

On-chain publication makes tool definitions publicly readable and ties a config account to its owning program. It does not prove that a description is accurate or that a transaction is safe. A host must validate the account owner, config version, IDL bindings, arguments, program ID, and account privileges. The LLM may propose an operation, but only the wallet can approve and sign the reviewed transaction.

## Project Status

- **Phase 1: Protocol v0.1 (In review)**: The binary layout, schema, version rules, and conformance tests are implemented in `protocol/SPEC.md`.
- **Phase 2: Reference Program (Deployed)**: The current vault and Web3MCP config are published on Devnet at program `9zJzM4rHDPR4pd3vXHQjQ7whTVmx4zxB3ZH4Gb9iXRwD`.
- **Phase 3: Generic SDK and Host CLI (Implemented locally)**: The SDK discovers on-chain tools, reads accounts, prepares instructions, and simulates transactions. Discovery and account reads passed against the current Devnet config.
- **Phase 4: LLM and Wallet Flow (In review)**: Model adapters, a terminal agent, and wallet approval are implemented. A basic provider-backed chat worked; a full Devnet read/write rehearsal remains pending.
