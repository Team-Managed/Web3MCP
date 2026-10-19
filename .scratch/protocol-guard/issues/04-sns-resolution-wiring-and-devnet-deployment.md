# 04: Host CLI Program Discovery & Devnet Deployment

**What to build:** Deploy `reference-protocol-guard` program binary and publish its Config PDA to Solana Devnet, and verify conversational interaction and tool discovery in the Host CLI using the real deployed Program ID.

**Blocked by:** 03: Chunked Config PDA Publisher & Generic SDK Integration Tests

**Status:** completed

- [x] Program is built and deployed to Solana Devnet using the funded keypair (`CniPSdkAUaNTfZZUSKvAKU2VJuWecRjqvGhDmQjGSZEG`).
- [x] Config PDA is published and confirmed in `Published` state on Devnet.
- [x] Program ID and Config PDA addresses are recorded in `Anchor.toml` and `reference-programs/reference-protocol-guard/README.md`.
- [x] Host CLI interaction verified: entering natural-language commands referencing the Program ID loads discovered tools and simulates transactions.
- [x] All CI and repository tests pass cleanly (`npm test`).
