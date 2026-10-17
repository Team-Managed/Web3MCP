use crate::state::Vault;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        init,
        payer = owner,
        space = 8 + Vault::INIT_SPACE,
        seeds = [b"vault", owner.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, Vault>,
    pub system_program: Program<'info, System>,
}

pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    vault.owner = ctx.accounts.owner.key();
    vault.balance = 0;
    vault.bump = ctx.bumps.vault;
    Ok(())
}
