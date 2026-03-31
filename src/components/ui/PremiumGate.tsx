"use client";

import { useState } from "react";
import Link from "next/link";

interface PremiumGateProps {
  feature: string;
  description: string;
  example: string;
  onUnlock?: () => void;
}

const FREE_FEATURES = [
  "Identity portrait",
  "Daily check-ins (morning + evening)",
  "Commitments",
  "Journal (last 30 days)",
  "Monthly retrospective",
  "Anonymous portrait feed",
];

const PREMIUM_FEATURES = [
  "Everything in free",
  "Portrait Sessions",
  "Portrait Evolution",
  "AI Conversation",
  "Scripting Sessions",
  "Identity Challenges",
  "Full journal archive",
];

export function PremiumGate({ feature, description, example, onUnlock }: PremiumGateProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleUnlock() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upgrade" }),
      });
      if (!res.ok) throw new Error();
      if (onUnlock) onUnlock();
      else window.location.reload();
    } catch {
      setError(true);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10 animate-fade-up pb-12">

      {/* Header */}
      <div className="space-y-2">
        <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
          Script Premium
        </p>
        <p className="heading-editorial text-[1.4rem] leading-[1.4] text-ink dark:text-dark-text">
          {feature} is a premium feature.
        </p>
        <p className="text-[0.9375rem] leading-relaxed text-ink-secondary dark:text-dark-text-secondary">
          {description}
        </p>
      </div>

      {/* Teaser */}
      <div className="relative overflow-hidden border border-border dark:border-dark-border p-5 space-y-2">
        <p className="text-[0.6rem] tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary mb-3">
          Example
        </p>
        <p
          className="portrait-text text-ink dark:text-dark-text leading-relaxed select-none"
          style={{ filter: "blur(4px)", userSelect: "none" }}
        >
          {example}
        </p>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bone/80 dark:to-dark-bg/80" />
      </div>

      {/* Pricing */}
      <div className="space-y-1">
        <p className="heading-editorial text-[1.8rem] leading-none text-ink dark:text-dark-text">
          £7.99
          <span className="text-[0.9rem] font-normal text-ink-secondary dark:text-dark-text-secondary"> / month</span>
        </p>
        <p className="text-xs text-ink-faint dark:text-dark-text-secondary tracking-wide">
          or £49.99 / year — save 48%
        </p>
      </div>

      {/* Comparison */}
      <div className="flex border border-border dark:border-dark-border overflow-hidden">

        {/* Free column */}
        <div className="flex-1 border-r border-border dark:border-dark-border">
          <div className="px-4 py-3 border-b border-border dark:border-dark-border">
            <p className="text-[0.65rem] tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
              Free
            </p>
          </div>
          <ul className="divide-y divide-border dark:divide-dark-border">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="px-4 py-3 flex items-start gap-2">
                <span className="mt-[0.1rem] text-[0.65rem] text-ink-faint dark:text-dark-text-secondary flex-shrink-0">✓</span>
                <span className="text-[0.8rem] leading-snug text-ink-secondary dark:text-dark-text-secondary">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Premium column */}
        <div className="flex-1 bg-ink dark:bg-dark-text">
          <div className="px-4 py-3 border-b border-bone/20 dark:border-dark-bg/20">
            <p className="text-[0.65rem] tracking-widest uppercase text-bone/60 dark:text-dark-bg/60">
              Premium
            </p>
          </div>
          <ul className="divide-y divide-bone/10 dark:divide-dark-bg/10">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="px-4 py-3 flex items-start gap-2">
                <span className="mt-[0.1rem] text-[0.65rem] text-bone/50 dark:text-dark-bg/50 flex-shrink-0">✓</span>
                <span className="text-[0.8rem] leading-snug text-bone dark:text-dark-bg">{f}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* CTA */}
      <div className="space-y-3">
        <button
          onClick={handleUnlock}
          disabled={loading}
          className="w-full py-4 bg-ink dark:bg-dark-text text-bone dark:text-dark-bg text-sm tracking-widest uppercase disabled:opacity-60 transition-opacity"
        >
          {loading ? "Unlocking…" : "Unlock Script Premium"}
        </button>
        {error && (
          <p className="text-center text-xs text-ink-faint dark:text-dark-text-secondary">
            Something went wrong. Try again.
          </p>
        )}
        <Link
          href="/home"
          className="block w-full text-center py-3 text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary hover:text-ink-secondary transition-colors"
        >
          Maybe later
        </Link>
      </div>

    </div>
  );
}
