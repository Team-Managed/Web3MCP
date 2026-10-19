# Status: ready-for-agent

# Specification: Protocol Risk & Circuit-Breaker Guard Reference Program (`reference-protocol-guard`)

## Problem Statement

Users and developers evaluating Web3MCP need proof that the protocol generalizes beyond the single existing sample program (`reference-vault`). Currently, the repository features only an Anchor SOL vault holding deposited funds, leaving an open question of whether non-custodial administrative, operational, and risk-management programs can be discovered, audited, and executed purely via on-chain Config PDAs. Furthermore, operators managing protocols on Solana lack safe, natural-language tooling to monitor health metrics and execute emergency circuit breakers without risking blind-signing or manual JSON-RPC errors.

## Solution

Deploy a second reference program, **Protocol Risk & Circuit-Breaker Guard (`reference-protocol-guard`)**, to Solana Devnet and publish its Web3MCP tools directly on-chain:
- A non-custodial Anchor Solana program managing global risk parameters (fee basis points, utilization limits, volume caps) and an emergency circuit breaker with zero vault or escrow custody.
- Publishes a Web3MCP v0.1/v0.2 Config PDA under canonical seeds `["web3mcp", "config"]` advertising 5 tools: `get_protocol_status` (read), `trip_circuit_breaker` (write), `resume_protocol` (write), `update_risk_parameters` (write), and `set_operator` (write).
- Deployed to Solana Devnet, published on-chain, and linked to the canonical SNS name `guard.sns` in the Host CLI resolver suite.
- Conforms strictly to Web3MCP boundaries: neither `@web3mcp/sdk` nor `apps/host` import the program's source or generated IDL.

---

## User Stories

1. As a protocol risk engineer, I want to query protocol health via natural language using `guard.sns`, so that I can inspect operational parameters without decoding raw binary accounts in block explorers.
2. As a protocol risk engineer, I want to read the current fee basis points, utilization cap, and volume limits in one tool call, so that I have immediate context on current operational risk.
3. As a protocol operator, I want to trigger an emergency circuit breaker via natural language, so that I can freeze protocol operations immediately during an active exploit or oracle failure.
4. As a protocol administrator, I want to resume normal protocol operations after an incident is resolved, so that user transactions can proceed safely.
5. As a protocol administrator, I want to update fee tiers and volume ceilings through a validated tool, so that the protocol can adapt to shifting market volatility.
6. As a protocol administrator, I want to delegate a hot operator key for automated circuit breaking, so that automated monitoring bots or agent hosts can trip the breaker without holding master admin authority.
7. As an agent host developer, I want the protocol guard to publish its tool descriptors in its canonical Config PDA `["web3mcp", "config"]`, so that generic Web3MCP hosts can discover it without custom MCP servers.
8. As a protocol publisher, I want an automated `generate-config.js` script, so that the Web3MCP manifest and embedded Anchor IDL match the compiled program binary exactly.
9. As a protocol publisher, I want a chunked `publish.js` script, so that configs exceeding transaction limits can be uploaded reliably to the on-chain Config PDA.
10. As a Web3MCP host user, I want the Host CLI to resolve `guard.sns` to the deployed program ID before discovery, so that I can interact with the program using an intuitive name.
11. As a wallet owner, I want the Host CLI to simulate all parameter updates and display exact diffs before signing, so that I never blind-sign an administrative mistake.
12. As a security auditor, I want unauthorized wallets to be rejected when attempting to update parameters or resume the protocol, so that administrative invariants are cryptographically enforced on-chain.
13. As an SDK consumer, I want `@web3mcp/sdk` to discover and execute `reference-protocol-guard` without any code changes or program imports, proving that the SDK is truly generic.
14. As a test engineer, I want offline conformance fixtures for the protocol guard config, so that protocol compliance can be verified in CI without requiring an active Solana RPC validator.
15. As a developer, I want an end-to-end integration test running against the protocol guard, so that regressions in PDA derivation, simulation, or transaction execution are caught automatically.
16. As a protocol operator, I want parameter validation on fees (max 10,000 bps) and utilization (max 10,000 bps) to be enforced on-chain, so that impossible configurations are rejected fail-closed.
17. As an on-call engineer, I want circuit breaker actions to be parameterless and fast, so that emergency halts can be broadcast with minimum latency.
18. As a compliance auditor, I want the protocol state account to track the timestamp of the last parameter modification, so that operational changes are chronologically verifiable.
19. As a security reviewer, I want the circuit breaker timestamp to be recorded on-chain when triggered, so that post-mortem incident reports can correlate the exact halt slot and time.
20. As a generic agent host, I want all tool descriptions to provide clear operational context to the LLM, so that the model suggests correct arguments without inventing unsupported fields.

---

## Implementation Decisions

