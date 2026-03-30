"use client";

import Link from "next/link";

interface PremiumGateProps {
  feature: string;
  description: string;
  example: string; // a teaser line showing what the feature produces
}

export function PremiumGate({ feature, description, example }: PremiumGateProps) {
  return (
    <div className="space-y-10 animate-fade-up">
      <div className="space-y-2">
        <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
          Script Premium
        </p>
        <p className="heading-editorial text-[1.3rem] leading-[1.45] text-ink dark:text-dark-text">
          {feature}
        </p>
        <p className="text-[0.9375rem] leading-relaxed text-ink-secondary dark:text-dark-text-secondary">
          {description}
        </p>
      </div>

      {/* Teaser — blurred example output */}
      <div className="relative overflow-hidden border border-border dark:border-dark-border p-6 space-y-2">
        <p className="text-[0.6rem] tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary mb-3">
          Example
        </p>
        <p className="portrait-text text-ink dark:text-dark-text leading-relaxed select-none"
           style={{ filter: "blur(4px)", userSelect: "none" }}>
          {example}
        </p>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bone/80 dark:to-dark-bg/80" />
      </div>

      <div className="space-y-3">
        <button
          className="w-full py-4 bg-ink dark:bg-dark-text text-bone dark:text-dark-bg text-sm tracking-widest uppercase"
          onClick={() => {
            // Placeholder — replace with Stripe checkout when ready
            alert("Premium is coming soon. You'll be the first to know.");
          }}
        >
          Unlock Premium
        </button>
        <Link
          href="/home"
          className="block w-full text-center py-3 text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary hover:text-ink-secondary transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
