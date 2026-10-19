use crate::errors::ProtocolGuardError;
use crate::state::ProtocolGuard;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdateRiskParameters<'info> {
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"protocol_guard"],
        bump = guard.bump,
        has_one = authority @ ProtocolGuardError::Unauthorized
    )]
    pub guard: Account<'info, ProtocolGuard>,
}

pub fn update_risk_parameters(
    ctx: Context<UpdateRiskParameters>,
    fee_basis_points: u64,
    max_utilization_bps: u64,
    epoch_volume_limit: u64,
) -> Result<()> {
    require!(
        fee_basis_points <= 10000 && max_utilization_bps <= 10000,
        ProtocolGuardError::InvalidParameterBounds
    );
    let guard = &mut ctx.accounts.guard;
    let clock = Clock::get()?;
    guard.fee_basis_points = fee_basis_points;
    guard.max_utilization_bps = max_utilization_bps;
    guard.epoch_volume_limit = epoch_volume_limit;
    guard.last_updated_at = clock.unix_timestamp as u64;
    Ok(())
}
