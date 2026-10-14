# Spec: Reference Program & Tool Publisher (reference-vault)

Status: implementation under review · Date: 2026-10-14

## Problem Statement

AI agent runtimes (Web3MCP hosts) require target Solana programs to self-publish verifiable tool declarations and IDLs on-chain in program-owned PDAs. Currently, the Web3MCP protocol v0.1 wire specification is frozen and validated in the abstract, but there is no deployed reference program demonstrating how a real Solana program publishes its tools, manages chunked upload lifecycles, and exposes valid instructions and account queries. Without a reference implementation, host implementers cannot test end-to-end against live on-chain accounts, and program authors lack a reference template for publishing Web3MCP tools.

## Solution

Build `reference-vault`, an Anchor-based SOL vault program that owns a canonical Web3MCP Config PDA at seeds `["web3mcp", "config"]`. The program implements core vault capabilities (`initialize`, `deposit`, `withdraw`, and state account `Vault`), provides an authorized chunked upload publication lifecycle (`initialize_config`, `write_config_chunk`, `finalize_config`), and provides an automated publication script that extracts the compiled Anchor IDL, generates a valid Web3MCP v0.1 JSON config, uploads it in bounded MTU-safe chunks, and finalizes it. Local-validator conformance and authorization tests must pass before updated code is published to devnet.

## User Stories

1. As a program publisher, I want my program to derive and own a canonical Config PDA at seeds `["web3mcp", "config"]`, so that agent hosts can deterministically discover tool definitions without off-chain directories.
2. As a program publisher, I want to initiate a tool configuration upload via `initialize_config`, so that the Config PDA is initialized with authority, expected length, and SHA-256 digest in status `1 (Uploading)`.
3. As a program publisher, I want to stream large JSON tool manifests in chunks (~800 bytes) via `write_config_chunk`, so that IDLs up to 64 KiB can be published despite Solana's 1,232-byte transaction MTU.
4. As a program publisher, I want `write_config_chunk` to dynamically reallocate account storage and fund rent from my authority wallet, so that I don't need manual multi-transaction pre-allocation loops.
5. As a program publisher, I want to finalize publication via `finalize_config`, verifying that the uploaded byte buffer matches `expected_len` and matches the SHA-256 `digest`, transitioning the status to `2 (Published)`.
6. As a program publisher, I want unauthorized wallets to be blocked from writing chunks or finalizing the config, so that only the designated authority can update tool declarations.
7. As a program publisher, I want to be able to re-initialize an existing Config PDA to publish updates, immediately setting status back to `1 (Uploading)` so agents fail closed until publication is finalized.
8. As a program publisher, I want an automated script to combine my compiled Anchor IDL with tool descriptors into a validated Web3MCP envelope, so that manual JSON assembly errors are avoided.
9. As a vault user, I want to initialize a dedicated vault PDA derived from `["vault", owner]`, so that my deposited SOL is segregated from other users.
10. As a vault user, I want to deposit SOL into my vault PDA, updating the on-chain vault balance.
11. As a vault user, I want to withdraw SOL from my vault PDA back to my wallet, ensuring the vault retains at least the rent-exempt minimum balance to prevent accidental account closing.
12. As a host implementer, I want to read the vault account state via an `accountRead` tool descriptor (`get_vault`), so that an agent can inspect user balances before suggesting actions.
13. As a host implementer, I want to execute vault actions via `instruction` tool descriptors (`deposit`, `withdraw`, `initialize`), so that an agent can construct and simulate wallet-approved transactions.
14. As a conformance tester, I want an integration test on a local validator / devnet to verify the deployed Config PDA against `@web3mcp/protocol`'s `validateConfigAccount`, ensuring strict protocol compliance.
15. As a protocol maintainer, I want the reference vault's source code and IDL to be strictly isolated within its program directory, so that the future Web3MCP host cannot accidentally import reference source files or violate decoupling boundaries (ADR 0007).

## Implementation Decisions

