"use client";

import React from "react";
import { DocSection } from "../../data/docsContent";
import CodeSnippet from "./CodeSnippet";
import AnchorLayoutInspector from "./AnchorLayoutInspector";
import DevnetPlayground from "./DevnetPlayground";
import { Info, AlertTriangle, Shield, CheckCircle } from "lucide-react";

interface DocContentRendererProps {
  section: DocSection;
}

export default function DocContentRenderer({ section }: DocContentRendererProps) {
  const { content } = section;

  return (
    <article className="doc-content-article">
      {/* Title & Category Badge */}
      <div className="article-header">
        <span className="category-tag">{section.category}</span>
        <h1 className="article-title">{section.title}</h1>
        <p className="article-summary">{section.summary}</p>
      </div>

      {/* Interactive visualizers */}
      {section.id === "on-chain-wire-format" && <AnchorLayoutInspector />}
      {section.id === "playground" && <DevnetPlayground />}

      <div className="article-body">
        {/* Overview text */}
        {content.overview && (
          <p className="doc-paragraph overview-text">{content.overview}</p>
        )}

        {/* Callouts */}
        {content.callouts && content.callouts.length > 0 && (
          <div className="callouts-stack">
            {content.callouts.map((c, i) => {
              const isSecurity = c.type === "security";
              const isWarning = c.type === "warning";
              return (
                <div
                  key={i}
                  className={`doc-callout ${
                    isSecurity ? "is-security" : isWarning ? "is-warning" : "is-info"
                  }`}
                >
                  <div className="callout-icon">
                    {isSecurity ? (
                      <Shield size={16} />
                    ) : isWarning ? (
                      <AlertTriangle size={16} />
                    ) : (
                      <Info size={16} />
                    )}
                  </div>
                  <div className="callout-body">
                    {c.title && <div className="callout-title">{c.title}</div>}
                    <div className="callout-text">{c.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tables */}
        {content.tables &&
          content.tables.map((tbl, tIdx) => (
            <div key={tIdx} className="table-responsive-wrapper">
              <table className="doc-table">
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
                        <td key={cIdx}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {/* Code Blocks */}
        {content.codeBlocks &&
          content.codeBlocks.map((cb, cIdx) => (
            <CodeSnippet
              key={cIdx}
              code={cb.code}
              language={cb.language}
              filename={cb.title}
            />
          ))}

        {/* Subsections */}
        {content.subsections &&
          content.subsections.map((sub, sIdx) => (
            <div key={sIdx} className="doc-subsection">
              <h3 className="subsection-title">{sub.title}</h3>
              <p className="doc-paragraph">{sub.description}</p>
              {sub.code && (
                <CodeSnippet
                  code={sub.code.code}
                  language={sub.code.language}
                />
              )}
              {sub.table && (
                <div className="table-responsive-wrapper">
                  <table className="doc-table">
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
                            <td key={cIdx}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
      </div>

      <style jsx>{`
        .doc-content-article {
          padding-bottom: 32px;
        }

        .article-header {
          margin-bottom: 32px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 24px;
        }

        .category-tag {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          color: #38bdf8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
          display: inline-block;
        }

        .article-title {
          font-family: var(--font-serif);
          font-size: clamp(2rem, 3.5vw, 2.75rem);
          font-weight: 500;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: #ffffff;
          margin: 0 0 12px 0;
        }

        .article-summary {
          font-family: var(--font-sans);
          font-size: 15px;
          line-height: 1.6;
          color: #94a3b8;
          margin: 0;
        }

        .article-body {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .doc-paragraph {
          font-family: var(--font-sans);
          font-size: 14.5px;
          line-height: 1.7;
          color: #cbd5e1;
          margin: 0;
        }

        .overview-text {
          font-size: 15.5px;
          color: #e2e8f0;
        }

        .callouts-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin: 8px 0;
        }

        .doc-callout {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 4px;
          border: 1px solid;
        }

        .doc-callout.is-security {
          background: rgba(168, 85, 247, 0.08);
          border-color: rgba(168, 85, 247, 0.3);
          color: #f3e8ff;
        }

        .doc-callout.is-security .callout-icon {
          color: #c084fc;
        }

        .doc-callout.is-info {
          background: rgba(56, 189, 248, 0.06);
          border-color: rgba(56, 189, 248, 0.25);
          color: #e0f2fe;
        }

        .doc-callout.is-info .callout-icon {
          color: #38bdf8;
        }

        .doc-callout.is-warning {
          background: rgba(245, 158, 11, 0.08);
          border-color: rgba(245, 158, 11, 0.3);
          color: #fef3c7;
        }

        .doc-callout.is-warning .callout-icon {
          color: #fbbf24;
        }

        .callout-icon {
          margin-top: 2px;
          flex-shrink: 0;
        }

        .callout-body {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .callout-title {
          font-family: var(--font-sans);
          font-weight: 700;
          font-size: 13.5px;
          letter-spacing: -0.01em;
        }

        .callout-text {
          font-family: var(--font-sans);
          font-size: 13px;
          line-height: 1.55;
        }

        .table-responsive-wrapper {
          overflow-x: auto;
          margin: 12px 0;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 4px;
        }

        .doc-table {
          width: 100%;
          border-collapse: collapse;
          font-family: var(--font-sans);
          font-size: 13px;
        }

        .doc-table th {
          background: rgba(255, 255, 255, 0.04);
          padding: 10px 14px;
          text-align: left;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          white-space: nowrap;
        }

        .doc-table td {
          padding: 10px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          color: #cbd5e1;
          line-height: 1.5;
        }

        .doc-table tr:last-child td {
          border-bottom: none;
        }

        .doc-subsection {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .subsection-title {
          font-family: var(--font-sans);
          font-size: 17px;
          font-weight: 600;
          color: #f1f5f9;
          margin: 12px 0 0 0;
        }
      `}</style>
    </article>
  );
}
