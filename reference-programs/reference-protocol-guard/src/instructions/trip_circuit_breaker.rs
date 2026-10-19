use crate::errors::ProtocolGuardError;
use crate::state::ProtocolGuard;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct TripCircuitBreaker<'info> {
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"protocol_guard"],
        bump = guard.bump,
        constraint = signer.key() == guard.operator || signer.key() == guard.authority @ ProtocolGuardError::Unauthorized
    )]
    pub guard: Account<'info, ProtocolGuard>,
}

pub fn trip_circuit_breaker(ctx: Context<TripCircuitBreaker>) -> Result<()> {
    let guard = &mut ctx.accounts.guard;
    require!(!guard.is_paused, ProtocolGuardError::AlreadyPaused);
    let clock = Clock::get()?;
    guard.is_paused = true;
    guard.operational_mode = 2;
    guard.circuit_breaker_at = clock.unix_timestamp as u64;
    guard.last_updated_at = clock.unix_timestamp as u64;
    Ok(())
}
