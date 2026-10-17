# Web3MCP

Web3MCP is a proposed Solana protocol for publishing agent-facing tool definitions in an account owned by the target program. A compatible agent host reads that on-chain config, presents its tools to an LLM, and uses Solana RPC and a wallet to carry out approved actions. A program's website or dedicated MCP server is not required.

## Project tracks

| Track | Purpose |
| --- | --- |
| [Protocol](protocol/README.md) | Define the config format, discovery and execution rules, examples, and conformance checks. |
| [Web3MCP host](apps/host/README.md) | Load program tools dynamically, run an LLM tool loop, and coordinate RPC and wallet approval. |
| [Reference program](programs/reference-vault/README.md) | Publish real tools from a Solana program so the host can prove the protocol end to end. |
| [Documentation site](apps/docs/README.md) | Present the whitepaper, protocol reference, and guides to program and host authors. |

The [whitepaper](docs/whitepaper.md) explains the idea. The [current design](docs/superpowers/specs/2026-10-13-web3mcp-project-design.md) and [demo roadmap](docs/roadmap.md) define the next implementation work.

## First demo

The user supplies a program ID to the host. The host verifies the executable program and its program-owned config PDA, loads the published IDL and tools, and makes those tools available to an LLM. The LLM can request an account read or propose an instruction; the host validates inputs, simulates the exact transaction, and asks the user's wallet for approval before submitting it. A second compatible program should load without changing the host.

Program-ID discovery is the first release. SNS name resolution, MCP adapters, swaps, and mainnet deployment come later.

## Status

The protocol validator, reference vault, and generic host core are implemented. The current reference vault has passed local-validator tests; the earlier Devnet deployment predates its latest fixes. The documentation site and second-program interoperability demo remain planned. The older October 9 spec and plan under `docs/superpowers/` are superseded research history.
