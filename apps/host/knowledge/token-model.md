---
name: token-model
description: In-depth Solana token mechanics covering SPL Token, Token-2022 extensions, Associated Token Accounts (ATAs), decimals math, and authority checks.
---

# Solana Token Model & Standards

Tokens on Solana do not live inside a smart contract's internal mapping. They are discrete accounts owned by either the classic SPL Token Program or the Token Extensions Program (Token-2022).

---

## 1. SPL Token vs. Token-2022

| Property | Classic SPL Token | Token Extensions (Token-2022) |
|---|---|---|
| **Program ID** | `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` | `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` |
| **Account Layout** | Fixed 165-byte account | Variable length (165 bytes + extension TLV bytes) |
| **Extensions** | None | Transfer fees, hooks, confidential transfers, etc. |
| **Interoperability** | Universal across all Solana tooling | Requires Token-2022 instructions and client support |

### Critical Invariant
An account created under the Classic Token Program **cannot** be managed by Token-2022 instructions, and vice-versa. Always check the `owner` of the mint and token accounts before building instruction arguments.

---

## 2. Token-2022 Extensions

Token-2022 introduces optional modular extensions configured on the Mint or Token Account. When reasoning about tools:

### Transfer Fees
- The mint deducts a protocol fee on every token transfer (e.g., 100 bps = 1%).
- **Operational Impact**: If a user sends 1,000 tokens, the recipient receives 990 tokens, and 10 tokens are withheld in the fee accumulator.
- If a program requires receiving exactly $N$ tokens to complete an operation, sending $N$ without accounting for the transfer fee causes the downstream program instruction to revert!

### Default Account State (Frozen)
- Newly created token accounts can be forced into a `Frozen` state by default.
- Requires an explicit unfreeze signature/instruction from the issuer or KYC authority before transfers are unlocked.

### Transfer Hooks
- The mint specifies a custom program called automatically on every transfer via Cross-Program Invocation (CPI).
- Instruction requires passing extra accounts (the hook program, hook state accounts) alongside standard transfer accounts.

### Permanent Delegate & Non-Transferable Tokens
- **Permanent Delegate**: An authority that can transfer or burn tokens from any holder's account without the holder's signature (common in regulated securities or stablecoins).
- **Non-Transferable (Soulbound)**: Tokens locked to the original recipient that cannot be transferred to any other wallet.

---

## 3. Decimals & Base Units Arithmetic

Solana programs **never** store floating-point numbers. All token balances and amounts are stored as 64-bit unsigned integers (`u64`) representing **base units**.

### Conversion Formula
$$\text{Base Units (integer)} = \text{round}(\text{UI Amount} \times 10^{\text{decimals}})$$
$$\text{UI Amount (float)} = \frac{\text{Base Units}}{10^{\text{decimals}}}$$

### Common Ecosystem Decimals
- **SOL / WSOL**: 9 decimals ($1\text{ SOL} = 1,000,000,000\text{ lamports}$)
- **USDC / USDT**: 6 decimals ($1\text{ USDC} = 1,000,000\text{ base units}$)
- **WBTC**: 8 decimals ($1\text{ WBTC} = 100,000,000\text{ base units}$)
- **BONK**: 5 decimals ($1\text{ BONK} = 100,000\text{ base units}$)

### Golden Rule for Agents
Never pass decimal strings or floats (like `0.1` or `1.5`) to an instruction argument expecting an integer amount. Always calculate and pass the exact integer base units (`100000000` for 0.1 SOL).

---

## 4. Associated Token Accounts (ATAs)

In Solana, a user does not receive tokens directly into their main wallet address. They receive tokens into an **Associated Token Account (ATA)** derived deterministically for their wallet and that specific mint.

### Derivation
- Program ID: `ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL`
- Seeds:
  $$\text{PDA} = \text{findProgramAddressSync}([\text{walletPubkey}, \text{tokenProgramId}, \text{mintPubkey}], \text{ASSOCIATED\_TOKEN\_PROGRAM\_ID})$$

### The Missing ATA Failure Pattern
If a wallet has never held a specific token before, its ATA does **not exist** on-chain.
- Attempting to transfer tokens into an uninitialized ATA causes an immediate runtime error (`AccountNotFound`).
- **Recovery**: Include the `createAssociatedTokenAccountIdempotent` instruction before the transfer instruction. Idempotent creation succeeds if the ATA already exists and initializes it if it does not.

---

## 5. Mint & Freeze Authorities

When inspecting a token mint with `accountRead`:
- **`mintAuthority`**: The public key allowed to mint new tokens.
  - If `mintAuthority` is `null` / `None`, the token has a **fixed supply** and cannot be inflated.
  - If `mintAuthority` is an active address, the owner can mint more tokens at any time.
- **`freezeAuthority`**: The public key allowed to freeze user token accounts.
  - If `freezeAuthority` is present, the issuer can censor transfers and lock funds.
  - If `freezeAuthority` is `null` / `None`, the token accounts cannot be frozen by the mint authority.
