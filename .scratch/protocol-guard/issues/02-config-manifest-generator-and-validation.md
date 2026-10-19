# 02: Config Manifest Generator & Schema Validation

**What to build:** An automated script that reads the compiled `reference_protocol_guard` Anchor IDL, constructs modular Web3MCP tool descriptors for the 5 tools, and validates the complete configuration against the official protocol JSON schema.

**Blocked by:** 01: Modular Anchor Program Core & State Layout

**Status:** ready-for-agent

- [x] `scripts/generate-config.js` is created under `reference-programs/reference-protocol-guard/scripts/`.
- [x] Advertises `get_protocol_status` as an `accountRead` tool reading the `ProtocolGuard` PDA.
- [x] Advertises `trip_circuit_breaker` as an `instruction` tool declaring `stateChanging: true, financial: false`.
- [x] Advertises `resume_protocol` as an `instruction` tool declaring `stateChanging: true, financial: false`.
- [x] Advertises `update_risk_parameters` as an `instruction` tool taking scalar decimal string arguments `fee_basis_points`, `max_utilization_bps`, and `epoch_volume_limit`.
- [x] Advertises `set_operator` as an `instruction` tool taking scalar public key argument `new_operator`.
- [x] Tool descriptions provide clear, unambiguous operational context for LLM agents.
- [x] Generated JSON payload strictly passes `validateConfig` against `protocol/schema/config.schema.json`.
- [x] A dedicated offline unit test verifies config generation and schema conformance without requiring a live validator.
