"use client";

import React from "react";
import { DocSection } from "../../data/docsContent";

interface DocsOnThisPageProps {
  section: DocSection;
}

export default function DocsOnThisPage({ section }: DocsOnThisPageProps) {
  // Extract all headings / jump anchors from the section
  const anchors: { id: string; title: string }[] = [];

  if (section.content.subsections) {
    section.content.subsections.forEach((sub, idx) => {
      const anchorId = sub.id || `subsection-${idx}`;
      anchors.push({ id: anchorId, title: sub.title });
    });
  }

  // If section has tables or specific widgets, add jump anchors
  if (section.id === "on-chain-wire-format") {
    anchors.unshift({ id: "anchor-layout-inspector", title: "Layout Inspector (81B)" });
  }

  if (section.id === "playground") {
    anchors.unshift({ id: "devnet-playground", title: "Devnet Tool Explorer" });
  }

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <aside className="docs-toc-box">
      <div className="toc-header">
        <span className="toc-header-text">ON THIS PAGE</span>
      </div>

      <div className="toc-links-list">
        {anchors.length > 0 ? (
          anchors.map((anc) => (
            <button
              key={anc.id}
              onClick={() => handleScrollTo(anc.id)}
              className="toc-jump-btn"
            >
              {anc.title}
            </button>
          ))
        ) : (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="toc-jump-btn"
          >
            Overview
          </button>
        )}
      </div>

      <style jsx>{`
        .docs-toc-box {
          width: 220px;
          flex-shrink: 0;
          background: #070709;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 4px;
          overflow: hidden;
          position: sticky;
          top: 76px;
          max-height: calc(100vh - 96px);
          display: flex;
          flex-direction: column;
        }

        .toc-header {
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.01);
        }

        .toc-header-text {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #94a3b8;
        }

        .toc-links-list {
          padding: 14px 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .toc-jump-btn {
          font-family: var(--font-sans);
          font-size: 11.5px;
          color: #94a3b8;
          text-align: left;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 3px 0;
          line-height: 1.4;
          transition: color 0.15s ease;
        }

        .toc-jump-btn:hover {
          color: #ffffff;
        }

        @media (max-width: 1150px) {
          .docs-toc-box {
            display: none;
          }
        }
      `}</style>
    </aside>
  );
}
