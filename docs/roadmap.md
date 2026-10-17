# Web3MCP demo roadmap

This is the build order for the first complete demo. The current [design spec](superpowers/specs/2026-10-13-web3mcp-project-design.md) describes the boundaries. Detailed implementation plans belong under `docs/superpowers/plans/` when interfaces and tooling are selected.

## 1. Freeze protocol v0.1 (In review)

The account layout, JSON schema, version rules, supported input types, Anchor IDL 0.1.0 profile, and initial account/argument binding checks are implemented in `protocol/`. Local-validator publication and RPC discovery passed on 2026-10-17. More adversarial conformance vectors are still needed before freezing v0.1.

## 2. Publish from a reference program (In review)

Build a small Anchor SOL vault with `get_vault`, `initialize`, `deposit`, and `withdraw` capabilities. Add a program-owned config PDA and authorized publication instructions. Generate the config from the compiled IDL, publish it in bounded chunks, and verify its bytes and account owner on a local validator. No host code may import the generated IDL.

**Status:** An earlier reference vault is deployed on devnet at `GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv` with Config PDA `HfA1ExZS1cgYR5k5GEJmsQfyAcDK2J9NPi7p97dU3WLD`. A read-only RPC check on 2026-10-14 found an executable program and a published, program-owned config with four tools. That deployed version predates the authorization and read-binding corrections in this review. The updated program built and passed 18 local-validator integration tests on 2026-10-17, including config publication, RPC conformance, and vault operations. It has not been deployed to devnet.

## 3. Build the generic host core (Completed)

Given a program ID, verify the executable program and config PDA, parse the config, and dynamically register its tools for the LLM. Implement account reads, instruction encoding, supported account resolution, and strict input validation. Prove the host works from the published config alone.

**Status:** `@web3mcp/host` is implemented under `apps/host/`, with RPC discovery, validated tool export, account reads, instruction preparation, and simulation. The earlier Devnet reference config does not satisfy the current v0.1 validator, so its older host tests are an optional rehearsal until the corrected program and config are deployed. Current protocol interoperability is checked against a local validator.

## 4. Add the LLM and wallet flow (In review)

Choose one tool-calling model for the demo. Add a generic chat interface that exposes only validated on-chain tools to the model. For writes, construct and simulate the transaction, show the exact program, accounts, amount, fee, and uncertainty, then request explicit wallet approval of that exact message. Confirm the signature and report the chain result. Keep model credentials out of the browser bundle and repository.

**Status:** Model adapters, a terminal agent, and wallet approval are implemented. A provider-backed rehearsal against the current protocol remains pending.

## 5. Publish the explanation and demonstrate interoperability

Build a static documentation site from the whitepaper, protocol reference, publisher guide, and host guide. Run the full read → deposit → read → withdraw flow on a local validator, followed by a devnet rehearsal when deployment is authorized. Load a second small compatible program without changing host code to test the program-agnostic claim. Show one rejected unsafe or malformed tool call.

## Demo acceptance

- The host starts from only a program ID, RPC connection, model connection, and wallet.
- The target program has no required website, backend API, or MCP server.
- Read tools do not ask for a signature; write tools require review and wallet approval.
- The host rejects malformed config, mismatched program ownership, unsupported account rules, and altered transactions.
- A second compatible program is discovered without a host release.

SNS discovery, arbitrary third-party programs, swaps, MCP adapters, and mainnet are outside the first demo.
