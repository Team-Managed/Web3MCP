"use client";

import React, { useState } from "react";
import { Copy, Check, Terminal } from "lucide-react";

interface CodeSnippetProps {
  code: string;
  language?: string;
  filename?: string;
}

export default function CodeSnippet({ code, language = "typescript", filename }: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.trim().split("\n");

  return (
    <div className="code-snippet-container">
      <div className="snippet-header">
        <div className="header-meta">
          <Terminal size={12} className="meta-icon" />
          <span className="meta-filename">{filename || language}</span>
        </div>
        <button onClick={handleCopy} className={`copy-btn ${copied ? "is-copied" : ""}`}>
          {copied ? <Check size={11} /> : <Copy size={11} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      <div className="snippet-body">
        <div className="line-numbers" aria-hidden="true">
          {lines.map((_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <pre className="code-pre">
          <code>{code.trim()}</code>
        </pre>
      </div>

      <style jsx>{`
        .code-snippet-container {
          margin: 20px 0;
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
          font-family: var(--font-mono);
        }

        .snippet-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .header-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #94a3b8;
        }

        .meta-icon {
          color: #00c2ff;
        }

        .meta-filename {
          font-weight: 500;
        }

        .copy-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #94a3b8;
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .copy-btn:hover {
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.04);
        }

        .copy-btn.is-copied {
          background: rgba(20, 241, 149, 0.2);
          border-color: #14f195;
          color: #14f195;
        }

        .snippet-body {
          display: flex;
          padding: 12px 0;
          overflow-x: auto;
          font-size: 12px;
          line-height: 1.6;
        }

        .line-numbers {
          display: flex;
          flex-direction: column;
          user-select: none;
          color: #334155;
          padding: 0 12px;
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          text-align: right;
          min-width: 28px;
        }

        .code-pre {
          margin: 0;
          padding: 0 16px;
          color: #e2e8f0;
          white-space: pre;
        }
      `}</style>
    </div>
  );
}
