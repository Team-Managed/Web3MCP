use crate::errors::ProtocolGuardError;
use crate::state::{parse_config_header, ConfigStatus, CONFIG_HEADER_LEN, STATUS_OFFSET};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct FinalizeConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(constraint = program.programdata_address()? == Some(program_data.key()) @ ProtocolGuardError::Unauthorized)]
    pub program: Program<'info, crate::program::ReferenceProtocolGuard>,
    #[account(constraint = program_data.upgrade_authority_address == Some(authority.key()) @ ProtocolGuardError::Unauthorized)]
    pub program_data: Account<'info, ProgramData>,
    /// CHECK: Seeds, owner, authority, and layout are checked before modification.
    #[account(mut, seeds = [b"web3mcp".as_ref(), b"config".as_ref()], bump)]
    pub config: AccountInfo<'info>,
}

pub fn finalize_config(ctx: Context<FinalizeConfig>) -> Result<()> {
    let config_info = &ctx.accounts.config;
    require_keys_eq!(*config_info.owner, crate::id(), ProtocolGuardError::Unauthorized);
    let data = config_info.try_borrow_data()?;
    let config = parse_config_header(&data)?;
    require_keys_eq!(
        config.authority,
        ctx.accounts.authority.key(),
        ProtocolGuardError::Unauthorized
    );
    require!(
        config.status == ConfigStatus::Uploading as u8,
        ProtocolGuardError::InvalidStatus
    );

    require!(
        config.payload_len as u32 == config.expected_len,
        ProtocolGuardError::InvalidLength
    );

    let computed_digest = solana_sha256_hasher::hash(&data[CONFIG_HEADER_LEN..]).to_bytes();
    require!(computed_digest == config.digest, ProtocolGuardError::DigestMismatch);

    drop(data);
    config_info.try_borrow_mut_data()?[STATUS_OFFSET] = ConfigStatus::Published as u8;

    Ok(())
}
