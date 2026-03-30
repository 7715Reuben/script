"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type PaletteEvent = "base" | "portrait" | "morning" | "evening" | "weekly";

interface PaletteWrapperProps {
  event: PaletteEvent;
  children: React.ReactNode;
  className?: string;
}

const paletteClasses: Record<PaletteEvent, string> = {
  base: "palette-base",
  portrait: "palette-portrait",
  morning: "palette-morning",
  evening: "palette-evening",
  weekly: "palette-weekly",
};

// Accent color that animates into view for each event
const accentColors: Record<PaletteEvent, string> = {
  base: "transparent",
  portrait: "#C9943A",
  morning: "#C4827A",
  evening: "#5C6E94",
  weekly: "#B8923A",
};

// Blob configs per event — positions and sizes are fixed, opacity animates
const blobConfigs: Record<PaletteEvent, { color: string; blobs: { top: string; left: string; width: string; height: string }[] }> = {
  base: { color: "transparent", blobs: [] },
  portrait: {
    color: "#C9943A",
    blobs: [
      { top: "-10%", left: "-5%", width: "55vw", height: "55vw" },
      { top: "40%", left: "55%", width: "45vw", height: "45vw" },
    ],
  },
  morning: {
    color: "#C4827A",
    blobs: [
      { top: "-5%", left: "50%", width: "50vw", height: "50vw" },
      { top: "55%", left: "-10%", width: "40vw", height: "40vw" },
    ],
  },
  evening: {
    color: "#5C6E94",
    blobs: [
      { top: "30%", left: "-10%", width: "60vw", height: "60vw" },
      { top: "-5%", left: "45%", width: "40vw", height: "40vw" },
    ],
  },
  weekly: {
    color: "#B8923A",
    blobs: [
      { top: "-15%", left: "20%", width: "65vw", height: "65vw" },
      { top: "50%", left: "40%", width: "40vw", height: "40vw" },
    ],
  },
};

export function PaletteWrapper({ event, children, className }: PaletteWrapperProps) {
  const [current, setCurrent] = useState<PaletteEvent>("base");
  const [blobVisible, setBlobVisible] = useState(false);

  useEffect(() => {
    setCurrent(event);

    if (event !== "base") {
      setBlobVisible(true);
      const timer = setTimeout(() => {
        setBlobVisible(false);
        setTimeout(() => setCurrent("base"), 1200);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setBlobVisible(false);
    }
  }, [event]);

  const config = blobConfigs[current];

  return (
    <div
      className={cn("min-h-dvh w-full relative overflow-hidden", paletteClasses[current], className)}
      style={{ "--palette-accent": accentColors[current] } as React.CSSProperties}
    >
      {/* Blobs */}
      {config.blobs.map((blob, i) => (
        <div
          key={`${current}-${i}`}
          className="fixed pointer-events-none z-0"
          style={{
            top: blob.top,
            left: blob.left,
            width: blob.width,
            height: blob.height,
            borderRadius: "50%",
            background: config.color,
            filter: "blur(90px)",
            opacity: blobVisible ? 0.13 : 0,
            transition: "opacity 1.4s ease-in-out",
          }}
        />
      ))}

      {/* Subtle top accent line that appears on events */}
      <div
        className="fixed top-0 left-0 right-0 h-[2px] transition-all duration-1000 ease-in-out z-50"
        style={{
          backgroundColor: current !== "base" ? accentColors[current] : "transparent",
          opacity: current !== "base" ? 0.6 : 0,
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
