# 02: Config PDA Layout and Authorized Chunked Upload Instructions

**What to build:** Program-owned Config PDA storage and multi-instruction publication lifecycle (`initialize_config`, `write_config_chunk`, and `finalize_config`) derived from canonical seeds `["web3mcp", "config"]`. Program publishers can stream tool configurations of up to 64 KiB across multiple transactions, funding rent via dynamic reallocation, and finalize the upload with on-chain SHA-256 digest validation.

**Blocked by:** 01: Anchor Program Scaffold and Native SOL Vault Operations

**Status:** ready-for-agent

- [ ] Config PDA account struct defined matching SPEC §2.2 layout: discriminator `0x991dc793e1358b35`, `authority: Pubkey`, `status: u8`, `expected_len: u32`, `digest: [u8; 32]`, `config: Vec<u8>`.
- [ ] `initialize_config(authority: Pubkey, expected_len: u32, digest: [u8; 32])` initializes or resets the Config PDA to `status = 1 (Uploading)`, setting authority, expected length, and digest.
- [ ] `write_config_chunk(offset: u32, chunk: Vec<u8>)` validates authority signature, verifies `status == 1`, verifies `offset == current_len`, writes chunk, and dynamically reallocates account space.
- [ ] `finalize_config()` validates authority signature, verifies `status == 1`, verifies payload length equals `expected_len`, computes SHA-256 digest of payload, asserts equality with `digest`, and transitions status to `2 (Published)`.
- [ ] Unauthorized signers or corrupted digest uploads fail closed and cannot reach status `2`.
- [ ] Integration test verifies the complete upload lifecycle and fail-closed security properties against a local validator.
