"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  BookOpen,
  Shield,
  Zap,
  Cpu,
  Lock,
  Layers,
  Sparkles,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  Code,
  FileCode,
  Database,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Info,
  CheckCircle2,
} from "lucide-react";
import { DOCS_SECTIONS, DocSection } from "../data/docsContent";

export default function DocsExplorer() {
  const [activeSectionId, setActiveSectionId] = useState<string>("overview");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [selectedByteOffset, setSelectedByteOffset] = useState<number>(0);
  const [selectedPlaygroundTool, setSelectedPlaygroundTool] = useState<string>("deposit");

  // Listen for navigation events from Hero or Navbar
  useEffect(() => {
    const handleNav = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setActiveSectionId(customEvent.detail);
      }
    };
    window.addEventListener("web3mcp-navigate", handleNav);
    return () => window.removeEventListener("web3mcp-navigate", handleNav);
  }, []);

  const activeSection = DOCS_SECTIONS.find((s) => s.id === activeSectionId) || DOCS_SECTIONS[0];
  const currentIndex = DOCS_SECTIONS.findIndex((s) => s.id === activeSectionId);
  const prevSection = currentIndex > 0 ? DOCS_SECTIONS[currentIndex - 1] : null;
  const nextSection = currentIndex < DOCS_SECTIONS.length - 1 ? DOCS_SECTIONS[currentIndex + 1] : null;

  // Filter sections by search query
  const filteredSections = DOCS_SECTIONS.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.summary.toLowerCase().includes(q) ||
      JSON.stringify(s.content).toLowerCase().includes(q)
    );
  });

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Byte header segments
  const BYTE_SEGMENTS = [
    {
      name: "discriminator",
      range: "0 .. 8",
      size: "8 B",
      type: "[u8; 8]",
      color: "#a78bfa",
      desc: 'Anchor account discriminator: sha256("account:Web3McpConfig")[0..8] = 0x991dc793e1358b35. Enforces strict account type verification before decoding.',
    },
    {
      name: "authority",
      range: "8 .. 40",
      size: "32 B",
      type: "Pubkey",
      color: "#38bdf8",
      desc: "Authorized publisher wallet address. Only this signer is permitted to write chunks or finalize tool configuration updates.",
    },
    {
      name: "status",
      range: "40 .. 41",
      size: "1 B",
      type: "u8",
      color: "#34d399",
      desc: "State machine lifecycle byte: 0 = Uninitialized (rejected), 1 = Uploading (fail-closed), 2 = Published (consumable by hosts).",
    },
    {
      name: "expected_len",
      range: "41 .. 45",
      size: "4 B",
      type: "u32 (LE)",
      color: "#fbbf24",
      desc: "Little-endian 32-bit integer specifying exact total byte count of complete UTF-8 JSON configuration payload (capped at 64 KiB = 65,536 bytes).",
    },
    {
      name: "digest",
      range: "45 .. 77",
      size: "32 B",
      type: "[u8; 32]",
      color: "#f472b6",
      desc: "Cryptographic SHA-256 digest of the entire config JSON. Recomputed on-chain via native sol_sha256 syscall during finalize_config.",
    },
    {
      name: "config payload",
      range: "77 .. 77+N",
      size: "4 + N B",
      type: "Vec<u8>",
      color: "#60a5fa",
      desc: "4-byte LE length prefix followed by raw UTF-8 JSON envelope conforming strictly to Web3MCP v0.1 JSON Schema with embedded Anchor IDL.",
    },
  ];

  // Devnet reference tools data
  const REFERENCE_TOOLS = [
    {
      id: "deposit",
      name: "deposit",
      kind: "instruction",
      title: "Deposit SOL to Vault",
      desc: "Deposits native SOL into the caller's segregated vault PDA derived from ['vault', owner].",
      inputs: [{ name: "amount", type: "u64", pattern: "^[1-9][0-9]*$", desc: "Lamports to deposit (e.g. 100000000 = 0.1 SOL)" }],
      accounts: [
        { name: "owner", source: "signer", detail: "Connected wallet public key (isSigner: true)" },
        { name: "vault", source: "idl", detail: "Derived PDA: ['vault', owner.key()]" },
        { name: "systemProgram", source: "program", detail: "11111111111111111111111111111111" },
      ],
      effects: { stateChanging: true, financial: true, summary: "Transfers native SOL from user wallet to on-chain vault PDA" },
      simulatedCUs: "4,563 CUs",
      simulatedFee: "5,000 lamports",
    },
    {
      id: "get_vault",
      name: "get_vault",
      kind: "accountRead",
      title: "Get Vault State",
      desc: "Queries and decodes the caller's vault account state signature-free via Solana RPC.",
      inputs: [{ name: "owner", type: "publicKey", pattern: "^[1-9A-HJ-NP-Za-km-z]{32,44}$", desc: "Wallet address of vault owner" }],
      accounts: [
        { name: "vault", source: "idl", detail: "Derived PDA: ['vault', owner.key()]" },
      ],
      effects: { stateChanging: false, financial: false, summary: "Signature-free account inspection (zero fees)" },
      simulatedCUs: "0 CUs (RPC Read)",
      simulatedFee: "0 lamports",
    },
    {
      id: "withdraw",
      name: "withdraw",
      kind: "instruction",
      title: "Withdraw SOL from Vault",
      desc: "Withdraws native SOL from vault PDA back to wallet, maintaining rent-exemption reserves.",
      inputs: [{ name: "amount", type: "u64", pattern: "^[1-9][0-9]*$", desc: "Lamports to withdraw" }],
      accounts: [
        { name: "owner", source: "signer", detail: "Connected wallet public key (isSigner: true)" },
        { name: "vault", source: "idl", detail: "Derived PDA: ['vault', owner.key()]" },
        { name: "systemProgram", source: "program", detail: "11111111111111111111111111111111" },
      ],
      effects: { stateChanging: true, financial: true, summary: "Transfers native SOL from vault PDA to user wallet" },
      simulatedCUs: "5,120 CUs",
      simulatedFee: "5,000 lamports",
    },
    {
      id: "initialize",
      name: "initialize",
      kind: "instruction",
      title: "Initialize Vault Account",
      desc: "Allocates the user's vault PDA and funds initial rent-exempt minimum balance.",
      inputs: [],
      accounts: [
        { name: "owner", source: "signer", detail: "Connected wallet public key (isSigner: true)" },
        { name: "vault", source: "idl", detail: "Derived PDA: ['vault', owner.key()]" },
        { name: "systemProgram", source: "program", detail: "11111111111111111111111111111111" },
      ],
      effects: { stateChanging: true, financial: true, summary: "Creates on-chain Vault account and reserves rent" },
      simulatedCUs: "3,890 CUs",
      simulatedFee: "5,000 lamports",
    },
  ];

  const currentTool = REFERENCE_TOOLS.find((t) => t.id === selectedPlaygroundTool) || REFERENCE_TOOLS[0];

  return (
    <section id="docs-section" className="docs-container">
      {/* Top Section Header */}
      <div className="docs-header">
        <div className="docs-header-pill">
          <BookOpen size={13} className="pill-icon" />
          <span>DOCUMENTATION & PROTOCOL PORTAL</span>
        </div>
        <h2 className="docs-header-title">Web3MCP Knowledge Base</h2>
        <p className="docs-header-desc">
          Complete engineering reference, normative wire specifications, publisher guides, and runtime architecture.
        </p>
      </div>

      {/* Main Layout Grid */}
      <div className="docs-layout">
        {/* Left Navigation Sidebar */}
        <aside className="docs-sidebar">
          {/* Search Bar */}
          <div className="search-box">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Filter topics, specs, guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="search-clear">
                ✕
              </button>
            )}
          </div>

          {/* Section Navigation List */}
          <nav className="nav-tree">
            {filteredSections.map((sec) => {
              const isActive = sec.id === activeSection.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`nav-item ${isActive ? "nav-item-active" : ""}`}
                >
                  <div className="nav-item-content">
                    <span className="nav-item-category">{sec.category}</span>
                    <span className="nav-item-title">{sec.title}</span>
                  </div>
                  {sec.badge && (
                    <span className={`nav-item-badge ${isActive ? "badge-active" : ""}`}>
                      {sec.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Devnet Reference Badge in Sidebar */}
          <div className="sidebar-footer">
            <div className="footer-card">
              <div className="footer-card-header">
                <span className="dot-green"></span>
                <span className="footer-card-title">Devnet Program</span>
              </div>
              <p className="footer-card-text">
                Live reference vault deployed at seeds <code>[&quot;web3mcp&quot;, &quot;config&quot;]</code>.
              </p>
              <a
                href="https://solscan.io/account/GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv?cluster=devnet"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-card-link"
              >
                <span>View on Solscan</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="docs-content">
          {/* Breadcrumbs */}
          <div className="breadcrumbs">
            <span className="crumb-root">Docs</span>
            <ChevronRight size={12} className="crumb-sep" />
            <span className="crumb-cat">{activeSection.category}</span>
            <ChevronRight size={12} className="crumb-sep" />
            <span className="crumb-current">{activeSection.title}</span>
          </div>

          {/* Section Header */}
          <div className="content-header">
            <div className="title-row">
              <h1 className="content-title">{activeSection.title}</h1>
              {activeSection.badge && (
                <span className="content-badge">{activeSection.badge}</span>
              )}
            </div>
            <p className="content-summary">{activeSection.summary}</p>
          </div>

          {/* Callouts */}
          {activeSection.content.callouts?.map((c, i) => (
            <div key={i} className={`callout-box callout-${c.type}`}>
              <div className="callout-header">
                {c.type === "security" && <Shield size={16} className="callout-icon security-icon" />}
                {c.type === "warning" && <AlertTriangle size={16} className="callout-icon warning-icon" />}
                {c.type === "info" && <Info size={16} className="callout-icon info-icon" />}
                {c.type === "tip" && <Sparkles size={16} className="callout-icon tip-icon" />}
                <span className="callout-title">{c.title}</span>
              </div>
              <p className="callout-text">{c.text}</p>
            </div>
          ))}

          {/* Overview Prose */}
          {activeSection.content.overview && (
            <div className="prose-block">
              <p>{activeSection.content.overview}</p>
            </div>
          )}

          {/* Interactive Binary Account Inspector on Protocol Spec */}
          {activeSection.id === "protocol-spec" && (
            <div className="interactive-card">
              <div className="interactive-card-header">
                <div className="card-badge">
                  <Database size={13} />
                  <span>INTERACTIVE VISUALIZER</span>
                </div>
                <h3 className="card-title">Anchor 81-Byte Account Layout Inspector</h3>
                <p className="card-desc">
                  Click on any byte offset in the header to inspect its serialization type, size, and fail-closed verification rules.
                </p>
              </div>

              {/* Byte Grid Bar */}
              <div className="byte-grid-bar">
                {BYTE_SEGMENTS.map((seg, idx) => {
                  const isSelected = selectedByteOffset === idx;
                  return (
                    <button
                      key={seg.name}
                      onClick={() => setSelectedByteOffset(idx)}
                      className={`byte-block ${isSelected ? "byte-block-selected" : ""}`}
                      style={{
                        borderColor: isSelected ? seg.color : "rgba(255, 255, 255, 0.12)",
                        background: isSelected ? `${seg.color}22` : "rgba(18, 18, 24, 0.6)",
                      }}
                    >
                      <span className="byte-range" style={{ color: seg.color }}>
                        {seg.range}
                      </span>
                      <span className="byte-name">{seg.name}</span>
                      <span className="byte-size">{seg.size}</span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Byte Inspector Detail Box */}
              <div className="byte-detail-box">
                <div className="byte-detail-header">
                  <div className="detail-tag" style={{ color: BYTE_SEGMENTS[selectedByteOffset].color }}>
                    Offset: {BYTE_SEGMENTS[selectedByteOffset].range}
                  </div>
                  <div className="detail-type">
                    Type: <code>{BYTE_SEGMENTS[selectedByteOffset].type}</code>
                  </div>
                  <div className="detail-size">
                    Size: {BYTE_SEGMENTS[selectedByteOffset].size}
                  </div>
                </div>
                <h4 className="detail-field-name">{BYTE_SEGMENTS[selectedByteOffset].name}</h4>
                <p className="detail-desc">{BYTE_SEGMENTS[selectedByteOffset].desc}</p>
              </div>
            </div>
          )}

          {/* Interactive Reference Vault Playground on Playground Section */}
          {activeSection.id === "playground" && (
            <div className="interactive-card">
              <div className="interactive-card-header">
                <div className="card-badge">
                  <Sparkles size={13} />
                  <span>DEVNET RUNTIME INSPECTOR</span>
                </div>
                <h3 className="card-title">Live Reference Vault Tool Inspector</h3>
                <p className="card-desc">
                  Explore how tools published on Solana Devnet (Program: <code>GgVnzvsMh...</code>) are resolved and simulated.
                </p>
              </div>

              {/* Tool Selection Tabs */}
              <div className="tool-tabs">
                {REFERENCE_TOOLS.map((tool) => {
                  const isSelected = tool.id === currentTool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setSelectedPlaygroundTool(tool.id)}
                      className={`tool-tab ${isSelected ? "tool-tab-active" : ""}`}
                    >
                      <span className="tool-tab-name">{tool.name}</span>
                      <span className={`tool-tab-kind kind-${tool.kind}`}>
                        {tool.kind === "instruction" ? "Instruction" : "Account Read"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Tool Inspection Details */}
              <div className="tool-inspection-grid">
                {/* Left: Input Schema & Accounts Mapping */}
                <div className="inspection-panel">
                  <div className="panel-header">
                    <Code size={13} />
                    <span>Tool Specifications & Bindings</span>
                  </div>
                  <div className="panel-body">
                    <h5 className="panel-subtitle">Description</h5>
                    <p className="panel-text">{currentTool.desc}</p>

                    <h5 className="panel-subtitle">Parameter Schema (inputSchema)</h5>
                    {currentTool.inputs.length === 0 ? (
                      <div className="empty-params">No input parameters required.</div>
                    ) : (
                      <div className="param-list">
                        {currentTool.inputs.map((p) => (
                          <div key={p.name} className="param-item">
                            <div className="param-header">
                              <span className="param-name">{p.name}</span>
                              <span className="param-type">{p.type}</span>
                            </div>
                            <code className="param-pattern">{p.pattern}</code>
                            <span className="param-desc">{p.desc}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <h5 className="panel-subtitle">Resolved Accounts</h5>
                    <div className="account-list">
                      {currentTool.accounts.map((acc) => (
                        <div key={acc.name} className="account-item">
                          <span className="acc-name">{acc.name}</span>
                          <span className="acc-source source-{acc.source}">{acc.source}</span>
                          <span className="acc-detail">{acc.detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Simulated Terminal Review Card */}
                <div className="inspection-panel">
                  <div className="panel-header">
                    <Shield size={13} />
                    <span>Host Simulation & Review Card Preview</span>
                  </div>
                  <div className="panel-body">
                    <div className="terminal-card-preview">
                      <div className="card-top">
                        <span className="card-title-text">TRANSACTION REVIEW</span>
                        <span className="card-status-badge">
                          {currentTool.kind === "instruction" ? "PRE-SIMULATED" : "READ ONLY"}
                        </span>
                      </div>
                      <div className="card-line">
                        <span className="lbl">Program:</span>
                        <span className="val">GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv</span>
                      </div>
                      <div className="card-line">
                        <span className="lbl">Tool:</span>
                        <span className="val highlight">{currentTool.name}</span>
                      </div>
                      <div className="card-line">
                        <span className="lbl">Compute Units:</span>
                        <span className="val">{currentTool.simulatedCUs}</span>
                      </div>
                      <div className="card-line">
                        <span className="lbl">Network Fee:</span>
                        <span className="val">{currentTool.simulatedFee}</span>
                      </div>
                      <div className="card-line">
                        <span className="lbl">Effects Summary:</span>
                        <span className="val">{currentTool.effects.summary}</span>
                      </div>
                      <div className="card-prompt">
                        {currentTool.kind === "instruction" ? (
                          <span>? Approve and broadcast transaction to Devnet? [y/N] › </span>
                        ) : (
                          <span>✓ Executed via getAccountInfo with zero wallet signature</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subsections with code and tables */}
          {activeSection.content.subsections?.map((sub, idx) => (
            <div key={idx} className="subsection-block">
              <h3 className="subsection-title">{sub.title}</h3>
              <p className="subsection-desc">{sub.description}</p>

              {/* Table */}
              {sub.table && (
                <div className="table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        {sub.table.headers.map((h, i) => (
                          <th key={i}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sub.table.rows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Code */}
              {sub.code && (
                <div className="code-box">
                  <div className="code-header">
                    <span className="code-lang">{sub.code.language}</span>
                    <button
                      onClick={() => handleCopyCode(`sub-${idx}`, sub.code!.code)}
                      className="code-copy-btn"
                    >
                      {copiedCodeId === `sub-${idx}` ? (
                        <>
                          <Check size={12} className="check-green" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="code-pre">
                    <code>{sub.code.code}</code>
                  </pre>
                </div>
              )}
            </div>
          ))}

          {/* Tables */}
          {activeSection.content.tables?.map((table, tIdx) => (
            <div key={tIdx} className="table-wrapper main-table">
              <table className="custom-table">
                <thead>
                  <tr>
                    {table.headers.map((h, i) => (
                      <th key={i}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {/* Primary Code Blocks */}
          {activeSection.content.codeBlocks?.map((cb, cbIdx) => (
            <div key={cbIdx} className="code-box main-code-box">
              <div className="code-header">
                <span className="code-title">{cb.title}</span>
                <button
                  onClick={() => handleCopyCode(`cb-${cbIdx}`, cb.code)}
                  className="code-copy-btn"
                >
                  {copiedCodeId === `cb-${cbIdx}` ? (
                    <>
                      <Check size={12} className="check-green" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="code-pre">
                <code>{cb.code}</code>
              </pre>
            </div>
          ))}

          {/* Bottom Pagination Links */}
          <div className="pagination-row">
            {prevSection ? (
              <button
                onClick={() => setActiveSectionId(prevSection.id)}
                className="pager-btn pager-prev"
              >
                <ArrowLeft size={14} />
                <div className="pager-text">
                  <span className="pager-label">Previous Section</span>
                  <span className="pager-title">{prevSection.title}</span>
                </div>
              </button>
            ) : (
              <div></div>
            )}

            {nextSection && (
              <button
                onClick={() => setActiveSectionId(nextSection.id)}
                className="pager-btn pager-next"
              >
                <div className="pager-text text-right">
                  <span className="pager-label">Next Section</span>
                  <span className="pager-title">{nextSection.title}</span>
                </div>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </main>
      </div>

      <style jsx>{`
        .docs-container {
          width: 100%;
          max-width: 1380px;
          margin: 0 auto;
          padding: 40px 32px 100px 32px;
          position: relative;
          z-index: 10;
        }

        .docs-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .docs-header-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 14px;
          border-radius: 9999px;
          background: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.3);
          color: #38bdf8;
          font-family: var(--font-mono);
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.08em;
          margin-bottom: 14px;
        }

        .pill-icon {
          color: #38bdf8;
        }

        .docs-header-title {
          font-family: var(--font-serif);
          font-size: clamp(2.4rem, 4.5vw, 3.6rem);
          font-weight: 500;
          color: #ffffff;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }

        .docs-header-desc {
          font-family: var(--font-sans);
          font-size: 15px;
          color: #94a3b8;
          max-width: 620px;
          margin: 0 auto;
          line-height: 1.5;
        }

        .docs-layout {
          display: grid;
          grid-template-columns: 310px 1fr;
          gap: 36px;
          align-items: start;
        }

        /* Sidebar Styling */
        .docs-sidebar {
          position: sticky;
          top: 90px;
          background: rgba(10, 10, 14, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 16px;
          backdrop-filter: blur(16px);
          max-height: calc(100vh - 110px);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          color: #64748b;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          background: rgba(18, 18, 24, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 9px 32px 9px 34px;
          font-family: var(--font-sans);
          font-size: 12.5px;
          color: #ffffff;
          outline: none;
          transition: border-color 0.15s ease;
        }

        .search-input:focus {
          border-color: #38bdf8;
        }

        .search-clear {
          position: absolute;
          right: 10px;
          color: #64748b;
          font-size: 11px;
          padding: 2px 4px;
        }

        .nav-tree {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: 8px;
          text-align: left;
          background: transparent;
          border: 1px solid transparent;
          transition: all 0.15s ease;
          gap: 8px;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        .nav-item-active {
          background: rgba(56, 189, 248, 0.08);
          border-color: rgba(56, 189, 248, 0.35);
        }

        .nav-item-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }

        .nav-item-category {
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .nav-item-title {
          font-family: var(--font-sans);
          font-size: 13px;
          font-weight: 500;
          color: #e2e8f0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nav-item-active .nav-item-title {
          color: #38bdf8;
          font-weight: 600;
        }

        .nav-item-badge {
          font-family: var(--font-mono);
          font-size: 9.5px;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.06);
          color: #94a3b8;
          white-space: nowrap;
        }

        .badge-active {
          background: rgba(56, 189, 248, 0.18);
          color: #38bdf8;
        }

        .sidebar-footer {
          margin-top: auto;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .footer-card {
          background: rgba(16, 185, 129, 0.06);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 8px;
          padding: 10px 12px;
        }

        .footer-card-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }

        .dot-green {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 6px #10b981;
        }

        .footer-card-title {
          font-family: var(--font-sans);
          font-size: 11.5px;
          font-weight: 600;
          color: #34d399;
        }

        .footer-card-text {
          font-family: var(--font-sans);
          font-size: 11px;
          color: #94a3b8;
          line-height: 1.4;
          margin-bottom: 6px;
        }

        .footer-card-text code {
          color: #38bdf8;
          font-family: var(--font-mono);
        }

        .footer-card-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 500;
          color: #34d399;
          text-decoration: underline;
        }

        /* Main Content Styling */
        .docs-content {
          background: rgba(10, 10, 14, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 36px 40px;
          backdrop-filter: blur(16px);
          min-height: 800px;
        }

        .breadcrumbs {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 11px;
          color: #64748b;
          margin-bottom: 18px;
        }

        .crumb-sep {
          color: #475569;
        }

        .crumb-current {
          color: #38bdf8;
        }

        .content-header {
          margin-bottom: 28px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .content-title {
          font-family: var(--font-serif);
          font-size: 32px;
          font-weight: 500;
          color: #ffffff;
          letter-spacing: -0.015em;
        }

        .content-badge {
          font-family: var(--font-mono);
          font-size: 10.5px;
          font-weight: 600;
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.3);
          padding: 3px 8px;
          border-radius: 4px;
        }

        .content-summary {
          font-family: var(--font-sans);
          font-size: 14.5px;
          color: #94a3b8;
          line-height: 1.5;
        }

        .callout-box {
          border-radius: 10px;
          padding: 14px 18px;
          margin-bottom: 28px;
        }

        .callout-security {
          background: rgba(168, 85, 247, 0.08);
          border: 1px solid rgba(168, 85, 247, 0.3);
        }

        .callout-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .callout-title {
          font-family: var(--font-sans);
          font-size: 13.5px;
          font-weight: 600;
          color: #c084fc;
        }

        .security-icon {
          color: #c084fc;
        }

        .callout-text {
          font-family: var(--font-sans);
          font-size: 13px;
          color: #e2e8f0;
          line-height: 1.5;
        }

        .prose-block {
          font-family: var(--font-sans);
          font-size: 14.5px;
          line-height: 1.65;
          color: #cbd5e1;
          margin-bottom: 32px;
        }

        /* Interactive Card */
        .interactive-card {
          background: rgba(14, 14, 18, 0.85);
          border: 1px solid rgba(56, 189, 248, 0.25);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 36px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
        }

        .card-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
          color: #38bdf8;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }

        .card-title {
          font-family: var(--font-serif);
          font-size: 20px;
          color: #ffffff;
          margin-bottom: 6px;
        }

        .card-desc {
          font-family: var(--font-sans);
          font-size: 13px;
          color: #94a3b8;
          margin-bottom: 20px;
        }

        .byte-grid-bar {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }

        .byte-block {
          border-radius: 8px;
          padding: 10px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
          border-width: 1px;
          border-style: solid;
        }

        .byte-block:hover {
          transform: translateY(-2px);
        }

        .byte-range {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
        }

        .byte-name {
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 500;
          color: #ffffff;
          text-align: center;
        }

        .byte-size {
          font-family: var(--font-mono);
          font-size: 9px;
          color: #64748b;
        }

        .byte-detail-box {
          background: rgba(8, 8, 12, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 16px;
        }

        .byte-detail-header {
          display: flex;
          align-items: center;
          gap: 16px;
          font-family: var(--font-mono);
          font-size: 11.5px;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .detail-tag {
          font-weight: 600;
        }

        .detail-type code {
          color: #38bdf8;
        }

        .detail-size {
          color: #94a3b8;
        }

        .detail-field-name {
          font-family: var(--font-mono);
          font-size: 15px;
          color: #ffffff;
          margin-bottom: 6px;
        }

        .detail-desc {
          font-family: var(--font-sans);
          font-size: 13px;
          color: #cbd5e1;
          line-height: 1.5;
        }

        /* Playground Tabs */
        .tool-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 8px;
          overflow-x: auto;
        }

        .tool-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid transparent;
          color: #94a3b8;
          transition: all 0.15s ease;
        }

        .tool-tab-active {
          background: rgba(56, 189, 248, 0.12);
          border-color: rgba(56, 189, 248, 0.35);
          color: #ffffff;
        }

        .tool-tab-name {
          font-family: var(--font-mono);
          font-size: 12.5px;
          font-weight: 600;
        }

        .tool-tab-kind {
          font-family: var(--font-sans);
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .kind-instruction {
          background: rgba(168, 85, 247, 0.2);
          color: #c084fc;
        }

        .kind-accountRead {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
        }

        .tool-inspection-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .inspection-panel {
          background: rgba(8, 8, 12, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          overflow: hidden;
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.04);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          font-family: var(--font-mono);
          font-size: 11.5px;
          font-weight: 600;
          color: #38bdf8;
        }

        .panel-body {
          padding: 14px;
        }

        .panel-subtitle {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }

        .panel-text {
          font-family: var(--font-sans);
          font-size: 12.5px;
          color: #cbd5e1;
          margin-bottom: 14px;
          line-height: 1.45;
        }

        .empty-params {
          font-family: var(--font-sans);
          font-size: 12px;
          color: #64748b;
          font-style: italic;
          margin-bottom: 14px;
        }

        .param-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .param-item {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 6px;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .param-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .param-name {
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          color: #38bdf8;
        }

        .param-type {
          font-family: var(--font-mono);
          font-size: 10px;
          color: #c084fc;
        }

        .param-pattern {
          font-family: var(--font-mono);
          font-size: 10.5px;
          color: #94a3b8;
          background: rgba(0, 0, 0, 0.4);
          padding: 2px 4px;
          border-radius: 3px;
        }

        .param-desc {
          font-family: var(--font-sans);
          font-size: 11.5px;
          color: #64748b;
        }

        .account-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .account-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11.5px;
          font-family: var(--font-mono);
          background: rgba(255, 255, 255, 0.02);
          padding: 6px 8px;
          border-radius: 4px;
        }

        .acc-name {
          color: #f1f5f9;
          font-weight: 600;
        }

        .acc-source {
          font-size: 9.5px;
          padding: 1px 5px;
          border-radius: 3px;
          text-transform: uppercase;
          font-weight: 600;
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
        }

        .acc-detail {
          color: #64748b;
          margin-left: auto;
          font-size: 10.5px;
        }

        /* Terminal Review Card Preview */
        .terminal-card-preview {
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 6px;
          padding: 14px;
          font-family: var(--font-mono);
          font-size: 11.5px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .card-title-text {
          font-weight: 700;
          color: #f1f5f9;
          letter-spacing: 0.05em;
        }

        .card-status-badge {
          font-size: 9.5px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 3px;
          background: rgba(52, 211, 153, 0.15);
          color: #34d399;
        }

        .card-line {
          display: flex;
          justify-content: space-between;
          line-height: 1.4;
        }

        .card-line .lbl {
          color: #64748b;
        }

        .card-line .val {
          color: #cbd5e1;
        }

        .card-line .highlight {
          color: #38bdf8;
          font-weight: 600;
        }

        .card-prompt {
          margin-top: 6px;
          padding-top: 8px;
          border-top: 1px dashed rgba(255, 255, 255, 0.12);
          color: #38bdf8;
          font-weight: 500;
        }

        /* Subsections & Tables */
        .subsection-block {
          margin-bottom: 36px;
        }

        .subsection-title {
          font-family: var(--font-sans);
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 8px;
        }

        .subsection-desc {
          font-family: var(--font-sans);
          font-size: 13.5px;
          color: #94a3b8;
          line-height: 1.5;
          margin-bottom: 14px;
        }

        .table-wrapper {
          overflow-x: auto;
          margin-bottom: 24px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          background: rgba(8, 8, 12, 0.7);
        }

        .custom-table {
          width: 100%;
          border-collapse: collapse;
          font-family: var(--font-sans);
          font-size: 12.5px;
          text-align: left;
        }

        .custom-table th {
          background: rgba(255, 255, 255, 0.04);
          color: #94a3b8;
          font-weight: 600;
          padding: 10px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.03em;
        }

        .custom-table td {
          padding: 10px 14px;
          color: #cbd5e1;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          line-height: 1.45;
        }

        .custom-table tr:last-child td {
          border-bottom: none;
        }

        .custom-table tr:hover td {
          background: rgba(255, 255, 255, 0.02);
        }

        /* Code Boxes */
        .code-box {
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 24px;
        }

        .main-code-box {
          margin-top: 16px;
        }

        .code-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 8px 14px;
        }

        .code-title,
        .code-lang {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
        }

        .code-copy-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-family: var(--font-sans);
          font-size: 11px;
          color: #94a3b8;
          padding: 3px 8px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.06);
          transition: all 0.15s ease;
        }

        .code-copy-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.12);
        }

        .check-green {
          color: #10b981;
        }

        .code-pre {
          padding: 16px;
          overflow-x: auto;
          font-family: var(--font-mono);
          font-size: 12.5px;
          line-height: 1.55;
          color: #f1f5f9;
        }

        /* Bottom Pagination */
        .pagination-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 48px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .pager-btn {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: rgba(18, 18, 24, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 12px 18px;
          color: #ffffff;
          transition: all 0.15s ease;
        }

        .pager-btn:hover {
          border-color: #38bdf8;
          background: rgba(56, 189, 248, 0.08);
        }

        .pager-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .text-right {
          text-align: right;
        }

        .pager-label {
          font-family: var(--font-mono);
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
        }

        .pager-title {
          font-family: var(--font-sans);
          font-size: 13.5px;
          font-weight: 500;
          color: #38bdf8;
        }

        @media (max-width: 1080px) {
          .docs-layout {
            grid-template-columns: 1fr;
          }
          .docs-sidebar {
            position: relative;
            top: 0;
            max-height: 380px;
          }
          .byte-grid-bar {
            grid-template-columns: repeat(3, 1fr);
          }
          .tool-inspection-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .docs-container {
            padding: 30px 16px 80px 16px;
          }
          .docs-content {
            padding: 24px 18px;
          }
          .byte-grid-bar {
            grid-template-columns: repeat(2, 1fr);
          }
          .title-row {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </section>
  );
}
