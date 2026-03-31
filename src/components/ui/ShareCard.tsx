"use client";

import { useState } from "react";

interface ShareCardProps {
  portrait: string;
  tags?: string[];
  onClose: () => void;
}

function getExcerpt(text: string): string {
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  const first = paragraphs[0] ?? text;
  return first.length > 260 ? first.slice(0, 257) + "\u2026" : first;
}

export function ShareCard({ portrait, tags, onClose }: ShareCardProps) {
  const [shared, setShared] = useState(false);
  const excerpt = getExcerpt(portrait);

  async function handleShare() {
    const shareText = `"${excerpt}"\n\n#ScriptedIntoExistence\nscript.app`;
    try {
      if (navigator.share) {
        await navigator.share({ text: shareText });
        setShared(true);
      } else {
        await navigator.clipboard.writeText(shareText);
        setShared(true);
      }
    } catch {
      // dismissed — do nothing
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "linear-gradient(165deg, #1A0422 0%, #3E1035 45%, #220818 100%)" }}>

      {/* Grain texture — printed feel */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          opacity: 0.04,
          mixBlendMode: "overlay",
        }}
      />

      {/* Close — top right */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-10 w-8 h-8 flex items-center justify-center transition-opacity"
        style={{ color: "rgba(230, 160, 195, 0.5)" }}
      >
        <span className="text-sm">✕</span>
      </button>

      {/* Card content */}
      <div className="flex-1 flex flex-col justify-between px-8 pt-10 pb-8 min-h-0">

        {/* Wordmark */}
        <div className="text-center space-y-1">
          <p
            className="text-[0.6rem] tracking-[0.35em] uppercase"
            style={{ color: "#D080A8", fontFamily: "var(--font-playfair)" }}
          >
            Script
          </p>
          {tags && tags.length > 0 && (
            <div className="flex gap-2 flex-wrap justify-center">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[0.55rem] tracking-widest uppercase"
                  style={{ color: "rgba(208, 128, 168, 0.6)" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Portrait excerpt — the centrepiece */}
        <div className="flex-1 flex items-center py-10">
          <p
            className="text-center leading-[1.9] text-[1.05rem]"
            style={{
              fontFamily: "var(--font-playfair)",
              fontStyle: "italic",
              color: "#F5E8EE",
              letterSpacing: "0.01em",
            }}
          >
            &ldquo;{excerpt}&rdquo;
          </p>
        </div>

        {/* Bottom tag */}
        <div className="text-center space-y-2">
          <p
            className="text-[0.65rem] tracking-[0.28em] uppercase"
            style={{ color: "#D080A8" }}
          >
            #ScriptedIntoExistence
          </p>
          <p
            className="text-[0.55rem] tracking-[0.2em] uppercase"
            style={{ color: "rgba(208, 128, 168, 0.45)" }}
          >
            script.app
          </p>
        </div>

      </div>

      {/* Actions — below the natural "card" area */}
      <div
        className="px-6 pb-10 pt-4 flex gap-3"
        style={{ background: "rgba(0,0,0,0.25)" }}
      >
        <button
          onClick={handleShare}
          className="flex-1 py-3.5 text-xs tracking-widest uppercase transition-all"
          style={{
            background: shared ? "rgba(208, 128, 168, 0.15)" : "rgba(208, 128, 168, 0.2)",
            color: "#E8A8C8",
            border: "1px solid rgba(208, 128, 168, 0.3)",
          }}
        >
          {shared ? "Copied ✓" : "Share →"}
        </button>
        <button
          onClick={onClose}
          className="px-5 py-3.5 text-xs tracking-widest uppercase"
          style={{ color: "rgba(208, 128, 168, 0.5)" }}
        >
          Close
        </button>
      </div>

    </div>
  );
}
