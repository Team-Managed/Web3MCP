import { Connection, PublicKey } from '@solana/web3.js';
import { Web3McpSdk, type AccountReadResult, type PreparedInstruction } from '../dist/index.js';

const sdk = new Web3McpSdk({ connection: new Connection('http://localhost:8899') });
const discovered: Promise<string> = sdk.discover('program-id').then(program => program.configPda);
const read: Promise<AccountReadResult> = sdk.executeRead('get_account', {}, { signer: new PublicKey('11111111111111111111111111111111') });
const prepared: Promise<PreparedInstruction> = sdk.prepareInstruction('deposit', { amount: '1' }, { signer: '11111111111111111111111111111111' });
void [discovered, read, prepared];

// @ts-expect-error Program IDs are strings.
sdk.discover(123);
// @ts-expect-error Program IDs in read options are strings.
sdk.executeRead('get_account', {}, { programId: 123 });
// @ts-expect-error A signer must be a public key or wallet object.
sdk.prepareInstruction('deposit', {}, { signer: 123 });
// @ts-expect-error The SDK needs a Solana Connection.
new Web3McpSdk({ connection: 'http://localhost:8899' });
