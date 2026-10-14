# 03: Config Generator and Tool Manifest Packaging

**What to build:** An automated manifest compilation script that combines the compiled Anchor IDL of `reference_vault` with Web3MCP v0.1 tool descriptors (`get_vault`, `initialize`, `deposit`, `withdraw`), producing a normative JSON configuration envelope that validates strictly against `@web3mcp/protocol` without schema violations.

**Blocked by:** 01: Anchor Program Scaffold and Native SOL Vault Operations

**Status:** ready-for-agent

- [ ] Generator script in `programs/reference-vault/scripts/generate-config.ts` loads the compiled Anchor IDL from `target/idl/reference_vault.json`.
- [ ] Defines Web3MCP tool descriptors:
  - `get_vault`: `kind: "accountRead"`, account `Vault`, input `vaultOwner: publicKey`.
  - `initialize`: `kind: "instruction"`, effects `stateChanging: true, financial: false`.
  - `deposit`: `kind: "instruction"`, input `amount: u64`, effects `stateChanging: true, financial: true`.
  - `withdraw`: `kind: "instruction"`, input `amount: u64`, effects `stateChanging: true, financial: true`.
- [ ] Assembles the root envelope with `standard: "web3mcp"`, `version: "0.1.0"`, target program ID, IDL, and tools array.
- [ ] Validates the assembled JSON configuration offline using `@web3mcp/protocol`'s `validateConfigJson`, ensuring 0 errors and zero extra/unsupported properties.
