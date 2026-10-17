# Web3MCP

Protocol and runtime enabling generic AI agent hosts to discover and execute Solana program tools directly from on-chain program accounts.

## Core Language

**Config PDA**:
The program-derived address owned by the target Solana program (canonical seeds `["web3mcp", "config"]`) holding publication metadata, embedded Anchor IDL, and tool declarations.
_Avoid_: Metadata account, Tool account, Manifest PDA

**Publication Status**:
The lifecycle state of the on-chain Config PDA: `0 = Uninitialized`, `1 = Uploading`, `2 = Published`. Agents and hosts must only consume configs in the `Published` state.
_Avoid_: Active/Inactive, Ready, Deployed

**Fail-Closed**:
The mandatory security posture where the host halts execution and rejects any configuration or tool call with unknown fields, unsupported versions, ambiguous bindings, or unverifiable signatures.
_Avoid_: Best-effort fallback, Lenient parsing

**Web3MCP Host**:
The agent runtime that discovers on-chain tools via RPC, presents validated schemas to an LLM, simulates transactions, and handles wallet approval.
_Avoid_: MCP Client, MCP Server, Agent Frontend

**Tool Descriptor**:
A serializable declaration defining a tool's name, description, parameters schema, and Solana execution binding.
_Avoid_: Tool Definition, Plugin, Function

**accountRead**:
A query tool binding that reads, checks ownership/discriminator, and decodes an on-chain account through RPC.
_Avoid_: View function, Read call, Query

**instruction**:
A state-changing tool binding that resolves accounts, serializes instruction data, and requires transaction simulation and wallet signing.
_Avoid_: Write call, Transaction tool, Action

**Wallet Handoff**:
The mandatory boundary where the host presents simulated transaction effects, signers, writable accounts, and fees to the user wallet for approval. The LLM never signs.
_Avoid_: Auto-sign, Agent signing, Delegation

**Account Resolution**:
The deterministic mechanism by which the Web3MCP Host resolves account public keys required for instruction execution or queries using declared sources (`signer`, `input`, `program`, `idl`).
_Avoid_: Address mapping, Parameter binding

**Reference Vault**:
The sample Anchor program in `programs/reference-vault` used to demonstrate publishing tools; never imported by the host.
_Avoid_: Sample backend, Target program
