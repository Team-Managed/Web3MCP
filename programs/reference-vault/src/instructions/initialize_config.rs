use anchor_lang::prelude::*;
use anchor_lang::system_program::{create_account, CreateAccount};
use crate::errors::VaultError;
use crate::state::{ConfigStatus, Web3McpConfig, CONFIG_HEADER_LEN, MAX_CONFIG_LEN};

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
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
        VaultError::InvalidLength
    );

    let config_info = &ctx.accounts.config;
    let bump = ctx.bumps.config;

    if config_info.data_is_empty() {
        let rent = Rent::get()?;
        let lamports = rent.minimum_balance(CONFIG_HEADER_LEN);

        let signer_seeds: &[&[&[u8]]] = &[&[
            b"web3mcp".as_ref(),
            b"config".as_ref(),
            &[bump],
        ]];

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
        require_keys_eq!(*config_info.owner, crate::id(), VaultError::Unauthorized);

        // Verify current authority from existing account data
        {
            let mut data: &[u8] = &config_info.try_borrow_data()?;
            let existing = Web3McpConfig::try_deserialize(&mut data)?;
            require_keys_eq!(existing.authority, ctx.accounts.authority.key(), VaultError::Unauthorized);
        }

        if config_info.data_len() > CONFIG_HEADER_LEN {
            config_info.resize(CONFIG_HEADER_LEN)?;
        }
    }

    // Write new configuration header
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
