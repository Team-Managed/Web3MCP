use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct ProtocolGuard {
    pub authority: Pubkey,
    pub operator: Pubkey,
    pub operational_mode: u8,
    pub is_paused: bool,
    pub fee_basis_points: u64,
    pub max_utilization_bps: u64,
    pub epoch_volume_limit: u64,
    pub current_epoch_volume: u64,
    pub last_updated_at: u64,
    pub circuit_breaker_at: u64,
    pub bump: u8,
}
