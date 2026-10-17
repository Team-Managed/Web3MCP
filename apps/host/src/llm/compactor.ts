/**
 * Compacts tool execution results to minimize LLM token consumption.
 * Prunes massive Solana validator byte logs while retaining essential state,
 * compute units consumed, publisher effects, and transaction signatures.
 *
 * @param {string} toolName Name of the tool executed
 * @param {any} result Raw result object from executeRead or prepareInstruction/signAndBroadcast
 * @returns {any} Compact token-efficient summary for LLM conversation history
 */
export function compactToolResult(toolName, result) {
  if (!result || typeof result !== 'object') {
    return { tool: toolName, result };
  }

  // If this was an instruction execution/simulation result
  if (result.instruction || result.simulation || result.confirmedSignature || result.declined) {
    return {
      tool: toolName,
      status: result.declined
        ? 'declined'
        : result.simulation?.err
        ? 'simulated_failure'
        : result.confirmedSignature
        ? 'confirmed'
        : 'simulated_success',
      computeUnits: result.simulation?.unitsConsumed ?? null,
      effects: result.effects || null,
      accounts: (result.accounts || []).map((a: any) => ({
        name: a.name,
        pubkey: a.pubkey,
        signer: a.isSigner,
        writable: a.isWritable,
      })),
      confirmedSignature: result.confirmedSignature || null,
      explorerUrl: result.explorerUrl || null,
      declined: Boolean(result.declined),
      error: result.declined
        ? result.error || 'Transaction rejected by user.'
        : result.simulation?.err || result.error || null,
    };
  }

  // If this was an accountRead result
  if (result.exists !== undefined) {
    return {
      tool: toolName,
      exists: result.exists,
      account: result.account,
      address: result.address,
      data: result.data || null,
    };
  }

  return result;
}
