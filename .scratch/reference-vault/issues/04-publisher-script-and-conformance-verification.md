# 04: Publisher Script and On-Chain Conformance Verification

**What to build:** An end-to-end publisher script and local validator test runner that deploys `reference_vault`, publishes the generated Web3MCP tool config to the on-chain Config PDA via chunked transactions, and queries the deployed PDA via standard Solana RPC `getAccountInfo` to verify that the live on-chain account data passes 100% of `@web3mcp/protocol` conformance validations.

**Blocked by:** 02: Config PDA Layout and Authorized Chunked Upload Instructions, 03: Config Generator and Tool Manifest Packaging

**Status:** ready-for-agent

- [ ] Publisher script in `programs/reference-vault/scripts/publish.ts` computes SHA-256 digest of config JSON, calls `initialize_config`, splits payload into MTU-safe chunks (~800 bytes), streams `write_config_chunk` transactions, and calls `finalize_config`.
- [ ] Test command `npm run test:vault` configured in root `package.json`.
- [ ] End-to-end integration test runs against a local validator:
  - Builds and deploys `reference_vault`.
  - Executes vault operations (initialize, deposit, withdraw, balance read).
  - Publishes the config PDA in chunks and finalizes it.
  - Queries `getAccountInfo` for canonical Config PDA `["web3mcp", "config"]`.
  - Passes raw account bytes directly into `@web3mcp/protocol`'s `validateConfigAccount`.
  - Asserts status is `2 (Published)`, owner is the program ID, and 0 validation errors occur.
- [ ] Preserves host boundary: verifies no host modules exist that import `programs/reference-vault`.