- **Program Architecture**: Anchor program (`reference_vault`) with two functional modules: vault operations (`initialize`, `deposit`, `withdraw`) and Web3MCP publication operations (`initialize_config`, `write_config_chunk`, `finalize_config`).
- **Config PDA Account Layout**: Exact 81-byte header followed by 4-byte LE length prefix and raw UTF-8 JSON payload:
  - Discriminator: 8 bytes (`sha256("account:Web3McpConfig")[0..8]` = `0x991dc793e1358b35`)
  - Authority: 32-byte `Pubkey`
  - Status: 1 byte (`0 = Uninitialized`, `1 = Uploading`, `2 = Published`)
  - Expected length: 4 bytes `u32` (little-endian)
  - Digest: 32 bytes `[u8; 32]` (SHA-256 of complete JSON payload)
  - Config payload: `Vec<u8>` (4-byte length prefix + UTF-8 payload)
- **Publication Lifecycle & Safety**:
  - `initialize_config` requires the upgradeable program's current upgrade authority to sign and sets the config authority to that same key. It resets status to `1 (Uploading)`, stores `expected_len` and `digest`, and truncates the config buffer. A pre-funded system-owned PDA is allocated and assigned before writing the header. After a program upgrade-authority rotation, the new authority may reinitialize and replace the stored config authority.
  - `write_config_chunk` verifies caller is both the stored config authority and the current program upgrade authority, verifies `status == 1` and `offset == current_len`, writes the slice, and reallocates account space with rent transfer from authority.
  - `finalize_config` verifies caller is both authorities, verifies `status == 1` and payload length equals `expected_len`, computes SHA-256 of payload via native `sol_sha256` syscall, asserts equality with `digest`, and sets status to `2 (Published)`.
- **Vault State & Safety**:
  - Vault PDA derived from seeds `[b"vault", owner.as_ref()]`.
  - Account struct: `Vault { owner: Pubkey, balance: u64, bump: u8 }`.
  - `withdraw` enforces that remaining lamports on the vault account meet the rent-exempt minimum (`minimum_balance(space)`), throwing a custom error if violated.
- **Publisher Tooling**:
  - Kept strictly in `programs/reference-vault/scripts/`.
  - Script loads compiled Anchor IDL, packages WebMCP tool descriptors for `get_vault`, `initialize`, `deposit`, and `withdraw`, validates the JSON envelope against `@web3mcp/protocol`, chunks the serialized JSON into ~800-byte pieces, and streams transactions to devnet.
- **Fail-Closed Guarantees**:
  - The Config PDA is unreadable / invalid to hosts while in status `1`.
  - Any hash or length mismatch during finalization rejects the transaction and prevents status `2`.

## Testing Decisions

- **Testing Principles**: Only test external on-chain behavior and RPC outputs. No tests should couple to private internal helper functions.
- **Primary Seam**: Local-validator integration test suites in `tests/`:
  1. Deploys `reference_vault` to a local validator using the program ID `GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv`.
  2. Tests vault user actions: `initialize`, `deposit`, `withdraw`, balance checks, rent-reserve enforcement.
  3. Tests publication lifecycle: unauthorized rejection, chunk upload, digest verification, finalization.
  4. Reads the Config PDA via standard RPC `getAccountInfo` and executes `@web3mcp/protocol`'s `validateConfig` to guarantee full protocol conformance.
  5. Enforces zero host imports of program source or static IDL files (ADR 0007).
- **Prior Art**: `@web3mcp/protocol` tests in `protocol/tests/` verifying schema and binary layout fixtures.

## Out of Scope

- Host runtime discovery or chat UI (Phase 3 and Phase 4).
- SNS or DNS-based program discovery (deferred beyond v0.1).
- Multi-token (SPL) vaults or token swaps (only native SOL for reference vault).
- Delegated agent key signing (wallet handoff only).

## Further Notes

- The reference vault program ID and artifacts remain strictly within `programs/reference-vault/` and `tests/`.
- The Web3MCP host must discover this program purely via its public key and RPC `getAccountInfo`.
