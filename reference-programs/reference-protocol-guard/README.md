# Reference protocol guard

This directory contains an Anchor Protocol Risk & Circuit-Breaker Guard, a program-owned Web3MCP Config PDA, a manifest generator, and a chunked publisher.

## Program Overview

`reference_protocol_guard` provides non-custodial administrative controls, risk parameters, and an emergency circuit breaker for Solana protocols without holding any user funds, vaults, or escrows.

### Tools Advertised to Web3MCP Hosts

- **`get_protocol_status`** (`accountRead`): Reads the global protocol state PDA (`["protocol_guard"]`), decoding authority, operator, fee basis points, utilization cap, volume usage, and pause status.
- **`trip_circuit_breaker`** (`instruction`): Emergency freeze callable by either the master authority or delegated operator. Flips `is_paused = true` and `operational_mode = 2`.
- **`resume_protocol`** (`instruction`): Restores normal operations after an emergency. Callable by authority only.
- **`update_risk_parameters`** (`instruction`): Tunes fee rates (bps), utilization ceilings (bps), and epoch volume limits. Callable by authority only.
- **`set_operator`** (`instruction`): Rotates or sets the delegated monitoring agent / hot operator key. Callable by authority only.

### Solana Devnet Deployment

- **Program ID**: `BDwiU9GGqf7zxNNxD3QxyZ4PzKBWr8QMfUeYknbsXzFA`
- **Config PDA (`["web3mcp", "config"]`)**: `FnN43zVgGkqKWbs5D83AEs4cTrKfjrmodafTB7J69vB4` (Status: `Published`)
- **State PDA (`["protocol_guard"]`)**: `EWXdUTZGa1uQ1g1aLPeJv3J6oKFTSNgvJpueZ1fnN2dB`

### Architectural Boundaries

The generic host discovers capabilities from the deployed on-chain Config PDA derived from `["web3mcp", "config"]` and must not import this program's source or generated IDL.
