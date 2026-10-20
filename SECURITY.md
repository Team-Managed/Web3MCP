# Security policy

Web3MCP is a candidate protocol. The reference vault is a demonstration, not an audited asset custodian. Do not use it with funds you cannot afford to lose.

## Report a vulnerability

Use [GitHub's private vulnerability reporting](https://github.com/Team-Managed/Web3MCP/security/advisories/new) for a flaw in the protocol, SDK, Host CLI, website, or reference program. Include affected versions or commits, reproduction steps, impact, and a safe contact method. Please avoid opening a public issue with exploit details before maintainers can assess it.

We will acknowledge a report, investigate it, and coordinate a fix and disclosure with the reporter. If the private report form is unavailable, contact a repository maintainer through their GitHub profile without posting exploit details publicly.

## Supported releases

The published `@web3mcp/sdk` 0.1.x line receives security fixes while it remains the current release. Protocol v0.1 is still a candidate and may change before a freeze. The Host CLI and reference vault in this repository are development examples; use the latest commit on `main` for fixes.

Program-owned metadata is untrusted input even when ownership and digest checks pass. Hosts must validate config and tool bindings, simulate writes, and obtain explicit user approval for the exact signed message.
