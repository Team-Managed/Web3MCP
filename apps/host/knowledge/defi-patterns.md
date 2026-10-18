---
name: defi-patterns
description: Operational mechanics for decentralized finance protocols on Solana including AMMs, lending markets, liquid staking, and bonding curves.
---

# DeFi Patterns & Protocol Mechanics

When interacting with Solana DeFi protocols (DEXs, lending markets, liquid staking, yield vaults, and bonding curves), apply these operational invariants.

---

## 1. Automated Market Makers (AMMs) & Swaps

### Constant Product Invariant ($x \cdot y = k$)
Standard pools maintain the invariant $x \cdot y = k$, where $x$ and $y$ are the token reserve balances in the pool.
- When trading $\Delta x$ into the pool, output $\Delta y$ is:
  $$\Delta y = \frac{y \cdot \Delta x}{x + \Delta x} \times (1 - \text{fee})$$
- **Price Impact**: Large trades relative to reserve depth move the marginal pool price unfavorably. If a trade causes $>2-3\%$ price impact, alert the user before proceeding.

### Concentrated Liquidity (CLMM)
Protocols like Orca Whirlpools and Raydium CLMM allocate liquidity within discrete tick ranges:
- Capital efficiency is higher, but if the current price crosses outside the active tick range, liquidity drops to zero and slippage spikes.
- Tools for CLMM often require passing tick array accounts or oracle accounts alongside pool accounts.

### Slippage Tolerance & Basis Points
- Slippage is the acceptable difference between the quoted output amount and the executed output amount at settlement.
- Always specify slippage in **basis points (bps)**:
  - $1\% = 100\text{ bps}$
  - $0.5\% = 50\text{ bps}$
  - $0.1\% = 10\text{ bps}$
- **Rule of Thumb**:
  - Stable pairs (USDC/USDT, SOL/mSOL): $5-10\text{ bps}$ ($0.05\%-0.1\%$).
  - Volatile pairs (SOL/USDC): $50\text{ bps}$ ($0.5\%$).
  - Illiquid / meme tokens: $100-300\text{ bps}$ ($1\%-3\%$).
- **MEV & Sandwich Protection**: Never set slippage above $300\text{ bps}$ ($3\%$) unless explicitly instructed by the user. Excessively wide slippage invites searcher bots to sandwich the transaction.

### Native SOL vs. Wrapped SOL (WSOL)
- Native SOL ($10^9$ lamports) is the native fee token and lives in System accounts.
- SPL token contracts CANNOT accept native SOL directly. They require **Wrapped SOL (WSOL)**:
  - Mint Address: `So11111111111111111111111111111111111111112`
  - Decimals: 9
- **WSOL Lifecycle**:
  1. Create ATA for WSOL mint.
  2. Transfer native lamports into the WSOL ATA via System Program.
  3. Call `syncNative` on Token Program so the token account balance reflects lamport deposits.
  4. Perform swap/deposit.
  5. Close WSOL ATA to refund remaining lamports to user's wallet.

---

## 2. Lending & Borrowing Protocols

### Collateralization & LTV
- Solana lending markets (e.g. Kamino, Solend, Marginfi, Jupiter Lend) require **over-collateralization**:
  $$\text{LTV (Loan-to-Value)} = \frac{\text{Borrowed Value in USD}}{\text{Collateral Value in USD}}$$
- **Liquidation Threshold**: The maximum allowable LTV before the position becomes subject to liquidation (typically $75\%-85\%$).
- **Health Factor**:
  $$\text{Health Factor} = \frac{\text{Collateral Value} \times \text{Liquidation Threshold}}{\text{Borrowed Value}}$$
  - If $\text{Health Factor} > 1.0$, the account is safe.
  - If $\text{Health Factor} \le 1.0$, anyone can liquidate the position by repaying debt and seizing collateral at a bonus discount (liquidation penalty).

### Derivative Receipt Tokens
- Depositing an underlying asset into a lending pool or vault issues a yield-bearing receipt token:
  - Example: Depositing USDC mints `cUSDC` or `jlUSDC`.
  - The exchange rate between receipt tokens and underlying tokens increases over time as borrowers pay interest.
  - Withdrawing burns the receipt token and returns the underlying asset + accrued yield.

### Oracle Health & Staleness
- Lending protocols depend on price feeds (Pyth, Switchboard).
- During extreme network turbulence or Solana RPC lag, oracles may flag stale prices or wide confidence intervals. Instructions attempting to borrow or withdraw will fail simulation with custom oracle errors.

---

## 3. Staking & Liquid Staking (LSTs)

### Native Stake Accounts
- Direct Solana staking creates separate Stake Accounts owned by the Stake Program (`Stake11111111111111111111111111111111111111`).
- **Epoch Boundaries**: Solana epochs last 432,000 slots (~2 to 3 days).
- **Warmup & Cooldown**:
  - Delegating stake to a validator takes effect at the next epoch boundary.
  - Deactivating stake requires 1 full epoch cooldown before lamports can be withdrawn.

### Liquid Staking Tokens (LSTs)
- Protocols (Jito, Marinade, BlazeStake) pool user SOL and delegate it across validator sets.
- Users receive LSTs (e.g., JitoSOL, mSOL, bSOL).
- **Instant Liquidity**: Users can swap LSTs back to SOL on DEX AMMs immediately without waiting for the 3-day epoch cooldown.

---

## 4. Bonding Curves & Fair Launches

### Mechanics
- Launchpad protocols (e.g. pump.fun, raydium launchpad) use a deterministic pricing curve:
  - Token price is low initially and increases as more tokens are purchased with SOL.
  - The SOL paid accumulates in a program-owned reserve vault PDA.
- **Migration / Graduation**:
  - When the reserve reaches a target threshold (e.g., 85 SOL or fixed market cap), the curve completes.
  - Liquidity is migrated to an AMM pool (e.g., Raydium CPMM or Meteora DLMM).
  - The LP receipt tokens are burned or permanently locked to prevent rug pulls.
- **Agent Rule**: Before proposing a buy or sell on a bonding curve, query the curve state account with `accountRead` to check if the curve is still active or already graduated.
