# Web3MCP demo roadmap

This is the build order for the first complete demo. The current [design spec](superpowers/specs/2026-10-13-web3mcp-project-design.md) describes the boundaries. Detailed implementation plans belong under `docs/superpowers/plans/` when interfaces and tooling are selected.

## 1. Freeze protocol v0.1 (In review)

The account layout, JSON schema, version rules, supported input types, Anchor IDL 0.1.0 profile, and initial account/argument binding checks are implemented in `protocol/`. Local-validator publication and RPC discovery passed on 2026-10-17. More adversarial conformance vectors are still needed before freezing v0.1.

## 2. Publish from a reference program (Completed)

Build a small Anchor SOL vault with `get_vault`, `get_vault_by_owner`, `initialize`, `deposit`, and `withdraw` capabilities. Add a program-owned config PDA and authorized publication instructions. Generate the config from the compiled IDL, publish it in bounded chunks, and verify its bytes and account owner on a local validator. No host code may import the generated IDL.

**Status:** The current vault was deployed on Devnet on 2026-10-18 at `9zJzM4rHDPR4pd3vXHQjQ7whTVmx4zxB3ZH4Gb9iXRwD`, with Config PDA `J8Ph37LoQsv4yED6USdupCooCZzsVMqJkgBTm9uSkvCw`. The deployed program's upgrade authority matches the publisher. On 2026-10-18, its config was updated in place to v0.2 with five tools and passed on-chain discovery validation. The SDK then read the existing vault by owner public key on Devnet. The v0.2 config passed all 38 local-validator integration tests on 2026-10-18 with an upgradeable test deployment. The earlier Devnet program at `GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv` remains historical.

## 3. Build the generic SDK and one Host CLI (Local implementation)

Given a program ID, verify the executable program and config PDA, parse the config, and dynamically register its tools for the LLM. Implement account reads, instruction encoding, supported account resolution, and strict input validation. Prove the host works from the published config alone.

**Status:** Generic RPC discovery, validated tool export, account reads, instruction preparation, simulation, and signed submission now live in `@web3mcp/sdk` under `packages/sdk/`. The single `web3mcp` command in `apps/host/` imports that SDK. The SDK discovered all five tools from the current Devnet config and read an existing vault by owner public key. The v0.2 local-validator suite passed 38 tests, including an SDK-backed signed write. The older Devnet tests still target the superseded program and need updating for the new CLI rehearsal.

## 4. Add the LLM and wallet flow (In review)

Choose one tool-calling model for the demo. Add a generic chat interface that exposes only validated on-chain tools to the model. For writes, construct and simulate the transaction, show the exact program, accounts, amount, fee, and uncertainty, then request explicit wallet approval of that exact message. Confirm the signature and report the chain result. Keep model credentials out of the browser bundle and repository.

**Status:** Model adapters and one Ink terminal chat with wallet approval are implemented locally. Chat opens by default; `/` opens commands, `/model` configures provider, key, and model, `/wallet` selects a detected or entered keypair path, and `/rpc` sets the endpoint. API keys are saved in the operating system credential store; non-secret selections persist in a local settings file. Generic host discovery and IDL account-resolution tools let the model load a program's validated PDA tools and derive a PDA for reads. The CLI requires an explicit **Sign** action for each simulated transaction. A basic provider-backed OpenAI chat retry succeeded; a full Devnet read/write rehearsal remains pending.

## 5. Publish the explanation and demonstrate interoperability

Build a static documentation site from the whitepaper, protocol reference, publisher guide, and host guide. Run the full read → deposit → read → withdraw flow on a local validator, followed by a devnet rehearsal when deployment is authorized. Load a second small compatible program without changing host code to test the program-agnostic claim. Show one rejected unsafe or malformed tool call.

## Demo acceptance

- The host starts from only a program ID, RPC connection, model connection, and wallet.
- The target program has no required website, backend API, or MCP server.
- Read tools do not ask for a signature; write tools require review and wallet approval.
- The host rejects malformed config, mismatched program ownership, unsupported account rules, and altered transactions.
- A second compatible program is discovered without a host release.

The host can optionally resolve a `.sns` name to a program address using the current SNS SDK before normal SDK discovery. This is host-side convenience; the protocol still starts from a program ID. `.sol` name resolution, arbitrary third-party programs, swaps, MCP adapters, and mainnet execution are outside the first demo.
