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

export function PaletteWrapper({ event, children, className }: PaletteWrapperProps) {
  const [current, setCurrent] = useState<PaletteEvent>("base");

  useEffect(() => {
    setCurrent(event);

    if (event !== "base") {
      const timer = setTimeout(() => setCurrent("base"), 5000);
      return () => clearTimeout(timer);
    }
  }, [event]);

  return (
    <div
      className={cn("min-h-dvh w-full relative", paletteClasses[current], className)}
      style={{ "--palette-accent": accentColors[current] } as React.CSSProperties}
    >
      {/* Accent line — appears briefly on palette events */}
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
