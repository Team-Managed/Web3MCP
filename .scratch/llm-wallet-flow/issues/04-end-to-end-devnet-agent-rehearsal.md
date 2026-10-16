# 04: End-to-End Devnet Agent Rehearsal & Verification

**What to build:** Execute and verify a complete, multi-turn conversational agent rehearsal against the live Reference Vault on Solana Devnet (`GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv`). Verify the entire lifecycle: natural language balance check (`get_vault`), approved deposit (`deposit`), confirmed on-chain transaction hash and explorer URL, updated balance check, and cleanly rejected transaction without crashes.

**Blocked by:** 03: Interactive Agent REPL, Slash Commands & Tool Loop

**Status:** ready-for-agent

- [ ] Write integration test script `apps/host/tests/agent-devnet-e2e.test.js` exercising the complete conversational loop against the live Devnet Reference Vault.
- [ ] Turn 1 (Autonomous Read): User asks for vault balance -> Agent calls `get_vault`, receives on-chain balance, and explains it in plain English.
- [ ] Turn 2 (Approved Write): User asks to deposit SOL -> Agent calls `deposit`, triggers approval callback, signs with local keypair, broadcasts to Devnet, confirms on-chain, and provides Solana Explorer URL.
- [ ] Turn 3 (State Verification): User asks for updated balance -> Agent calls `get_vault` and verifies balance increased by deposit amount.
- [ ] Turn 4 (Rejected Write): User asks to withdraw SOL -> Agent calls `withdraw`, triggers approval callback, user declines (`approved: false`), agent acknowledges cancellation without error.
- [ ] Verify zero synthetic RPC mocks are used; all tests communicate with live Solana Devnet.
