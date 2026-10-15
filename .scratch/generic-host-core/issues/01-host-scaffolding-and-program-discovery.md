# 01: Host Package Scaffolding & Live RPC Program Discovery

**What to build:** Given a live Solana connection and a target Program ID, the host validates that the program account is executable, derives the canonical Config PDA (`["web3mcp", "config"]`), queries the live on-chain account via RPC, validates binary layout and JSON schema using `@web3mcp/protocol`, verifies publication status (`Published`) and SHA-256 digest integrity, compiles dynamic Anchor Borsh coders from the on-chain IDL, and registers the discovered program and tools in memory.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Package `@web3mcp/host` is scaffolded as an independent npm workspace package under `apps/host/` with `@web3mcp/protocol` dependency.
- [ ] `Web3McpHost` class accepts a live `@solana/web3.js` `Connection` and configuration options.
- [ ] Calling `discover(programId)` fetches program account info on live RPC and throws typed `DiscoveryError` if the account does not exist or `executable !== true`.
- [ ] Canonical Config PDA address is derived deterministically from `["web3mcp", "config"]` seeds under the target program ID.
- [ ] Config account is retrieved via live RPC `getAccountInfo` and validated with `@web3mcp/protocol` (`parseConfigAccount` + `validateConfig`).
- [ ] Dynamic Anchor Borsh instruction coder and accounts coder are instantiated from the deserialized `config.idl` without static file imports.
- [ ] Discovery of the live Devnet Reference Vault (`GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv`) succeeds and logs zero protocol or digest errors.
- [ ] Fail-closed behavior is verified on live RPC when querying non-existent program IDs or uninitialized config accounts.
