use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

pub use errors::*;
#[allow(ambiguous_glob_reexports)]
pub use instructions::*;
pub use state::*;

declare_id!("BDwiU9GGqf7zxNNxD3QxyZ4PzKBWr8QMfUeYknbsXzFA");

#[program]
pub mod reference_protocol_guard {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        operator: Pubkey,
        fee_basis_points: u64,
        max_utilization_bps: u64,
        epoch_volume_limit: u64,
    ) -> Result<()> {
        instructions::initialize::initialize(
            ctx,
            operator,
            fee_basis_points,
            max_utilization_bps,
            epoch_volume_limit,
        )
    }

    pub fn trip_circuit_breaker(ctx: Context<TripCircuitBreaker>) -> Result<()> {
        instructions::trip_circuit_breaker::trip_circuit_breaker(ctx)
    }

    pub fn resume_protocol(ctx: Context<ResumeProtocol>) -> Result<()> {
        instructions::resume_protocol::resume_protocol(ctx)
    }

    pub fn update_risk_parameters(
        ctx: Context<UpdateRiskParameters>,
        fee_basis_points: u64,
        max_utilization_bps: u64,
        epoch_volume_limit: u64,
    ) -> Result<()> {
        instructions::update_risk_parameters::update_risk_parameters(
            ctx,
            fee_basis_points,
            max_utilization_bps,
            epoch_volume_limit,
        )
    }

    pub fn set_operator(ctx: Context<SetOperator>, new_operator: Pubkey) -> Result<()> {
        instructions::set_operator::set_operator(ctx, new_operator)
    }

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        authority: Pubkey,
        expected_len: u32,
        digest: [u8; 32],
    ) -> Result<()> {
        instructions::initialize_config::initialize_config(ctx, authority, expected_len, digest)
    }

    pub fn write_config_chunk(
        ctx: Context<WriteConfigChunk>,
        offset: u32,
        chunk: Vec<u8>,
    ) -> Result<()> {
        instructions::write_config_chunk::write_config_chunk(ctx, offset, chunk)
    }

    pub fn finalize_config(ctx: Context<FinalizeConfig>) -> Result<()> {
        instructions::finalize_config::finalize_config(ctx)
    }
}
