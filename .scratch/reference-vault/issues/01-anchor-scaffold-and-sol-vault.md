# 01: Anchor Program Scaffold and Native SOL Vault Operations

**What to build:** An Anchor program workspace and reference SOL vault implementation with user-owned vault PDAs. Users can initialize a personal vault, deposit native SOL, and withdraw SOL while enforcing rent-exemption preservation. A local integration test proves these operations succeed against a local Solana validator.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `Anchor.toml` and program Cargo workspace configured for `reference_vault` in `programs/reference-vault`.
- [ ] Account `Vault` defined with fields `owner: Pubkey`, `balance: u64`, `bump: u8`, derived with canonical seeds `["vault", owner]`.
- [ ] `initialize` instruction creates and initializes the user's `Vault` PDA.
- [ ] `deposit(amount: u64)` instruction transfers lamports from user to vault PDA and updates `vault.balance`.
- [ ] `withdraw(amount: u64)` instruction transfers lamports from vault PDA back to owner, enforcing that remaining lamports are >= rent-exempt minimum.
- [ ] Integration test builds the program and verifies initialize, deposit, withdraw, and rent violation rejection against a local validator.
