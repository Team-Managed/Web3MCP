use crate::errors::ProtocolGuardError;
use crate::state::{parse_config_header, ConfigStatus, CONFIG_HEADER_LEN, VEC_LEN_OFFSET};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct WriteConfigChunk<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(constraint = program.programdata_address()? == Some(program_data.key()) @ ProtocolGuardError::Unauthorized)]
    pub program: Program<'info, crate::program::ReferenceProtocolGuard>,
    #[account(constraint = program_data.upgrade_authority_address == Some(authority.key()) @ ProtocolGuardError::Unauthorized)]
    pub program_data: Account<'info, ProgramData>,
    /// CHECK: Seeds, owner, authority, and layout are checked before modification.
    #[account(mut, seeds = [b"web3mcp".as_ref(), b"config".as_ref()], bump)]
    pub config: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

pub fn write_config_chunk(
    ctx: Context<WriteConfigChunk>,
    offset: u32,
    chunk: Vec<u8>,
) -> Result<()> {
    let config_info = &ctx.accounts.config;
    require_keys_eq!(*config_info.owner, crate::id(), ProtocolGuardError::Unauthorized);
    let config = parse_config_header(&config_info.try_borrow_data()?)?;
    require_keys_eq!(
        config.authority,
        ctx.accounts.authority.key(),
        ProtocolGuardError::Unauthorized
    );
    require!(
        config.status == ConfigStatus::Uploading as u8,
        ProtocolGuardError::InvalidStatus
    );

    let current_len = config.payload_len as u32;
    require!(offset == current_len, ProtocolGuardError::InvalidOffset);

    let new_len = current_len
        .checked_add(chunk.len() as u32)
        .ok_or(ProtocolGuardError::MathOverflow)?;
    require!(new_len <= config.expected_len, ProtocolGuardError::InvalidLength);

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
    let mut data = config_info.try_borrow_mut_data()?;
    data[VEC_LEN_OFFSET..CONFIG_HEADER_LEN].copy_from_slice(&new_len.to_le_bytes());
    data[CONFIG_HEADER_LEN + current_len as usize..new_account_len].copy_from_slice(&chunk);

    Ok(())
}
