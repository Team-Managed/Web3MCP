"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface FeatureConfig {
  id: string;
  num: string;
  badge: string;
  stageTitle: string;
  figCaption: string;
}

const FEATURES: FeatureConfig[] = [
  {
    id: "discovery",
    num: "01",
    badge: "DYNAMIC ON-CHAIN DISCOVERY",
    stageTitle: "web3mcp-host · Discovery (gemini-3.8-flash)",
    figCaption: "Fig. 01 | On-Chain Tool Manifest Discovery (Zero Build-Time IDLs)",
  },
  {
    id: "reads",
    num: "02",
    badge: "FEE-FREE ACCOUNT READS",
    stageTitle: "web3mcp-host · Tool Query (get_vault)",
    figCaption: "Fig. 02 | Signature-Free State Query & Balance Check (Zero RPC Fees)",
  },
  {
    id: "schema",
    num: "03",
    badge: "SCALAR INPUT BOUNDS",
    stageTitle: "web3mcp-host · Conversational Guidance",
    figCaption: "Fig. 03 | Strict Schema Scalar Guidance & Conversational Fallback",
  },
  {
    id: "approval",
    num: "04",
    badge: "WALLET APPROVAL BOUNDARY",
    stageTitle: "web3mcp-host · Terminal Review Card",
    figCaption: "Fig. 04 | Pre-Flight Transaction Simulation & Wallet Approval Boundary",
  },
];

