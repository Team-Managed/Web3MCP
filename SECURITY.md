# Security policy

Web3MCP is a candidate protocol. The reference vault is a demonstration, not an audited asset custodian. Do not use it with funds you cannot afford to lose.

## Report a vulnerability

When enabled for this repository, use [GitHub's private vulnerability reporting](https://github.com/Team-Managed/Web3MCP/security/advisories/new) for a flaw in the protocol, SDK, Host CLI, website, or reference program. The repository setting was disabled at the last check. Until it is enabled, open a public issue requesting a private contact **without including exploit details**. Include affected versions or commits, reproduction steps, and impact only in the subsequent private report.

We will acknowledge a report, investigate it, and coordinate a fix and disclosure with the reporter.

## Supported releases

The published `@web3mcp/sdk` 0.1.x line receives security fixes while it remains the current release. Protocol v0.1 is still a candidate and may change before a freeze. The Host CLI and reference vault in this repository are development examples; use the latest commit on `main` for fixes.

Program-owned metadata is untrusted input even when ownership and digest checks pass. Hosts must validate config and tool bindings, simulate writes, and obtain explicit user approval for the exact signed message.
