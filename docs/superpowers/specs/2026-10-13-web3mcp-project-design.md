# Web3MCP project design

**Status:** Current project design · **Date:** 2026-10-13

## Goal

Define a program-published tool protocol for Solana and demonstrate it with a generic agent host. A compatible program places its tool declarations and supported IDL in a program-owned PDA. The host reads that account through RPC, presents valid tools to an LLM, and carries out reads or wallet-approved instructions without a target-program website or dedicated MCP server.

## Components

| Component | Responsibility | Boundary |
| --- | --- | --- |
| Protocol | Versioned on-chain config, tool schema, execution bindings, validation, conformance fixtures | Defines what independent publishers and hosts agree on |
| Reference publisher | Sample Anchor vault, config PDA, authorized upload, generated config | Proves a program can publish the format |
| Node.js SDK | Program-ID discovery, validation, tool registry, RPC reads, transaction preparation, simulation, signed submission | Consumes only deployed account data and generic Solana interfaces |
| Web3MCP Compatible Host CLI | Model tool loop, terminal chat, human approval, local wallet | Imports the same SDK available to other Node.js hosts |
| Documentation site | Whitepaper, normative reference, author guides, live demo explanation | Never serves a target program's tool definitions |

The SDK and Host CLI read Solana directly. They contain no MCP server, MCP client, or adapter. An [MCP client](https://modelcontextprotocol.io/docs/learn/architecture) uses MCP transport; this project does not.

## Protocol direction

The first profile starts from a program ID. The target program owns a config PDA at the canonical seeds `["web3mcp", "config"]`. Its account carries publication metadata and a versioned UTF-8 JSON config with `standard`, `version`, `programId`, `idl`, and `tools`. The IDL is embedded so the host does not need a program-specific URL or a second metadata account. Tool descriptors follow the useful serializable shape of WebMCP; a Solana binding identifies either an `accountRead` or one `instruction`. v0.2 read tools may publish deterministic PDA seeds so an agent can find an account from a wallet public key. The account stores declarations, never executable callbacks or arbitrary resolver code.

The initial profile supports only account addresses and argument types that a generic host can validate and resolve from the supported Anchor IDL. Unsupported instructions fail closed. The exact layout, limits, encodings, validation rules, and test vectors must be frozen in `protocol/` before calling the format interoperable. The [earlier technical draft](2026-10-09-web3mcp-design.md) contains candidate details, but its SNS-first scope is superseded.

## Host flow

1. Receive a program ID, fetch its executable account, derive the config PDA, and check the PDA owner, status, program ID, version, and manifest/IDL consistency.
2. Offer a generic host discovery tool to the model. It accepts a program ID or, in the Host CLI, a `.sns` name. After executable-program and config-PDA validation, add the program's declared tools to the model's next turn. Treat every description and chain result as untrusted data.
3. Validate each model-proposed tool call against the config. For `accountRead`, fetch, check ownership/discriminator, and decode through RPC.
4. For `instruction`, resolve accounts, encode and simulate the exact transaction, display program, accounts, signer and writable flags, amount, fee, effects, and uncertainty, then ask the wallet to approve that message.
5. Submit only the wallet-signed message, confirm it through RPC, and report the transaction signature and status.

The model never receives signing authority. The user explicitly selects **Sign** for each simulated message, and the CLI signs it with the selected local keypair. The host must not import the reference vault's source, generated IDL, or hard-coded tool names. A second compatible program must load without a host code change.

## Demo and scope

The first demo uses a reference SOL vault on a local validator and then devnet if publication is authorized. It must show one read, one approved state change, a confirmed result, and a rejected invalid call. The host may have a generic web or desktop UI; that is not a target-program frontend. The documentation site is independent of tool execution.

The Host CLI can optionally resolve a `.sns` name on Mainnet before program-ID discovery on the selected Solana RPC. Name resolution is outside the protocol and does not change config PDA validation. Current `.sol` name resolution, multi-instruction recipes, arbitrary third-party programs, swaps/quotes, delegated signing, and mainnet execution are deferred. The first Host CLI uses a terminal chat and a local keypair; SDK consumers can provide their own model and wallet integration. The [roadmap](../../roadmap.md) defines delivery order.
