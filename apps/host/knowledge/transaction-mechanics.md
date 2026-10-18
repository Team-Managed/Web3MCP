---
name: transaction-mechanics
description: Deep dive into Solana transaction construction, compute unit budgeting, priority fee calculations, versioned transactions (v0/ALTs), and blockhash expiry.
---

# Transaction Mechanics, Compute Units & Fees

Solana's execution pipeline differs fundamentally from EVM-based chains. It enforces strict MTU packet size limits, parallel account locking, compute unit quotas, and short-lived blockhashes.

---

## 1. Compute Budget & Limits

### Default Compute Unit (CU) Quota
- By default, each instruction in a Solana transaction is allocated **200,000 compute units**.
- The maximum compute limit for an entire transaction is **1,400,000 compute units**.
- If execution exceeds the allocated units, the transaction halts immediately and reverts with:
  `Program failed to complete: computational budget exceeded`

### Requesting Explicit Compute Limits
Complex operations (e.g., multi-hop AMM swaps, Flash Loans, or heavy Anchor programs) require more than 200k CU.
- Prepend an instruction using the Compute Budget Program:
  - Program ID: `ComputeBudget111111111111111111111111111111`
  - Instruction: `ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 })`
- **Simulation Heuristic**: Modern hosts simulate the transaction first. If simulation uses $150,000\text{ CU}$, set the limit to $150,000 \times 1.15 = 172,500\text{ CU}$ to provide a safety margin while keeping priority fees minimal.

---

## 2. Priority Fees & Local Fee Markets

Solana uses localized fee markets. Accounts marked as `isWritable` are write-locked during execution. High congestion on a single popular mint or pool does not congest unrelated transactions across the network.

### Priority Fee Architecture
1. **Base Signature Fee**: Fixed at **5,000 lamports** per signature (0.000005 SOL).
2. **Priority Fee**: Bids for prioritization among transactions competing for the same writable accounts.
   - Quoted in **micro-lamports per compute unit** ($1\text{ lamport} = 1,000,000\text{ micro-lamports}$).
   - Set via: `ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 10000 })`.

### Fee Calculation Formula
$$\text{Priority Fee (lamports)} = \frac{\text{Requested Compute Units} \times \text{Micro-Lamports per CU}}{1,000,000}$$
$$\text{Total Fee (lamports)} = (5,000 \times \text{Signatures}) + \text{Priority Fee}$$

*Example*: If a transaction requests 200,000 CU with a price of 25,000 micro-lamports:
$$\text{Priority Fee} = \frac{200,000 \times 25,000}{1,000,000} = 5,000\text{ lamports}$$
$$\text{Total Network Fee} = 5,000 + 5,000 = 10,000\text{ lamports (0.00001 SOL)}$$

---

## 3. Transaction Formats: Legacy vs. Versioned (v0)

### IPv6 MTU Packet Limit (1232 Bytes)
All Solana network transactions must fit into a single IPv6 MTU packet of **1232 bytes**.
- A standard account public key takes 32 bytes.
- Legacy transactions can reference at most ~30 to 35 unique accounts before exceeding 1232 bytes.

### Versioned Transactions (v0) & Address Lookup Tables (ALTs)
To enable multi-step DeFi transactions involving 40-60 accounts:
- **Address Lookup Table (ALT)**: An on-chain account storing an array of public keys.
- **v0 Transactions**: Instead of storing 32-byte public keys in the transaction envelope, the transaction stores 1-byte indices pointing into the ALT.
- This allows bundling up to 256 accounts in a single transaction.

---

## 4. Blockhash Lifetime & Expiry

Solana does not use transaction nonces for replay protection (except for durable nonces). Instead, every transaction includes a **Recent Blockhash**.

- A blockhash is valid for **150 slots** (~60 to 90 seconds).
- Once 150 slots elapse, the blockhash expires and the cluster rejects the transaction:
  `Transaction simulation failed: Blockhash not found`
- **Agent Rule**: If a transaction is submitted or simulated after a delay, always refresh the recent blockhash before final broadcast. Never assume an old blockhash remains valid.

---

## 5. Instruction Ordering & Atomic Composition

A transaction is an all-or-nothing atomic unit. If instruction 3 fails, changes from instructions 1 and 2 are rolled back completely.

### Canonical Instruction Flow
When composing a multi-step Solana operation, follow this precise sequence:
```
1. ComputeBudgetProgram.setComputeUnitLimit (Request estimated CU)
2. ComputeBudgetProgram.setComputeUnitPrice (Set priority fee if congested)
3. ATA Creation (createAssociatedTokenAccountIdempotent if ATA missing)
4. State Setup (e.g. system transfer lamports to WSOL ATA + syncNative)
5. Primary Protocol Instruction (e.g. swap, deposit, stake, borrow)
6. Cleanup / Refund (e.g. closeAccount on WSOL ATA to return lamports to user)
```
Ordering setup before the primary action prevents unnecessary transaction failures.
