# Web3MCP agent guide

## Project

Web3MCP lets an agent host discover Solana program tools from a program-owned config PDA, then read accounts or prepare wallet-approved instructions using generic Solana capabilities. The project has two main tracks: the protocol and a Web3MCP host. A reference program proves interoperability.

## Source of truth

- Start with [README.md](README.md), then the current [project design](docs/superpowers/specs/2026-10-13-web3mcp-project-design.md) and [demo roadmap](docs/roadmap.md).
- `docs/superpowers/` is the location recommended by the Superpowers skills for design specs and implementation plans. Older documents there are marked as superseded; do not implement them without reconciling them with the current design.
- Keep protocol rules in `protocol/`. The whitepaper and docs site explain those rules but do not define a second wire format.

## Boundaries

- The target program owns the config PDA. The host must discover tools from the deployed program ID and on-chain config; it must not import the reference program's source, generated IDL, or hard-coded tool list.
- Web3MCP v0.1 does not require an MCP server, MCP client, target-program website, or program-specific API. The host may have its own UI and model connection.
- The LLM proposes a tool and arguments. The host validates untrusted config and inputs, constructs and simulates instructions, and asks the wallet to approve the exact transaction. The LLM never signs.
- Start discovery from a program ID. SNS names and other name systems are deferred.
- Do not commit wallet files, private keys, API keys, or environment secrets. Keep examples on local validator or devnet until a deployment is explicitly requested.

## Working here

- This first commit is a project baseline, not a runnable protocol or host. Add build commands only when their implementation exists.
- Keep protocol fixtures and conformance tests independent of the reference program. A generic host should work with a second compatible program without code changes.
- Update the design and roadmap when a protocol or product boundary changes.
