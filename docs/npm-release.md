# Publish the Web3MCP SDK

Publish only `@web3mcp/sdk`. The protocol specification, schema, and conformance tests remain in `protocol/`; the SDK bundles the protocol validator and includes its schema in its npm package. The example Host CLI is not part of this release.

## Before the first release

1. Confirm the `web3mcp` npm organization and publisher access. Check that `@web3mcp/sdk@0.1.0` is not already published.
2. From the repository root, run:

   ```bash
   npm ci
   npm --prefix protocol test
   npm --prefix packages/sdk run build
   npm --prefix packages/sdk test
   npm pack --workspace @web3mcp/sdk --dry-run
   ```

3. Review the pack list for compiled JavaScript, type declarations, the protocol schema, README, and LICENSE. Check that it contains no keys or `.env` files.
4. Install the packed SDK in a clean Node.js project and run discovery against the reference Devnet program. Confirm that installation does not request `@web3mcp/protocol` from npm.

## First publication

The publisher must be signed into npm with access to the `web3mcp` organization and complete npm's required two-factor authentication. From the repository root:

```bash
npm publish --workspace @web3mcp/sdk --access public
```

Verify the public package page and a fresh `npm install @web3mcp/sdk @solana/web3.js`. Change the website's “pending publication” text only after that install succeeds.

## Later releases from GitHub Actions

The manual `Publish SDK to npm` workflow in `.github/workflows/publish-npm.yml` runs SDK checks and publishes from `main`. It does not store an npm write token. Before running it, configure a trusted GitHub Actions publisher for `@web3mcp/sdk` in npm package settings:

- GitHub organization: `Team-Managed`
- Repository: `Web3MCP`
- Workflow filename: `publish-npm.yml`
- Allowed action: direct `npm publish`

Bump the SDK version before each run and review the package contents again. Only the manual workflow on `main` can publish.

See npm's [scoped public package guide](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/) and [trusted publishing guide](https://docs.npmjs.com/trusted-publishers/) for current account and workflow requirements.
