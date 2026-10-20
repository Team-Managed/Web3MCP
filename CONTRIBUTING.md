# Contributing to Web3MCP

Web3MCP has one normative protocol in [`protocol/`](protocol/), a reusable Node.js SDK, one example Host CLI, and one reference vault. Start with the [specification](protocol/SPEC.md), [design](docs/superpowers/specs/2026-10-13-web3mcp-project-design.md), and [roadmap](docs/roadmap.md).

## Propose a change

Open an issue to describe the behavior, compatibility impact, and security assumptions before changing the wire format. A protocol change needs an updated spec, JSON Schema and validator, positive and negative conformance fixtures, and a version/compatibility note. Do not create a second wire format in the website or whitepaper. See the [protocol change process](docs/protocol-changes.md).

For code changes, keep the SDK and Host CLI generic. They must discover tools from a program ID and its on-chain config, without importing the reference vault IDL or hard-coding its tools. The model proposes actions; the host owns user approval and wallet signing. Do not add an MCP server, client, or adapter to the v0.1 architecture.

## Check your work

Use Node.js 22 or later and Rust stable. From the repository root:

```bash
npm ci
npm test
npm ci --prefix apps/website
npm run build
cargo test --workspace --locked
```

The local-validator suite also needs Solana and Anchor; follow the [vault guide](reference-programs/reference-vault/README.md). Run it when changing publication, on-chain account layout, or instruction behavior. Never commit keypairs, recovery phrases, API keys, or `.env` files.

Submit a PR against `staging` for integration work. Describe the behavior, spec impact, tests actually run, and any remaining risk. Changes for `main` go through a reviewed PR and required checks. Follow the [code of conduct](CODE_OF_CONDUCT.md).