export default function HomeStoryGrid() {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const activeFeature = FEATURES[activeIdx] || FEATURES[0];

  useEffect(() => {
    const handleScroll = () => {
      const viewportMiddle = window.innerHeight * 0.45;
      let closestIdx = 0;
      let closestDistance = Infinity;

      FEATURES.forEach((feature, idx) => {
        const el = document.getElementById(feature.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          const elCenter = rect.top + rect.height * 0.35;
          const distance = Math.abs(elCenter - viewportMiddle);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIdx = idx;
          }
        }
      });

      setActiveIdx(closestIdx);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <section className="home-story-section" aria-labelledby="storySectionTitle">
      <div className="section-container">
        {/* Section Header */}
        <header className="section-header">
          <h2 id="storySectionTitle" className="section-main-title">
            How Web3MCP Works
          </h2>
          <p className="section-lead-subtitle">
            From dynamic on-chain discovery to fee-free account state inspection and wallet-approved transaction execution.
          </p>
        </header>

        <div className="home-story-grid" id="features-grid">
          {/* Sticky Left Column: Authentic CLI Terminal Stage */}
          <div className="landing-stage">
        <figure className="surface-panel figure-frame landing-demo-figure">
          <span className="figure-corner figure-corner--tl" aria-hidden="true"></span>
          <span className="figure-corner figure-corner--tr" aria-hidden="true"></span>
          <span className="figure-corner figure-corner--bl" aria-hidden="true"></span>
          <span className="figure-corner figure-corner--br" aria-hidden="true"></span>

          {/* CLI Terminal Header */}
          <div className="stage-header">
            <div className="stage-controls">
              <span className="ctrl"></span>
              <span className="ctrl"></span>
              <span className="ctrl"></span>
            </div>
            <span className="stage-title">{activeFeature.stageTitle}</span>
          </div>

          {/* Stage Canvas: Native CLI Stream aligned to user terminal */}
          <div className="stage-canvas">
            <div key={activeIdx} className="cli-terminal-stream">
              {/* =========================================================
                  FEATURE 01: AGENT BOOT & TOOL DISCOVERY
                  Matches exact CLI output upon launching host:agent
                  ========================================================= */}
              {activeIdx === 0 && (
                <div className="cli-flow-view">
                  <div className="cli-bash-line">
                    <span className="p-dollar">$</span>
                    <span className="p-cmd">npm run host:agent -- --model gemini-3.8-flash</span>
                  </div>

                  <div className="cli-section-block">
                    <div className="cli-bullet-heading">
                      <span className="bullet-sym">•</span>
                      <span className="heading-text">Web3MCP Agent</span>
                      <span className="heading-sub">(Solana Devnet)</span>
                    </div>
                    <div className="cli-kv-table">
                      <div className="kv-item">
                        <span className="kv-label">Program</span>
                        <span className="kv-value">GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv</span>
                      </div>
                      <div className="kv-item">
                        <span className="kv-label">Wallet</span>
                        <span className="kv-value">CniPSdkAUaNTfZZUSKvAKU2VJuWecRjqvGhDmQjGSZEG <span className="text-dim">(Connected)</span></span>
                      </div>
                      <div className="kv-item">
                        <span className="kv-label">Model</span>
                        <span className="kv-value">gemini-3.8-flash <span className="text-dim">(via gemini)</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="cli-section-block">
                    <div className="cli-sub-title">Discovered Tools (4):</div>
                    <div className="cli-tools-list">
                      <div className="tool-row">
                        <span className="t-dot">•</span>
                        <span className="t-name">get_vault</span>
                        <span className="t-tag tag-read">[read]</span>
                        <span className="t-desc">Reads on-chain account state for a specified program vault</span>
                      </div>
                      <div className="tool-row">
                        <span className="t-dot">•</span>
                        <span className="t-name">initialize</span>
                        <span className="t-tag tag-write">[write]</span>
                        <span className="t-desc">Initializes a personal vault PDA for depositing SOL</span>
                      </div>
                      <div className="tool-row">
                        <span className="t-dot">•</span>
                        <span className="t-name">deposit</span>
                        <span className="t-tag tag-write">[write]</span>
                        <span className="t-desc">Transfers SOL from connected wallet into program vault</span>
                      </div>
                      <div className="tool-row">
                        <span className="t-dot">•</span>
                        <span className="t-name">withdraw</span>
                        <span className="t-tag tag-write">[write]</span>
                        <span className="t-desc">Withdraws SOL from program vault back to connected wallet</span>
                      </div>
                    </div>
                  </div>

                  <div className="cli-dim-note">Commands: /help, /tools, /balance, /keygen, /clear, /exit</div>
                  <div className="cli-rule">────────────────────────────────────────────────────</div>
                  <div className="cli-session-meta">gemini-3.8-flash | devnet | GgVnzvsM...4Lyrgv</div>
                  <div className="cli-active-cursor">
                    <span className="cli-prompt-chevron">&gt;</span> <span className="cursor-blink">_</span>
                  </div>
                </div>
              )}

              {/* =========================================================
                  FEATURE 02: READ-ONLY TOOL CALL (can I withdraw 5 SOL?)
                  Matches exact CLI turn for get_vault on-chain read
                  ========================================================= */}
              {activeIdx === 1 && (
                <div className="cli-flow-view">
                  <div className="cli-session-meta">gemini-3.8-flash | devnet | GgVnzvsM...4Lyrgv</div>
                  <div className="cli-user-command">&gt; can I withdraw 5 SOL?</div>
                  <div className="cli-thinking-state">⠇ Thinking...</div>

                  <div className="cli-tool-invocation">
                    <span className="bullet-sym">•</span>
                    <span>Calling tool <span className="tool-hl">get_vault</span> <span className="t-tag tag-read">[read]</span>(vaultOwner: &quot;CniPSdkAUa...mQjGSZEG&quot;)...</span>
                  </div>
                  <div className="cli-invocation-res">
                    <span className="check-mark">✓</span>
                    <span>Query resolved successfully</span>
                  </div>

                  <div className="cli-section-block">
                    <div className="cli-bullet-heading">
                      <span className="bullet-sym">•</span>
                      <span className="heading-text">Vault Balance Check</span>
                    </div>
                    <div className="cli-kv-table">
                      <div className="kv-item">
                        <span className="kv-label">Vault Address:</span>
                        <span className="kv-value">7Nm9VsUWReKcBrheRDDjPqv6qB3Ag9UwxCabnd11TwXB</span>
                      </div>
                      <div className="kv-item">
                        <span className="kv-label">Owner:</span>
                        <span className="kv-value">CniPSdkAUaNTfZZUSKvAKU2VJuWecRjqvGhDmQjGSZEG</span>
                      </div>
                      <div className="kv-item">
                        <span className="kv-label">Current Balance:</span>
                        <span className="kv-value">35,001,000 lamports (~0.035 SOL)</span>
                      </div>
                    </div>
                  </div>

                  <div className="cli-section-block">
                    <div className="cli-alert-title text-amber">Insufficient Vault Balance</div>
                    <div className="cli-body-text">You cannot withdraw 5 SOL right now.</div>
                    <div className="cli-bullet-list">
                      <div>• Requested: 5 SOL (5,000,000,000 lamports)</div>
                      <div>• Available in Vault: ~0.035001 SOL (35,001,000 lamports)</div>
                      <div>• Shortfall: ~4.964999 SOL (4,964,999,000 lamports)</div>
                    </div>
                    <div className="cli-body-text text-dim">
                      The maximum amount you can withdraw from this vault is 35,001,000 lamports. Would you like to deposit additional SOL first?
                    </div>
                  </div>

                  <div className="cli-rule">────────────────────────────────────────────────────</div>
                  <div className="cli-session-meta">gemini-3.8-flash | devnet | GgVnzvsM...4Lyrgv</div>
                  <div className="cli-active-cursor">
                    <span className="cli-prompt-chevron">&gt;</span> <span className="cursor-blink">_</span>
                  </div>
                </div>
              )}

              {/* =========================================================
                  FEATURE 03: CONVERSATIONAL GUIDANCE (deposit 10% balance)
                  Matches exact CLI turn for scalar inputs & wallet guidance
                  ========================================================= */}
              {activeIdx === 2 && (
                <div className="cli-flow-view">
                  <div className="cli-session-meta">gemini-3.8-flash | devnet | GgVnzvsM...4Lyrgv</div>
                  <div className="cli-user-command">&gt; deposit 10% of my remaining wallet balance into the vault</div>
                  <div className="cli-thinking-state">⠇ Thinking...</div>

                  <div className="cli-section-block">
                    <div className="cli-bullet-heading">
                      <span className="bullet-sym">•</span>
                      <span className="heading-text">Wallet Balance Required</span>
                    </div>
                    <div className="cli-body-text">
                      The available on-chain tools allow reading vault PDA state (<span className="tool-hl">get_vault</span>), but do not include a direct query for your external wallet&apos;s native SOL balance.
                    </div>
                  </div>

                  <div className="cli-section-block">
                    <div className="cli-sub-title">How to Proceed</div>
                    <div className="cli-numbered-steps">
                      <div>1. State your current wallet SOL balance (e.g. &quot;my balance is 2.5 SOL&quot;), or</div>
                      <div>2. Specify the exact amount you want to deposit directly (e.g. &quot;deposit 0.1 SOL&quot;).</div>
                    </div>
                  </div>

                  <div className="cli-section-block">
                    <div className="cli-sub-title">Units and Considerations</div>
                    <div className="cli-bullet-list">
                      <div>• 1 SOL = 1,000,000,000 lamports (strict u64 decimal string)</div>
                      <div>• Always leave a small amount of SOL (at least 0.005 SOL) to cover network fees.</div>
                    </div>
                    <div className="cli-body-text text-dim">
                      Once you provide the amount, I will prepare the deposit transaction for your wallet review.
                    </div>
                  </div>

                  <div className="cli-rule">────────────────────────────────────────────────────</div>
                  <div className="cli-session-meta">gemini-3.8-flash | devnet | GgVnzvsM...4Lyrgv</div>
                  <div className="cli-active-cursor">
                    <span className="cli-prompt-chevron">&gt;</span> <span className="cursor-blink">_</span>
                  </div>
                </div>
              )}

              {/* =========================================================
                  FEATURE 04: TRANSACTION REVIEW CARD & WALLET APPROVAL
                  Matches exact CLI Terminal Review Card
                  ========================================================= */}
              {activeIdx === 3 && (
                <div className="cli-flow-view">
                  <div className="cli-session-meta">gemini-3.8-flash | devnet | GgVnzvsM...4Lyrgv</div>
                  <div className="cli-user-command">&gt; deposit 0.1 SOL into the vault</div>
                  <div className="cli-thinking-state">⠇ Thinking...</div>

                  <div className="cli-tool-invocation">
                    <span className="bullet-sym">•</span>
                    <span>Calling tool <span className="tool-hl">deposit</span> <span className="t-tag tag-write">[write]</span>(amount: &quot;100000000&quot;)...</span>
                  </div>
                  <div className="cli-invocation-res">
                    <span className="check-mark">✓</span>
                    <span>Simulated successfully against Devnet RPC (4,563 CUs)</span>
                  </div>

                  <div className="cli-rule">────────────────────────────────────────────────────</div>
                  <div className="cli-review-title-row">
                    <span className="r-title">TRANSACTION REVIEW</span>
                  </div>
                  <div className="cli-rule">────────────────────────────────────────────────────</div>

                  <div className="cli-review-fields">
                    <div className="rf-row">
                      <span className="rf-k">Program:</span>
                      <span className="rf-v">GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv</span>
                    </div>
                    <div className="rf-row">
                      <span className="rf-k">Tool:</span>
                      <span className="rf-v tool-hl font-bold">deposit</span>
                    </div>
                    <div className="rf-row">
                      <span className="rf-k">Amount:</span>
                      <span className="rf-v font-semibold">100,000,000 lamports (0.1 SOL)</span>
                    </div>
                    <div className="rf-row">
                      <span className="rf-k">Signer:</span>
                      <span className="rf-v text-dim">CniPSdkAUaNTfZZUSKvAKU2VJuWecRjqvGhDmQjGSZEG</span>
                    </div>
                    <div className="rf-row">
                      <span className="rf-k">Derived PDA:</span>
                      <span className="rf-v text-dim">HfA1ExZS1cgYR5k5GEJmsQfyAcDK2J9NPi7p97dU3WLD</span>
                    </div>
                    <div className="rf-row">
                      <span className="rf-k">Compute Units:</span>
                      <span className="rf-v text-dim">4,563 CUs</span>
                    </div>
                    <div className="rf-row">
                      <span className="rf-k">Network Fee:</span>
                      <span className="rf-v text-dim">5,000 lamports</span>
                    </div>
                    <div className="rf-row">
                      <span className="rf-k">Effects:</span>
                      <span className="rf-v">Transfers native SOL to on-chain vault</span>
                    </div>
                  </div>

                  <div className="cli-rule">────────────────────────────────────────────────────</div>
                  <div className="cli-wallet-prompt">
                    <span className="prompt-q-text">? Approve and broadcast transaction to Devnet? [y/N] › </span>
                    <span className="cursor-blink">_</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </figure>
      </div>

      {/* Right Column: Narrative Story Sections */}
      <div className="landing-copy">
        <div className="landing-sections">
          {/* Section 1 */}
          <div className={`section ${activeIdx === 0 ? "active-story-section" : ""}`} id="discovery">
            <div className="section-eyebrow-tag">
              <span className="eyebrow-num">01</span>
              <span className="eyebrow-sep">/</span>
              <span className="eyebrow-title">DYNAMIC ON-CHAIN DISCOVERY</span>
            </div>
            <h2 className="section-title">Program Discovery &amp; Tool Manifests</h2>
            <p>
              Smart contracts publish typed tool declarations directly into canonical on-chain Config PDAs derived from seeds <code>[&quot;web3mcp&quot;, &quot;config&quot;]</code>.
            </p>
            <p>
              When an agent host starts up, it queries the target Program ID over standard Solana RPC. It discovers available tools dynamically (<code>get_vault</code>, <code>initialize</code>, <code>deposit</code>, <code>withdraw</code>) and JIT-compiles dynamic Borsh encoders with zero build-time IDL imports.
            </p>
            <p>
              If a program upgrades and adds or modifies instructions on-chain, every connected agent across the network automatically discovers the changes without code redeployments or package updates.
            </p>
          </div>

          {/* Section 2 */}
          <div className={`section ${activeIdx === 1 ? "active-story-section" : ""}`} id="reads">
            <div className="section-eyebrow-tag">
              <span className="eyebrow-num">02</span>
              <span className="eyebrow-sep">/</span>
              <span className="eyebrow-title">FEE-FREE ACCOUNT READS</span>
            </div>
            <h2 className="section-title">Signature-Free State Inspection</h2>
            <p>
              Autonomous agents frequently need to query account balances, inspect treasury state, or verify token reserves before proposing a transaction.
            </p>
            <p>
              Read-only tools (<code>accountRead</code>) execute via standard Solana RPC <code>getAccountInfo</code>. The host verifies program ownership and the Anchor 8-byte discriminator, deserializes binary PDA data into structured JSON, and returns it directly to the model loop.
            </p>
            <p>
              Point-in-time state inspection requires <strong>0 network transaction fees</strong>, <strong>0 wallet signatures</strong>, and executes with sub-second RPC latency.
            </p>
          </div>

          {/* Section 3 */}
          <div className={`section ${activeIdx === 2 ? "active-story-section" : ""}`} id="schema">
            <div className="section-eyebrow-tag">
              <span className="eyebrow-num">03</span>
              <span className="eyebrow-sep">/</span>
              <span className="eyebrow-title">SCALAR INPUT BOUNDS</span>
            </div>
            <h2 className="section-title">Strict Typing &amp; Conversational Guidance</h2>
            <p>
              Protocol inputs are strictly restricted to three scalar primitives: <code>u64</code> (decimal strings), <code>boolean</code>, and <code>publicKey</code> (Base58 strings). This eliminates numeric precision loss, IEEE-754 floating-point ambiguity, and schema hallucinations.
            </p>
            <p>
              When a user prompt involves relative or missing values (such as &quot;deposit 10% of my wallet balance&quot;), the agent host fails safe. Because external native SOL balances require wallet context, the model informs the user and conversationally requests exact lamports or SOL amounts.
            </p>
            <p>
              Agents never guess or hallucinate parameters; every argument is validated against normative JSON Schema with <code>additionalProperties: false</code>.
            </p>
          </div>

          {/* Section 4 */}
          <div className={`section ${activeIdx === 3 ? "active-story-section" : ""}`} id="approval">
            <div className="section-eyebrow-tag">
              <span className="eyebrow-num">04</span>
              <span className="eyebrow-sep">/</span>
              <span className="eyebrow-title">WALLET APPROVAL BOUNDARY</span>
            </div>
            <h2 className="section-title">Zero Autonomous Signing &amp; Review Cards</h2>
            <p>
              The language model proposes tool calls and parameter bindings. It <strong>never signs transactions</strong> and <strong>never holds private keys</strong>.
            </p>
            <p>
              State-changing tools (<code>instruction</code>) halt execution immediately. The host resolves accounts across 4 declarative tiers, simulates the transaction on live Solana RPC (<code>simulateTransaction</code>), and displays the high-contrast Terminal Review Card.
            </p>
            <p>
              Signing occurs exclusively after explicit human keystroke confirmation (<code>[y/N]</code>). If aborted or denied, the transaction is discarded without on-chain side effects or key exposure.
            </p>
            <div className="docs-action">
              <Link href="/docs/latest" className="story-cta-box">
                [ Read Protocol Specification ]
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

      <style jsx>{`
        .home-story-section {
          width: 100%;
          padding: 80px 32px 140px 32px;
          background: #000000;
          position: relative;
          z-index: 10;
        }

        .section-container {
          max-width: 1320px;
          margin: 0 auto;
        }

        .section-header {
          max-width: 860px;
          margin-bottom: 56px;
        }

        .section-main-title {
          font-family: var(--font-serif);
          font-size: clamp(2.4rem, 4.2vw, 3.2rem);
          font-weight: 500;
          color: #ffffff;
          letter-spacing: -0.015em;
          margin: 0 0 16px 0;
          line-height: 1.15;
        }

        .section-lead-subtitle {
          font-family: var(--font-sans);
          font-size: clamp(1.05rem, 1.4vw, 1.15rem);
          line-height: 1.65;
          color: #a3a3a3;
          margin: 0;
        }

        .home-story-grid {
          width: 100%;
          display: grid;
          grid-template-columns: 530px 1fr;
          gap: 64px;
          position: relative;
        }

        /* Sticky Left Column */
        .landing-stage {
          position: relative;
          height: 100%;
        }

        .landing-demo-figure {
          position: sticky;
          top: 88px;
          border-radius: 4px;
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7);
          font-family: var(--font-mono);
          overflow: hidden;
        }

        .landing-demo-figure .figure-corner--tl {
          top: -1px;
          left: -1px;
          border-top: 2px solid rgba(255, 255, 255, 0.3);
          border-left: 2px solid rgba(255, 255, 255, 0.3);
        }

        .landing-demo-figure .figure-corner--tr {
          top: -1px;
          right: -1px;
          border-top: 2px solid rgba(255, 255, 255, 0.3);
          border-right: 2px solid rgba(255, 255, 255, 0.3);
        }

        .landing-demo-figure .figure-corner--bl {
          bottom: -1px;
          left: -1px;
          border-bottom: 2px solid rgba(255, 255, 255, 0.3);
          border-left: 2px solid rgba(255, 255, 255, 0.3);
        }

        .landing-demo-figure .figure-corner--br {
          bottom: -1px;
          right: -1px;
          border-bottom: 2px solid rgba(255, 255, 255, 0.3);
          border-right: 2px solid rgba(255, 255, 255, 0.3);
        }

        /* Stage Window Header */
        .stage-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 11px 18px;
          background: #000000;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .stage-controls {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .ctrl {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #262626;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .stage-title {
          font-family: var(--font-mono);
          font-size: 11px;
          color: #94a3b8;
          letter-spacing: 0.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Stage Canvas: Authentic CLI Terminal Styling */
        .stage-canvas {
          background: #000000;
          padding: 22px 22px;
          min-height: 490px;
          display: flex;
          flex-direction: column;
        }

        .cli-terminal-stream {
          animation: streamFade 0.2s ease-out;
          width: 100%;
        }

        @keyframes streamFade {
          from {
            opacity: 0.25;
            transform: translateY(2px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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

        /* Shell command line */
        .cli-bash-line {
          font-size: 11.5px;
          line-height: 1.4;
          margin-bottom: 2px;
          word-break: break-all;
        }

        /* Shell command line */
        .cli-bash-line {
          font-size: 11.5px;
          line-height: 1.4;
          margin-bottom: 2px;
          word-break: break-all;
        }

        .p-dollar { color: #a3a3a3; margin-right: 6px; font-weight: 700; }
        .p-cmd { color: #ffffff; font-weight: 500; }

        /* Block & Section Headings */
        .cli-section-block {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .cli-bullet-heading {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .bullet-sym {
          color: #ffffff;
          font-weight: 700;
          font-size: 12px;
        }

        .heading-text {
          color: #ffffff;
          font-weight: 700;
        }

        .heading-sub {
          color: #64748b;
          font-size: 10.5px;
        }

        .cli-sub-title {
          color: #ffffff;
          font-weight: 600;
          font-size: 11px;
          margin-top: 2px;
        }

        /* Key-Value table */
        .cli-kv-table {
          display: flex;
          flex-direction: column;
          gap: 2.5px;
          padding-left: 14px;
        }

        .kv-item {
          display: grid;
          grid-template-columns: 88px 1fr;
          gap: 8px;
          align-items: baseline;
          font-size: 10.5px;
        }

        .kv-label {
          color: #64748b;
        }

        .kv-value {
          color: #e2e8f0;
          word-break: break-all;
        }

        /* Tools List */
        .cli-tools-list {
          display: flex;
          flex-direction: column;
          gap: 2.5px;
          padding-left: 14px;
        }

        .tool-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
          font-size: 10.5px;
        }

        .t-dot { color: #64748b; }
        .t-name { color: #ffffff; font-weight: 600; min-width: 76px; }
        .t-tag { font-size: 9.5px; font-weight: 600; min-width: 44px; }
        .tag-read { color: #a3a3a3; }
        .tag-write { color: #f59e0b; }
        .t-desc { color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .cli-dim-note {
          color: #64748b;
          font-size: 10px;
          margin-top: 2px;
        }

        /* Divider & Turn Meta */
        .cli-rule {
          color: #333333;
          font-size: 10px;
          letter-spacing: -0.05em;
          margin: 2px 0;
          overflow: hidden;
          white-space: nowrap;
          user-select: none;
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

        /* Tool Invocation */
        .cli-tool-invocation {
          display: flex;
          align-items: baseline;
          gap: 6px;
          font-size: 10.5px;
          color: #cbd5e1;
        }

        .tool-hl {
          color: #ffffff;
          font-weight: 600;
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

        /* Body & Bullet Content */
        .cli-body-text {
          font-size: 10.5px;
          line-height: 1.5;
          color: #cbd5e1;
        }

        .cli-alert-title {
          font-weight: 700;
          font-size: 11px;
        }

        .cli-bullet-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-left: 10px;
          font-size: 10px;
          color: #cbd5e1;
        }

        .cli-numbered-steps {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-left: 10px;
          font-size: 10px;
          color: #cbd5e1;
        }

        /* Review Card Rows in CLI */
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

        .cli-active-cursor {
          display: flex;
          align-items: center;
          font-size: 11.5px;
          color: #ffffff;
        }

        .cli-prompt-chevron {
          margin-right: 4px;
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

        .text-cyan { color: #ffffff; }
        .text-amber { color: #f59e0b; }
        .text-dim { color: #71717a; }
        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }

        /* Right Narrative Column */
        .landing-copy {
          display: flex;
          flex-direction: column;
        }

        .landing-sections {
          display: flex;
          flex-direction: column;
          gap: 120px;
        }

        .section {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: 380px;
          justify-content: center;
          padding: 24px 20px;
          border-left: 2px solid transparent;
          border-radius: 0 6px 6px 0;
          transition: all 0.25s ease;
        }

        .active-story-section {
          border-left-color: #00C2FF;
          background: linear-gradient(90deg, rgba(0, 194, 255, 0.03) 0%, transparent 100%);
        }

        .section-eyebrow-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.08em;
          color: #64748b;
        }

        .eyebrow-num {
          font-weight: 700;
          color: #00C2FF;
        }

        .eyebrow-sep {
          color: rgba(255, 255, 255, 0.2);
        }

        .eyebrow-title {
          font-weight: 600;
          color: #94a3b8;
        }

        .section-title {
          font-family: var(--font-serif);
          font-size: clamp(1.8rem, 3.2vw, 2.4rem);
          font-weight: 500;
          color: #ffffff;
          letter-spacing: -0.015em;
          margin: 0;
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
          .home-story-section {
            padding: 50px 24px 80px 24px;
          }
          .home-story-grid {
            grid-template-columns: 1fr;
            gap: 48px;
            padding: 0;
          }
          .landing-stage {
            position: relative;
            height: auto;
          }
          .landing-demo-figure {
            position: sticky;
            top: 80px;
            z-index: 20;
          }
          .stage-canvas {
            min-height: auto;
          }
          .landing-sections {
            gap: 64px;
          }
          .section {
            min-height: auto;
            padding: 16px 12px;
          }
        }

        @media (max-width: 640px) {
          .home-story-section {
            padding: 40px 16px 64px 16px;
          }
          .home-story-grid {
            padding: 0;
          }
          .kv-item {
            grid-template-columns: 75px 1fr;
          }
          .tool-row {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </section>
  );
}
