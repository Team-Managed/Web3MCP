# Spec: LLM and Wallet Flow (llm-wallet-flow)

Status: ready-for-agent · Date: 2026-10-16

## Problem Statement

The Web3MCP Host core engine can discover on-chain tools, query accounts via RPC, and prepare/simulate transaction instructions. However, end users and AI developers currently have no interactive conversational agent that ties these primitives together into an autonomous tool-calling loop with human-in-the-loop wallet approval. Without this layer, interacting with on-chain programs requires writing programmatic scripts, and AI agents cannot assist non-technical users in exploring programs, understanding state, and safely proposing state-changing transactions.

## Solution

Build the conversational agent runtime and interactive terminal application (`Web3McpAgent` and `web3mcp-agent` CLI).

The agent connects to a multi-provider LLM engine using a lightweight, universal OpenAI-compatible client (covering OpenAI, Groq, DeepSeek, and local Ollama/vLLM) plus an Anthropic Claude driver with native token streaming. It exposes discovered on-chain Web3MCP JSON Schema tools directly to the model with zero intermediate framework translations or Zod shims.

When the model suggests read tools (`accountRead`), the host executes them autonomously and returns decoded account data back into the reasoning loop.

When the model suggests state-changing transactions (`instruction`), the host constructs and simulates the instruction against live Solana Devnet RPC, presents an interactive terminal review card (displaying target program, accounts, simulated compute units, validator logs, and publisher effects), and requires explicit approval (`[y/N]`) before signing with the local Solana keypair (`~/.config/solana/id.json`).

The model never touches private keys, and refused transactions cleanly abort without throwing unhandled exceptions.

## User Stories

1. As a user, I want to launch an interactive AI agent by providing a Solana Program ID (`npm run host:agent -- <programId>`), so that I can explore and interact with any on-chain program using natural language.
2. As a user, I want the CLI to automatically detect my configured model provider (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, or local Ollama), so that I don't have to pass complex configuration flags on startup.
3. As a user, I want the CLI to automatically load my local Solana CLI keypair (`~/.config/solana/id.json`) or accept an override (`--keypair <path>`), so that I can use my existing devnet wallet.
4. As a user, I want the agent to stream its reasoning tokens smoothly to my terminal, so that I don't experience awkward freezes during long model turns.
5. As a user, I want subtle animated spinners during RPC calls and transaction simulations, so that I always know what the agent is currently doing.
6. As a user, I want to ask read-only questions (e.g. "What is my vault balance?"), and have the agent execute `get_vault` autonomously and explain the balance in clear, natural language.
7. As a user, I want the agent to call read tools first to verify balances before suggesting state-changing operations.
8. As a user, I want a high-contrast terminal review card whenever a transaction is proposed, displaying:
   - Target program and tool name,
   - Full account privilege breakdown (Signers, Writable, derived PDAs),
   - Simulation status, compute units consumed, and validator logs,
   - Declared publisher financial effects and summary,
   - Estimated network fee in lamports.
9. As a user, I want an explicit terminal prompt (`? Approve and broadcast transaction to Devnet? [y/N] › `), so that the agent never signs or broadcasts transactions without my explicit authorization.
10. As a user, I want the option to decline a transaction (`n` or Ctrl+C), and have the agent politely acknowledge the cancellation and continue the conversation without crashing.
11. As a user, I want a clickable Solana Explorer link upon transaction confirmation, so that I can independently verify the transaction on-chain.
12. As a user, I want built-in slash commands:
    - `/tools`: prints a formatted table of all discovered program tools,
    - `/balance`: checks wallet and vault SOL balances immediately,
    - `/clear`: clears the screen while keeping conversation context,
    - `/help`: prints available commands,
    - `/exit`: exits the agent session cleanly.
13. As an embedding developer, I want a deep programmatic class `Web3McpAgent` exported by `@web3mcp/host` with an `onApprovalRequest` callback, so that I can embed the Web3MCP agent into Telegram bots, Discord bots, or web interfaces.
14. As an embedding developer, I want simulation logs compacted before being sent to the LLM context, so that conversation token usage remains minimal and model reasoning stays sharp over long sessions.
15. As a project maintainer, I want zero mocks during live integration tests, running a complete rehearsal against the Reference Vault on Solana Devnet (`GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv`).

## Implementation Decisions

- **Universal OpenAI-Compatible & Anthropic Driver**: Implement a native, lightweight LLM driver module that leverages the universal OpenAI Chat Completions standard (OpenAI, Groq, DeepSeek, Ollama) and Anthropic Messages API. This consumes Web3MCP's native JSON Schema tools directly with zero schema translation layers, zero framework bloat, and sub-200ms token streaming.
- **Deep Module Architecture (`Web3McpAgent`)**: Encapsulate the complete conversational loop, prompt grounding, tool dispatching, and approval handoff behind `Web3McpAgent` in `apps/host/src/agent.js`, leaving `apps/host/bin/agent.js` as a lightweight terminal REPL wrapper (< 80 lines).
- **Interactive Review Card**: Use Unicode box-drawing characters and ANSI color formatting for high-contrast presentation of simulated transaction parameters, fees, and publisher effects.
- **Zero Autonomous Signing & Strict Wallet Handoff**: The LLM proposed parameters are validated, accounts are deterministically resolved by the host, simulated via RPC, and presented to the user. Signing occurs exclusively through the user-approved `Keypair` instance inside the host process.
- **Context Compaction for Solana Logs**: The user sees the full validator logs on the screen, but the LLM receives only a high-signal execution summary (`{ status: "success", unitsConsumed: 4563, effects }`) to prevent token bloat and context degradation.
- **Slash Commands**: Intercept input starting with `/` directly in the REPL loop without triggering unnecessary LLM API calls.

- **Programmatic Seam**: Test `Web3McpAgent` at the programmatic interface asserting on input validation, system prompt generation, slash command execution, tool payload formatting, and approval refusal routing without artificial mock LLM scripts.
- **Live Devnet Rehearsal**: Execute an end-to-end script against the deployed Reference Vault on Solana Devnet (`GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv`), validating read -> approved deposit -> confirmed explorer link -> rejected withdrawal.

## Out of Scope

- Browser Wallet Connect extension modals (e.g. Phantom popup in a browser tab; deferred to web applications).
- Mainnet deployments or real SOL custody.
- Multi-party computation (MPC) or custodial key management.
