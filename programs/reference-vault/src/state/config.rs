use anchor_lang::prelude::*;

pub const CONFIG_HEADER_LEN: usize = 81;
pub const MAX_CONFIG_LEN: u32 = 65536;

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
