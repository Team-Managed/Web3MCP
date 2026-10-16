# 03: Live Account Query & Dynamic Borsh Decoding

**What to build:** An agent host can query on-chain account state for any discovered `accountRead` tool via `executeRead(toolName, args, options?)`. The host validates the arguments against `inputSchema`, resolves the target query account address (from `source: "input"` or `source: "idl"`), queries the account via live Solana RPC `getAccountInfo`, verifies account ownership matches the program ID, validates the 8-byte Anchor discriminator against the on-chain IDL, and decodes the Borsh payload into a clean JavaScript/JSON object.

**Blocked by:** 01: Host Package Scaffolding & Live RPC Program Discovery

**Status:** done

- [x] `host.executeRead(toolName, args, options?)` validates input arguments against the tool's declared `inputSchema`.
- [x] Query account address is resolved directly without indexers from input properties (`source: "input"`) or deterministically derived PDA seeds (`source: "idl"`) per ADR 0010.
- [x] Raw account data is fetched via live Solana RPC `getAccountInfo` with confirmed commitment.
- [x] Returns explicit typed `null` result when an account does not exist on-chain without throwing unexpected exceptions (ADR 0010).
- [x] Host checks that `accountInfo.owner.toBase58() === programId`; throws `AccountSecurityError` if mismatched (ADR 0010).
- [x] 8-byte discriminator is compared against the target account struct in the embedded IDL; throws `AccountDiscriminatorMismatchError` if invalid (ADR 0010).
- [x] Account data payload is decoded using the dynamic Anchor accounts coder compiled from the on-chain IDL.
- [x] Scalar types (such as `u64` balances and `PublicKey` addresses) are formatted into clean JSON-serializable structures.
- [x] Verified end-to-end against the live Devnet Reference Vault (`GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv`), querying `get_vault` for an active vault owner on Devnet and retrieving genuine on-chain balance state.
- [x] Fail-closed behavior is verified when querying an account with an invalid owner or mismatched discriminator.