### 1. Workspace Organization & Seams
- The program lives strictly inside the Anchor workspace under the reference programs directory (`reference-programs/reference-protocol-guard/`).
- The program contains its own manifest generator (`scripts/generate-config.js`) and chunked publisher (`scripts/publish.js`).
- Neither the generic SDK package (`@web3mcp/sdk`) nor the example host application (`apps/host`) will import source code, generated types, or IDLs from `reference-protocol-guard`.
- A dedicated end-to-end test will be added to the top-level test suite, exercising discovery and simulation purely through Solana RPC.

### 2. On-Chain Account & State Architecture
- Global state is stored in a deterministic PDA derived from seeds `["protocol_guard"]` owned by the program.
- Config PDA is stored under canonical seeds `["web3mcp", "config"]` owned by the program, matching the Web3MCP protocol standard.
- The state account stores:
  - `authority`: Master administrator public key.
  - `operator`: Delegated risk manager / monitoring agent public key.
  - `operational_mode`: Numeric status (0 = Normal, 1 = Caution, 2 = Emergency Paused).
  - `is_paused`: Boolean circuit-breaker flag.
  - `fee_basis_points`: Scalar integer (u64) representing protocol fee rate in basis points.
  - `max_utilization_bps`: Scalar integer (u64) representing utilization ceiling in basis points.
  - `epoch_volume_limit`: Scalar integer (u64) volume threshold in lamports.
  - `current_epoch_volume`: Scalar integer (u64) volume consumed in lamports.
  - `last_updated_at`: Unix timestamp of last parameter edit.
  - `circuit_breaker_at`: Unix timestamp of emergency halt.

### 3. Web3MCP Tool Catalog
- `get_protocol_status` (`accountRead` tool): Reads and decodes the global protocol state PDA via standard RPC. Read-only hint set to true.
- `trip_circuit_breaker` (`instruction` tool): Signer may be either `operator` or `authority`. Immediately flips `is_paused = true` and `operational_mode = 2`. Declares `stateChanging: true, financial: false`.
- `resume_protocol` (`instruction` tool): Signer must be `authority`. Flips `is_paused = false` and `operational_mode = 0`. Declares `stateChanging: true, financial: false`.
- `update_risk_parameters` (`instruction` tool): Signer must be `authority`. Takes scalar arguments `fee_basis_points` (u64), `max_utilization_bps` (u64), and `epoch_volume_limit` (u64). Declares `stateChanging: true, financial: false`.
- `set_operator` (`instruction` tool): Signer must be `authority`. Takes scalar argument `new_operator` (publicKey). Declares `stateChanging: true, financial: false`.

### 4. SNS Resolution Wiring
- In `apps/host`, wire `guard.sns` into the resolution map pointing to the deployed `reference-protocol-guard` Program ID.
- Enable chat commands such as `"Check protocol status on guard.sns"` or `"Trip the circuit breaker on guard.sns"` to resolve through the Host CLI's existing program reference resolver.

---

## Testing Decisions

### What Makes a Good Test
- Tests must assert observable external behavior through the highest available seams (RPC discovery, simulated instruction effects, and permission checks).
- Tests must never assert private internal state or import Anchor IDL types into generic host suites.
- Tests should survive internal refactoring of instruction handlers as long as external interfaces and published tools remain valid.

### Tested Modules & Seams
1. **Generic Host & Discovery Seam**:
   - Discovers tools from the on-chain Config PDA using `@web3mcp/sdk` (`discover`, `getTools`).
   - Executes read tools via RPC using `sdk.executeRead('get_protocol_status')`.
   - Prepares and simulates administrative instructions using `sdk.prepareInstruction` (`update_risk_parameters`, `trip_circuit_breaker`, `resume_protocol`, `set_operator`).
   - Submits confirmed signed transactions via `sdk.submitSignedTransaction`.
   - Asserts fail-closed behavior when an unauthorized wallet attempts administrative actions.
   - Enforces zero imports of program source, types, or compiled IDL.
2. **SNS Name Resolution Seam**:
   - Verifies `extractProgramReference` and `resolveProgramReference` correctly extract and resolve `guard.sns`.
3. **Offline Config Validation Seam**:
   - Verifies `generate-config.js` outputs a valid Web3MCP schema payload accepted by `validateConfig`.

### Prior Art
- `tests/reference-vault.test.js`: Discovers tools from on-chain config and executes simulated calls.
- `apps/host/tests/program-ref.test.js`: Tests SNS domain resolution and executable checks.
- `tests/generate-config.test.js`: Validates generated JSON configs against protocol schema.

---

## Out of Scope

- Multi-instruction composite transactions (deferred beyond protocol v0.1).
- Freeform string arguments in tool inputs (deferred beyond protocol v0.1).
- Mainnet SOL payments for commercial `.sns` domain registration (uses devnet/mock resolver).
- Third-party oracle feeds (Pyth/Switchboard) integration.


---

## Further Notes

- Maintains exact alignment with `GLOSSARY.md` (Config PDA, publication status, fail-closed, wallet handoff, tool descriptor).
- Keeps the project strictly focused on one CLI command: `web3mcp`.
