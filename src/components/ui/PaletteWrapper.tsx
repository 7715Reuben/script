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

const accentColors: Record<PaletteEvent, string> = {
  base: "transparent",
  portrait: "#C9943A",
  morning: "#C4827A",
  evening: "#5C6E94",
  weekly: "#B8923A",
};

// Light mode blob colours per event
const blobColors: Record<PaletteEvent, [string, string, string]> = {
  base:    ["#DDD5C8", "#D6CFC8", "#CFC8C0"],
  portrait:["#C9943A", "#D4A84B", "#B8822E"],
  morning: ["#C4827A", "#D4908A", "#B87070"],
  evening: ["#5C6E94", "#6B7FA8", "#4E5E80"],
  weekly:  ["#B8923A", "#C9A348", "#A8822E"],
};

// Dark mode blob colours — deeper, more saturated
const blobColorsDark: Record<PaletteEvent, [string, string, string]> = {
  base:    ["#2E2820", "#2A2420", "#26211C"],
  portrait:["#7A5520", "#8A6228", "#6A4818"],
  morning: ["#7A4A48", "#8A5452", "#6A3E3C"],
  evening: ["#2E3D5C", "#364866", "#263450"],
  weekly:  ["#7A5820", "#8A6628", "#6A4A18"],
};

export function PaletteWrapper({ event, children, className }: PaletteWrapperProps) {
  const [current, setCurrent] = useState<PaletteEvent>("base");

  useEffect(() => {
    setCurrent(event);

    if (event !== "base") {
      const timer = setTimeout(() => setCurrent("base"), 5200);
      return () => clearTimeout(timer);
    }
  }, [event]);

  const light = blobColors[current];
  const dark = blobColorsDark[current];

  const blobs = [
    { cls: "blob-a", top: "-15%", left: "-10%",  size: "60vmax", color: light[0], darkColor: dark[0] },
    { cls: "blob-b", top: "35%",  left: "45%",   size: "50vmax", color: light[1], darkColor: dark[1] },
    { cls: "blob-c", top: "60%",  left: "-5%",   size: "45vmax", color: light[2], darkColor: dark[2] },
  ];

  return (
    <div
      className={cn("min-h-dvh w-full relative overflow-hidden", paletteClasses[current], className)}
      style={{ "--palette-accent": accentColors[current] } as React.CSSProperties}
    >
      {/* Always-present drifting blobs — colour transitions with palette */}
      {blobs.map((blob) => (
        <div key={blob.cls} className={cn("fixed pointer-events-none z-0", blob.cls)} style={{ top: blob.top, left: blob.left }}>
          {/* Light mode blob */}
          <div
            className="dark:hidden"
            style={{
              width: blob.size,
              height: blob.size,
              borderRadius: "50%",
              backgroundColor: blob.color,
              filter: "blur(90px)",
              opacity: 0.45,
              transition: "background-color 2s ease-in-out",
            }}
          />
          {/* Dark mode blob */}
          <div
            className="hidden dark:block"
            style={{
              width: blob.size,
              height: blob.size,
              borderRadius: "50%",
              backgroundColor: blob.darkColor,
              filter: "blur(90px)",
              opacity: 0.6,
              transition: "background-color 2s ease-in-out",
            }}
          />
        </div>
      ))}

      {/* Subtle top accent line on events */}
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
