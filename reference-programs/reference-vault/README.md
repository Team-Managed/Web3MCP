# Reference vault

This directory contains an Anchor SOL vault, a program-owned Web3MCP Config PDA, a manifest generator, and a chunked publisher. The current program is deployed on Devnet at `9zJzM4rHDPR4pd3vXHQjQ7whTVmx4zxB3ZH4Gb9iXRwD`, with config PDA `J8Ph37LoQsv4yED6USdupCooCZzsVMqJkgBTm9uSkvCw`. `npm test` runs offline checks. The generic host must discover capabilities from the deployed on-chain config and must not import this source or generated IDL.

For local integration, build with `anchor build`, then start a fresh local validator with the compiled program preloaded as upgradeable. Use a disposable wallet outside the repository as both the program upgrade authority and `ANCHOR_WALLET`. Fund it with local-validator SOL, then run `npm run test:integration` with `ANCHOR_PROVIDER_URL` set to that validator's RPC URL. The integration suite changes the Config PDA, so reset the ledger before rerunning it.
