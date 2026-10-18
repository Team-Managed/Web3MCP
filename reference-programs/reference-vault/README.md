# Reference vault

This directory contains an Anchor SOL vault, a program-owned Web3MCP Config PDA, a manifest generator, and a chunked publisher. The current program is deployed on Devnet at `9zJzM4rHDPR4pd3vXHQjQ7whTVmx4zxB3ZH4Gb9iXRwD`, with config PDA `J8Ph37LoQsv4yED6USdupCooCZzsVMqJkgBTm9uSkvCw`. `npm test` runs offline checks. The generic host must discover capabilities from the deployed on-chain config and must not import this source or generated IDL.

The generated v0.2 config advertises `get_vault_by_owner(ownerAddress)` to derive and read a vault PDA from the owner's wallet public key. `get_vault(vaultAddress)` remains available for an exact vault PDA. `initialize`, `deposit`, and `withdraw` still use the owner wallet as signer. This adds a read tool to the config; the program binary and account layout do not change.

For local integration, use a disposable wallet outside the repository and run `ANCHOR_WALLET=/path/to/wallet.json anchor test --provider.wallet /path/to/wallet.json`. Anchor builds the SDK and host, starts a local validator, loads the program as upgradeable with that wallet as authority, and runs the 38 integration tests. The suite changes the Config PDA, so use a fresh ledger on each run.
