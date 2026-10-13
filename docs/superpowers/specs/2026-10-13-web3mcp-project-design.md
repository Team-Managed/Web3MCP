# Web3MCP project design

**Status:** Current project design · **Date:** 2026-10-13

## Goal

Define a program-published tool protocol for Solana and demonstrate it with a generic agent host. A compatible program places its tool declarations and supported IDL in a program-owned PDA. The host reads that account through RPC, presents valid tools to an LLM, and carries out reads or wallet-approved instructions without a target-program website or dedicated MCP server.

## Components

| Component | Responsibility | Boundary |
| --- | --- | --- |
| Protocol | Versioned on-chain config, tool schema, execution bindings, validation, conformance fixtures | Defines what independent publishers and hosts agree on |
| Reference publisher | Sample Anchor vault, config PDA, authorized upload, generated config | Proves a program can publish the format |
| Web3MCP host | Program-ID discovery, validation, LLM tool registry, RPC reads, transaction preparation, simulation, wallet handoff | Consumes only deployed account data and generic Solana interfaces |
| Documentation site | Whitepaper, normative reference, author guides, live demo explanation | Never serves a target program's tool definitions |

The host is a Web3MCP runtime, not an MCP client. An [MCP client](https://modelcontextprotocol.io/docs/learn/architecture) connects to an MCP server through MCP transport; this design reads Solana directly. A future adapter may expose these tools to existing MCP hosts, but is not required for v0.1.

## Protocol direction

The first profile starts from a program ID. The target program owns a config PDA at the canonical `agent-cap` seed. Its account carries publication metadata and a versioned UTF-8 JSON config with `standard`, `version`, `programId`, `idl`, and `tools`. The IDL is embedded so the host does not need a program-specific URL or a second metadata account. Tool descriptors follow the useful serializable shape of WebMCP; a Solana binding identifies either an `accountRead` or one `instruction`. The account stores declarations, never executable callbacks or arbitrary resolver code.

The initial profile supports only account addresses and argument types that a generic host can validate and resolve from the supported Anchor IDL. Unsupported instructions fail closed. The exact layout, limits, encodings, validation rules, and test vectors must be frozen in `protocol/` before calling the format interoperable. The [earlier technical draft](2026-10-09-web3mcp-design.md) contains candidate details, but its SNS-first scope is superseded.

## Host flow

1. Receive a program ID, fetch its executable account, derive the config PDA, and check the PDA owner, status, program ID, version, and manifest/IDL consistency.
2. Convert validated tool declarations into the chosen model's tool format. Treat every description and chain result as untrusted data.
3. Validate each model-proposed tool call against the config. For `accountRead`, fetch, check ownership/discriminator, and decode through RPC.
4. For `instruction`, resolve accounts, encode and simulate the exact transaction, display program, accounts, signer and writable flags, amount, fee, effects, and uncertainty, then ask the wallet to approve that message.
5. Submit only the wallet-signed message, confirm it through RPC, and report the transaction signature and status.

The model never receives signing authority. The host must not import the reference vault's source, generated IDL, or hard-coded tool names. A second compatible program must load without a host code change.

## Demo and scope

The first demo uses a reference SOL vault on a local validator and then devnet if publication is authorized. It must show one read, one approved state change, a confirmed result, and a rejected invalid call. The host may have a generic web or desktop UI; that is not a target-program frontend. The documentation site is independent of tool execution.

SNS names, multi-instruction recipes, arbitrary third-party programs, swaps/quotes, delegated signing, MCP adapters, and mainnet are deferred. The model provider and wallet UI are implementation choices to settle before building the host. The [roadmap](../../roadmap.md) defines delivery order.
