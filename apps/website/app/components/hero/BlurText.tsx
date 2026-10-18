"use client";

import { motion, useReducedMotion } from "framer-motion";

type BlurTextProps = {
  text: string;
  highlightWord?: string;
};

// Adapted from the supplied React Bits BlurText for the hero's word reveal.
export default function BlurText({ text, highlightWord }: BlurTextProps) {
  const reducedMotion = useReducedMotion();

  return (
    <span className="blur-text-line" aria-hidden="true">
      {text.split(" ").map((word, index) => (
        <motion.span
          key={`${index}-${word}`}
          className={word === highlightWord ? "hero-gradient" : undefined}
          initial={reducedMotion ? false : { opacity: 0, filter: "blur(10px)", y: -14 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.55, delay: index * 0.1, ease: "easeOut" }}
        >
          {word}
        </motion.span>
      ))}
      <style jsx>{`
        .blur-text-line {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          column-gap: 0.23em;
        }
        .blur-text-line :global(span) {
          display: inline-block;
        }
      `}</style>
    </span>
  );
}
