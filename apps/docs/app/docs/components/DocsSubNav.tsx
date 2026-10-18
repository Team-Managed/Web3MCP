"use client";

import React from "react";
import { ExternalLink } from "lucide-react";

interface DocsSubNavProps {
  sectionTitle: string;
}

export default function DocsSubNav({ sectionTitle }: DocsSubNavProps) {
  return (
    <div className="docs-sub-nav">
      <div className="sub-nav-inner">
        <div className="sub-nav-left">
          <span className="doc-version-badge">LATEST &middot; v0.1.0 FROZEN</span>
          <span className="sub-nav-sep">/</span>
          <span className="sub-nav-title">{sectionTitle}</span>
        </div>
        <div className="sub-nav-right">
          <a
            href="https://github.com/Team-Managed/Web3MCP/blob/main/protocol/SPEC.md"
            target="_blank"
            rel="noopener noreferrer"
            className="sub-nav-link"
          >
            <span>View Source on GitHub</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      <style jsx>{`
        .docs-sub-nav {
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(8, 10, 15, 0.95);
          backdrop-filter: blur(12px);
          position: sticky;
          top: 60px;
          z-index: 40;
        }

        .sub-nav-inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 8px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .sub-nav-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .doc-version-badge {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          color: #10b981;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          padding: 2px 7px;
          border-radius: 4px;
          letter-spacing: 0.06em;
        }

        .sub-nav-sep {
          color: #475569;
          font-size: 12px;
        }

        .sub-nav-title {
          font-family: var(--font-sans);
          font-size: 12.5px;
          color: #cbd5e1;
          font-weight: 500;
        }

        .sub-nav-right {
          display: flex;
          align-items: center;
        }

        .sub-nav-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: var(--font-mono);
          font-size: 11px;
          color: #64748b;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .sub-nav-link:hover {
          color: #38bdf8;
        }

        @media (max-width: 640px) {
          .sub-nav-inner {
            padding: 8px 16px;
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }
        }
      `}</style>
    </div>
  );
}
