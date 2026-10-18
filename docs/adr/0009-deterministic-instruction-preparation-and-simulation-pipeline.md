# Deterministic Instruction Preparation and Simulation Pipeline

We formalized a six-stage deterministic execution pipeline inside the Web3MCP host (`prepareInstruction`) that converts untrusted LLM tool calls into verified, simulated Solana instructions prior to wallet handoff. Rather than delegating transaction construction to the model or third-party adapters, the host enforces a strict, fail-closed pipeline: input validation, account resolution, IDL seed parsing, PDA derivation, Anchor Borsh encoding, and RPC transaction simulation.

## Pipeline Architecture

1. **Input Validation:**
   The host validates proposed tool arguments strictly against the tool's JSON `inputSchema` using `@web3mcp/protocol`. All inputs are restricted to the three frozen scalar types (`u64` decimal string, `boolean`, `publicKey` Base58 string) with `additionalProperties: false`. Any unexpected or malformed parameter halts execution immediately.

2. **Account Resolution:**
   The host iterates through the required instruction accounts declared in the on-chain IDL, binding public keys according to the tool descriptor's `solana.accounts` mapping:
   - `{"source": "signer"}`: Bound to the connected user wallet's public key (`isSigner: true`).
   - `{"source": "input", "input": "<name>"}`: Bound to the Base58 public key provided in validated arguments.
   - `{"source": "program", "address": "<pubkey>"}`: Bound to the static program address.
   - `{"source": "idl"}`: Delegated to the deterministic IDL seed parser.

3. **IDL Seed Parsing:**
   For accounts sourced from the IDL, the host extracts the `pda.seeds` specification from the embedded IDL instruction declaration and evaluates each seed sequentially:
   - `kind: "const"`: Converted directly from the IDL's byte array into a byte buffer.
   - `kind: "account"`: Resolves to the 32-byte public key buffer of an earlier resolved account (e.g. resolving `owner` before `vault`).
   - `kind: "arg"`: Resolves to the serialized byte representation of the corresponding input argument.

4. **Deterministic PDA Derivation:**
   The assembled byte buffers are passed to standard Solana PDA derivation (`PublicKey.findProgramAddressSync(seeds, programId)`). The derived public key is assigned to the account with `isSigner: false` and the mutability flag (`isWritable`) declared in the IDL.

5. **Anchor Borsh Instruction Encoding:**
   The host computes the 8-byte Anchor instruction discriminator (`sha256("global:<instruction_name>")[0..8]`) and serializes the validated argument values into binary Borsh format according to the exact field types and ordering defined in the IDL `args` schema. The discriminator and Borsh payload are concatenated to form the instruction `data` buffer.

6. **Live RPC Transaction Simulation:**
   The host constructs a complete `@solana/web3.js` `TransactionInstruction` (program ID, ordered `AccountMeta` array, and binary data buffer), compiles a transaction message with a recent blockhash, and submits it to Solana RPC via `simulateTransaction`. The simulation report (compute units consumed, return data, logs, and potential error codes) is combined with the declared publisher `effects` and returned to the caller.

This pipeline ensures that every instruction presented to the human wallet is mathematically deterministic, fully resolved without LLM hallucination, and pre-verified against the live Solana runtime.
