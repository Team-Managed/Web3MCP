# Web3MCP agent guide

## Project

Web3MCP lets an agent host discover Solana program tools from a program-owned config PDA, then read accounts or prepare wallet-approved instructions using generic Solana capabilities. The project has a protocol, a reusable Node.js SDK, and one example Host CLI. A reference program proves interoperability.

## Source of truth

- Start with [README.md](README.md), then the current [project design](docs/superpowers/specs/2026-10-13-web3mcp-project-design.md) and [demo roadmap](docs/roadmap.md).
- `docs/superpowers/` is the location recommended by the Superpowers skills for design specs and implementation plans. Older documents there are marked as superseded; do not implement them without reconciling them with the current design.
- Keep protocol rules in `protocol/`. The whitepaper and docs site explain those rules but do not define a second wire format.

## Boundaries

- The target program owns the config PDA. `@web3mcp/sdk` discovers tools from the deployed program ID and on-chain config; neither SDK nor Host CLI may import the reference program's source, generated IDL, or hard-coded tool list.
- Web3MCP v0.1 uses no MCP server, MCP client, or adapter. It needs no target-program website or program-specific API. The Host CLI has its own terminal UI and model connection.
- The LLM proposes a tool and arguments. The SDK validates untrusted config and inputs, constructs and simulates instructions, and checks the signed message before submission. The Host CLI handles human review and wallet signing. The LLM never signs.
- Protocol and SDK discovery start from a program ID. The Host CLI may resolve a current `.sns` name to that ID before discovery; other name systems remain deferred.
- Do not commit wallet files, private keys, API keys, or environment secrets. Keep examples on local validator or devnet until a deployment is explicitly requested.

## Working here

- Keep exactly one end-user CLI command, `web3mcp`. Other Node.js hosts should import `@web3mcp/sdk` without installing the Host CLI.
- Keep protocol fixtures and conformance tests independent of the reference program. A generic host should work with a second compatible program without code changes.
- Update the design and roadmap when a protocol or product boundary changes.

## Agent skills

Skills are installed under `.agents/skills/`.

### Configuration & Docs

- **Issue tracker**: Local markdown under `.scratch/<feature>/` (and GitHub `Team-Managed/Web3MCP`). See [issue-tracker.md](docs/agents/issue-tracker.md).
- **Domain docs**: Single-context domain glossary at [GLOSSARY.md](GLOSSARY.md) and architecture decision records in `docs/adr/`. See [domain.md](docs/agents/domain.md).

### Core Workflows

- **`tdd`**: Test-driven development with a red-green-refactor loop. Essential for freezing protocol wire formats and conformance fixtures before implementing parsers.
- **`code-review`**: Dual-axis review across **Standards** and **Spec**. Validates that host implementations never violate protocol boundaries (e.g. importing the reference vault source or attempting agent signing).
- **`codebase-design`**: Deep module design principles. Enforces small, robust interfaces for complex on-chain config parsing, RPC interactions, and simulation.
- **`diagnosing-bugs`**: Disciplined debugging loop with reproducible feedback scripts for Solana RPC and Anchor transaction simulation failures.
- **`domain-modeling`**: Actively keeps [GLOSSARY.md](GLOSSARY.md) and `docs/adr/` aligned with protocol specifications.
- **`grill-me`** / **`grilling`**: Relentless Socratic interview to stress-test designs and edge cases before coding.
- **`to-spec`** & **`to-tickets`**: Converts discussions into specifications and vertical-slice tracer tickets.
- **`git-guardrails-claude-code`**: Blocks selected destructive Git commands in Claude Code. Review staged files for wallet keys and secrets before committing.
