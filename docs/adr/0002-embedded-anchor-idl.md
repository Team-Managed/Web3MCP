# Embedded Anchor IDL in Config PDA

We decided to embed the Anchor IDL entries needed by published tools in the on-chain Config PDA JSON payload rather than point to an external URL, IPFS CID, or secondary IDL account. The reference generator prunes unrelated instructions and types to stay within the 64 KiB payload limit. Hosts fetch the executable program account and its canonical Config PDA through Solana RPC; they do not need a program-specific website or API to obtain the IDL.
