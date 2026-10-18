# @web3mcp/sdk

Node.js SDK for discovering Web3MCP tools directly from a Solana program's owned config PDA. It needs an RPC connection and a program ID. It does not contain a model, terminal UI, wallet file reader, or MCP transport.

```js
import { Connection } from '@solana/web3.js';
import { Web3McpSdk } from '@web3mcp/sdk';

const sdk = new Web3McpSdk({ connection: new Connection('https://api.devnet.solana.com') });
await sdk.discover(programId);
const tools = sdk.getTools(programId);
const readResult = await sdk.executeRead('get_vault', { vaultOwner: address }, { programId });
```

For a write, call `prepareInstruction(name, args, { programId, signer: walletPublicKey })`. Review its accounts, effects claim, simulation, and `messageHash` with the human. After approval, have the wallet sign `prepared.transaction` and call `submitSignedTransaction(prepared, signedTransaction)`. The SDK checks the signed message, signatures, blockhash lifetime, and confirmation. A failed simulation or changed message requires a fresh preparation and review. If confirmation fails after submission, `TransactionConfirmationUnknownError` carries the signature; check its status before retrying.

Tool descriptions and claimed effects are untrusted publisher content. The host decides how to display them and when to ask for approval.
