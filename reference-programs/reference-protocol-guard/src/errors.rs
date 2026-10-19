use anchor_lang::prelude::*;

#[error_code]
pub enum ProtocolGuardError {
    #[msg("Signer is not authorized to perform this administrative action")]
    Unauthorized,
    #[msg("Parameter exceeds allowable basis points (max 10,000 bps)")]
    InvalidParameterBounds,
    #[msg("Protocol operations are currently paused by the circuit breaker")]
    ProtocolPaused,
    #[msg("Protocol circuit breaker is already tripped")]
    AlreadyPaused,
    #[msg("Protocol circuit breaker is not currently tripped")]
    NotPaused,
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
    #[msg("Config account has an invalid binary layout")]
    InvalidConfigAccount,
}
