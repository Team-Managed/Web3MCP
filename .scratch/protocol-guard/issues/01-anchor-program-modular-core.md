# 01: Modular Anchor Program Core & State Layout

**What to build:** A modular, compiling Anchor Solana program for `reference-protocol-guard` with isolated state, errors, and instruction modules that manages protocol risk parameters and emergency circuit-breaker state without holding any user funds, vaults, or escrows.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [x] Program is initialized under `reference-programs/reference-protocol-guard/` with a modular directory layout: `state/`, `instructions/`, and `errors.rs`.
- [x] Global state account `ProtocolGuard` is stored in a deterministic PDA `["protocol_guard"]` with fields: `authority`, `operator`, `operational_mode`, `is_paused`, `fee_basis_points`, `max_utilization_bps`, `epoch_volume_limit`, `current_epoch_volume`, `last_updated_at`, and `circuit_breaker_at`.
- [x] Config PDA lifecycle instructions are implemented: `initialize_config`, `write_config_chunk`, and `finalize_config` under `["web3mcp", "config"]`.
- [x] Operational instructions are implemented in separate modules: `initialize`, `trip_circuit_breaker`, `resume_protocol`, `update_risk_parameters`, and `set_operator`.
- [x] Strict authorization checks: `trip_circuit_breaker` requires either `operator` or `authority`; all other administrative operations require `authority`.
- [x] Bounds validation: fee basis points and utilization caps must not exceed 10,000 (100.00%).
- [x] Program compiles cleanly with `anchor build`, generating the IDL at `target/idl/reference_protocol_guard.json`.
