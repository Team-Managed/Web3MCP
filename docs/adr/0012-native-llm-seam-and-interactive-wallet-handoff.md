# Native LLM Seam and Interactive Wallet Handoff

**Package boundary update (2026-10-18):** The native model loop and human approval decision remain, while generic Solana operations now live in `@web3mcp/sdk` and the single `web3mcp` Host CLI owns the terminal UI. The package names and separate runtime assumptions below are historical.

## Context

Phase 4 of Web3MCP introduces conversational AI reasoning and wallet handoffs. An agent host requires:
1. An LLM interface to pass discovered tool descriptors, receive model reasoning, and parse tool-call proposals.
2. A wallet approval mechanism to securely sign and broadcast state-changing transactions.

We evaluated third-party agent frameworks (LangChain, LangGraph, Vercel AI SDK) versus a native deep module, and browser-extension wallet modals versus local CLI keypair approval.

## Decision

1. **Native Universal LLM Seam:**
   We reject heavy agent orchestration frameworks (LangChain, LangGraph, Vercel AI SDK) inside the host runtime core. Instead, `@web3mcp/host` implements a native, lightweight `LlmClient` interface wrapping the universal OpenAI Chat Completions wire protocol (supporting OpenAI, Google Gemini via its OpenAI-compatible endpoint, Groq, DeepSeek, Ollama, and vLLM) and Anthropic Claude Messages API.

2. **Direct JSON Schema Tool Binding:**
   The host passes Web3MCP tool descriptors directly as standard JSON Schema into the model API without converting them into intermediate Zod schemas or framework-specific tool classes.

3. **Interactive Terminal Wallet Handoff (Zero Autonomous Signing):**
   When an `instruction` tool is called, the host halts execution, simulates the transaction on Solana RPC, renders a high-contrast financial review card (displaying target program, accounts, simulated compute units, validator logs, and publisher effects), and requires explicit terminal confirmation (`[y/N]`) before signing with the local Solana keypair (`~/.config/solana/id.json`). If declined, a structured cancellation is fed back to the model without throwing unhandled exceptions. The LLM never holds or accesses private keys.

4. **Context Compaction for Solana Logs:**
   The human user sees complete simulation validator logs in the terminal review card, but the conversation history receives a compacted summary (`{ status, unitsConsumed, effects, accounts }`) to prevent context window pollution and optimize token economics.

5. **Explicit Model Selection (No Opinionated Defaults):**
   The host enforces explicit model specification by the caller (via `options.model`, `--model`, or `LLM_MODEL` / `<PROVIDER>_MODEL` environment variables). The host does not hardcode opinionated default models (e.g. outdated model IDs), preventing silent obsolescence and giving the developer and user total autonomy over model selection.

## Rationale

- **The Deletion Test (Deep Module Design):**
  The entire multi-turn tool calling and approval loop is approximately 70 lines of clean `async`/`await` code. Pulling in LangChain or LangGraph would inject over 120 MB of dependencies and dozens of wrapper types (`StateGraph`, `BaseMessage`, `Runnable`) to accomplish what standard JavaScript handles natively.
- **Zod vs. Raw JSON Schema Mismatch:**
  Frameworks like Vercel AI SDK expect static Zod schemas, creating friction with Web3MCP's dynamic, on-chain JSON Schemas fetched over RPC. Using the universal OpenAI/Anthropic tool specification accepts raw JSON Schema directly.
- **Inversion of Control for Ecosystem Interoperability:**
  Keeping `@web3mcp/host` lean allows any external developer to easily import Web3MCP tools (`host.toOpenAiTools()`) into their own LangGraph, AutoGen, or Vercel AI projects without suffering dependency conflicts or version lock-in.
- **Security Invariant:**
  Decoupling LLM reasoning from transaction signing enforces the fundamental security rule of Web3MCP: the model proposes parameters, the host validates and simulates, and only the human wallet signs.

## Consequences

- `@web3mcp/host` remains fast, dependency-lean, and embeddable anywhere (CLI, Discord/Telegram bots, server daemons, or desktop apps).
- Adding future model providers requires only an OpenAI-compatible endpoint or a small message adapter.
