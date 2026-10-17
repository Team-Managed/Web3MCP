---
name: account-model
description: In-depth reference for Solana's account-based runtime, ownership rules, rent exemption, and Program Derived Address (PDA) derivation.
---

# Account Model & Program Derived Addresses (PDAs)

Unlike stateful blockchains where contract storage lives inside a contract's single address, Solana uses an account-centric architecture where state and logic are strictly decoupled.

---

## 1. Anatomy of a Solana Account

Every address on Solana references an Account data structure on the ledger:

```
┌───────────────────────────────────────────────┐
│              Solana Account Header            │
├───────────────────────────────────────────────┤
│ lamports: u64          (Balance in 10^-9 SOL) │
│ owner: PublicKey       (Controlling Program)  │
│ data: Vec<u8>          (Serialized State)     │
│ executable: bool       (Is it a program?)     │
│ rentEpoch: u64         (Deprecated metadata)  │
└───────────────────────────────────────────────┘
```

---

## 2. Fundamental Ownership Invariants

1. **Write Exclusivity**:
   Only the program listed in the `owner` field can modify the `data` byte buffer of an account.
2. **Debit Exclusivity**:
   Only the program listed in the `owner` field can debit lamports from an account.
   - *Exception*: The System Program can debit lamports from an account it owns (such as a standard user wallet) if and only if the transaction includes the account's valid cryptographic signature.
3. **Credit Freedom**:
   Any program or transaction can credit lamports to any existing account.
4. **Executable Immutability**:
   Once marked `executable: true`, an account's data buffer represents compiled machine code (eBPF/SBF) and cannot be modified except via the BPF Upgradeable Loader.

---

## 3. Rent Exemption

To prevent validator memory bloat, every active account must be **rent-exempt**.

- **Rent-Exempt Reserve**: An account must hold a minimum balance in lamports proportional to its byte size:
  $$\text{Minimum Lamports} = (128 + \text{data.length}) \times \text{lamports\_per\_byte\_year} \times 2$$
  *(128 bytes is the fixed account header overhead).*
- **Failure Condition**: Any transaction that leaves an account with more than 0 lamports but fewer than the required rent-exempt reserve will fail with an `InsufficientFundsForRent` runtime error.
- **Closing an Account**: To close an account and delete its state:
  1. The owning program zeros out the `data` buffer.
  2. The owning program transfers all remaining lamports to a destination wallet.
  3. With 0 lamports remaining, the runtime automatically garbage collects the account.

---

## 4. Program Derived Addresses (PDAs)

A Program Derived Address (PDA) is a deterministic public key that belongs to a specific program but intentionally has **no corresponding private key**.

### Mathematical Invariant (Off the Curve)
- Valid Ed25519 keypairs lie on the curve $y^2 = x^3 + ax^2 + x$.
- PDAs are mathematically forced to lie **off the curve**, guaranteeing that no entity can ever generate a private key to sign for the address.

### PDA Derivation
```typescript
import { PublicKey } from '@solana/web3.js';

const [pdaAddress, bumpSeed] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("vault"),
    userWalletPublicKey.toBuffer(),
    Buffer.from([vaultId]),
  ],
  PROGRAM_ID
);
```

### Canonical Bump
- `findProgramAddressSync` starts searching at `bump = 255` and decrements backwards (254, 253...) until it finds an address off the curve.
- The highest valid bump is the **canonical bump**.
- Secure Solana programs store and verify the canonical bump to prevent duplicate rogue PDAs with non-canonical bumps.

### Program Signing via CPI
Although no one holds a private key for a PDA, the owning program can sign for instructions it invokes via **Cross-Program Invocation (CPI)** using `invoke_signed`.
The Solana runtime verifies that the seeds passed into `invoke_signed` regenerate the PDA address under that program ID, granting the CPI instruction signer privileges.

---

## 5. Privilege & Locking Flags: Signer & Writable

When declaring account meta in Web3MCP tool descriptors:

| Flag | Value | Runtime Meaning | Parallel Execution |
|---|---|---|---|
| `isSigner` | `true` | The transaction includes a verified digital signature for this public key (or PDA via CPI). | Restricts unauthorized execution. |
| `isSigner` | `false` | The account is referenced without cryptographic authorization. | |
| `isWritable` | `true` | The instruction may mutate account data or transfer lamports. | **Locks the account exclusively**; other transactions writing to this account must queue. |
| `isWritable` | `false` | The instruction only reads data. | **Shared read lock**; multiple transactions can read simultaneously. |
