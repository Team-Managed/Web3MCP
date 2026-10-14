use anchor_lang::prelude::*;
use crate::errors::VaultError;
use crate::state::{ConfigStatus, Web3McpConfig, CONFIG_HEADER_LEN};

#[derive(Accounts)]
pub struct WriteConfigChunk<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"web3mcp".as_ref(), b"config".as_ref()],
        bump,
        has_one = authority @ VaultError::Unauthorized
    )]
    pub config: Account<'info, Web3McpConfig>,
    pub system_program: Program<'info, System>,
}

pub fn write_config_chunk(
    ctx: Context<WriteConfigChunk>,
    offset: u32,
    chunk: Vec<u8>,
) -> Result<()> {
    let config = &mut ctx.accounts.config;
    require!(
        config.status == ConfigStatus::Uploading as u8,
        VaultError::InvalidStatus
    );

    let current_len = config.config.len() as u32;
    require!(offset == current_len, VaultError::InvalidOffset);

    let new_len = current_len
        .checked_add(chunk.len() as u32)
        .ok_or(VaultError::MathOverflow)?;
    require!(new_len <= config.expected_len, VaultError::InvalidLength);

    // Reallocate account size
    let config_info = config.to_account_info();
    let new_account_len = CONFIG_HEADER_LEN + new_len as usize;

    let rent = Rent::get()?;
    let new_minimum_balance = rent.minimum_balance(new_account_len);
    let lamports_diff = new_minimum_balance.saturating_sub(config_info.lamports());

    if lamports_diff > 0 {
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.authority.to_account_info(),
                    to: config_info.clone(),
                },
            ),
            lamports_diff,
        )?;
    }

    config_info.resize(new_account_len)?;
    config.config.extend_from_slice(&chunk);

    Ok(())
}
