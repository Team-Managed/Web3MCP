# Reference vault

This directory contains an Anchor SOL vault, a program-owned Web3MCP Config PDA, a manifest generator, and a chunked publisher. The updated publication authority and read-tool binding are under review and have not been deployed to devnet. `npm test` runs offline checks. The generic host must discover capabilities from the deployed on-chain config and must not import this source or generated IDL.

For local integration, build with `anchor build`, then start a fresh local validator with the compiled program preloaded as upgradeable. Use a disposable wallet outside the repository as both the program upgrade authority and `ANCHOR_WALLET`. Fund it with local-validator SOL, then run `npm run test:integration` with `ANCHOR_PROVIDER_URL` set to that validator's RPC URL. The integration suite changes the Config PDA, so reset the ledger before rerunning it.
