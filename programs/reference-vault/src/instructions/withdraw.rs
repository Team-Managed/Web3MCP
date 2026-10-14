use crate::errors::VaultError;
use crate::state::Vault;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref()],
        bump = vault.bump,
        has_one = owner
    )]
    pub vault: Account<'info, Vault>,
    pub system_program: Program<'info, System>,
}

pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    require!(amount > 0, VaultError::InvalidAmount);

    let vault = &ctx.accounts.vault;
    require!(vault.balance >= amount, VaultError::InsufficientFunds);

    let vault_info = ctx.accounts.vault.to_account_info();
    let rent = Rent::get()?;
    let required_rent = rent.minimum_balance(vault_info.data_len());
    let current_lamports = vault_info.lamports();

    require!(
        current_lamports.saturating_sub(amount) >= required_rent,
        VaultError::RentViolation
    );

    **vault_info.try_borrow_mut_lamports()? = current_lamports
        .checked_sub(amount)
        .ok_or(VaultError::MathOverflow)?;
    **ctx
        .accounts
        .owner
        .to_account_info()
        .try_borrow_mut_lamports()? = ctx
        .accounts
        .owner
        .to_account_info()
        .lamports()
        .checked_add(amount)
        .ok_or(VaultError::MathOverflow)?;

    let vault = &mut ctx.accounts.vault;
    vault.balance = vault
        .balance
        .checked_sub(amount)
        .ok_or(VaultError::MathOverflow)?;
    Ok(())
}
