"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Terminal, Database, Code } from "lucide-react";

interface ByteOffset {
  name: string;
  offset: string;
  size: string;
  type: string;
  color: string;
  detail: string;
}

interface DevnetToolSpec {
  type: string;
  badge: string;
  color: string;
  program: string;
  ixName: string;
  inputSchema: string;
  accounts: { name: string; source: string; priv: string }[];
  discriminator?: string;
  effects: string;
}

export default function HomeStoryGrid() {
  const [activeStageTab, setActiveStageTab] = useState<"terminal" | "bytes" | "tools">("terminal");
  const [selectedByte, setSelectedByte] = useState<number>(0);
  const [selectedTool, setSelectedTool] = useState<string>("deposit");

  const BYTE_OFFSETS: ByteOffset[] = [
    {
      name: "discriminator",
      offset: "0 .. 8",
      size: "8 B",
      type: "[u8; 8]",
      color: "#9945FF",
      detail: 'sha256("account:Web3McpConfig")[0..8] = 0x991dc793e1358b35. Enforces Anchor account type safety.',
    },
    {
      name: "authority",
      offset: "8 .. 40",
      size: "32 B",
      type: "Pubkey",
      color: "#00C2FF",
      detail: "Authorized publisher wallet. Only this key can write chunks or finalize updates.",
    },
    {
      name: "status",
      offset: "40 .. 41",
      size: "1 B",
      type: "u8",
      color: "#14F195",
      detail: "0 = Uninitialized (rejected), 1 = Uploading (fail-closed), 2 = Published (consumable by agents).",
    },
    {
      name: "expected_len",
      offset: "41 .. 45",
      size: "4 B",
      type: "u32 (LE)",
      color: "#fbbf24",
      detail: "Total JSON payload byte size (max 64 KiB = 65,536 bytes).",
    },
    {
      name: "digest",
      offset: "45 .. 77",
      size: "32 B",
      type: "[u8; 32]",
      color: "#f472b6",
      detail: "SHA-256 hash of entire config JSON. Verified on-chain via native sol_sha256 syscall.",
    },
    {
      name: "config",
      offset: "77 .. 77+N",
      size: "4 + N B",
      type: "Vec<u8>",
      color: "#38bdf8",
      detail: "4-byte LE length prefix + UTF-8 JSON envelope with embedded Anchor IDL.",
    },
  ];

  const DEVNET_TOOLS: Record<string, DevnetToolSpec> = {
    deposit: {
      type: "instruction",
      badge: "Wallet Approved",
      color: "#00C2FF",
      program: "GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv",
      ixName: "deposit",
      inputSchema: '{"amount": "u64 (lamports, decimal string)"}',
      accounts: [
        { name: "owner", source: "signer", priv: "signer, writable" },
        { name: "vault", source: "idl", priv: "writable (seeds: [\"vault\", owner])" },
        { name: "system_program", source: "program", priv: "11111111111111111111111111111111" },
      ],
      effects: "Transfers native SOL from user wallet to on-chain vault PDA",
    },
    get_vault: {
      type: "accountRead",
      badge: "Signature-Free RPC",
      color: "#14F195",
      program: "GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv",
      ixName: "Vault",
      inputSchema: '{"owner": "publicKey (optional, defaults to signer)"}',
      accounts: [
        { name: "vault", source: "idl", priv: "read-only (seeds: [\"vault\", owner])" },
      ],
      discriminator: "0xd0e83b384dcdd105 (Anchor 8-byte discriminator verified)",
      effects: "Decodes binary account data into structured JSON state: { owner, balance, bump }",
    },
    withdraw: {
      type: "instruction",
      badge: "Wallet Approved",
      color: "#00C2FF",
      program: "GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv",
      ixName: "withdraw",
      inputSchema: '{"amount": "u64 (lamports, decimal string)"}',
      accounts: [
        { name: "owner", source: "signer", priv: "signer, writable" },
        { name: "vault", source: "idl", priv: "writable (seeds: [\"vault\", owner])" },
        { name: "system_program", source: "program", priv: "11111111111111111111111111111111" },
      ],
      effects: "Transfers native SOL from on-chain vault PDA back to user wallet",
    },
    initialize: {
      type: "instruction",
      badge: "Wallet Approved",
      color: "#00C2FF",
      program: "GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv",
      ixName: "initialize",
      inputSchema: "{} (no parameters required)",
      accounts: [
        { name: "owner", source: "signer", priv: "signer, writable" },
        { name: "vault", source: "idl", priv: "writable (seeds: [\"vault\", owner])" },
        { name: "system_program", source: "program", priv: "11111111111111111111111111111111" },
      ],
      effects: "Allocates and initializes the user's on-chain vault PDA account",
    },
  };

  const currentToolSpec = DEVNET_TOOLS[selectedTool] || DEVNET_TOOLS.deposit;

  // Scrollytelling: sync stagnant left terminal view with narrative section in viewport
  useEffect(() => {
    const sectionToTabMap: Record<string, "terminal" | "bytes" | "tools"> = {
      why: "terminal",
      discovery: "bytes",
      models: "tools",
      resolution: "tools",
      security: "terminal",
    };

    const sectionIds = ["why", "discovery", "models", "resolution", "security"];
    const sectionElements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const tab = sectionToTabMap[entry.target.id];
            if (tab) {
              setActiveStageTab(tab);
            }
          }
        });
      },
      {
        rootMargin: "-20% 0px -45% 0px",
        threshold: 0.15,
      }
    );

    sectionElements.forEach((el) => observer.observe(el));

    return () => {
      sectionElements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

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
            <span className="stage-title">
              web3mcp-host &middot; {activeStageTab === "terminal" ? "Terminal Review Card" : activeStageTab === "bytes" ? "81-Byte Account Layout" : "Devnet Reference Tools"}
            </span>
            <div className="stage-live-badge">
              <span className="live-dot"></span>
              <span>LIVE RPC</span>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="stage-tabs">
            <button
              onClick={() => setActiveStageTab("terminal")}
              className={`stage-tab ${activeStageTab === "terminal" ? "is-active" : ""}`}
            >
              <Terminal size={12} />
              <span>Review Card</span>
            </button>
            <button
              onClick={() => setActiveStageTab("bytes")}
              className={`stage-tab ${activeStageTab === "bytes" ? "is-active" : ""}`}
            >
              <Database size={12} />
              <span>81-Byte Layout</span>
            </button>
            <button
              onClick={() => setActiveStageTab("tools")}
              className={`stage-tab ${activeStageTab === "tools" ? "is-active" : ""}`}
            >
              <Code size={12} />
              <span>Devnet Tools</span>
            </button>
          </div>

          {/* Interactive Stage Body */}
          <div className="stage-screen">
            {activeStageTab === "terminal" && (
              <div className="terminal-view">
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
                    <span className="rv">7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU</span>
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
            )}

            {activeStageTab === "bytes" && (
              <div className="bytes-view">
                <div className="bytes-header-title">Canonical Config PDA Binary Header (81 Bytes)</div>
                <div className="byte-strip">
                  {BYTE_OFFSETS.map((b, i) => (
                    <button
                      key={b.name}
                      onClick={() => setSelectedByte(i)}
                      className={`byte-cell ${selectedByte === i ? "is-selected" : ""}`}
                      style={{
                        borderColor: selectedByte === i ? b.color : "rgba(255,255,255,0.12)",
                        background: selectedByte === i ? `${b.color}22` : "rgba(255,255,255,0.02)",
                      }}
                    >
                      <span className="b-offset" style={{ color: b.color }}>{b.offset}</span>
                      <span className="b-name">{b.name}</span>
                    </button>
                  ))}
                </div>

                <div className="byte-info-box">
                  <div className="info-top">
                    <span className="info-field">{BYTE_OFFSETS[selectedByte].name}</span>
                    <span className="info-type">Type: <code>{BYTE_OFFSETS[selectedByte].type}</code></span>
                    <span className="info-size">{BYTE_OFFSETS[selectedByte].size}</span>
                  </div>
                  <p className="info-detail">{BYTE_OFFSETS[selectedByte].detail}</p>
                </div>
              </div>
            )}

            {activeStageTab === "tools" && (
              <div className="tools-view">
                <div className="tool-selector">
                  {Object.keys(DEVNET_TOOLS).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTool(t)}
                      className={`t-btn ${selectedTool === t ? "is-active" : ""}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="tool-specs-box">
                  <div className="spec-row">
                    <span className="sk">Type:</span>
                    <span className="sv" style={{ color: currentToolSpec.color, fontWeight: 600 }}>
                      {currentToolSpec.type} ({currentToolSpec.badge})
                    </span>
                  </div>
                  <div className="spec-row">
                    <span className="sk">Program:</span>
                    <span className="sv">{currentToolSpec.program}</span>
                  </div>
                  <div className="spec-row">
                    <span className="sk">Target:</span>
                    <span className="sv">{currentToolSpec.ixName}</span>
                  </div>
                  <div className="spec-row">
                    <span className="sk">Input Schema:</span>
                    <span className="sv code-text">{currentToolSpec.inputSchema}</span>
                  </div>
                  {currentToolSpec.discriminator && (
                    <div className="spec-row">
                      <span className="sk">Discriminator:</span>
                      <span className="sv code-text">{currentToolSpec.discriminator}</span>
                    </div>
                  )}
                  <div className="spec-row-col">
                    <span className="sk">Account Resolution:</span>
                    <div className="acc-list">
                      {currentToolSpec.accounts.map((acc) => (
                        <div key={acc.name} className="acc-item">
                          <code>{acc.name}</code> &rarr; <span className="acc-priv">{acc.priv}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="spec-row">
                    <span className="sk">Effects:</span>
                    <span className="sv">{currentToolSpec.effects}</span>
                  </div>
                </div>
              </div>
            )}
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
          overflow: hidden;
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
        }

        .stage-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: #000000;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stage-controls {
          display: flex;
          gap: 6px;
        }

        .ctrl {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }

        .ctrl.red { background: #ef4444; }
        .ctrl.yellow { background: #f59e0b; }
        .ctrl.green { background: #10b981; }

        .stage-title {
          font-family: var(--font-mono);
          font-size: 11px;
          color: #94a3b8;
        }

        .stage-live-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 600;
          color: #14F195;
          background: rgba(20, 241, 149, 0.1);
          border: 1px solid rgba(20, 241, 149, 0.3);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .live-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #14F195;
          box-shadow: 0 0 5px #14F195;
        }

        .stage-tabs {
          display: flex;
          background: #000000;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 6px;
          gap: 6px;
        }

        .stage-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 11px;
          color: #64748b;
          background: transparent;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .stage-tab:hover {
          color: #e2e8f0;
          background: rgba(255, 255, 255, 0.04);
        }

        .stage-tab.is-active {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.16);
          font-weight: 600;
        }

        .stage-screen {
          background: #000000;
          padding: 16px;
          min-height: 420px;
          font-family: var(--font-mono);
          font-size: 11.5px;
        }

        /* Terminal View */
        .terminal-header-line {
          color: #f1f5f9;
          margin-bottom: 8px;
        }

        .terminal-header-line .prompt {
          color: #00C2FF;
          font-weight: 700;
          margin-right: 6px;
        }

        .terminal-log-dim {
          color: #64748b;
          font-size: 10.5px;
          line-height: 1.5;
          margin-bottom: 14px;
        }

        .terminal-review-card {
          background: #050505;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 4px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .card-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .card-label {
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 0.05em;
        }

        .card-badge {
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(0, 194, 255, 0.12);
          border: 1px solid rgba(0, 194, 255, 0.3);
          color: #00C2FF;
        }

        .review-row {
          display: flex;
          justify-content: space-between;
          line-height: 1.4;
          gap: 12px;
        }

        .review-row .rk {
          color: #64748b;
          flex-shrink: 0;
        }

        .review-row .rv {
          color: #cbd5e1;
          text-align: right;
          word-break: break-all;
        }

        .review-row .highlight {
          color: #00C2FF;
          font-weight: 600;
        }

        .prompt-action {
          margin-top: 6px;
          padding-top: 6px;
          border-top: 1px dashed rgba(255, 255, 255, 0.12);
          color: #00C2FF;
          font-weight: 600;
        }

        .cursor-blink {
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        /* Bytes View */
        .bytes-header-title {
          color: #94a3b8;
          font-size: 11px;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .byte-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          margin-bottom: 14px;
        }

        .byte-cell {
          border-radius: 4px;
          padding: 8px 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          border-width: 1px;
          border-style: solid;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .byte-cell:hover {
          border-color: rgba(255, 255, 255, 0.4);
        }

        .b-offset {
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 600;
        }

        .b-name {
          font-family: var(--font-sans);
          font-size: 10.5px;
          color: #ffffff;
        }

        .byte-info-box {
          background: #050505;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 4px;
          padding: 12px;
        }

        .info-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 11px;
        }

        .info-field {
          font-weight: 600;
          color: #ffffff;
        }

        .info-type code {
          color: #00C2FF;
        }

        .info-size {
          color: #64748b;
        }

        .info-detail {
          font-family: var(--font-sans);
          font-size: 12px;
          color: #cbd5e1;
          line-height: 1.45;
          margin: 0;
        }

        /* Tools View */
        .tool-selector {
          display: flex;
          gap: 6px;
          margin-bottom: 12px;
        }

        .t-btn {
          font-family: var(--font-mono);
          font-size: 11px;
          padding: 5px 10px;
          border-radius: 4px;
          background: #000000;
          color: #94a3b8;
          border: 1px solid rgba(255, 255, 255, 0.12);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .t-btn:hover {
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.3);
        }

        .t-btn.is-active {
          background: rgba(0, 194, 255, 0.1);
          border-color: rgba(0, 194, 255, 0.4);
          color: #ffffff;
          font-weight: 600;
        }

        .tool-specs-box {
          background: #050505;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 4px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .spec-row {
          display: flex;
          justify-content: space-between;
          font-size: 11.5px;
          gap: 12px;
        }

        .spec-row .sk {
          color: #64748b;
          flex-shrink: 0;
        }

        .spec-row .sv {
          color: #cbd5e1;
          text-align: right;
          word-break: break-all;
        }

        .code-text {
          font-family: var(--font-mono);
          font-size: 10.5px;
          color: #94a3b8;
        }

        .spec-row-col {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 6px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .spec-row-col .sk {
          color: #64748b;
          font-size: 11px;
        }

        .acc-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding-left: 6px;
        }

        .acc-item {
          font-size: 10.5px;
          color: #cbd5e1;
        }

        .acc-item code {
          color: #00C2FF;
          background: rgba(0, 194, 255, 0.08);
          padding: 1px 4px;
          border-radius: 3px;
        }

        .acc-priv {
          color: #94a3b8;
        }

        .figure-caption--terminal {
          padding: 8px 14px;
          background: #000000;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: var(--font-mono);
          font-size: 10.5px;
          color: #64748b;
        }

        .figure-caption-live-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #14F195;
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
