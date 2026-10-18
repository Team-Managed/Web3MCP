"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  Terminal,
  Shield,
  Zap,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PixelCanvas from "../components/PixelCanvas";

const PROGRAM_ID = "9zJzM4rHDPR4pd3vXHQjQ7whTVmx4zxB3ZH4Gb9iXRwD";
const CONFIG_PDA = "J8Ph37LoQsv4yED6USdupCooCZzsVMqJkgBTm9uSkvCw";
const installCommand = "npm install @web3mcp/sdk @solana/web3.js";
const discoverCommand = [
  "node --input-type=module <<'JS'",
  "import { Connection } from '@solana/web3.js';",
  "import { Web3McpSdk } from '@web3mcp/sdk';",
  "const programId = '" + PROGRAM_ID + "';",
  "const sdk = new Web3McpSdk({ connection: new Connection('https://api.devnet.solana.com') });",
  "await sdk.discover(programId);",
  "console.log(sdk.getTools(programId).map(({ name, solana }) => ({ name, kind: solana.kind })));",
  "JS",
].join("\n");
const readCommand = [
  "node --input-type=module <<'JS'",
  "import { Connection } from '@solana/web3.js';",
  "import { Web3McpSdk } from '@web3mcp/sdk';",
  "const programId = '" + PROGRAM_ID + "';",
  "const ownerAddress = 'Bp9Va3Qx9oFwme5uuXhDMdh2uUf3o8YHDBwcg4VYxc2L';",
  "const sdk = new Web3McpSdk({ connection: new Connection('https://api.devnet.solana.com') });",
  "await sdk.discover(programId);",
  "console.log(await sdk.executeRead('get_vault_by_owner', { ownerAddress }, { programId }));",
  "JS",
].join("\n");

