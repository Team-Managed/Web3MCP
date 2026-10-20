import crypto from 'node:crypto';
import { PublicKey, type AccountInfo, type Commitment, type Connection } from '@solana/web3.js';
import { ConfigValidationError } from '../errors.js';

// Upgradeable Loader v3 stores the ProgramData address after its 4-byte Program tag.
const UPGRADEABLE_LOADER = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');

function digest(data: Buffer | Uint8Array): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export async function captureSnapshot(connection: Connection, programId: string, configPda: string,
  commitment: Commitment, accounts?: { program: AccountInfo<Buffer>; config: AccountInfo<Buffer> }): Promise<string> {
  const program = accounts?.program ?? await connection.getAccountInfo(new PublicKey(programId), commitment);
  const config = accounts?.config ?? await connection.getAccountInfo(new PublicKey(configPda), commitment);
  if (!program?.executable || !config?.data || config.owner.toBase58() !== programId) {
    throw new ConfigValidationError('Program or Web3MCP config changed; discover and review again.');
  }
  const programData = Buffer.from(program.data || []);
  let deployment = '';
  if (program.owner?.equals(UPGRADEABLE_LOADER)) {
    if (programData.length < 36 || programData.readUInt32LE(0) !== 2) {
      throw new ConfigValidationError('Upgradeable program account is malformed.');
    }
    const address = new PublicKey(programData.subarray(4, 36));
    const account = await connection.getAccountInfo(address, commitment);
    const deploymentData = Buffer.from(account?.data || []);
    if (!account || !account.owner.equals(UPGRADEABLE_LOADER) || deploymentData.length < 12 || deploymentData.readUInt32LE(0) !== 3) {
      throw new ConfigValidationError('ProgramData account is missing or malformed.');
    }
    deployment = `${address.toBase58()}:${digest(deploymentData)}`;
  }
  return digest(Buffer.from(JSON.stringify({
    programId,
    programOwner: program.owner?.toBase58() || '',
    programData: digest(programData),
    deployment,
    configPda,
    configData: digest(config.data),
  })));
}
