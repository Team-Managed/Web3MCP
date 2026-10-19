"use client";

import React, { useState } from "react";
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
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const CATEGORY_ORDER = [
    "Protocol",
    "Smart Contract",
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

  const activeSection = sections.find((s) => s.id === activeSectionId);

  return (
    <aside className={`docs-nav-box ${isMobileExpanded ? "mobile-open" : ""}`}>
      {/* Box Header Banner (interactive toggle on mobile) */}
      <button
        type="button"
        className="nav-box-header"
        onClick={() => setIsMobileExpanded((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsMobileExpanded((prev) => !prev);
          }
        }}
        aria-expanded={isMobileExpanded}
        aria-controls="docs-nav-content"
        aria-label="Toggle documentation navigation"
      >
        <div className="header-title-row">
          <span className="header-text">DOCUMENTATION</span>
          <div className="mobile-nav-toggle-badge">
            <span className="mobile-active-name">{activeSection ? activeSection.title : "Navigation"}</span>
            <span className="mobile-arrow">{isMobileExpanded ? "▲" : "▼"}</span>
          </div>
        </div>
      </button>

      {/* Categories and Indented Items */}
      <div id="docs-nav-content" className={`nav-box-content ${isMobileExpanded ? "is-mobile-expanded" : ""}`}>
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
                      onClick={() => {
                        onSelectSection(sec.id);
                        setIsMobileExpanded(false);
                      }}
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
          transition: border-color 0.15s ease;
        }

        .nav-box-header {
          width: 100%;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.02);
          padding: 14px 18px;
          text-align: left;
          color: inherit;
          font: inherit;
          cursor: default;
        }

        .nav-box-header:focus-visible {
          outline: 2px solid #38bdf8;
          outline-offset: -2px;
        }

        .header-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .header-text {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: #f1f5f9;
        }

        .mobile-nav-toggle-badge {
          display: none;
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
          font-size: 13.5px;
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

        @media (max-width: 900px) {
          .docs-nav-box {
            width: 100%;
            position: relative;
            top: 0;
            max-height: none;
          }

          .nav-box-header {
            cursor: pointer;
            user-select: none;
            padding: 12px 14px;
          }

          .nav-box-header:hover {
            background: rgba(255, 255, 255, 0.05);
          }

          .mobile-nav-toggle-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-family: var(--font-mono);
            font-size: 11px;
            color: #38bdf8;
            background: rgba(56, 189, 248, 0.08);
            border: 1px solid rgba(56, 189, 248, 0.25);
            padding: 2px 8px;
            border-radius: 3px;
            max-width: 60%;
          }

          .mobile-active-name {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 10.5px;
          }

          .mobile-arrow {
            font-size: 9px;
            color: #7dd3fc;
            flex-shrink: 0;
          }

          .nav-box-content {
            display: none;
            max-height: 60vh;
            padding: 12px 0 16px 0;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
          }

          .nav-box-content.is-mobile-expanded {
            display: flex;
          }
        }
      `}</style>
    </aside>
  );
}
