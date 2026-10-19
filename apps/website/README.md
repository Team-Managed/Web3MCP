# Website

This directory contains the Web3MCP landing page, quickstart, documentation reference, and pitch materials. The live site is [www.web3mcp.org](https://www.web3mcp.org); `web3mcp.org` redirects there. Its Devnet tool table is a static reference; use the Host CLI or SDK for a fresh on-chain discovery. The site does not execute target-program tools.

## Development

Install the root and site dependencies, then run the development server from the repository root (Node.js 22 or later):

```bash
npm ci
npm ci --prefix apps/website
npm run dev
```

Or from within `apps/website`:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the landing page.

## Production Build

```bash
npm run build
```
