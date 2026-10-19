use crate::errors::ProtocolGuardError;
use crate::state::ProtocolGuard;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct SetOperator<'info> {
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"protocol_guard"],
        bump = guard.bump,
        has_one = authority @ ProtocolGuardError::Unauthorized
    )]
    pub guard: Account<'info, ProtocolGuard>,
}

pub fn set_operator(ctx: Context<SetOperator>, new_operator: Pubkey) -> Result<()> {
    let guard = &mut ctx.accounts.guard;
    let clock = Clock::get()?;
    guard.operator = new_operator;
    guard.last_updated_at = clock.unix_timestamp as u64;
    Ok(())
}
