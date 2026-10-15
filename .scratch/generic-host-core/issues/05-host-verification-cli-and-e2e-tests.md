# 05: Host Verification CLI & End-to-End Devnet Verification

**What to build:** Provide a terminal command-line interface (`bin/inspect.js` and `npm run host:inspect`) enabling developers and agents to discover tools, execute account reads, and simulate instructions directly from the terminal without code, and a full end-to-end integration test suite verifying host operations against live Solana Devnet with zero mocks and zero static imports of the target program.

**Blocked by:** 02: Protocol-Strict Tool Descriptors & LLM Export, 03: Live Account Query & Dynamic Borsh Decoding, 04: Dynamic Account Resolution, Anchor Instruction Encoding & Live Simulation

**Status:** ready-for-agent

- [ ] CLI executable `bin/inspect.js` is added to `@web3mcp/host` and configured in `package.json` `bin` field (`web3mcp-host`).
- [ ] Root `package.json` exposes helper script `npm run host:inspect -- <programId>`.
- [ ] Running the CLI against the Devnet Reference Vault (`GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv`) prints discovered tools, executes `get_vault`, and simulates a `deposit` instruction.
- [ ] CLI formats output cleanly in JSON or human-readable summary, reporting compute units, simulation logs, and account privileges.
- [ ] Comprehensive test suite in `apps/host/tests/` verifies end-to-end discovery, `getTools()`, `executeRead()`, and `prepareInstruction()` against live Devnet RPC.
- [ ] All tests run without synthetic RPC mocks per ADR 0008.
- [ ] Conformance check verifies zero compile-time imports of `programs/reference-vault` or `target/idl/reference_vault.json` in `apps/host/` per ADR 0007.
