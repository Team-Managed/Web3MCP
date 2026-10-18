"use client";

import React, { useState } from "react";
import { Search, ExternalLink, Edit2, Copy, Check } from "lucide-react";
import { DocSection } from "../../data/docsContent";
import DevnetPlayground from "./DevnetPlayground";
import DocsPagination from "./DocsPagination";

interface DocsArticleBoxProps {
  section: DocSection;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  prevSection: DocSection | null;
  nextSection: DocSection | null;
  onSelectSection: (id: string) => void;
}

export default function DocsArticleBox({
  section,
  searchQuery,
  onSearchChange,
  prevSection,
  nextSection,
  onSelectSection,
}: DocsArticleBoxProps) {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const renderTextWithLinks = (text: string) => {
    const programId = "9zJzM4rHDPR4pd3vXHQjQ7whTVmx4zxB3ZH4Gb9iXRwD";
    const pdaId = "J8Ph37LoQsv4yED6USdupCooCZzsVMqJkgBTm9uSkvCw";

    const regex = new RegExp(`(${programId}|${pdaId})`, "g");
    const parts = text.split(regex);

    return parts.map((part, i) => {
      if (part === programId || part === pdaId) {
        const isProg = part === programId;
        const url = `https://explorer.solana.com/address/${part}?cluster=devnet`;
        return (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="explorer-inline-link"
            title={`View ${isProg ? "Program ID" : "Config PDA"} on Solana Explorer (Devnet)`}
          >
            <code>{part}</code>
            <ExternalLink size={10} className="explorer-inline-icon" />
          </a>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  const { content } = section;

  return (
    <div className="docs-center-col">
      {/* Search Input Bar (Directly Above Article) */}
      <div className="search-bar-box">
        <Search size={14} className="search-icon" />
        <input
          type="text"
          placeholder="Search documentation..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
        <kbd className="ctrl-k-badge">Ctrl K</kbd>
      </div>

      {/* Main Article Card Box */}
      <article className="article-card-box">
        {/* Article Header Row */}
        <div className="article-title-row">
          <h1 className="serif-article-title">{section.title}</h1>

          <div className="article-header-actions">
            <span className="version-dropdown-btn">CURRENT</span>
            <a
              href="https://github.com/Team-Managed/Web3MCP/blob/main/protocol/SPEC.md"
              target="_blank"
              rel="noopener noreferrer"
              className="action-icon-link"
              title="View on GitHub"
            >
              <ExternalLink size={14} />
            </a>
            <a
              href="https://github.com/Team-Managed/Web3MCP/edit/main/apps/website/app/data/docsContent.ts"
              target="_blank"
              rel="noopener noreferrer"
              className="action-icon-link"
              title="Edit this page"
            >
              <Edit2 size={13} />
            </a>
          </div>
        </div>

        <div className="title-divider-line" />

        {/* Overview text with interactive links */}
        {content.overview && (
          <p className="article-overview-p">{renderTextWithLinks(content.overview)}</p>
        )}

        {/* Callouts if any */}
        {content.callouts && content.callouts.length > 0 && (
          <div className="article-callouts-stack">
            {content.callouts.map((c, i) => (
              <div key={i} className={`article-callout ${c.type}`}>
                <div className="callout-title">{c.title}</div>
                <div className="callout-text">{c.text}</div>
              </div>
            ))}
          </div>
        )}

        {/* Primary Code Blocks */}
        {content.codeBlocks &&
          content.codeBlocks.map((cb, idx) => (
            <div key={idx} className="boxed-code-frame">
              <div className="code-frame-header">
                <span className="code-frame-title">{cb.title || cb.language}</span>
                <button
                  onClick={() => handleCopyCode(`code-${idx}`, cb.code)}
                  className="code-copy-btn"
                >
                  {copiedCodeId === `code-${idx}` ? (
                    <>
                      <Check size={11} />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={11} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="code-pre-block">
                <code>{cb.code.trim()}</code>
              </pre>
            </div>
          ))}

        {/* Primary Tables */}
        {content.tables &&
          content.tables.map((tbl, tIdx) => (
            <div key={tIdx} className="table-boxed-wrapper">
              <table className="pi-table">
                <thead>
                  <tr>
                    {tbl.headers.map((h, hIdx) => (
                      <th key={hIdx}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tbl.rows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx}>
                          {cIdx === 0 ? (
                            <span className="code-token-badge">{cell}</span>
                          ) : (
                            cell
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {/* Reference Tool Explorer */}
        {section.id === "playground" && (
          <div id="devnet-playground">
            <DevnetPlayground />
          </div>
        )}

        {/* Subsections with signature italic serif headings */}
        {content.subsections &&
          content.subsections.map((sub, sIdx) => {
            const subId = sub.id || `subsection-${sIdx}`;
            return (
              <section key={sIdx} id={subId} className="article-subsection">
                <div className="subsection-divider" />
                <h2 className="serif-subsection-title">{sub.title}</h2>
                <p className="article-body-p">{sub.description}</p>

                {sub.code && (
                  <div className="boxed-code-frame">
                    <div className="code-frame-header">
                      <span className="code-frame-title">{sub.code.language}</span>
                      <button
                        onClick={() =>
                          handleCopyCode(`sub-code-${sIdx}`, sub.code!.code)
                        }
                        className="code-copy-btn"
                      >
                        {copiedCodeId === `sub-code-${sIdx}` ? (
                          <>
                            <Check size={11} />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={11} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="code-pre-block">
                      <code>{sub.code.code.trim()}</code>
                    </pre>
                  </div>
                )}

                {sub.table && (
                  <div className="table-boxed-wrapper">
                    <table className="pi-table">
                      <thead>
                        <tr>
                          {sub.table.headers.map((h, hIdx) => (
                            <th key={hIdx}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sub.table.rows.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx}>
                                {cIdx === 0 ? (
                                  <span className="code-token-badge">{cell}</span>
                                ) : (
                                  cell
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}

        {/* Bottom Pagination Buttons */}
        <DocsPagination
          prevSection={prevSection}
          nextSection={nextSection}
          onSelectSection={onSelectSection}
        />
      </article>

      <style jsx>{`
        .docs-center-col {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Search Bar Box directly above the article */
        .search-bar-box {
          background: #070709;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 4px;
          padding: 8px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        :global(.search-icon) {
          color: #64748b;
          flex-shrink: 0;
        }

        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-family: var(--font-sans);
          font-size: 13px;
          color: #f1f5f9;
        }

        .search-input::placeholder {
          color: #64748b;
        }

        .ctrl-k-badge {
          font-family: var(--font-mono);
          font-size: 10.5px;
          color: #64748b;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          padding: 2px 6px;
        }

        /* Article Card Box */
        .article-card-box {
          background: #070709;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 4px;
          padding: 36px 44px;
        }

        .article-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        /* Signature pi.dev italic serif heading */
        .serif-article-title {
          font-family: var(--font-serif);
          font-style: italic;
          font-size: 42px;
          font-weight: 400;
          line-height: 1.1;
          color: #ffffff;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .article-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .version-dropdown-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-family: var(--font-mono);
          font-size: 10.5px;
          font-weight: 700;
          color: #94a3b8;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 3px;
          padding: 3px 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .version-dropdown-btn:hover {
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.25);
        }

        .action-icon-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          color: #64748b;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 3px;
          transition: all 0.15s ease;
        }

        .action-icon-link:hover {
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.04);
        }

        .title-divider-line {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          margin: 20px 0 28px 0;
        }

        .article-overview-p {
          font-family: var(--font-sans);
          font-size: 16px;
          line-height: 1.7;
          color: #cbd5e1;
          margin: 0 0 24px 0;
        }

        /* Boxed Code Frame */
        .boxed-code-frame {
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 4px;
          overflow: hidden;
          margin: 20px 0;
          font-family: var(--font-mono);
        }

        .code-frame-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .code-frame-title {
          font-size: 11px;
          color: #64748b;
        }

        .code-copy-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          color: #94a3b8;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 2px;
          transition: color 0.15s ease;
        }

        .code-copy-btn:hover {
          color: #ffffff;
        }

        .code-pre-block {
          margin: 0;
          padding: 14px 18px;
          overflow-x: auto;
          font-size: 12.5px;
          line-height: 1.6;
          color: #f1f5f9;
        }

        /* Table Boxed Wrapper matching pi.dev */
        .table-boxed-wrapper {
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 4px;
          overflow-x: auto;
          margin: 24px 0;
        }

        .pi-table {
          width: 100%;
          border-collapse: collapse;
          font-family: var(--font-sans);
          font-size: 14px;
        }

        .pi-table th {
          background: #000000;
          padding: 10px 14px;
          text-align: left;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          border-right: 1px solid rgba(255, 255, 255, 0.06);
        }

        .pi-table th:last-child {
          border-right: none;
        }

        .pi-table td {
          padding: 10px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          color: #cbd5e1;
          line-height: 1.5;
        }

        .pi-table tr:last-child td {
          border-bottom: none;
        }

        .pi-table td:last-child {
          border-right: none;
        }

        .code-token-badge {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 11px;
          color: #f1f5f9;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 2px 7px;
          border-radius: 3px;
          white-space: nowrap;
        }

        /* Subsections */
        .article-subsection {
          margin-top: 36px;
        }

        .subsection-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.06);
          margin-bottom: 24px;
        }

        .serif-subsection-title {
          font-family: var(--font-serif);
          font-style: italic;
          font-size: 28px;
          font-weight: 400;
          color: #ffffff;
          margin: 0 0 12px 0;
          letter-spacing: -0.01em;
        }

        .article-body-p {
          font-family: var(--font-sans);
          font-size: 16px;
          line-height: 1.65;
          color: #cbd5e1;
          margin: 0 0 16px 0;
        }

        .article-callouts-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin: 16px 0;
        }

        .article-callout {
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 4px;
        }

        .article-callout.security {
          border-color: rgba(168, 85, 247, 0.25);
          background: rgba(168, 85, 247, 0.04);
        }

        .callout-title {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          color: #a78bfa;
          margin-bottom: 4px;
        }

        .callout-text {
          font-size: 15px;
          color: #cbd5e1;
          line-height: 1.5;
        }

        .explorer-inline-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #38bdf8;
          text-decoration: none;
          vertical-align: baseline;
          transition: color 0.15s ease;
        }

        .explorer-inline-link:hover {
          color: #7dd3fc;
          text-decoration: underline;
        }

        .explorer-inline-link code {
          font-family: var(--font-mono);
          font-size: 11px;
          background: rgba(56, 189, 248, 0.08);
          border: 1px solid rgba(56, 189, 248, 0.25);
          padding: 1px 6px;
          border-radius: 3px;
          color: #38bdf8;
          word-break: break-all;
        }

        .explorer-inline-link:hover code {
          background: rgba(56, 189, 248, 0.15);
          border-color: rgba(56, 189, 248, 0.5);
        }

        .explorer-inline-icon {
          color: #38bdf8;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .article-card-box {
            padding: 24px 18px;
          }
          .serif-article-title {
            font-size: 32px;
          }
          .serif-subsection-title {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
}
