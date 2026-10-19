"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import DocsNavBox from "../components/DocsNavBox";
import DocsArticleBox from "../components/DocsArticleBox";
import DocsOnThisPage from "../components/DocsOnThisPage";
import Footer from "../../components/Footer";
import PixelCanvas from "../../components/PixelCanvas";
import { DOCS_SECTIONS } from "../../data/docsContent";

export default function DocsLatestPage() {
  const [activeSectionId, setActiveSectionId] = useState<string>("overview");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hashId = window.location.hash.replace("#", "");
      if (DOCS_SECTIONS.some((s) => s.id === hashId)) {
        setActiveSectionId(hashId);
      }
    }
  }, []);

  const handleSelectSection = (id: string) => {
    setActiveSectionId(id);
    if (typeof window !== "undefined") {
      window.location.hash = id;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const activeSection = DOCS_SECTIONS.find((s) => s.id === activeSectionId) || DOCS_SECTIONS[0];
  const currentIndex = DOCS_SECTIONS.findIndex((s) => s.id === activeSectionId);
  const prevSection = currentIndex > 0 ? DOCS_SECTIONS[currentIndex - 1] : null;
  const nextSection = currentIndex < DOCS_SECTIONS.length - 1 ? DOCS_SECTIONS[currentIndex + 1] : null;

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

  return (
    <div className="docs-page-shell">
      {/* Subtle Static Pixel Margin Backdrop with low density */}
      <div className="docs-pixel-bg-wrapper">
        <PixelCanvas density="low" transparentBg isStatic />
      </div>

      <Navbar />

      {/* Main 3-Column Boxed Layout matching pi.dev */}
      <div className="docs-three-column-grid">
        {/* Column 1: Left Navigation Box */}
        <DocsNavBox
          sections={filteredSections}
          activeSectionId={activeSection.id}
          onSelectSection={handleSelectSection}
        />

        {/* Column 2: Center Content & Search Box */}
        <DocsArticleBox
          section={activeSection}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          prevSection={prevSection}
          nextSection={nextSection}
          onSelectSection={handleSelectSection}
        />

        {/* Column 3: Right On This Page Box */}
        <DocsOnThisPage section={activeSection} />
      </div>

      <Footer />

      <style jsx>{`
        .docs-page-shell {
          min-height: 100vh;
          background: #000000;
          color: #ffffff;
          position: relative;
          overflow-x: clip;
        }

        .docs-pixel-bg-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
          opacity: 0.75;
        }

        .docs-three-column-grid {
          position: relative;
          z-index: 1;
          max-width: var(--site-content-max);
          margin: 0 auto;
          padding: 28px 24px 64px 24px;
          display: flex;
          align-items: flex-start;
          gap: 20px;
        }

        @media (max-width: 900px) {
          .docs-three-column-grid {
            flex-direction: column;
            padding: 16px;
            gap: 16px;
          }
        }

        @media (max-width: 640px) {
          .docs-three-column-grid {
            padding: 12px 10px 48px 10px;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
}
