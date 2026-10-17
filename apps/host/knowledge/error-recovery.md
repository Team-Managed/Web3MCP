---
name: error-recovery
description: Comprehensive operational diagnostic playbook for recovering from simulation failures, runtime errors, and Anchor contract codes.
---

# Error Recovery & Diagnostics Playbook

When an instruction simulation or tool call returns an error, the agent must diagnose the root cause and propose an actionable recovery path rather than failing silently or hallucinating arguments.

---

## 1. The Diagnostic Triage Loop

Follow this four-step diagnostic procedure:

```
[Simulation / Tool Fails]
           │
           ▼
1. Extract Error Code & Logs (Search for "Program log: ...", "custom program error: ...")
           │
           ▼
2. Classify Root Cause (Account missing? Balance low? Slippage exceeded? Blockhash expired?)
           │
           ▼
3. Execute Diagnostic Read Tool (Call accountRead to verify current balances/state)
           │
           ▼
4. Propose Corrective Action (Initialize missing account, adjust argument, or request user action)
```

---

## 2. Common Runtime Errors & Recovery Actions

### Error: `AccountNotFound` / `Account does not exist`
- **Cause**: An account address passed to the instruction has not been initialized on-chain (holds 0 lamports and has System Program as owner).
- **Diagnosis**:
  - Check if the account is an Associated Token Account (ATA).
  - Check if the account is a program PDA (e.g. personal vault, user profile, pool state).
- **Recovery Action**:
  - *If ATA*: Call or prepend `createAssociatedTokenAccountIdempotent`.
  - *If Program PDA*: Query discovered tools for an initialization instruction (e.g., `initialize`, `create_user`, `init_vault`). Inform the user: *"Your personal account is not initialized yet. Would you like me to prepare an initialize transaction first?"*

---

### Error: `InsufficientFunds` / `Custom(1)` / `0x1`
- **Cause**: The signer does not have enough lamports or tokens to cover the operation.
- **Diagnosis**:
  - Check if the wallet lacks native SOL for transaction fees (5,000+ lamports) or account rent (~0.002 SOL).
  - Or check if the user's token account holds fewer base units than the requested transfer amount.
- **Recovery Action**:
  - Execute `/balance` or an `accountRead` tool to determine current balances.
  - Report the exact shortfall in human-readable terms: *"You attempted to deposit 10 USDC, but your token account only holds 4.5 USDC."*

---

### Error: `SlippageExceeded` / `Custom(6001)` / `ExceededSlippage`
- **Cause**: The market price moved unfavorably between the quote generation and simulation, breaching the user's slippage tolerance.
- **Recovery Action**:
  - Execute an `accountRead` tool on the pool to retrieve the latest reserve balances.
  - Inform the user of the price movement.
  - Propose increasing slippage tolerance slightly (e.g., from 50 bps to 100 bps) and ask for user confirmation.

---

### Error: `BlockhashNotFound` / `Blockhash expired`
- **Cause**: The transaction took longer than 150 slots (~60-90 seconds) to be simulated, reviewed, or submitted to the network.
- **Recovery Action**:
  - Re-fetch the latest blockhash from the Solana RPC.
  - Re-simulate the transaction with the fresh blockhash.
  - Present the updated transaction for user wallet approval.

---

### Error: `InstructionFallbackNotFound` / `InvalidAccountData`
- **Cause**:
  - The 8-byte Anchor instruction discriminator did not match any handler in the deployed program.
  - Or an account was passed whose data buffer cannot be deserialized into the expected struct.
- **Recovery Action**:
  - Check whether the program was recently updated or re-deployed with breaking changes.
  - Verify that the tool descriptor was derived from the currently deployed program version.

---

## 3. Standard Anchor Framework Error Codes

Anchor programs share standard 4-digit error codes starting at 6000 (`0x1770`):

| Error Code (Dec / Hex) | Name | Cause | Resolution |
|---|---|---|---|
| `6000` / `0x1770` | `ConstraintMut` | An account was passed as read-only (`isWritable: false`) when the program requires writing to it. | Mark account as `isWritable: true`. |
| `6001` / `0x1771` | `ConstraintHasOne` | A target field (e.g. `authority` or `owner`) did not match the expected public key. | Verify that the correct signer or authority public key was supplied. |
| `6002` / `0x1772` | `ConstraintSigner` | An account was passed without signing (`isSigner: false`) when required. | Include the account's signature or invoke via PDA CPI `invoke_signed`. |
| `6003` / `0x1773` | `ConstraintRaw` | A custom assertion macro failed in the program logic. | Inspect program simulation logs to identify the exact failed check. |
| `6004` / `0x1774` | `ConstraintOwner` | The account is owned by the wrong program ID. | Verify that the account was created by the expected program. |
| `6005` / `0x1775` | `ConstraintRentExempt` | The account does not meet the minimum rent exemption threshold. | Credit sufficient lamports to cover rent. |
| `6006` / `0x1776` | `ConstraintSeeds` | PDA derivation failed; the provided seeds or bump did not produce the expected address. | Re-derive the PDA using the exact seed types and canonical bump. |
