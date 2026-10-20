# Account Query and Discriminator-Verified RPC Reads

## Decision

An `accountRead` tool fetches an account through Solana RPC. It does not create a transaction or require a wallet signature. The tool's published binding supplies an input address, signer address, fixed program address, or, in v0.2, a PDA derived from declared constant and public-key input seeds.

The SDK validates the tool arguments, resolves one address, and calls `getAccountInfo` at the configured commitment. A missing account returns `exists: false`. For an existing account, the SDK requires the account owner to equal the discovered program ID, compares the first eight data bytes with the published IDL discriminator, then decodes with an IDL-derived Anchor account coder. The published config and decoded data remain untrusted input.

## Scope and consequences

- Point reads need no program-specific indexer or read instruction. RPC access and an address or supported PDA rule are still required.
- The protocol cannot express arbitrary searches or historical queries through this account-read profile.
- Ownership and discriminator checks catch mismatched accounts; they do not prove the program's behavior or a publisher's claims.
- Results reflect the selected RPC commitment and may change after the read. The host must not present them as a permanent or instantaneous guarantee.
