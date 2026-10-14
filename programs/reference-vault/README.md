# Reference vault

This directory contains an Anchor SOL vault, a program-owned Web3MCP Config PDA, a manifest generator, and a chunked publisher. The updated publication authority and read-tool binding are under review and have not been deployed. Run the integration suite only against a fresh local validator; `npm test` runs offline checks. The generic host must discover capabilities from the deployed on-chain config and must not import this source or generated IDL.
