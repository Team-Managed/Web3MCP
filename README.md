# Web3MCP

Web3MCP is a proposed Solana protocol for publishing agent-facing tool definitions in an account owned by the target program. A compatible agent host reads that on-chain config, presents its tools to an LLM, and uses Solana RPC and a wallet to carry out approved actions. A program's website or dedicated MCP server is not required.

## Project tracks

| Track | Purpose |
| --- | --- |
| [Protocol](protocol/README.md) | Define the config format, discovery and execution rules, examples, and conformance checks. |
| [Node.js SDK](packages/sdk/README.md) | Reusable discovery, reads, transaction preparation, and signed submission. |
| [Web3MCP Compatible Host CLI](apps/host/README.md) | One terminal chat app that imports the SDK, runs a model loop, and requests wallet approval. |
| [Reference program](reference-programs/reference-vault/README.md) | Publish real tools from a Solana program so the host can prove the protocol end to end. |
| [Documentation site](apps/docs/README.md) | Present the whitepaper, protocol reference, and guides to program and host authors. |

The [whitepaper](docs/whitepaper.md) explains the idea. The [current design](docs/superpowers/specs/2026-10-13-web3mcp-project-design.md) and [demo roadmap](docs/roadmap.md) define the next implementation work.

## First demo

The host offers the LLM a generic discovery tool. The user can mention a program ID or `.sns` name in chat; the model asks the host to discover it, and the host verifies the executable program and its program-owned config PDA. Validated IDL tools are added to the model's next turn. The model can then request a read or propose an instruction; the host validates inputs, simulates the exact transaction, and waits for the user's explicit **Sign** action before signing with the selected keypair and submitting it. A second compatible program should load without changing the host.

Program-ID discovery is the protocol entry point. The Host CLI can optionally resolve a `.sns` name before discovery; `.sol` name resolution, MCP adapters, swaps, and mainnet deployment come later.

## Status

The protocol validator, reference vault, Node.js SDK, and single Host CLI are implemented locally. The current reference vault and Web3MCP config are deployed on Devnet at program `9zJzM4rHDPR4pd3vXHQjQ7whTVmx4zxB3ZH4Gb9iXRwD`; the extracted SDK discovered its four tools there. The local-validator integration suite passed all 38 tests, including an SDK-backed signed write. A basic provider-backed OpenAI chat succeeded, and packed SDK and Host CLI installs worked outside the monorepo. A full provider-backed Devnet read/write rehearsal, npm publication, the documentation site, and the second-program interoperability demo remain pending.
