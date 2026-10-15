# 02: Protocol-Strict Tool Descriptors & LLM Export

**What to build:** An agent host or LLM integration can query discovered tools across one or all registered programs via `getTools(programId?)` and receive tool descriptors that strictly adhere 100% to the frozen `@web3mcp/protocol` JSON schema without omitted metadata or proprietary fields. The host also provides an LLM export adapter to convert descriptors directly into standard OpenAI/Anthropic tool formats.

**Blocked by:** 01: Host Package Scaffolding & Live RPC Program Discovery

**Status:** ready-for-agent

- [ ] `host.getTools(programId?)` returns an array of tool descriptors registered from on-chain discovery.
- [ ] Each returned tool descriptor includes `name`, `title`, `description`, `inputSchema`, `annotations`, and `solana` execution binding.
- [ ] Every returned tool descriptor validates 100% against `@web3mcp/protocol` JSON Schema (`config.schema.json`).
- [ ] Tool parameters in `inputSchema` strictly enforce scalar types (`u64`, `boolean`, `publicKey`) with `additionalProperties: false`.
- [ ] Multi-program registration is supported: tools from distinct program IDs can be retrieved together or filtered by `programId`.
- [ ] An export helper (e.g. `host.toOpenAiTools()`) converts protocol tool descriptors into the standard OpenAI function/tool calling format with JSON schema parameters.
- [ ] Verified against the live Devnet Reference Vault (`GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv`), confirming `get_vault`, `initialize`, `deposit`, and `withdraw` are registered with complete schemas.
