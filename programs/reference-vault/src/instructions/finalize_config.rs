use anchor_lang::prelude::*;
use crate::errors::VaultError;
use crate::state::{ConfigStatus, Web3McpConfig};

#[derive(Accounts)]
pub struct FinalizeConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"web3mcp".as_ref(), b"config".as_ref()],
        bump,
        has_one = authority @ VaultError::Unauthorized
    )]
    pub config: Account<'info, Web3McpConfig>,
}

pub fn finalize_config(ctx: Context<FinalizeConfig>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    require!(
        config.status == ConfigStatus::Uploading as u8,
        VaultError::InvalidStatus
    );

    require!(
        config.config.len() as u32 == config.expected_len,
        VaultError::InvalidLength
    );

    let computed_digest = solana_sha256_hasher::hash(&config.config).to_bytes();
    require!(computed_digest == config.digest, VaultError::DigestMismatch);

    config.status = ConfigStatus::Published as u8;

    Ok(())
}
