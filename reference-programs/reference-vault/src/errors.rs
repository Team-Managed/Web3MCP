use anchor_lang::prelude::*;

#[error_code]
pub enum VaultError {
    #[msg("Invalid amount provided")]
    InvalidAmount,
    #[msg("Insufficient funds in vault")]
    InsufficientFunds,
    #[msg("Withdrawal would violate rent exemption reserve")]
    RentViolation,
    #[msg("Math calculation overflowed")]
    MathOverflow,
    #[msg("Config account is not in Uploading status")]
    InvalidStatus,
    #[msg("Config payload exceeds maximum size limit or expected length")]
    InvalidLength,
    #[msg("Chunk offset does not match current upload length")]
    InvalidOffset,
    #[msg("Uploaded config SHA-256 digest does not match expected digest")]
    DigestMismatch,
    #[msg("Signer is not authorized to modify config")]
    Unauthorized,
    #[msg("Config account has an invalid binary layout")]
    InvalidConfigAccount,
}
