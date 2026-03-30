"use client";

import { useState, useEffect } from "react";
import type { PaletteEvent } from "./PaletteWrapper";

// Each event gets 3 blob colours — [top-left, bottom-right, centre]
// Light mode: blush pinks + dusty blues — never harsh, always breathable
const LIGHT: Record<PaletteEvent, [string, string, string]> = {
  base:    ["#F0C8DC", "#B8C8E8", "#E4C0D8"],  // blush pink + dusty blue
  portrait:["#F0A8C8", "#D87098", "#F8C0DC"],  // warm blush rose — ceremonial
  morning: ["#A8C4E8", "#7898D0", "#C8D8F4"],  // periwinkle blue — new day
  evening: ["#8090C0", "#6070A8", "#A8B0D8"],  // slate blue — introspective
  weekly:  ["#F0A0C8", "#D85898", "#F8B8D8"],  // vivid sakura — celebratory
};

// Dark mode: deep twilight purples with soft cherry glow
const DARK: Record<PaletteEvent, [string, string, string]> = {
  base:    ["#380848", "#0C2040", "#280838"],  // deep twilight
  portrait:["#480828", "#380620", "#580838"],  // deep rose-twilight
  morning: ["#0C1040", "#080830", "#181050"],  // dark periwinkle-twilight
  evening: ["#060818", "#040610", "#0A0828"],  // pure deep twilight — darkest
  weekly:  ["#400820", "#300618", "#500828"],  // dark crimson-twilight
};

interface MeshGradientProps {
  event: PaletteEvent;
}

export function MeshGradient({ event }: MeshGradientProps) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const check = () =>
      setDark(document.documentElement.classList.contains("dark"));
    check();

    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const colors = dark ? DARK[event] : LIGHT[event];
  const opacity = dark ? 0.55 : 0.45;
  const blur = "90px";

  const blobBase: React.CSSProperties = {
    position: "absolute",
    borderRadius: "50%",
    filter: `blur(${blur})`,
    transition: "background-color 2s ease-in-out",
    willChange: "transform",
    pointerEvents: "none",
  };

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* Blob 1 — top-left */}
      <div
        className="mesh-blob-1"
        style={{
          ...blobBase,
          width: "70vw",
          height: "70vw",
          top: "-20vw",
          left: "-20vw",
          backgroundColor: colors[0],
          opacity,
        }}
      />

      {/* Blob 2 — bottom-right */}
      <div
        className="mesh-blob-2"
        style={{
          ...blobBase,
          width: "65vw",
          height: "65vw",
          bottom: "-18vw",
          right: "-18vw",
          backgroundColor: colors[1],
          opacity,
        }}
      />

      {/* Blob 3 — centre, smaller */}
      <div
        className="mesh-blob-3"
        style={{
          ...blobBase,
          width: "50vw",
          height: "50vw",
          top: "30vh",
          left: "25vw",
          backgroundColor: colors[2],
          opacity: opacity * 0.7,
        }}
      />
    </div>
  );
}
