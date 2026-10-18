"use client";

import React from "react";
import PixelCanvas from "./components/PixelCanvas";
import Navbar from "./components/Navbar";
import HeroCentered from "./components/hero/HeroCentered";
import HomeStoryGrid from "./components/HomeStoryGrid";
import SecurityByDesign from "./components/SecurityByDesign";
import WhyLegacyVsWeb3Mcp from "./components/WhyLegacyVsWeb3Mcp";
import GetInvolved from "./components/GetInvolved";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <main className="landing-page-root">
      <div className="hero-shell">
        <PixelCanvas />
        <Navbar />
        <section className="hero-section-wrapper">
          <HeroCentered />
        </section>
      </div>

      {/* Subsequent Sections: Pure Solid Black */}
      <div className="content-sections">
        <WhyLegacyVsWeb3Mcp />
        <HomeStoryGrid />
        <SecurityByDesign />
        <GetInvolved />
      </div>

      <Footer />

      <style jsx global>{`
        .landing-page-root {
          position: relative;
          min-height: 100vh;
          width: 100%;
          background: #000000;
          color: #ffffff;
          overflow-x: clip;
        }

        .hero-shell {
          position: relative;
          background: #000000;
          overflow: hidden;
        }

        .hero-section-wrapper {
          position: relative;
          z-index: 1;
          width: 100%;
          min-height: calc(100vh - 76px);
          min-height: calc(100dvh - 76px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: transparent;
          padding: 80px 20px 60px 20px;
          box-sizing: border-box;
        }

        .content-sections {
          position: relative;
          width: 100%;
          background: #000000;
          z-index: 10;
        }
      `}</style>
    </main>
  );
}
