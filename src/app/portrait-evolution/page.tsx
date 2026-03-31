"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { AppShell } from "@/components/layout/AppShell";
import { PaletteWrapper } from "@/components/ui/PaletteWrapper";
import { PremiumGate } from "@/components/ui/PremiumGate";

type Version = {
  id: string;
  content: string;
  created_at: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PortraitEvolutionPage() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [premium, setPremium] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/onboarding"); return; }

      const [profileRes, versionsRes] = await Promise.all([
        supabase.from("profiles").select("portrait, premium").eq("user_id", user.id).single(),
        supabase
          .from("portrait_versions")
          .select("id, content, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      setPremium(profileRes.data?.premium !== false);
      setCurrent(profileRes.data?.portrait ?? "");
      setVersions(versionsRes.data ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) return <div className="min-h-dvh bg-bone dark:bg-dark-bg" />;

  if (!premium) return (
    <PaletteWrapper event="portrait">
      <AppShell>
        <PremiumGate
          feature="Portrait Evolution"
          description="Your portrait isn't static. As you do Portrait Sessions, it deepens. This is where you see how far you've come."
          example="This is where you started. This is where you are now. The distance between them is everything you've done."
          onUnlock={() => window.location.reload()}
        />
      </AppShell>
    </PaletteWrapper>
  );

  const earliest = versions.length > 0 ? versions[versions.length - 1] : null;
  const hasEvolved = versions.length > 0;

  return (
    <PaletteWrapper event="portrait">
      <AppShell>
        <div className="space-y-10 pb-12 animate-fade-up">

          <div className="flex items-baseline justify-between">
            <button
              onClick={() => router.push("/home")}
              className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary hover:text-ink-secondary transition-colors"
            >
              ← Back
            </button>
            <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
              Portrait evolution
            </p>
          </div>

          {/* Current portrait */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                Now
              </p>
              {hasEvolved && (
                <button
                  onClick={() => setComparing(!comparing)}
                  className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary hover:text-ink-secondary transition-colors"
                >
                  {comparing ? "Close comparison" : "Compare to origin"}
                </button>
              )}
            </div>

            {comparing && earliest ? (
              <div className="flex gap-0 border border-border dark:border-dark-border overflow-hidden">
                <div className="flex-1 p-5 border-r border-border dark:border-dark-border space-y-2">
                  <p className="text-[0.6rem] tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                    Origin · {formatDate(earliest.created_at)}
                  </p>
                  <p className="portrait-text text-[0.85rem] leading-relaxed text-ink-secondary dark:text-dark-text-secondary">
                    {earliest.content}
                  </p>
                </div>
                <div className="flex-1 p-5 space-y-2">
                  <p className="text-[0.6rem] tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                    Now
                  </p>
                  <p className="portrait-text text-[0.85rem] leading-relaxed text-ink dark:text-dark-text">
                    {current}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {current.split(/\n\n+/).filter(Boolean).map((para, i) => (
                  <p key={i} className="portrait-text text-ink dark:text-dark-text leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Version history */}
          {!hasEvolved ? (
            <>
              <div className="divider" />
              <div className="space-y-3 py-4">
                <p className="text-[0.9375rem] text-ink-secondary dark:text-dark-text-secondary leading-relaxed">
                  Your portrait hasn&apos;t evolved yet.
                </p>
                <p className="text-[0.85rem] text-ink-faint dark:text-dark-text-secondary leading-relaxed">
                  Each Portrait Session adds a new layer — mornings, work, relationships, voice. When you complete one, the before and after are saved here.
                </p>
                <button
                  onClick={() => router.push("/portrait-session")}
                  className="text-xs tracking-widest uppercase text-ink dark:text-dark-text border-b border-ink dark:border-dark-text pb-0.5"
                >
                  Start a portrait session →
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="divider" />
              <div className="space-y-0 border-t border-border dark:border-dark-border">
                {versions.map((v, i) => {
                  const isExpanded = expanded === v.id;
                  const preview = v.content.slice(0, 200);
                  const hasMore = v.content.length > 200;
                  return (
                    <div key={v.id} className="border-b border-border dark:border-dark-border py-6 space-y-3">
                      <div className="flex items-baseline justify-between">
                        <p className="text-[0.65rem] tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                          {i === versions.length - 1 ? "Origin" : `Version ${versions.length - i - 1}`} · {formatDate(v.created_at)}
                        </p>
                      </div>
                      <p className="portrait-text text-[0.875rem] leading-relaxed text-ink-secondary dark:text-dark-text-secondary">
                        {isExpanded ? v.content : preview}
                        {!isExpanded && hasMore && "…"}
                      </p>
                      {hasMore && (
                        <button
                          onClick={() => setExpanded(isExpanded ? null : v.id)}
                          className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary hover:text-ink-secondary transition-colors"
                        >
                          {isExpanded ? "Collapse" : "Read more"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-ink-faint dark:text-dark-text-secondary text-center">
                {versions.length} {versions.length === 1 ? "version" : "versions"} saved
              </p>
            </>
          )}

        </div>
      </AppShell>
    </PaletteWrapper>
  );
}
