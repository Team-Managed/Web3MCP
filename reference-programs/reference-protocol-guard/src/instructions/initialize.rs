use crate::errors::ProtocolGuardError;
use crate::state::ProtocolGuard;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + ProtocolGuard::INIT_SPACE,
        seeds = [b"protocol_guard"],
        bump
    )]
    pub guard: Account<'info, ProtocolGuard>,
    pub system_program: Program<'info, System>,
}

pub fn initialize(
    ctx: Context<Initialize>,
    operator: Pubkey,
    fee_basis_points: u64,
    max_utilization_bps: u64,
    epoch_volume_limit: u64,
) -> Result<()> {
    require!(
        fee_basis_points <= 10000 && max_utilization_bps <= 10000,
        ProtocolGuardError::InvalidParameterBounds
    );
    let clock = Clock::get()?;
    let guard = &mut ctx.accounts.guard;
    guard.authority = ctx.accounts.authority.key();
    guard.operator = operator;
    guard.operational_mode = 0;
    guard.is_paused = false;
    guard.fee_basis_points = fee_basis_points;
    guard.max_utilization_bps = max_utilization_bps;
    guard.epoch_volume_limit = epoch_volume_limit;
    guard.current_epoch_volume = 0;
    guard.last_updated_at = clock.unix_timestamp as u64;
    guard.circuit_breaker_at = 0;
    guard.bump = ctx.bumps.guard;
    Ok(())
}
