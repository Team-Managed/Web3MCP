"use client";

import React from "react";
import { DocSection } from "../../data/docsContent";

interface DocsNavBoxProps {
  sections: DocSection[];
  activeSectionId: string;
  onSelectSection: (id: string) => void;
}

export default function DocsNavBox({
  sections,
  activeSectionId,
  onSelectSection,
}: DocsNavBoxProps) {
  const CATEGORY_ORDER = [
    "Protocol",
    "Implementation",
    "Reference",
  ];

  const categories = Array.from(new Set(sections.map((s) => s.category))).sort((a, b) => {
    const idxA = CATEGORY_ORDER.indexOf(a);
    const idxB = CATEGORY_ORDER.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  return (
    <aside className="docs-nav-box">
      {/* Box Header Banner */}
      <div className="nav-box-header">
        <span className="header-text">DOCUMENTATION</span>
      </div>

      {/* Categories and Indented Items */}
      <div className="nav-box-content">
        {categories.map((cat) => {
          const catSections = sections.filter((s) => s.category === cat && s.id !== "quickstart");
          if (catSections.length === 0) return null;

          return (
            <div key={cat} className="nav-category-group">
              <div className="cat-title">{cat.toUpperCase()}</div>
              <div className="cat-links-list">
                {catSections.map((sec) => {
                  const isActive = sec.id === activeSectionId;

                  return (
                    <button
                      key={sec.id}
                      onClick={() => onSelectSection(sec.id)}
                      className={`nav-item-btn ${isActive ? "is-active" : ""}`}
                    >
                      <span className="item-title">{sec.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

      </div>

      <style jsx>{`
        .docs-nav-box {
          width: 250px;
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

        .nav-box-header {
          padding: 14px 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.02);
        }

        .header-text {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: #f1f5f9;
        }

        .nav-box-content {
          padding: 16px 0;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .nav-category-group {
          display: flex;
          flex-direction: column;
        }

        .cat-title {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #94a3b8;
          padding: 4px 18px 6px 18px;
        }

        .cat-links-list {
          display: flex;
          flex-direction: column;
        }

        .nav-item-btn {
          display: flex;
          align-items: center;
          padding: 6px 18px 6px 20px;
          background: transparent;
          border: none;
          border-left: 2px solid transparent;
          color: #94a3b8;
          font-family: var(--font-sans);
          font-size: 14px;
          text-align: left;
          cursor: pointer;
          transition: all 0.12s ease;
          text-decoration: none;
          line-height: 1.4;
        }

        .nav-item-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.04);
        }

        .nav-item-btn.is-active {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
          border-left-color: #38bdf8;
          font-weight: 600;
        }

        .bottom-group {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .changelog-btn {
          padding-left: 18px;
        }

        @media (max-width: 900px) {
          .docs-nav-box {
            width: 100%;
            position: relative;
            top: 0;
            max-height: none;
          }
        }
      `}</style>
    </aside>
  );
}
