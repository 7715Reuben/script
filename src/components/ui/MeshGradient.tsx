"use client";

import { useState, useEffect } from "react";
import type { PaletteEvent } from "./PaletteWrapper";

// Each event gets 3 blob colours — [top-left, bottom-right, centre]
// Light mode: soft, low-saturation tints
const LIGHT: Record<PaletteEvent, [string, string, string]> = {
  base:    ["#C8B8A8", "#D4C4B4", "#BCA898"],
  portrait:["#E8B840", "#D4941C", "#F5D070"],
  morning: ["#D89090", "#C87070", "#EAB0A8"],
  evening: ["#7888B8", "#5868A0", "#A0AECE"],
  weekly:  ["#E0B030", "#C89818", "#F0CC60"],
};

// Dark mode: deeper but still subtle — glow-like, not washed out
const DARK: Record<PaletteEvent, [string, string, string]> = {
  base:    ["#3A2E24", "#2E2218", "#463A2C"],
  portrait:["#5C4010", "#7A5518", "#40300C"],
  morning: ["#5C2020", "#441818", "#6A2828"],
  evening: ["#181E3C", "#10162C", "#222A50"],
  weekly:  ["#584210", "#443208", "#6C5018"],
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
