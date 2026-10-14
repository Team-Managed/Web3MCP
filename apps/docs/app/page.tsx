"use client";

import React from "react";
import PixelCanvas from "./components/PixelCanvas";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";

export default function Home() {
  return (
    <main className="landing-page-root">
      <PixelCanvas />
      <Navbar />
      <Hero />

      <style jsx global>{`
        .landing-page-root {
          position: relative;
          min-height: 100vh;
          width: 100%;
          background: #000000;
          color: #ffffff;
          overflow: hidden;
        }
      `}</style>
    </main>
  );
}
