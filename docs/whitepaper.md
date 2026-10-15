# Web3MCP

## Thesis

AI agents need a reliable way to discover what a Solana program can do. Today, each agent usually needs a program-specific integration, an MCP adapter, or the project's website. Web3MCP proposes a common interface published by the program itself.

[WebMCP](https://developer.chrome.com/docs/ai/webmcp) lets a website register structured tools with a browser so an agent can use page features directly. Web3MCP applies the tool-discovery idea to Solana: a program publishes tool definitions in a program-owned account, and an agent host reads them through RPC. The executable actions remain Solana program instructions. The on-chain account stores declarations and an IDL, not an LLM or executable MCP callbacks.

## Prior Art & Comparison

| Approach | Architecture | Limitations |
| --- | --- | --- |
| **Solana Agent Kit / Action Kits** | Off-chain npm plugins hand-coded per protocol (e.g. Jupiter, Orca) | Centralized off-chain code maintenance; new programs require new library releases; often uses risky autonomous private key custody. |
| **Bespoke MCP Servers (Anthropic MCP)** | Separate Node.js/Python server running locally (stdio) or remotely (SSE/HTTP) per application | Requires hosting, server maintenance, network hops, and out-of-band trust instead of on-chain provenance. |
| **On-Chain Anchor IDLs (`anchor idl init`)** | Gzipped IDL stored in a program-owned buffer account | Developer/explorer-focused only; lacks AI tool descriptors, parameter validation schemas (`inputSchema`), semantic execution bindings, and human-readable safety hints. |
| **Browser WebMCP (Google Chrome)** | Declarative tool registration in the browser DOM | Limited to web applications and DOM interfaces; cannot discover or execute on-chain smart contract instructions directly. |
| **Web3MCP (This Protocol)** | Program-owned canonical Config PDA storing versioned tool descriptors, parameter schemas, and embedded IDL | Fully on-chain, self-sovereign discovery via standard Solana RPC; generic host with zero target-program dependencies; simulation-first wallet approval boundary. |

## How it works

1. **Publish:** A program author publishes a versioned config in a canonical PDA (`["web3mcp", "config"]`) owned by the target program.
2. **Discover:** A Web3MCP host receives the program ID, verifies executability and account ownership, and retrieves the config via Solana RPC.
3. **Register:** The host validates the configuration against the normative schema and makes supported tools available to an agent runtime.
4. **Query (Read):** Read tools fetch and decode Solana accounts directly through RPC against verified account discriminators.
5. **Simulate & Approve (Write):** Instruction tools resolve accounts, serialize Anchor instruction data, simulate the transaction against RPC, and present the exact transaction to the wallet for approval.
6. **AI Ingestion (Phase 4):** Downstream AI agents ingest these validated tool descriptors to understand available capabilities and propose user-directed actions, while never holding signing authority.

The host needs generic Web3MCP support, Solana RPC access, and a wallet. It needs no target-program website or program-specific MCP server. Program authors must opt in by implementing and publishing the config; an existing unrelated program does not become compatible automatically.

## Trust boundary

On-chain publication makes tool definitions publicly readable and ties a config account to its owning program. It does not prove that a description is accurate or that a transaction is safe. A host must validate the account owner, config version, IDL bindings, arguments, program ID, and account privileges. The LLM may propose an operation, but only the wallet can approve and sign the reviewed transaction.

## Project Status

- **Phase 1: Freeze Protocol v0.1 (Completed)**: Normative binary account layout, JSON schema, versioning, and fail-closed conformance test vectors frozen in `protocol/SPEC.md`.
- **Phase 2: Publish from Reference Program (Completed)**: Anchor reference vault deployed to Solana Devnet (`GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv`) with live Config PDA (`HfA1ExZS1cgYR5k5GEJmsQfyAcDK2J9NPi7p97dU3WLD`).
- **Phase 3: Generic Host Core (In Progress)**: Developing the deterministic, headless host engine for discovery, schema export, account reads, dynamic instruction preparation, and live simulation.
- **Phase 4: LLM and Wallet Flow (Upcoming)**: Direct AI model tool ingestion, interactive conversational loop, and human wallet approval flow.
