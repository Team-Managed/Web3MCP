"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  Terminal,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function QuickstartPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="quickstart-page-shell">
      {/* Exact landing page Navbar, sticky pinned with maximum width 1200px */}
      <Navbar isSticky maxWidth="1200px" />

      <main className="quickstart-main-container">
        {/* Header Breadcrumb & Eyebrow */}
        <header className="qs-header">
          <div className="qs-breadcrumb">
            <Link href="/" className="crumb-link">Home</Link>
            <ChevronRight size={12} className="crumb-sep" />
            <span className="crumb-current">Quickstart</span>
          </div>

          <div className="qs-badge-row">
            <span className="qs-badge">GET STARTED IN 60 SECONDS</span>
            <span className="qs-tag">SOLANA DEVNET</span>
          </div>

          <h1 className="qs-title">Protocol Quickstart</h1>

          <p className="qs-subtitle">
            Discover on-chain program capabilities over standard Solana RPC, execute signature-free account reads,
            simulate instruction executions, and launch an autonomous conversational agent with wallet approval.
          </p>
        </header>

        {/* Quick Highlights Bar */}
        <div className="highlights-grid">
          <div className="highlight-card">
            <Zap size={16} className="text-cyan" />
            <div className="hl-text">
              <span className="hl-title">Pure Solana RPC</span>
              <span className="hl-desc">Zero off-chain servers or custom SDKs required</span>
            </div>
          </div>
          <div className="highlight-card">
            <Shield size={16} className="text-emerald" />
            <div className="hl-text">
              <span className="hl-title">Human-in-the-Loop</span>
              <span className="hl-desc">LLM proposes tool calls; only your wallet signs</span>
            </div>
          </div>
          <div className="highlight-card">
            <Terminal size={16} className="text-purple" />
            <div className="hl-text">
              <span className="hl-title">Self-Sovereign Tools</span>
              <span className="hl-desc">Programs own tool declarations in canonical PDAs</span>
            </div>
          </div>
        </div>

        {/* ================= STEP 1: PREREQUISITES ================= */}
        <section className="qs-step-card" id="step-prerequisites">
          <div className="step-num-pill">[ 01 ]</div>
          <h2 className="step-heading">Prerequisites & Environment Setup</h2>
          <p className="step-body-p">
            Ensure your local terminal has Node.js and the Solana CLI configured for Devnet. No special API keys
            are required for inspection and reads; an LLM API key is only needed for the conversational agent.
          </p>

          <div className="prereq-grid">
            <div className="prereq-box">
              <span className="prereq-name">1. Node.js & npm</span>
              <span className="prereq-ver">v18.0.0 or higher</span>
              <code className="prereq-cmd">node --version</code>
            </div>
            <div className="prereq-box">
              <span className="prereq-name">2. Solana CLI Wallet</span>
              <span className="prereq-ver">Devnet Keypair (~/.config/solana/id.json)</span>
              <code className="prereq-cmd">solana address</code>
            </div>
            <div className="prereq-box">
              <span className="prereq-name">3. Solana Devnet RPC</span>
              <span className="prereq-ver">api.devnet.solana.com</span>
              <code className="prereq-cmd">solana config get</code>
            </div>
          </div>

          <div className="tip-box">
            <div className="tip-icon">💡</div>
            <div className="tip-content">
              <strong>Need testnet SOL?</strong> Request devnet lamports with{" "}
              <code>solana airdrop 1 --url devnet</code> or run the agent CLI with <code>/balance</code> to view current funds.
            </div>
          </div>
        </section>

        {/* ================= STEP 2: INSTANT DISCOVERY ================= */}
        <section className="qs-step-card" id="step-discovery">
          <div className="step-num-pill">[ 02 ]</div>
          <h2 className="step-heading">Discover On-Chain Tools in 10 Seconds</h2>
          <p className="step-body-p">
            Run discovery directly against the deployed Reference Vault program on Solana Devnet. The host inspects
            the program ID, resolves the canonical Config PDA, validates the SHA-256 digest on-chain, and extracts
            all published tools from the embedded Anchor IDL.
          </p>

          <div className="code-card">
            <div className="code-header">
              <span className="code-title">Terminal</span>
              <button
                onClick={() =>
                  handleCopy("cmd-discover", "npm run host:inspect -- discover GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv")
                }
                className="code-copy-btn"
              >
                {copiedId === "cmd-discover" ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedId === "cmd-discover" ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <pre className="code-block">
              <code>npm run host:inspect -- discover GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv</code>
            </pre>
          </div>

          <div className="output-card">
            <div className="output-header">
              <span className="output-title">Host Inspection Output</span>
            </div>
            <pre className="output-block">
              <code>{`✔ Canonical Config PDA resolved: HfA1ExZS1cgYR5k5GEJmsQfyAcDK2J9NPi7p97dU3WLD
✔ Account discriminator valid: 0x991dc793e1358b35
✔ Account status: 2 (Published)
✔ On-chain SHA-256 digest verified
✔ Discovered 4 tools from embedded Anchor IDL:
  • get_vault      [read]        Reads on-chain account state for a specified program vault
  • initialize     [instruction] Initializes a personal vault PDA for depositing SOL
  • deposit        [instruction] Transfers SOL from connected wallet into program vault
  • withdraw       [instruction] Withdraws SOL from program vault back to connected wallet`}</code>
            </pre>
          </div>
        </section>

        {/* ================= STEP 3: SIGNATURE-FREE READ ================= */}
        <section className="qs-step-card" id="step-read">
          <div className="step-num-pill">[ 03 ]</div>
          <h2 className="step-heading">Execute Signature-Free Account Reads</h2>
          <p className="step-body-p">
            Read-only queries (<code>accountRead</code>) execute via standard RPC <code>getAccountInfo</code>.
            Web3MCP dynamically resolves the target PDA from IDL seeds, enforces program ownership, verifies the
            Anchor 8-byte discriminator (<code>0xd0e83b384dcdd105</code>), and deserializes state into JSON. Zero wallet
            signatures and zero transaction fees.
          </p>

          <div className="code-card">
            <div className="code-header">
              <span className="code-title">Terminal</span>
              <button
                onClick={() =>
                  handleCopy(
                    "cmd-read",
                    `npm run host:inspect -- read get_vault '{"vaultOwner":"CniPSdkAUaNTfZZUSKvAKU2VJuWecRjqvGhDmQjGSZEG"}' --program GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv`
                  )
                }
                className="code-copy-btn"
              >
                {copiedId === "cmd-read" ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedId === "cmd-read" ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <pre className="code-block">
              <code>{`npm run host:inspect -- read get_vault '{"vaultOwner":"CniPSdkAUaNTfZZUSKvAKU2VJuWecRjqvGhDmQjGSZEG"}' --program GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv`}</code>
            </pre>
          </div>

          <div className="output-card">
            <div className="output-header">
              <span className="output-title">Decoded Account JSON</span>
            </div>
            <pre className="output-block">
              <code>{`{
  "owner": "CniPSdkAUaNTfZZUSKvAKU2VJuWecRjqvGhDmQjGSZEG",
  "balance": "35001000",
  "bump": 255
}`}</code>
            </pre>
          </div>
        </section>

        {/* ================= STEP 4: PRE-SIMULATION ================= */}
        <section className="qs-step-card" id="step-simulation">
          <div className="step-num-pill">[ 04 ]</div>
          <h2 className="step-heading">Pre-Simulate State-Changing Instructions</h2>
          <p className="step-body-p">
            Before any transaction is presented for wallet approval, the host executes a 6-stage preparation pipeline:
            it validates arguments against strict scalar schemas, resolves accounts across 4 tiers (signer, input, program,
            and IDL PDA seeds), serializes Anchor binary data, and runs a pre-flight simulation against live Solana RPC.
          </p>

          <div className="code-card">
            <div className="code-header">
              <span className="code-title">Terminal</span>
              <button
                onClick={() =>
                  handleCopy(
                    "cmd-prep",
                    `npm run host:inspect -- prepare deposit '{"amount":"50000000"}' --signer CniPSdkAUaNTfZZUSKvAKU2VJuWecRjqvGhDmQjGSZEG --program GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv`
                  )
                }
                className="code-copy-btn"
              >
                {copiedId === "cmd-prep" ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedId === "cmd-prep" ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <pre className="code-block">
              <code>{`npm run host:inspect -- prepare deposit '{"amount":"50000000"}' --signer CniPSdkAUaNTfZZUSKvAKU2VJuWecRjqvGhDmQjGSZEG --program GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv`}</code>
            </pre>
          </div>

          <div className="output-card">
            <div className="output-header">
              <span className="output-title">Simulation Report</span>
            </div>
            <pre className="output-block">
              <code>{`✔ Instruction compiled: Program GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv
  Accounts Resolved:
    • owner (signer, writable)    : CniPSdkAUaNTfZZUSKvAKU2VJuWecRjqvGhDmQjGSZEG
    • vault (writable, PDA)       : 7Nm9VsUWReKcBrheRDDjPqv6qB3Ag9UwXCabnd11TwXB
    • system_program (readonly)   : 11111111111111111111111111111111
✔ RPC Simulation Passed: 4,563 CUs consumed
✔ Financial effects verified: Transfers 50,000,000 lamports from user to vault`}</code>
            </pre>
          </div>
        </section>

        {/* ================= STEP 5: INTERACTIVE AGENT SESSION ================= */}
        <section className="qs-step-card" id="step-agent">
          <div className="step-num-pill">[ 05 ]</div>
          <h2 className="step-heading">Launch Conversational Agent with Wallet Approval</h2>
          <p className="step-body-p">
            Launch the interactive AI agent runner. Connect to your model of choice (Google Gemini, Anthropic Claude,
            OpenAI GPT, Groq, or local Ollama). Discovered tools are injected natively as JSON Schema. The model reasons
            and proposes actions; the host simulates every instruction and presents a terminal review card requiring
            explicit keystroke confirmation (<code>[y/N]</code>) before signing.
          </p>

          <div className="code-card">
            <div className="code-header">
              <span className="code-title">Terminal Launch Command</span>
              <button
                onClick={() =>
                  handleCopy(
                    "cmd-agent",
                    "npm run host:agent -- GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv --model gemini-3.8-flash"
                  )
                }
                className="code-copy-btn"
              >
                {copiedId === "cmd-agent" ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedId === "cmd-agent" ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <pre className="code-block">
              <code>npm run host:agent -- GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv --model gemini-3.8-flash</code>
            </pre>
          </div>

          {/* Exact Terminal CLI UI Box matching screenshot */}
          <div className="terminal-window">
            <div className="terminal-header-bar">
              <div className="terminal-dots">
                <span className="term-dot" />
                <span className="term-dot" />
                <span className="term-dot" />
              </div>
              <span className="terminal-bar-title">Web3MCP Agent Terminal (Live Devnet)</span>
            </div>

            <pre className="terminal-stream-code">
              <code>{`────────────────────────────────────────────────────────
gemini-3.8-flash | devnet | GgVnzvsM...4Lyrgv
> deposit 10% of my remaining wallet balance into the vault
⠇ Thinking...

• Wallet Balance Required

The available on-chain tools allow reading vault PDA state (get_vault), but do not include a direct query for your external wallet's native SOL balance.

How to Proceed

1. State your current wallet SOL balance (for example, "my wallet balance is 2.5 SOL"), or
2. Specify the exact amount you want to deposit directly (for example, "deposit 0.1 SOL").

Units and Considerations
• 1 SOL = 1,000,000,000 lamports
• Always leave a small amount of SOL (at least 0.005 SOL) in your wallet to cover network transaction fees.

Once you provide the amount, I will prepare the deposit transaction for your wallet review.
────────────────────────────────────────────────────────
gemini-3.8-flash | devnet | GgVnzvsM...4Lyrgv
> Deposit 0.05 SOL into my vault
⠇ Thinking...

● Calling tool get_vault [read](vaultOwner: "CniPSdkAUa...mQjGSZEG")...
  ✔ Query resolved successfully (Current Balance: 35,001,000 lamports)

● Calling tool deposit [write](amount: "50000000")...
✔ Simulation passed (4563 CUs)

╭────────────────────────────────────────────────────────────────────────╮
│ ⚠️   TRANSACTION APPROVAL REQUIRED                                     │
├────────────────────────────────────────────────────────────────────────┤
│ Tool:             deposit                                              │
│ Program ID:       GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv         │
│ Effects:          Deposits lamports from user to vault (⚠️ FINANCIAL WRITE) │
│ Estimated Fee:    ~0.000005 SOL (5000 lamports)                        │
├────────────────────────────────────────────────────────────────────────┤
│ Accounts Touched:                                                      │
│   • owner         : CniPSdkAUaNTfZZU...cRjqvGhDmQjGSZEG (SIGNER, WRITABLE) │
│   • vault         : 7Nm9VsUWReKcBrhe...g9UwXCabnd11TwXB (WRITABLE)     │
│   • system_program: 11111111111111111111111111111111 (READONLY)        │
├────────────────────────────────────────────────────────────────────────┤
│ Simulation Status: ✅ SUCCESS (4563 CUs consumed)                       │
│ Key Logs:                                                              │
│   > Program log: Instruction: Deposit                                  │
│   > Program 11111111111111111111111111111111 success                   │
│   > Program GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv consumed...   │
╰────────────────────────────────────────────────────────────────────────╯

? Approve and broadcast transaction to Devnet? [y/N] › y

✔ Transaction confirmed on Devnet:
  https://explorer.solana.com/tx/5k...c9?cluster=devnet
────────────────────────────────────────────────────────
gemini-3.8-flash | devnet | GgVnzvsM...4Lyrgv
> █`}</code>
            </pre>
          </div>
        </section>

        {/* ================= STEP 6: SLASH COMMANDS ================= */}
        <section className="qs-step-card" id="step-commands">
          <div className="step-num-pill">[ 06 ]</div>
          <h2 className="step-heading">Interactive Slash Commands</h2>
          <p className="step-body-p">
            During an agent session, use built-in slash commands to inspect chain state and manage tools instantly
            without invoking model reasoning tokens:
          </p>

          <div className="commands-table-wrapper">
            <table className="qs-table">
              <thead>
                <tr>
                  <th>Command</th>
                  <th>Function</th>
                  <th>Behavior</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>/tools</code></td>
                  <td>List Discovered Tools</td>
                  <td>Prints formatted table of on-chain tools with parameter schemas and privileges</td>
                </tr>
                <tr>
                  <td><code>/balance</code></td>
                  <td>Check SOL & Vault Balances</td>
                  <td>Queries wallet balance and active program vault state via RPC</td>
                </tr>
                <tr>
                  <td><code>/keygen</code></td>
                  <td>Generate Test Keypair</td>
                  <td>Generates a dedicated local Solana Devnet keypair if none is present</td>
                </tr>
                <tr>
                  <td><code>/clear</code></td>
                  <td>Clear Terminal</td>
                  <td>Clears terminal view while preserving conversational context and tool registry</td>
                </tr>
                <tr>
                  <td><code>/help</code></td>
                  <td>Show Keyboard Shortcuts</td>
                  <td>Lists supported options, model provider flags, and session shortcuts</td>
                </tr>
                <tr>
                  <td><code>/exit</code></td>
                  <td>Exit Agent</td>
                  <td>Safely terminates session and closes active RPC socket connections</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ================= NEXT STEPS ================= */}
        <section className="qs-next-steps">
          <h2 className="next-steps-title">Next Steps</h2>
          <p className="next-steps-desc">
            Explore the protocol wire format, publish tools for your own Solana program, or test the live Devnet explorer:
          </p>

          <div className="next-grid">
            <Link href="/docs/latest#publisher-guide" className="next-card">
              <span className="next-tag">PROGRAM PUBLISHER</span>
              <h3 className="next-card-title">Publish Your Program Tools</h3>
              <p className="next-card-desc">
                Learn how to embed Anchor IDLs and tool manifests on-chain using chunked uploads and on-chain SHA-256 verification.
              </p>
              <span className="next-arrow">Read Guide <ArrowRight size={13} /></span>
            </Link>

            <Link href="/docs/latest#protocol-spec" className="next-card">
              <span className="next-tag">WIRE SPECIFICATION</span>
              <h3 className="next-card-title">Protocol Wire Specification</h3>
              <p className="next-card-desc">
                Inspect the 81-byte Anchor binary header, canonical PDA seeds, 3 supported scalars, and fail-closed error catalog.
              </p>
              <span className="next-arrow">View Spec <ArrowRight size={13} /></span>
            </Link>

            <Link href="/docs/latest#playground" className="next-card">
              <span className="next-tag">INTERACTIVE REFERENCE</span>
              <h3 className="next-card-title">Live Devnet Tool Explorer</h3>
              <p className="next-card-desc">
                Browse the 4 reference vault tools directly in your browser with parameter schemas, accounts, and simulation CUs.
              </p>
              <span className="next-arrow">Open Explorer <ArrowRight size={13} /></span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .quickstart-page-shell {
          min-height: 100vh;
          background: #000000;
          color: #ffffff;
          overflow-x: clip;
        }

        .quickstart-main-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 40px 20px 80px 20px;
        }

        .qs-header {
          margin-bottom: 40px;
        }

        .qs-breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 11px;
          color: #64748b;
          margin-bottom: 18px;
        }

        :global(.crumb-link) {
          color: #94a3b8;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        :global(.crumb-link:hover) {
          color: #ffffff;
        }

        .crumb-current {
          color: #38bdf8;
        }

        .qs-badge-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }

        .qs-badge {
          font-family: var(--font-mono);
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.08);
          border: 1px solid rgba(56, 189, 248, 0.25);
          padding: 3px 8px;
          border-radius: 3px;
        }

        .qs-tag {
          font-family: var(--font-mono);
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: #94a3b8;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 3px 8px;
          border-radius: 3px;
        }

        .qs-title {
          font-family: var(--font-serif);
          font-style: italic;
          font-size: clamp(2.4rem, 4.5vw, 3.4rem);
          font-weight: 400;
          color: #ffffff;
          margin: 0 0 16px 0;
          letter-spacing: -0.015em;
          line-height: 1.1;
        }

        .qs-subtitle {
          font-family: var(--font-sans);
          font-size: 16px;
          line-height: 1.6;
          color: #94a3b8;
          max-width: 820px;
          margin: 0;
        }

        /* Highlights Grid */
        .highlights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 14px;
          margin-bottom: 40px;
        }

        .highlight-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: #070709;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          padding: 16px;
        }

        .text-cyan { color: #38bdf8; }
        .text-emerald { color: #34d399; }
        .text-purple { color: #a78bfa; }

        .hl-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .hl-title {
          font-family: var(--font-sans);
          font-size: 13px;
          font-weight: 600;
          color: #f1f5f9;
        }

        .hl-desc {
          font-family: var(--font-sans);
          font-size: 12px;
          color: #94a3b8;
        }

        /* Step Cards */
        .qs-step-card {
          background: #070709;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 4px;
          padding: 32px 36px;
          margin-bottom: 24px;
          position: relative;
        }

        .step-num-pill {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #38bdf8;
          margin-bottom: 8px;
        }

        .step-heading {
          font-family: var(--font-sans);
          font-size: 20px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 10px 0;
          letter-spacing: -0.01em;
        }

        .step-body-p {
          font-family: var(--font-sans);
          font-size: 14px;
          line-height: 1.65;
          color: #cbd5e1;
          margin: 0 0 20px 0;
        }

        /* Prerequisites Grid */
        .prereq-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12px;
          margin-bottom: 18px;
        }

        .prereq-box {
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 3px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .prereq-name {
          font-family: var(--font-sans);
          font-size: 12.5px;
          font-weight: 600;
          color: #f1f5f9;
        }

        .prereq-ver {
          font-family: var(--font-mono);
          font-size: 11px;
          color: #94a3b8;
        }

        .prereq-cmd {
          font-family: var(--font-mono);
          font-size: 11.5px;
          color: #38bdf8;
          margin-top: 4px;
        }

        .tip-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: rgba(56, 189, 248, 0.04);
          border: 1px solid rgba(56, 189, 248, 0.18);
          border-radius: 3px;
          padding: 10px 14px;
          font-size: 12.5px;
          color: #cbd5e1;
        }

        .tip-box code {
          color: #38bdf8;
          font-family: var(--font-mono);
        }

        /* Code Cards */
        .code-card {
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 4px;
          overflow: hidden;
          margin: 14px 0;
        }

        .code-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 14px;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .code-title {
          font-family: var(--font-mono);
          font-size: 11px;
          color: #94a3b8;
        }

        .code-copy-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-family: var(--font-sans);
          font-size: 11px;
          color: #94a3b8;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 2px 6px;
          transition: color 0.15s ease;
        }

        .code-copy-btn:hover {
          color: #ffffff;
        }

        .code-block {
          margin: 0;
          padding: 14px 18px;
          font-family: var(--font-mono);
          font-size: 12.5px;
          color: #38bdf8;
          overflow-x: auto;
          line-height: 1.5;
        }

        /* Output Cards */
        .output-card {
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          overflow: hidden;
          margin-top: 10px;
        }

        .output-header {
          padding: 6px 14px;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .output-title {
          font-family: var(--font-mono);
          font-size: 10.5px;
          color: #64748b;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .output-block {
          margin: 0;
          padding: 14px 18px;
          font-family: var(--font-mono);
          font-size: 12px;
          color: #e2e8f0;
          overflow-x: auto;
          line-height: 1.6;
        }

        /* Terminal Window */
        .terminal-window {
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 4px;
          overflow: hidden;
          margin-top: 16px;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.8);
        }

        .terminal-header-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 9px 14px;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .terminal-dots {
          display: flex;
          gap: 6px;
        }

        .term-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
        }

        .terminal-bar-title {
          font-family: var(--font-mono);
          font-size: 11px;
          color: #94a3b8;
        }

        .terminal-stream-code {
          margin: 0;
          padding: 16px 20px;
          font-family: var(--font-mono);
          font-size: 12px;
          line-height: 1.6;
          color: #f1f5f9;
          overflow-x: auto;
        }

        /* Tables */
        .commands-table-wrapper {
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow-x: auto;
          background: #000000;
        }

        .qs-table {
          width: 100%;
          border-collapse: collapse;
          font-family: var(--font-sans);
          font-size: 13px;
        }

        .qs-table th {
          background: rgba(255, 255, 255, 0.03);
          padding: 10px 14px;
          text-align: left;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          border-right: 1px solid rgba(255, 255, 255, 0.06);
        }

        .qs-table td {
          padding: 10px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          color: #cbd5e1;
        }

        .qs-table tr:last-child td {
          border-bottom: none;
        }

        .qs-table code {
          font-family: var(--font-mono);
          font-size: 12px;
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.08);
          padding: 2px 6px;
          border-radius: 3px;
        }

        /* Next Steps */
        .qs-next-steps {
          margin-top: 56px;
          padding-top: 36px;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
        }

        .next-steps-title {
          font-family: var(--font-serif);
          font-style: italic;
          font-size: 28px;
          font-weight: 400;
          color: #ffffff;
          margin: 0 0 8px 0;
        }

        .next-steps-desc {
          font-family: var(--font-sans);
          font-size: 14px;
          color: #94a3b8;
          margin: 0 0 24px 0;
        }

        .next-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        :global(.next-card) {
          background: #070709;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-decoration: none;
          transition: all 0.15s ease;
        }

        :global(.next-card:hover) {
          background: #0d0d12;
          border-color: rgba(56, 189, 248, 0.4);
          transform: translateY(-2px);
        }

        .next-tag {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #38bdf8;
        }

        .next-card-title {
          font-family: var(--font-sans);
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .next-card-desc {
          font-family: var(--font-sans);
          font-size: 13px;
          line-height: 1.5;
          color: #94a3b8;
          margin: 0;
          flex: 1;
        }

        .next-arrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          color: #38bdf8;
          margin-top: 6px;
        }

        @media (max-width: 768px) {
          .qs-step-card {
            padding: 24px 20px;
          }
          .quickstart-main-container {
            padding: 24px 16px 60px 16px;
          }
        }
      `}</style>
    </div>
  );
}
