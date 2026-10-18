"use client";

import React from "react";
import Link from "next/link";
import { Terminal, Database, Code } from "lucide-react";

export default function HomeStoryGrid() {

  return (
    <div className="home-story-grid" id="story-grid">
      {/* Sticky Left Column: Terminal / Interactive Stage */}
      <div className="landing-stage">
        <figure className="surface-panel figure-frame landing-demo-figure">
          <span className="figure-corner figure-corner--tl" aria-hidden="true"></span>
          <span className="figure-corner figure-corner--tr" aria-hidden="true"></span>
          <span className="figure-corner figure-corner--bl" aria-hidden="true"></span>
          <span className="figure-corner figure-corner--br" aria-hidden="true"></span>

          {/* Terminal Stage Header */}
          <div className="stage-header">
            <div className="stage-controls">
              <span className="ctrl red"></span>
              <span className="ctrl yellow"></span>
              <span className="ctrl green"></span>
            </div>
            <span className="stage-title">web3mcp-host &middot; Terminal Review Card</span>
            <div className="stage-live-badge">
              <span className="live-dot"></span>
              <span>LIVE RPC</span>
            </div>
          </div>

          {/* Static Chrome Sub-bar (Pure Display, Non-Interactive) */}
          <div className="stage-sub-bar" aria-hidden="true">
            <div className="tab-pill-active">
              <Terminal size={12} />
              <span>Review Card</span>
            </div>
            <div className="tab-pill-dim">
              <Database size={12} />
              <span>81-Byte Layout</span>
            </div>
            <div className="tab-pill-dim">
              <Code size={12} />
              <span>Devnet Tools</span>
            </div>
          </div>

          {/* Terminal CLI Screen */}
          <div className="stage-screen">
            <div className="terminal-header-line">
              <span className="prompt">$</span> npm run host:agent -- --model gemini-3.8-flash
            </div>
            <div className="terminal-log-dim">
              [15:23:40] Verified executable program: GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv
              <br />
              [15:23:41] Discovered Config PDA: HfA1ExZS1cgYR5k5GEJmsQfyAcDK2J9NPi7p97dU3WLD
              <br />
              [15:23:41] SHA-256 digest matched on-chain checksum (status: 2 Published)
              <br />
              [15:23:41] Dynamic Borsh coders compiled for 4 tools (0 imported IDLs)
            </div>

            {/* High Contrast Review Card */}
            <div className="terminal-review-card">
              <div className="card-top-bar">
                <span className="card-label">TRANSACTION REVIEW</span>
                <span className="card-badge">PRE-SIMULATED</span>
              </div>
              <div className="review-row">
                <span className="rk">Program:</span>
                <span className="rv">GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv</span>
              </div>
              <div className="review-row">
                <span className="rk">Tool:</span>
                <span className="rv highlight">deposit</span>
              </div>
              <div className="review-row">
                <span className="rk">Amount:</span>
                <span className="rv">100,000,000 lamports (0.1 SOL)</span>
              </div>
              <div className="review-row">
                <span className="rk">Signer:</span>
                <span className="rv">7xKXtG2CW87d97TXJSDpbd5jBkheTqA83TZRuJosgAsU</span>
              </div>
              <div className="review-row">
                <span className="rk">Derived PDA:</span>
                <span className="rv">HfA1ExZS1cgYR5k5GEJmsQfyAcDK2J9NPi7p97dU3WLD</span>
              </div>
              <div className="review-row">
                <span className="rk">Compute Units:</span>
                <span className="rv">4,563 CUs</span>
              </div>
              <div className="review-row">
                <span className="rk">Network Fee:</span>
                <span className="rv">5,000 lamports</span>
              </div>
              <div className="review-row">
                <span className="rk">Effects:</span>
                <span className="rv">Transfers native SOL to on-chain vault</span>
              </div>
              <div className="prompt-action">
                <span className="prompt-q">? Approve and broadcast transaction to Devnet? [y/N] &rsaquo; </span>
                <span className="cursor-blink">_</span>
              </div>
            </div>
          </div>

          <figcaption className="figure-caption figure-caption--terminal">
            <span className="figure-caption-title">Fig. 01 | Web3MCP Host Execution & Verification Seam</span>
            <span className="figure-caption-live-dot"></span>
          </figcaption>
        </figure>
      </div>

      {/* Right Column: Narrative Story Sections */}
      <div className="landing-copy">
        <div className="landing-sections">
          {/* Section 1 */}
          <div className="section" id="why">
            <h2 className="section-title">Why Web3MCP?</h2>
            <p>
              AI agents connecting to Solana today rely on off-chain npm packages, centralized tool registries, or fragile hardcoded client code. When a program upgrades or adds an instruction, every agent integration breaks.
            </p>
            <p>
              Web3MCP brings self-sovereign discovery to Solana: programs publish typed tool declarations and an embedded Anchor IDL directly into a canonical on-chain Config PDA. Agent hosts discover capabilities dynamically by querying the deployed Program ID over standard Solana RPC.
            </p>
            <p>
              Zero centralized dependencies: no MCP server daemon, no target-program website, and no third-party API indexer required. The host discovers, decodes, and simulates capabilities using generic Solana RPC.
            </p>
            <div className="docs-action">
              <Link href="/docs/latest" className="story-cta-box">
                [ Read Documentation ]
              </Link>
            </div>
          </div>

          {/* Section 2 */}
          <div className="section" id="discovery">
            <h2 className="section-title">Self-Sovereign On-Chain Discovery</h2>
            <p>
              Programs publish tool declarations in canonical PDAs derived deterministically from seeds <code>[&quot;web3mcp&quot;, &quot;config&quot;]</code> and the target Program ID.
            </p>
            <p>
              Uploads stream in MTU-safe chunks via a 3-step lifecycle (<code>initialize_config</code> &rarr; <code>write_config_chunk</code> &rarr; <code>finalize_config</code>). The account reallocates dynamically up to a 64 KiB cap. Finalization verifies the SHA-256 digest on-chain using Solana&apos;s native <code>sol_sha256</code> syscall before transitioning status to <code>2 (Published)</code>.
            </p>
            <p>
              Agent hosts fail closed: any account in status <code>0 (Uninitialized)</code> or <code>1 (Uploading)</code>, with a mismatched SHA-256 digest, or exceeding 64 KiB is rejected immediately before reaching the language model.
            </p>
          </div>

          {/* Section 3 */}
          <div className="section" id="models">
            <h2 className="section-title">Model-Agnostic JSON Schema & Strict Typing</h2>
            <p>
              Web3MCP exposes discovered tools strictly conforming to standard JSON Schema with <code>additionalProperties: false</code>. Connect directly to OpenAI, Anthropic Claude, Google Gemini, Groq, DeepSeek, or local Ollama with zero proprietary adapter layers or Zod shims.
            </p>
            <p>
              Protocol inputs are restricted to three scalar primitives: <code>u64</code> (decimal strings), <code>boolean</code>, and <code>publicKey</code> (Base58 strings). This eliminates numeric precision loss, IEEE-754 floating-point ambiguity, and schema hallucination.
            </p>
            <p>
              Strict host decoupling: the host never imports the target program&apos;s source code or static IDL at build time. Runtime Borsh instruction encoders and account decoders are compiled on the fly directly from the on-chain IDL.
            </p>
          </div>

          {/* Section 4 */}
          <div className="section" id="resolution">
            <h2 className="section-title">Declarative Account Resolution & Simulation</h2>
            <p>
              Instruction accounts are resolved deterministically across four declarative tiers:
            </p>
            <ul className="story-list">
              <li><strong>signer</strong>: Connected user wallet public key.</li>
              <li><strong>input</strong>: Parameter validated against the tool&apos;s scalar <code>inputSchema</code>.</li>
              <li><strong>program</strong>: Fixed on-chain addresses (e.g. Solana System Program <code>11111111111111111111111111111111</code>).</li>
              <li><strong>idl</strong>: Program-derived addresses (PDAs) evaluated dynamically from IDL seed declarations (<code>const</code> byte slices, <code>account</code> references, <code>arg</code> values).</li>
            </ul>
            <p>
              Before wallet handoff, the host builds the transaction and simulates it against live Solana RPC (<code>connection.simulateTransaction</code>). This pre-flight check validates execution status, compute units consumed, and validator logs before requesting a signature.
            </p>
          </div>

          {/* Section 5 */}
          <div className="section" id="security">
            <h2 className="section-title">Zero Autonomous Signing & Interactive Review</h2>
            <p>
              The LLM suggests tool calls and parameter bindings. It <strong>never signs transactions</strong> and <strong>never holds private keys</strong>.
            </p>
            <p>
              Read-only tools (<code>accountRead</code>) query state via RPC <code>getAccountInfo</code>, verify program ownership and the Anchor 8-byte discriminator, decode binary data into structured JSON, and return it to the model loop without signature or fee.
            </p>
            <p>
              State-changing tools (<code>instruction</code>) halt execution and render a high-contrast Terminal Review Card displaying the target program, account privilege matrix, pre-simulated compute units, validator logs, and publisher effects. Signing occurs exclusively after explicit human keystroke confirmation (<code>[y/N]</code>).
            </p>
            <div className="docs-action">
              <Link href="/docs/latest" className="story-cta-box">
                [ Read Documentation ]
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .home-story-grid {
          width: 100%;
          max-width: 1320px;
          margin: 0 auto;
          padding: 60px 32px 140px 32px;
          display: grid;
          grid-template-columns: 520px 1fr;
          gap: 64px;
          position: relative;
          z-index: 10;
        }

        /* Sticky Left Column: stretches to full height of grid, inner figure is sticky */
        .landing-stage {
          position: relative;
          height: 100%;
        }

        .landing-demo-figure {
          position: sticky;
          top: 36px;
          border-radius: 4px;
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7);
          font-family: var(--font-mono);
        }

        .landing-demo-figure .figure-corner--tl {
          top: -1px;
          left: -1px;
          border-top: 2px solid #00C2FF;
          border-left: 2px solid #00C2FF;
        }

        .landing-demo-figure .figure-corner--tr {
          top: -1px;
          right: -1px;
          border-top: 2px solid #00C2FF;
          border-right: 2px solid #00C2FF;
        }

        .landing-demo-figure .figure-corner--bl {
          bottom: -1px;
          left: -1px;
          border-bottom: 2px solid #00C2FF;
          border-left: 2px solid #00C2FF;
        }

        .landing-demo-figure .figure-corner--br {
          bottom: -1px;
          right: -1px;
          border-bottom: 2px solid #00C2FF;
          border-right: 2px solid #00C2FF;
        }

        .stage-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 16px;
          background: #000000;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .stage-controls {
          display: flex;
          gap: 7px;
          align-items: center;
        }

        .ctrl {
          width: 9.5px;
          height: 9.5px;
          border-radius: 50%;
        }

        .ctrl.red { background: #ef4444; }
        .ctrl.yellow { background: #f59e0b; }
        .ctrl.green { background: #10b981; }

        .stage-title {
          font-family: var(--font-mono);
          font-size: 11.5px;
          color: #94a3b8;
          letter-spacing: 0.02em;
        }

        .stage-live-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: #10b981;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.35);
          padding: 3px 8px;
          border-radius: 4px;
        }

        .live-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #14F195;
          box-shadow: 0 0 6px #14F195;
        }

        .stage-sub-bar {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 9px 16px;
          background: #000000;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          pointer-events: none;
          user-select: none;
        }

        .tab-pill-active {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          color: #ffffff;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .tab-pill-dim {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 11px;
          color: #64748b;
        }

        .stage-screen {
          background: #000000;
          padding: 20px 22px;
          font-family: var(--font-mono);
          font-size: 11.5px;
        }

        .terminal-header-line {
          color: #ffffff;
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 12px;
          line-height: 1.4;
        }

        .terminal-header-line .prompt {
          color: #00C2FF;
          font-weight: 700;
          margin-right: 8px;
        }

        .terminal-log-dim {
          color: #64748b;
          font-size: 10.5px;
          line-height: 1.6;
          margin-bottom: 18px;
        }

        .terminal-review-card {
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 4px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .card-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .card-label {
          font-weight: 700;
          font-size: 11.5px;
          color: #ffffff;
          letter-spacing: 0.06em;
        }

        .card-badge {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.04em;
          padding: 2px 7px;
          border-radius: 4px;
          background: rgba(0, 194, 255, 0.08);
          border: 1px solid #005a78;
          color: #00C2FF;
        }

        .review-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-size: 11.5px;
          line-height: 1.45;
          gap: 16px;
        }

        .review-row .rk {
          color: #64748b;
          flex-shrink: 0;
        }

        .review-row .rv {
          color: #ffffff;
          text-align: right;
          word-break: break-all;
        }

        .review-row .highlight {
          color: #00C2FF;
          font-weight: 700;
        }

        .prompt-action {
          margin-top: 10px;
          padding-top: 12px;
          border-top: 1px dashed rgba(255, 255, 255, 0.14);
          color: #00C2FF;
          font-weight: 600;
          font-size: 11.5px;
          line-height: 1.4;
        }

        .cursor-blink {
          display: inline-block;
          color: #00C2FF;
          margin-left: 2px;
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .figure-caption--terminal {
          padding: 11px 18px;
          background: #000000;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: var(--font-mono);
          font-size: 11px;
          color: #64748b;
        }

        .figure-caption-live-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #14F195;
          box-shadow: 0 0 5px #14F195;
        }

        /* Right Narrative Column */
        .landing-copy {
          display: flex;
          flex-direction: column;
        }

        .landing-sections {
          display: flex;
          flex-direction: column;
          gap: 140px;
        }

        .section {
          display: flex;
          flex-direction: column;
          gap: 18px;
          min-height: 360px;
          justify-content: center;
        }

        .section-title {
          font-family: var(--font-serif);
          font-size: clamp(1.8rem, 3.2vw, 2.4rem);
          font-weight: 500;
          color: #ffffff;
          letter-spacing: -0.015em;
          margin-bottom: 4px;
        }

        .section p {
          font-family: var(--font-sans);
          font-size: 14.5px;
          line-height: 1.65;
          color: #cbd5e1;
          margin: 0;
        }

        .section code {
          background: rgba(255, 255, 255, 0.08);
          color: #00C2FF;
          font-family: var(--font-mono);
          font-size: 12.5px;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .story-list {
          list-style: none;
          padding-left: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin: 4px 0;
        }

        .story-list li {
          font-family: var(--font-sans);
          font-size: 14px;
          color: #cbd5e1;
          position: relative;
          padding-left: 18px;
        }

        .story-list li::before {
          content: '→';
          position: absolute;
          left: 0;
          color: #00C2FF;
          font-family: var(--font-mono);
        }

        .story-list li strong {
          color: #ffffff;
          font-family: var(--font-mono);
        }

        .docs-action {
          margin-top: 8px;
        }

        .story-cta-box {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 18px;
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          color: #ffffff;
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .story-cta-box:hover {
          background: #0a0a0c;
          border-color: rgba(255, 255, 255, 0.5);
          color: #ffffff;
          box-shadow: 0 0 12px rgba(255, 255, 255, 0.08);
        }

        @media (max-width: 1080px) {
          .home-story-grid {
            grid-template-columns: 1fr;
            gap: 48px;
            padding: 40px 24px 80px 24px;
          }
          .landing-stage {
            position: relative;
            height: auto;
          }
          .landing-demo-figure {
            position: relative;
            top: 0;
          }
          .landing-sections {
            gap: 64px;
          }
          .section {
            min-height: auto;
          }
        }

        @media (max-width: 640px) {
          .home-story-grid {
            padding: 24px 16px 64px 16px;
          }
          .byte-strip {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