export default function QuickstartPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="quickstart-page-shell">
      {/* Subtle Static Pixel Margin Backdrop with low density */}
      <div className="qs-pixel-bg-wrapper">
        <PixelCanvas density="low" transparentBg isStatic />
      </div>

      <Navbar />

      <main className="quickstart-main-container">
        <header className="qs-header">
          <div className="qs-breadcrumb">
            <Link href="/" className="crumb-link">Home</Link>
            <ChevronRight size={12} className="crumb-sep" />
            <span className="crumb-current">Quickstart</span>
          </div>
          <div className="qs-badge-row">
            <span className="qs-badge">WEB3MCP PROTOCOL</span>
            <span className="qs-tag">SOLANA DEVNET</span>
          </div>
          <h1 className="qs-title">Discover on-chain tools</h1>
          <p className="qs-subtitle">
            Start with a program ID. Read its config PDA, load its published tools,
            and use them through Solana RPC.
          </p>
        </header>

        <div className="highlights-grid">
          <div className="highlight-card">
            <Zap size={16} className="text-cyan" />
            <div className="hl-text">
              <span className="hl-title">01 · Publish</span>
              <span className="hl-desc">A program owns and updates its config PDA.</span>
            </div>
          </div>
          <div className="highlight-card">
            <Terminal size={16} className="text-purple" />
            <div className="hl-text">
              <span className="hl-title">02 · Discover</span>
              <span className="hl-desc">A compatible host loads validated tools on demand.</span>
            </div>
          </div>
          <div className="highlight-card">
            <Shield size={16} className="text-emerald" />
            <div className="hl-text">
              <span className="hl-title">03 · Use</span>
              <span className="hl-desc">Reads use RPC; writes require wallet approval.</span>
            </div>
          </div>
        </div>

        <section className="qs-step-card" id="step-prerequisites">
          <div className="step-num-pill">[ 01 ]</div>
          <h2 className="step-heading">Start with a program ID</h2>
          <p className="step-body-p">
            Web3MCP starts from the target Solana program ID. This Devnet vault is a reference program;
            its tools are published in a PDA owned by the same program.
          </p>
          <div className="prereq-grid">
            <div className="prereq-box">
              <span className="prereq-name">Program ID</span>
              <span className="prereq-ver">Reference vault on Devnet</span>
              <code className="prereq-cmd">{PROGRAM_ID}</code>
            </div>
            <div className="prereq-box">
              <span className="prereq-name">Config PDA</span>
              <span className="prereq-ver">Seeds: web3mcp + config</span>
              <code className="prereq-cmd">{CONFIG_PDA}</code>
            </div>
            <div className="prereq-box">
              <span className="prereq-name">RPC</span>
              <span className="prereq-ver">Solana Devnet</span>
              <code className="prereq-cmd">api.devnet.solana.com</code>
            </div>
          </div>
        </section>

        <section className="qs-step-card" id="step-launch">
          <div className="step-num-pill">[ 02 ]</div>
          <h2 className="step-heading">Install the SDK</h2>
          <p className="step-body-p">
            In a Node.js 20 or later project, install the SDK and Solana library.
          </p>
          <div className="code-card">
            <div className="code-header">
              <span className="code-title">Install from npm</span>
              <button onClick={() => handleCopy("install", installCommand)} className="code-copy-btn">
                {copiedId === "install" ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedId === "install" ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <pre className="code-block"><code>{installCommand}</code></pre>
          </div>
        </section>

        <section className="qs-step-card" id="step-discovery">
          <div className="step-num-pill">[ 03 ]</div>
          <h2 className="step-heading">Discover the published tools</h2>
          <p className="step-body-p">
            The SDK derives the config PDA, fetches it through RPC, and validates its ownership,
            status, digest, manifest, and IDL before returning tools.
          </p>
          <div className="code-card">
            <div className="code-header">
              <span className="code-title">Discover through Solana RPC</span>
              <button onClick={() => handleCopy("discover", discoverCommand)} className="code-copy-btn">
                {copiedId === "discover" ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedId === "discover" ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <pre className="code-block"><code>{discoverCommand}</code></pre>
          </div>
        </section>

        <section className="qs-step-card" id="step-read">
          <div className="step-num-pill">[ 04 ]</div>
          <h2 className="step-heading">Read an account</h2>
          <p className="step-body-p">
            The published <code>get_vault_by_owner</code> tool derives a vault PDA from an owner public key.
            The SDK verifies the returned account before decoding it. This read needs no signature.
          </p>
          <div className="code-card">
            <div className="code-header">
              <span className="code-title">Read a reference vault</span>
              <button onClick={() => handleCopy("read", readCommand)} className="code-copy-btn">
                {copiedId === "read" ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedId === "read" ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <pre className="code-block"><code>{readCommand}</code></pre>
          </div>
        </section>

        <section className="qs-step-card" id="step-approval">
          <div className="step-num-pill">[ 05 ]</div>
          <h2 className="step-heading">Prepare a write for approval</h2>
          <p className="step-body-p">
            For a published instruction such as <code>deposit</code>, a compatible host validates
            arguments, resolves accounts, constructs one instruction, and simulates the transaction.
            The user reviews the exact message before their wallet signs. The SDK rejects a changed
            signed message.
          </p>
          <div className="tip-box">
            <div className="tip-icon">🔐</div>
            <div className="tip-content">
              The model proposes tool calls. It never holds the private key or authorizes a signature.
            </div>
          </div>
        </section>

        <section className="qs-next-steps">
          <h2 className="next-steps-title">Continue</h2>
          <p className="next-steps-desc">
            Read the protocol rules, publish your program's tools, or integrate the Node.js SDK.
          </p>
          <div className="next-grid">
            <Link href="/docs/latest#protocol-spec" className="next-card">
              <span className="next-tag">PROTOCOL</span>
              <h3 className="next-card-title">Protocol profile</h3>
              <p className="next-card-desc">See discovery, bindings, and version rules.</p>
              <span className="next-arrow">Read spec <ArrowRight size={13} /></span>
            </Link>
            <Link href="/docs/latest#publisher-guide" className="next-card">
              <span className="next-tag">PROGRAM PUBLISHER</span>
              <h3 className="next-card-title">Publish tools</h3>
              <p className="next-card-desc">Add a config PDA to your Solana program.</p>
              <span className="next-arrow">Read guide <ArrowRight size={13} /></span>
            </Link>
            <Link href="/docs/latest#typescript-sdk" className="next-card">
              <span className="next-tag">NODE.JS SDK</span>
              <h3 className="next-card-title">@web3mcp/sdk</h3>
              <p className="next-card-desc">Add protocol support to a Node.js agent host.</p>
              <span className="next-arrow">Read SDK guide <ArrowRight size={13} /></span>
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
          position: relative;
          overflow-x: clip;
        }

        .qs-pixel-bg-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
          opacity: 0.75;
        }

        .quickstart-main-container {
          position: relative;
          z-index: 1;
          max-width: var(--site-content-max);
          margin: 0 auto;
          padding: 40px 24px 80px 24px;
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
          font-size: 14px;
          font-weight: 600;
          color: #f1f5f9;
        }

        .hl-desc {
          font-family: var(--font-sans);
          font-size: 13.5px;
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
          font-size: 16px;
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
          font-size: 14px;
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
          font-size: 14px;
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
          background: #262626;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .terminal-bar-title {
          font-family: var(--font-mono);
          font-size: 11px;
          color: #94a3b8;
        }

        .terminal-cli-canvas {
          background: #000000;
          padding: 22px 22px;
          font-family: var(--font-mono);
        }

        .cli-flow-view {
          display: flex;
          flex-direction: column;
          gap: 11px;
          font-family: var(--font-mono);
          font-size: 11px;
          line-height: 1.5;
          color: #e2e8f0;
        }

        .cli-session-meta {
          color: #64748b;
          font-size: 10px;
        }

        .cli-user-command {
          color: #ffffff;
          font-size: 11.5px;
          font-weight: 500;
        }

        .cli-thinking-state {
          color: #64748b;
          font-size: 10px;
        }

        .cli-tool-invocation {
          display: flex;
          align-items: baseline;
          gap: 6px;
          font-size: 10.5px;
          color: #cbd5e1;
        }

        .bullet-sym {
          color: #ffffff;
          font-weight: 700;
          font-size: 12px;
        }

        .tool-hl {
          color: #ffffff;
          font-weight: 600;
        }

        .tag-write {
          color: #f59e0b;
          font-weight: 600;
          font-size: 9.5px;
        }

        .cli-invocation-res {
          display: flex;
          align-items: center;
          gap: 6px;
          padding-left: 14px;
          font-size: 10px;
          color: #e2e8f0;
        }

        .check-mark {
          color: #e2e8f0;
          font-weight: 700;
        }

        .cli-rule {
          color: #333333;
          font-size: 10px;
          letter-spacing: -0.05em;
          margin: 2px 0;
          overflow: hidden;
          white-space: nowrap;
          user-select: none;
        }

        .cli-review-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .r-title {
          font-weight: 700;
          color: #ffffff;
          font-size: 11px;
          letter-spacing: 0.05em;
        }

        .cli-review-fields {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .rf-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-size: 11px;
          gap: 12px;
        }

        .rf-k { color: #64748b; flex-shrink: 0; }
        .rf-v { color: #ffffff; text-align: right; word-break: break-all; }

        .cli-wallet-prompt {
          color: #ffffff;
          font-weight: 600;
          font-size: 11px;
          line-height: 1.4;
          margin-top: 2px;
        }

        .cursor-blink {
          display: inline-block;
          color: #ffffff;
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .text-dim { color: #71717a; }
        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }

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
          font-size: 14px;
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
          font-size: 16px;
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
          font-size: 14px;
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
