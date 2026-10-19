use crate::errors::ProtocolGuardError;
use crate::state::ProtocolGuard;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ResumeProtocol<'info> {
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"protocol_guard"],
        bump = guard.bump,
        has_one = authority @ ProtocolGuardError::Unauthorized
    )]
    pub guard: Account<'info, ProtocolGuard>,
}

pub fn resume_protocol(ctx: Context<ResumeProtocol>) -> Result<()> {
    let guard = &mut ctx.accounts.guard;
    require!(guard.is_paused, ProtocolGuardError::NotPaused);
    let clock = Clock::get()?;
    guard.is_paused = false;
    guard.operational_mode = 0;
    guard.last_updated_at = clock.unix_timestamp as u64;
    Ok(())
}
