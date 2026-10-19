use crate::errors::ProtocolGuardError;
use anchor_lang::prelude::*;

pub const CONFIG_HEADER_LEN: usize = 81;
pub const MAX_CONFIG_LEN: u32 = 65536;
pub const STATUS_OFFSET: usize = 40;
pub const VEC_LEN_OFFSET: usize = 77;

pub struct ConfigHeader {
    pub authority: Pubkey,
    pub status: u8,
    pub expected_len: u32,
    pub digest: [u8; 32],
    pub payload_len: usize,
}

pub fn parse_config_header(data: &[u8]) -> Result<ConfigHeader> {
    require!(
        data.len() >= CONFIG_HEADER_LEN && data.starts_with(Web3McpConfig::DISCRIMINATOR),
        ProtocolGuardError::InvalidConfigAccount
    );
    let payload_len =
        u32::from_le_bytes(data[VEC_LEN_OFFSET..CONFIG_HEADER_LEN].try_into().unwrap()) as usize;
    require!(
        payload_len <= MAX_CONFIG_LEN as usize && data.len() == CONFIG_HEADER_LEN + payload_len,
        ProtocolGuardError::InvalidConfigAccount
    );
    let mut digest = [0u8; 32];
    digest.copy_from_slice(&data[45..77]);
    Ok(ConfigHeader {
        authority: Pubkey::new_from_array(data[8..40].try_into().unwrap()),
        status: data[STATUS_OFFSET],
        expected_len: u32::from_le_bytes(data[41..45].try_into().unwrap()),
        digest,
        payload_len,
    })
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum ConfigStatus {
    Uninitialized = 0,
    Uploading = 1,
    Published = 2,
}

#[account]
pub struct Web3McpConfig {
    pub authority: Pubkey,
    pub status: u8,
    pub expected_len: u32,
    pub digest: [u8; 32],
    pub config: Vec<u8>,
}
