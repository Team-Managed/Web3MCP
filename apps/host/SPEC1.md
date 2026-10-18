# Spec: Generic Host Core (generic-host-core)

**Historical:** The current generic runtime has moved to `@web3mcp/sdk`. See [the current project design](../../docs/superpowers/specs/2026-10-13-web3mcp-project-design.md).

Status: ready-for-agent · Date: 2026-10-15

## Problem Statement

AI agent hosts and developers connecting to Solana programs currently require custom, program-specific integration SDKs or static IDLs hard-coded into their applications. While the Web3MCP protocol v0.1 defines the on-chain Config PDA standard and the Reference Vault proves that a program can publish its tool declarations on Solana Devnet, there is no generic runtime host capable of discovering these tools from a Program ID alone, validating on-chain accounts, querying state, and preparing wallet-ready instructions. Without a generic host core, agents cannot interact dynamically with arbitrary compatible Solana programs across the network.

## Solution

Build the headless Web3MCP Compatible Host core engine as a standalone workspace package (`@web3mcp/host`). Given a target Solana Program ID and an active Solana RPC connection, the host verifies executable status, derives the canonical Config PDA, parses and validates publication status and integrity using the protocol validator, and dynamically registers all valid tools. The host exposes high-leverage entry points to inspect protocol-compliant tool descriptors (`getTools()`), execute strongly validated account queries (`executeRead()`), and resolve accounts, serialize Anchor instruction data, and simulate transactions (`prepareInstruction()`) ready for downstream human wallet approval. All RPC interactions and verification run against real Solana RPC endpoints without synthetic mocks.

## User Stories

1. As an agent host developer, I want to initialize a Web3MCP Compatible Host by providing an RPC connection, so that the host can interact directly with the Solana network.
2. As an agent host developer, I want to discover tools from a Program ID with a single method call, so that I do not have to manually derive PDAs or verify program account flags.
3. As an agent host developer, I want discovery to verify that the target Program ID is an executable program account on-chain, so that non-program addresses fail immediately.
4. As an agent host developer, I want discovery to derive the canonical Config PDA using seeds `["web3mcp", "config"]`, so that discovery requires zero out-of-band address configuration.
5. As an agent host developer, I want discovery to fail closed if the Config PDA does not exist or has publication status `Uninitialized (0)` or `Uploading (1)`, so that incomplete configs are never exposed to agents.
6. As an agent host developer, I want discovery to enforce SHA-256 digest validation over the on-chain payload, so that corrupted or tampered configs are rejected.
7. As an agent host developer, I want discovery to validate the embedded config against the normative JSON schema and cross-check against the embedded IDL, so that malformed tool definitions cannot be registered.
8. As an agent host developer, I want discovery to initialize runtime Borsh instruction and account coders dynamically from the on-chain IDL, so that the host requires zero static IDL imports or compilation artifacts from the target program.
9. As an LLM runtime integrator, I want to call `getTools()` and receive tool descriptors that strictly conform to the Web3MCP protocol JSON schema, so that tool definitions can be passed safely to language model runtimes.
10. As an LLM runtime integrator, I want each tool descriptor to contain `name`, `title`, `description`, `inputSchema`, and `annotations`, so that the LLM receives complete context and argument constraints.
11. As an agent runtime, I want to execute an `accountRead` tool by providing the tool name and validated arguments, so that I can query structured on-chain state without signing transactions.
12. As an agent runtime, I want `executeRead` to resolve target account addresses from input arguments or derived PDA seeds, so that callers do not need low-level address calculation logic.
13. As an agent runtime, I want `executeRead` to verify that the fetched account is owned by the target Program ID, so that spoofed accounts from foreign programs are rejected.
14. As an agent runtime, I want `executeRead` to verify the 8-byte Anchor discriminator before decoding account data, so that mismatched account types fail closed.
15. As an agent runtime, I want `executeRead` to decode binary account data using the embedded IDL and return a plain structured JSON object, so that state can be inspected immediately.
16. As an agent runtime, I want to prepare an instruction tool by providing the tool name, arguments, and signer public key, so that a valid Solana transaction instruction is constructed.
17. As an agent runtime, I want `prepareInstruction` to validate arguments strictly against the tool's `inputSchema` for scalar types (`u64`, `boolean`, `publicKey`), so that malformed inputs fail closed before instruction serialization.
18. As an agent runtime, I want `prepareInstruction` to resolve accounts declared with `source: "signer"` using the provided wallet public key, so that signer accounts are correctly assigned.
19. As an agent runtime, I want `prepareInstruction` to resolve accounts declared with `source: "input"` using validated input arguments, so that caller-specified accounts are correctly mapped.
20. As an agent runtime, I want `prepareInstruction` to resolve accounts declared with `source: "program"` using fixed on-chain addresses, so that system programs and external services are correctly referenced.
21. As an agent runtime, I want `prepareInstruction` to resolve accounts declared with `source: "idl"` by dynamically deriving PDAs according to IDL seeds (`const`, `account`, `arg`), so that program-derived addresses are computed deterministically.
22. As an agent runtime, I want `prepareInstruction` to serialize instruction data into Anchor binary layout using the runtime Borsh coder, so that the target program can successfully deserialize the instruction on-chain.
23. As an agent runtime, I want `prepareInstruction` to simulate the constructed instruction against real Solana RPC, so that simulation logs, compute units consumed, and potential runtime errors are detected before wallet handoff.
24. As an agent runtime, I want `prepareInstruction` to return the complete instruction, simulation results, and declared effects summary together, so that human users and wallets can inspect exactly what will happen before approving the transaction.
25. As a developer, I want clear, typed error classes (`DiscoveryError`, `ConfigValidationError`, `AccountResolutionError`, `SimulationError`) extending `Web3McpHostError`, so that failure causes can be handled programmatically.
26. As a CLI user, I want a command-line tool to inspect a Program ID, view discovered tools, execute reads, and simulate instructions directly in the terminal, so that I can verify on-chain configurations without writing boilerplate code.
27. As a project maintainer, I want all host tests to run against live Solana RPC endpoints without synthetic mocks, so that test results prove true network interoperability.

