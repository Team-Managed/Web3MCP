# Embedded Anchor IDL in Config PDA

We decided to embed the complete compiled Anchor IDL directly inside the on-chain Config PDA JSON payload rather than pointing to an external URL, IPFS CID, or secondary IDL account. This ensures that agent hosts can discover, register, and validate tools via a single Solana RPC `getAccountInfo` call with zero external web server, IPFS, or DNS dependencies.
