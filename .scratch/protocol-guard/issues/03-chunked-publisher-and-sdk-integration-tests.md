# 03: Chunked Config PDA Publisher & Generic SDK Integration Tests

**What to build:** An on-chain chunked publisher script for `reference-protocol-guard` and a generic end-to-end integration test demonstrating that `@web3mcp/sdk` discovers and interacts with the program over Solana RPC with zero code imports of the program source.

**Blocked by:** 02: Config Manifest Generator & Schema Validation

**Status:** completed

- [x] `scripts/publish.js` is created under `reference-programs/reference-protocol-guard/scripts/` to upload configs in chunked transactions to the on-chain Config PDA `["web3mcp", "config"]` and finalize them to `status = Published`.
- [x] Top-level integration test `tests/protocol-guard.test.js` is implemented using `@web3mcp/sdk`.
- [x] Integration test verifies `sdk.discover(programId)` and `sdk.getTools(programId)` successfully discover all 5 published tools using only the target Program ID.
- [x] Integration test verifies `sdk.executeRead('get_protocol_status', {}, { programId })` correctly decodes on-chain risk state via standard RPC.
- [x] Integration test verifies `sdk.prepareInstruction('update_risk_parameters', ...)` and `sdk.prepareInstruction('trip_circuit_breaker', ...)` run transaction simulation and produce signable transactions.
- [x] Integration test verifies `sdk.submitSignedTransaction(...)` confirms state transitions on-chain.
- [x] Integration test verifies fail-closed security when unauthorized signers attempt administrative writes.
- [x] Neither the test runner nor `@web3mcp/sdk` imports Rust source, types, or compiled IDL from the program.
- [x] Test runs cleanly alongside existing tests in `npm test`.
