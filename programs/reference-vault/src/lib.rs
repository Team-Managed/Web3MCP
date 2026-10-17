use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

pub use errors::*;
#[allow(ambiguous_glob_reexports)]
pub use instructions::*;
pub use state::*;

declare_id!("GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv");

#[program]
pub mod reference_vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::initialize(ctx)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        instructions::deposit::deposit(ctx, amount)
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        instructions::withdraw::withdraw(ctx, amount)
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
