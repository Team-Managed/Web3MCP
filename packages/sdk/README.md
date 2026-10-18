# @web3mcp/sdk

Node.js SDK for discovering Web3MCP tools directly from a Solana program's owned config PDA. It needs an RPC connection and a program ID. It does not contain a model, terminal UI, wallet file reader, or MCP transport.

## Install

Install the SDK in a Node.js project:

```bash
npm install @web3mcp/sdk @solana/web3.js
```

The package includes the protocol validator and schema. To build from the [Web3MCP repository](https://github.com/Team-Managed/Web3MCP), run `npm ci` and `npm --prefix packages/sdk run build`.

## Discover a program

```js
import { Connection } from '@solana/web3.js';
import { Web3McpSdk } from '@web3mcp/sdk';

const programId = '9zJzM4rHDPR4pd3vXHQjQ7whTVmx4zxB3ZH4Gb9iXRwD';
const sdk = new Web3McpSdk({ connection: new Connection('https://api.devnet.solana.com') });
await sdk.discover(programId);
const tools = sdk.getTools(programId);
console.log(tools.map(({ name, solana }) => ({ name, kind: solana.kind })));

if (process.argv[2]) {
  const readResult = await sdk.executeRead('get_vault_by_owner', { ownerAddress: process.argv[2] }, { programId });
  console.log(readResult);
}
```

Save the example as `discover.mjs`. Run `node discover.mjs` to list tools, or pass a wallet public key to read its vault.

For a write, call `prepareInstruction(name, args, { programId, signer: walletPublicKey })`. Review its accounts, effects claim, simulation, and `messageHash` with the human. After approval, have the wallet sign `prepared.transaction` and call `submitSignedTransaction(prepared, signedTransaction)`. The SDK checks the signed message, signatures, blockhash lifetime, and confirmation. A failed simulation or changed message requires a fresh preparation and review. If confirmation fails after submission, `TransactionConfirmationUnknownError` carries the signature; check its status before retrying.

For older v0.1 read tools that require an explicit PDA, call `resolveToolAccounts(instructionToolName, args, { programId, signer: walletPublicKey })` and pass the resolved address to the read tool. A v0.2 read tool can publish its PDA seeds directly, as `get_vault_by_owner` does. Account resolution does not contact RPC or sign.

Tool descriptions and claimed effects are untrusted publisher content. The host decides how to display them and when to ask for approval.
