# 03: Interactive Agent REPL, Slash Commands & Tool Loop

**What to build:** Build the deep `Web3McpAgent` class in `apps/host/src/agent.js` and the executable terminal REPL in `apps/host/bin/agent.js` (`web3mcp-agent` / `npm run host:agent`). The agent maintains multi-turn conversation context with grounding system prompt, routes read tools autonomously, intercepts write tools for human wallet review and approval, and implements built-in slash commands (`/tools`, `/balance`, `/clear`, `/help`, `/exit`).

**Blocked by:** 01: Multi-Provider LLM Engine, 02: Terminal Wallet Signer & Transaction Review Card

**Status:** ready-for-agent

- [ ] Implement `Web3McpAgent` class in `apps/host/src/agent.js` accepting `host`, `model`, `signer`, and optional `onApprovalRequest` callback hook.
- [ ] Ground the model with a system prompt specifying role, read-before-write requirement, tool boundary, and strict human review.
- [ ] Connect the native tool-calling loop: execute `executeRead` for `accountRead` tools and feed results back to the LLM; execute `prepareInstruction` for `instruction` tools and invoke `onApprovalRequest`.
- [ ] If user rejects transaction, feed structured refusal back to the model without throwing unhandled exceptions.
- [ ] Implement terminal REPL in `apps/host/bin/agent.js` with animated spinners, streaming stdout, prompt line, and slash commands (`/tools`, `/balance`, `/clear`, `/help`, `/exit`).
- [ ] Expose `"web3mcp-agent": "./bin/agent.js"` in `apps/host/package.json` and `"host:agent": "node apps/host/bin/agent.js"` in root `package.json`.
- [ ] Automated unit test suite in `apps/host/tests/agent.test.js` verifying system prompt grounding, slash command dispatch, tool payload formatting, and approval refusal routing without fake mock LLM scripts.