## Implementation Decisions

- **Package Architecture**: Implement the host as an independent npm workspace package `@web3mcp/host` under `apps/host/`, depending on `@web3mcp/protocol` for PDA derivation, binary account parsing, and JSON schema validation.
- **Deep Module Design**: Consolidate host operations behind a single `Web3McpHost` class with a small surface area (`discover`, `getTools`, `executeRead`, `prepareInstruction`) hiding all internal discovery, verification, decoding, and simulation logic.
- **Pure RPC Discovery & Zero Target Program Imports**: Fulfill ADR 0007 by requiring zero static imports of the target program's source or compiled IDL. All IDL definitions and tool schemas are ingested from the on-chain Config PDA at runtime.
- **Dynamic Borsh Encoding & Decoding**: Dynamically construct Anchor `BorshInstructionCoder` and `BorshAccountsCoder` at runtime from the parsed IDL in the Config PDA to encode instructions and decode accounts without compile-time code generation.
- **Protocol-Strict Tool Descriptors**: Ensure `getTools()` returns tool objects matching 100% of the normative Web3MCP protocol JSON schema without proprietary wrapping or omissions.
- **Live RPC Testing Over Synthetic Mocks**: In accordance with explicit project direction, do not use in-memory RPC mocks. All tests and verification commands execute against live Solana RPC (Solana Devnet), testing against the deployed Reference Vault (`GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv`).
- **Fail-Closed Account Resolution**: In accordance with ADR 0008, resolve accounts declared as `signer`, `input`, `program`, and `idl`. For `idl`, dynamically evaluate seed rules (`const` byte vectors, `account` path references to other resolved accounts, `arg` value references). Fail closed with `AccountResolutionError` if any seed or account cannot be resolved.
- **Discriminator-Verified Account Queries**: In accordance with ADR 0010, execute read-only queries via standard RPC `getAccountInfo`, enforcing strict program ownership verification and Anchor 8-byte discriminator matching before Borsh decoding with the dynamic accounts coder.
- **Instruction Simulation at Preparation**: In accordance with ADR 0009, `prepareInstruction` builds a versioned message or legacy transaction and calls `connection.simulateTransaction`, returning the simulation report alongside the raw `TransactionInstruction` and effects metadata.
- **Typed Error Hierarchy**: Define `Web3McpHostError` as the base class with distinct subclasses: `DiscoveryError`, `ConfigValidationError`, `AccountResolutionError`, `ExecutionError`, and `SimulationError`.
- **Command-Line Interface**: Provide an executable CLI binary (`bin/inspect.js`) exposed via `package.json` for terminal inspection and verification.

## Testing Decisions

- **Test Surface**: Test `Web3McpHost` exclusively through its external public methods (`discover`, `getTools`, `executeRead`, `prepareInstruction`) at the highest seam.
- **Real RPC Verification**: Run test suites against live Solana Devnet RPC (`https://api.devnet.solana.com`).
- **End-to-End Test Matrix**:
  - Discover the live Reference Vault on Devnet (`GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv`) and verify `getTools()` returns all published tools (`get_vault`, `initialize`, `deposit`, `withdraw`).
  - Execute `executeRead` for `get_vault` on Devnet and verify decoded balance and owner fields match on-chain account data.
  - Execute `prepareInstruction` for `deposit` with valid arguments and verify that dynamic PDA resolution derives the vault PDA, Anchor instruction data is properly encoded, and transaction simulation against Devnet returns success.
  - Fail-closed testing: attempt discovery against an uninitialized program ID or non-executable address and verify typed `DiscoveryError` is thrown.
  - Fail-closed testing: attempt `executeRead` with mismatched discriminator or invalid address and verify typed error is thrown.
  - Fail-closed testing: attempt `prepareInstruction` with invalid arguments (e.g. non-numeric u64 or malformed public key) and verify fail-closed validation error.

## Out of Scope

- **Interactive LLM Provider Loop**: Streaming LLM chat interface, OpenAI/Anthropic API client integration, and agent prompt templates (deferred to Feature 4).
- **Browser Wallet Adapter UI**: Browser wallet connect modals, Phantom/Solflare extension adapters, and interactive transaction signing prompts (deferred to Feature 4).
- **SNS Name Discovery**: Resolving `.sol` domain names to Program IDs (deferred per protocol v0.1 specification).
- **Multi-Instruction Recipes**: Batched instructions, flash loans, or address lookup tables (ALTs) (deferred per protocol v0.1 specification).
- **Agent Autonomous Signing**: Private key custody or autonomous signing by the host runtime (strictly prohibited; wallet handoff is mandatory).

## Further Notes

- The Reference Vault is currently deployed on Solana Devnet at `GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv` with canonical Config PDA at `HfA1ExZS1cgYR5k5GEJmsQfyAcDK2J9NPi7p97dU3WLD`.
- The host implementation must respect the 64 KiB config size limit and Anchor binary header layout defined in `@web3mcp/protocol`.
