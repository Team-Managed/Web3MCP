use crate::errors::ProtocolGuardError;
use crate::state::{
    parse_config_header, ConfigStatus, Web3McpConfig, CONFIG_HEADER_LEN, MAX_CONFIG_LEN,
};
use anchor_lang::prelude::*;
use anchor_lang::system_program::{
    allocate, assign, create_account, transfer, Allocate, Assign, CreateAccount, Transfer,
};

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(constraint = program.programdata_address()? == Some(program_data.key()) @ ProtocolGuardError::Unauthorized)]
    pub program: Program<'info, crate::program::ReferenceProtocolGuard>,
    #[account(constraint = program_data.upgrade_authority_address == Some(authority.key()) @ ProtocolGuardError::Unauthorized)]
    pub program_data: Account<'info, ProgramData>,
    /// CHECK: Seeds and bump are verified by Anchor; ownership and discriminator handled in instruction
    #[account(
        mut,
        seeds = [b"web3mcp".as_ref(), b"config".as_ref()],
        bump
    )]
    pub config: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

pub fn initialize_config(
    ctx: Context<InitializeConfig>,
    authority: Pubkey,
    expected_len: u32,
    digest: [u8; 32],
) -> Result<()> {
    require!(
        expected_len > 0 && expected_len <= MAX_CONFIG_LEN,
        ProtocolGuardError::InvalidLength
    );
    require_keys_eq!(
        authority,
        ctx.accounts.authority.key(),
        ProtocolGuardError::Unauthorized
    );

    let config_info = &ctx.accounts.config;
    let bump = ctx.bumps.config;

    if config_info.data_is_empty() {
        require_keys_eq!(
            *config_info.owner,
            anchor_lang::system_program::ID,
            ProtocolGuardError::Unauthorized
        );
        let rent = Rent::get()?;
        let lamports = rent.minimum_balance(CONFIG_HEADER_LEN);

        let signer_seeds: &[&[&[u8]]] = &[&[b"web3mcp".as_ref(), b"config".as_ref(), &[bump]]];

        if config_info.lamports() == 0 {
            create_account(
                CpiContext::new_with_signer(
                    ctx.accounts.system_program.to_account_info(),
                    CreateAccount {
                        from: ctx.accounts.authority.to_account_info(),
                        to: config_info.clone(),
                    },
                    signer_seeds,
                ),
                lamports,
                CONFIG_HEADER_LEN as u64,
                &crate::id(),
            )?;
        } else {
            let top_up = lamports.saturating_sub(config_info.lamports());
            if top_up > 0 {
                transfer(
                    CpiContext::new(
                        ctx.accounts.system_program.to_account_info(),
                        Transfer {
                            from: ctx.accounts.authority.to_account_info(),
                            to: config_info.clone(),
                        },
                    ),
                    top_up,
                )?;
            }
            allocate(
                CpiContext::new_with_signer(
                    ctx.accounts.system_program.to_account_info(),
                    Allocate {
                        account_to_allocate: config_info.clone(),
                    },
                    signer_seeds,
                ),
                CONFIG_HEADER_LEN as u64,
            )?;
            assign(
                CpiContext::new_with_signer(
                    ctx.accounts.system_program.to_account_info(),
                    Assign {
                        account_to_assign: config_info.clone(),
                    },
                    signer_seeds,
                ),
                &crate::id(),
            )?;
        }
    } else {
        require_keys_eq!(*config_info.owner, crate::id(), ProtocolGuardError::Unauthorized);

        {
            let data = config_info.try_borrow_data()?;
            parse_config_header(&data)?;
        }

        if config_info.data_len() > CONFIG_HEADER_LEN {
            config_info.resize(CONFIG_HEADER_LEN)?;
        }
    }

    let minimum_balance = Rent::get()?.minimum_balance(CONFIG_HEADER_LEN);
    let excess = config_info.lamports().saturating_sub(minimum_balance);
    if excess > 0 {
        **config_info.try_borrow_mut_lamports()? -= excess;
        **ctx.accounts.authority.try_borrow_mut_lamports()? += excess;
    }

    let new_config = Web3McpConfig {
        authority,
        status: ConfigStatus::Uploading as u8,
        expected_len,
        digest,
        config: Vec::new(),
    };

    let mut data = config_info.try_borrow_mut_data()?;
    let mut writer = &mut data[..];
    new_config.try_serialize(&mut writer)?;

    Ok(())
}
