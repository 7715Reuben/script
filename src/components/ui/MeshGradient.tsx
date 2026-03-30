"use client";

import { useState, useEffect } from "react";
import type { PaletteEvent } from "./PaletteWrapper";

// Each event gets 3 blob colours — [top-left, bottom-right, centre]
// Light mode: cherry blossom pinks and twilight purples
const LIGHT: Record<PaletteEvent, [string, string, string]> = {
  base:    ["#E8C0D4", "#D4A8C4", "#F0D0E4"],  // soft cherry blossom
  portrait:["#E898C0", "#D06090", "#F0B8D4"],  // deep rose-sakura — ceremonial
  morning: ["#C8A8E8", "#A878D0", "#DCC0F4"],  // lavender-blossom — new day
  evening: ["#9898D0", "#7070B8", "#B8B0E0"],  // twilight lavender — inward
  weekly:  ["#E880B8", "#C85898", "#F0A8D0"],  // vivid sakura — celebratory
};

// Dark mode: deep twilight purples with cherry blossom glow
const DARK: Record<PaletteEvent, [string, string, string]> = {
  base:    ["#3A1838", "#2A1048", "#481840"],  // deep twilight purple
  portrait:["#4A1030", "#380828", "#581838"],  // deep rose-twilight
  morning: ["#2A1048", "#1C0838", "#381860"],  // dark lavender-twilight
  evening: ["#0C0828", "#080620", "#141040"],  // pure deep twilight — darkest
  weekly:  ["#440828", "#320620", "#540830"],  // dark crimson-twilight
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
