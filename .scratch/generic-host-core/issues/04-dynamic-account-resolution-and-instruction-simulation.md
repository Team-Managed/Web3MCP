# 04: Dynamic Account Resolution, Anchor Instruction Encoding & Live Simulation

**What to build:** An agent host can prepare any discovered `instruction` tool for wallet handoff via `prepareInstruction(toolName, args, { signer, ...options })`. The host strictly validates arguments, dynamically resolves all required accounts (`signer`, `input`, `program`, and IDL PDA seeds `const`/`account`/`arg`), serializes Anchor instruction data via runtime Borsh coder, constructs a `@solana/web3.js` `TransactionInstruction`, simulates transaction execution against live Solana Devnet RPC, and returns the constructed instruction, RPC simulation results, and declared effects summary.

**Blocked by:** 01: Host Package Scaffolding & Live RPC Program Discovery

**Status:** done

- [x] `host.prepareInstruction(toolName, args, { signer })` strictly validates arguments against the tool's scalar `inputSchema` (`u64`, `boolean`, `publicKey`).
- [x] Accounts declared with `source: "signer"` resolve to the caller-supplied `signer` public key with `isSigner: true`.
- [x] Accounts declared with `source: "input"` resolve to the public key specified in the corresponding validated argument.
- [x] Accounts declared with `source: "program"` resolve to the fixed declared program public key.
- [x] Accounts declared with `source: "idl"` dynamically derive PDAs according to IDL seeds: `const` byte vectors, `account` references to other resolved accounts (e.g. `owner`), and `arg` references (ADR 0008).
- [x] Account writable flags (`isMut` / `isWritable`) match the IDL instruction account declarations.
- [x] Instruction data is encoded into Anchor binary layout (8-byte instruction discriminator + Borsh serialized args) using the dynamic runtime coder (ADR 0009).
- [x] The constructed `TransactionInstruction` is packaged into a transaction and simulated via live RPC (`connection.simulateTransaction`) per ADR 0009.
- [x] The method returns an object containing: `instruction` (the raw `@solana/web3.js` instruction), `simulation` (status, compute units consumed, logs, error details), and `effects` (declared publisher effects, accounts touched).
- [x] Verified end-to-end against the live Devnet Reference Vault (`GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv`), successfully preparing and simulating a `deposit` instruction with live validator logs.
- [x] Fail-closed behavior is verified on invalid argument types or unresolvable PDA seeds.
