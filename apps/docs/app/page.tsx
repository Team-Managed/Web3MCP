"use client";

import React from "react";
import PixelCanvas from "./components/PixelCanvas";
import Navbar from "./components/Navbar";
import HeroCentered from "./components/hero/HeroCentered";
import HomeStoryGrid from "./components/HomeStoryGrid";
import WhatWeDidntBuild from "./components/WhatWeDidntBuild";
import WhyLegacyVsWeb3Mcp from "./components/WhyLegacyVsWeb3Mcp";
import GetInvolved from "./components/GetInvolved";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <main className="landing-page-root">
      <Navbar />

      {/* Hero Section Container: PixelCanvas extends to the very top */}
      <section className="hero-section-wrapper">
        <PixelCanvas />
        <HeroCentered />
      </section>

      {/* Subsequent Sections: Pure Solid Black */}
      <div className="content-sections">
        <WhyLegacyVsWeb3Mcp />
        <HomeStoryGrid />
        <WhatWeDidntBuild />
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

        .hero-section-wrapper {
          position: relative;
          width: 100%;
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #000000;
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
