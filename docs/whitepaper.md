# Web3MCP

## Thesis

AI agents need a reliable way to discover what a Solana program can do. Today, each agent usually needs a program-specific integration, an MCP adapter, or the project's website. Web3MCP proposes a common interface published by the program itself.

[WebMCP](https://developer.chrome.com/docs/ai/webmcp) lets a website register structured tools with a browser so an agent can use page features directly. Web3MCP applies the tool-discovery idea to Solana: a program publishes tool definitions in a program-owned account, and an agent host reads them through RPC. The executable actions remain Solana program instructions. The on-chain account stores declarations and an IDL, not an LLM or executable MCP callbacks.

## How it works

1. A program author publishes a versioned config in a PDA owned by the target program.
2. A Web3MCP host receives the program ID and verifies the program and config account.
3. The host reads the tool definitions and makes supported tools available to its LLM.
4. Read tools fetch and decode Solana accounts through RPC.
5. Instruction tools produce transactions for simulation, human review, and wallet approval.

The host needs generic Web3MCP support, Solana RPC access, a model capable of tool use, and a wallet. It needs no target-program website or program-specific MCP server. Program authors must opt in by implementing and publishing the config; an existing unrelated program does not become compatible automatically.

## Trust boundary

On-chain publication makes tool definitions publicly readable and ties a config account to its owning program. It does not prove that a description is accurate or that a transaction is safe. A host must validate the account owner, config version, IDL bindings, arguments, program ID, and account privileges. The LLM may propose an operation, but only the wallet can approve and sign the reviewed transaction.

## First release

The first release targets an Anchor-compatible Solana program and starts from its program ID. A small reference vault will publish read and instruction tools. A generic host will discover those tools and demonstrate a wallet-approved transaction. SNS name resolution, richer account resolution, and adapters for existing MCP hosts are later work.

The [project design](superpowers/specs/2026-10-13-web3mcp-project-design.md) describes the proposed first-release contract. The wire format is not frozen yet.
