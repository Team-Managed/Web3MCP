# 02: Terminal Wallet Signer & Transaction Review Card

**What to build:** Implement local keypair loading, transaction assembly, broadcast, and confirmation in `@web3mcp/host`, combined with an interactive terminal review card formatted with Unicode box-drawing characters and ANSI styling. Whenever a state-changing instruction is prepared, render the complete privilege breakdown, simulation units, logs, fee, and effects, and require explicit human approval (`[y/N]`) before signing.

**Blocked by:** none

**Status:** complete

- [x] Implement `loadKeypair(customPath?)` in `apps/host/src/wallet.js` that checks `--keypair <path>`, falls back to `~/.config/solana/id.json`, and returns actionable guidance if no wallet exists.
- [x] Implement `formatReviewCard({ tool, programId, instruction, simulation, effects, accounts, fee })` rendering a high-contrast terminal review box.
- [x] Implement interactive terminal approval prompt with readline/inquirer: returns `true` on `y`/`yes`, and `false` on `n`/rejection or Ctrl+C.
- [x] Implement `signAndBroadcastTransaction({ connection, instruction, signer, commitment })` that signs with the local keypair, broadcasts the transaction to Solana Devnet, awaits `confirmed` commitment, and returns the signature and explorer URL.
- [x] Unit test in `apps/host/tests/wallet.test.js` verifying keypair loading, review card generation, approval rejection handling, and transaction signing.
