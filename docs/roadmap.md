# Web3MCP demo roadmap

This is the build order for the first complete demo. The current [design spec](superpowers/specs/2026-10-13-web3mcp-project-design.md) describes the boundaries. Detailed implementation plans belong under `docs/superpowers/plans/` when interfaces and tooling are selected.

## 1. Freeze protocol v0.1 (Completed)

Normative account layout, JSON schema, version rules, supported input types, account-resolution rules, error behavior, and test vectors published and frozen in `protocol/` (see `protocol/SPEC.md`). The test suite passes 25 automated conformance tests verifying offline schema validation, Anchor binary account layout, digest integrity, and fail-closed error behavior.

## 2. Publish from a reference program (Completed)

Build a small Anchor SOL vault with `get_vault`, `initialize`, `deposit`, and `withdraw` capabilities. Add a program-owned config PDA and authorized publication instructions. Generate the config from the compiled IDL, publish it in bounded chunks, and verify its bytes and account owner on a local validator. No host code may import the generated IDL.

**Status: Complete on Devnet.** Reference vault deployed to `GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv` with Config PDA at `HfA1ExZS1cgYR5k5GEJmsQfyAcDK2J9NPi7p97dU3WLD`. Automated publisher streamed 9 chunks with native on-chain SHA-256 verification (`sol_sha256`). RPC account read verified 100% protocol conformance with zero host imports of the generated IDL or program source (ADR 0007).

## 3. Build the generic host core

Given a program ID, verify the executable program and config PDA, parse the config, and dynamically register its tools for the LLM. Implement account reads, instruction encoding, supported account resolution, and strict input validation. Prove the host works from the published config alone.

## 4. Add the LLM and wallet flow

Choose one tool-calling model for the demo. Add a generic chat interface that exposes only validated on-chain tools to the model. For writes, construct and simulate the transaction, show the exact program, accounts, amount, fee, and uncertainty, then request explicit wallet approval of that exact message. Confirm the signature and report the chain result. Keep model credentials out of the browser bundle and repository.

## 5. Publish the explanation and demonstrate interoperability

Build a static documentation site from the whitepaper, protocol reference, publisher guide, and host guide. Run the full read → deposit → read → withdraw flow on a local validator, followed by a devnet rehearsal when deployment is authorized. Load a second small compatible program without changing host code to test the program-agnostic claim. Show one rejected unsafe or malformed tool call.

## Demo acceptance

- The host starts from only a program ID, RPC connection, model connection, and wallet.
- The target program has no required website, backend API, or MCP server.
- Read tools do not ask for a signature; write tools require review and wallet approval.
- The host rejects malformed config, mismatched program ownership, unsupported account rules, and altered transactions.
- A second compatible program is discovered without a host release.

SNS discovery, arbitrary third-party programs, swaps, MCP adapters, and mainnet are outside the first demo.
