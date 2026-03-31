"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { ShareCard } from "@/components/ui/ShareCard";

type PublicPortrait = {
  id: string;
  portrait: string;
  portrait_tags: string[] | null;
  created_at: string;
};

type ShareState = { portrait: string; tags: string[] } | null;

const ALL_TAGS = [
  "grounded", "creative", "ambitious", "intentional", "nurturing",
  "luminous", "quiet", "bold", "soft", "disciplined", "free", "clear",
  "magnetic", "tender", "fierce", "present", "devoted", "rising", "still", "expressive",
];

export default function FeedPage() {
  const [portraits, setPortraits] = useState<PublicPortrait[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareCard, setShareCard] = useState<ShareState>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id, portrait, portrait_tags, created_at")
        .eq("portrait_public", true)
        .order("created_at", { ascending: false })
        .limit(100);
      setPortraits(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = activeTag
    ? portraits.filter((p) => p.portrait_tags?.includes(activeTag))
    : portraits;

  // Find which tags actually exist in the current set
  const activeTags = new Set(portraits.flatMap((p) => p.portrait_tags || []));
  const visibleTags = ALL_TAGS.filter((t) => activeTags.has(t));

  if (loading) return <div className="min-h-dvh bg-bone dark:bg-dark-bg" />;

  return (
    <>
      <div className="min-h-dvh bg-bone dark:bg-dark-bg">
        <div className="max-w-lg mx-auto px-6 py-12 space-y-10">

          {/* Header */}
          <div className="flex items-baseline justify-between">
            <div className="space-y-1">
              <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                Script
              </p>
              <p className="heading-editorial text-[1.3rem] leading-[1.45] text-ink dark:text-dark-text">
                Who they&apos;re becoming.
              </p>
            </div>
            <Link
              href="/home"
              className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary hover:text-ink-secondary transition-colors"
            >
              My portrait
            </Link>
          </div>

          {/* Tag filters */}
          {visibleTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTag(null)}
                className={[
                  "px-3 py-1.5 text-[0.65rem] tracking-widest uppercase border transition-all",
                  activeTag === null
                    ? "border-ink dark:border-dark-text text-ink dark:text-dark-text"
                    : "border-border dark:border-dark-border text-ink-faint dark:text-dark-text-secondary",
                ].join(" ")}
              >
                All
              </button>
              {visibleTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={[
                    "px-3 py-1.5 text-[0.65rem] tracking-widest uppercase border transition-all",
                    activeTag === tag
                      ? "border-ink dark:border-dark-text text-ink dark:text-dark-text"
                      : "border-border dark:border-dark-border text-ink-faint dark:text-dark-text-secondary",
                  ].join(" ")}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="space-y-4 py-12 text-center">
              <p className="text-[0.9375rem] text-ink-secondary dark:text-dark-text-secondary">
                {portraits.length === 0
                  ? "No portraits shared yet. Be the first."
                  : "No portraits with this tag yet."}
              </p>
              <Link
                href="/home"
                className="inline-block text-xs tracking-widest uppercase text-ink dark:text-dark-text border-b border-ink dark:border-dark-text pb-0.5"
              >
                Share yours
              </Link>
            </div>
          )}

          {/* Portrait cards */}
          <div className="space-y-0 border-t border-border dark:border-dark-border">
            {filtered.map((p) => (
              <PortraitCard
                key={p.id}
                portrait={p}
                onShare={() => setShareCard({ portrait: p.portrait, tags: p.portrait_tags || [] })}
              />
            ))}
          </div>

          {/* Footer */}
          {portraits.length > 0 && (
            <p className="text-xs text-ink-faint dark:text-dark-text-secondary text-center pb-4">
              {filtered.length} {filtered.length === 1 ? "portrait" : "portraits"} · anonymous · no names · no photos
            </p>
          )}

        </div>
      </div>

      {shareCard && (
        <ShareCard
          portrait={shareCard.portrait}
          tags={shareCard.tags}
          onClose={() => setShareCard(null)}
        />
      )}
    </>
  );
}

function PortraitCard({
  portrait,
  onShare,
}: {
  portrait: PublicPortrait;
  onShare: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const preview = portrait.portrait.slice(0, 220);
  const hasMore = portrait.portrait.length > 220;

  return (
    <div className="border-b border-border dark:border-dark-border py-8 space-y-4">
      {portrait.portrait_tags && portrait.portrait_tags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {portrait.portrait_tags.map((tag) => (
            <span
              key={tag}
              className="text-[0.6rem] tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div>
        <p className="portrait-text text-ink dark:text-dark-text leading-relaxed">
          {expanded ? portrait.portrait : preview}
          {!expanded && hasMore && "…"}
        </p>
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary hover:text-ink-secondary transition-colors"
          >
            {expanded ? "Less" : "Read more"}
          </button>
        )}
      </div>

      <button
        onClick={onShare}
        className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary hover:text-ink-secondary transition-colors"
      >
        Share ↗
      </button>
    </div>
  );
}
