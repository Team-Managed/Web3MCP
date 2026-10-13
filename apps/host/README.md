# Web3MCP host

This directory will contain the agent-facing host: a generic program-ID loader, on-chain config validator, LLM tool loop, Solana RPC executor, transaction review, and wallet handoff. It must not contain reference-vault-specific tool names, instruction layouts, or an imported vault IDL.

The host UI and model provider for the first demo have not been selected. Those choices do not change the on-chain protocol.
