"use client";

import React from "react";
import { Search } from "lucide-react";
import { DocSection } from "../../data/docsContent";

interface DocsSidebarProps {
  sections: DocSection[];
  activeSectionId: string;
  onSelectSection: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export default function DocsSidebar({
  sections,
  activeSectionId,
  onSelectSection,
  searchQuery,
  onSearchChange,
}: DocsSidebarProps) {
  // Group sections by category
  const categories = Array.from(new Set(sections.map((s) => s.category)));

  return (
    <aside className="docs-nav-rail">
      {/* Search Input Field */}
      <div className="search-field">
        <Search size={13} className="search-icon" />
        <input
          type="text"
          placeholder="Search documentation..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
        <kbd className="search-kbd">⌘K</kbd>
      </div>

      {/* Nav Link Tree Grouped by Category */}
      <div className="nav-group-list">
        {categories.map((cat) => {
          const catSections = sections.filter((s) => s.category === cat);
          if (catSections.length === 0) return null;

          return (
            <div key={cat} className="nav-category-block">
              <div className="nav-category-title">{cat}</div>
              <div className="nav-links-stack">
                {catSections.map((sec) => {
                  const isActive = sec.id === activeSectionId;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => onSelectSection(sec.id)}
                      className={`rail-link ${isActive ? "is-active" : ""}`}
                    >
                      <span className="rail-link-text">{sec.title}</span>
                      {sec.badge && <span className="rail-badge">{sec.badge}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .docs-nav-rail {
          width: 270px;
          flex-shrink: 0;
          position: sticky;
          top: 60px;
          height: calc(100vh - 60px);
          overflow-y: auto;
          padding: 24px 18px 48px 0;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
        }

        .search-field {
          position: relative;
          display: flex;
          align-items: center;
          margin-bottom: 24px;
        }

        :global(.search-icon) {
          position: absolute;
          left: 10px;
          color: #64748b;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          padding: 8px 36px 8px 30px;
          font-family: var(--font-sans);
          font-size: 12.5px;
          color: #f1f5f9;
          outline: none;
          transition: all 0.15s ease;
        }

        .search-input:focus {
          border-color: #38bdf8;
          background: rgba(56, 189, 248, 0.05);
        }

        .search-kbd {
          position: absolute;
          right: 8px;
          font-family: var(--font-mono);
          font-size: 10px;
          color: #64748b;
          background: rgba(255, 255, 255, 0.06);
          padding: 2px 4px;
          border-radius: 3px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .nav-group-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .nav-category-title {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
          padding-left: 8px;
        }

        .nav-links-stack {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .rail-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 10px;
          border-radius: 4px;
          background: transparent;
          border: none;
          color: #94a3b8;
          font-family: var(--font-sans);
          font-size: 13px;
          text-align: left;
          cursor: pointer;
          transition: all 0.12s ease;
          width: 100%;
        }

        .rail-link:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.04);
        }

        .rail-link.is-active {
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.08);
          font-weight: 600;
          border-left: 2px solid #38bdf8;
          border-radius: 0 4px 4px 0;
        }

        .rail-badge {
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 3px;
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
          letter-spacing: 0.04em;
        }

        @media (max-width: 900px) {
          .docs-nav-rail {
            width: 100%;
            height: auto;
            position: relative;
            top: 0;
            border-right: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            padding: 16px 0;
          }
        }
      `}</style>
    </aside>
  );
}
