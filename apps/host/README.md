# Web3MCP Compatible Host CLI

One Node.js agent chat application, using the public `@web3mcp/sdk` package for program discovery, reads, transaction preparation, and signed submission. It talks directly to Solana RPC; no MCP server or client is involved.

See the [Web3MCP protocol documentation](https://www.web3mcp.org/docs/latest).

From the repository root, build the SDK and host, then launch a terminal:

```sh
npm run test:sdk
npm --prefix apps/host run build
npm run host
```

The CLI opens in chat. Typing `/` shows available commands; the list narrows as you type. Tab completes the closest match, and Enter runs it. Press Enter after `/` to open the full command menu. Use `/model` to choose a provider, enter or reuse its masked API key, and select a model. The key is saved per provider in the operating system credential store and loaded on later launches. For a custom `OPENAI_BASE_URL`, `/model` uses a separate keychain entry for that endpoint, accepts a keyless endpoint, or reads `OPENAI_COMPAT_API_KEY`; it never forwards `OPENAI_API_KEY` to the custom endpoint. Provider, model, wallet path, and RPC URL are saved separately in `~/.config/web3mcp/settings.json` (or under `XDG_CONFIG_HOME`); that file never contains the API key. If the credential store is unavailable, the key works for the current session and the CLI tells you it was not saved. On Linux, persistent storage requires a Secret Service provider. The provider's list may include models that cannot call chat tools; the CLI reports that when you try one. Use `/model <id>` to set a model manually for the current provider. `/wallet` shows keypairs found in `~/.config/solana` and environment-selected locations; use Up/Down and Enter, or type another path. `/rpc` changes the Solana endpoint. Environment variables and CLI flags can prefill values. The default RPC is Devnet; without a wallet, reads remain available. `--help` and `--version` work without a terminal.

In chat, include a program ID with the request, such as “Read my vault using program ID `9zJzM4rHDPR4pd3vXHQjQ7whTVmx4zxB3ZH4Gb9iXRwD`.” The model receives a host discovery tool and calls it to validate the program config PDA; the published tools appear in its next turn. The host also provides a generic account resolver so the model can derive IDL-defined PDAs before calling read tools that need an account address. A `.sns` name can resolve to a program address through SNS on Mainnet before that validation. `SNS_RPC_URL` overrides the SNS lookup endpoint. Current SNS SDK support does not resolve `.sol` names. Use `/tools` to inspect discoveries, `/help` for commands, and `/exit` to leave. A write runs simulation and pauses until you press `s` to sign the displayed transaction with the selected keypair; Enter or `n` rejects.

The extracted SDK discovered five tools from the current Devnet reference program `9zJzM4rHDPR4pd3vXHQjQ7whTVmx4zxB3ZH4Gb9iXRwD`, including `get_vault_by_owner`, and read an existing vault from its owner's wallet address. The v0.2 local-validator suite passed 38 tests, including an SDK-backed signed write. OpenAI GPT-6 Luna and Sol function-tool calls currently use Chat Completions with `reasoning_effort: "none"`; using reasoning with tools will require a Responses API adapter. A live basic OpenAI chat retry succeeded; a full Devnet CLI read/write rehearsal remains pending.
