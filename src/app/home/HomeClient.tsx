"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PortraitDisplay } from "@/components/ui/PortraitDisplay";
import { PaletteWrapper } from "@/components/ui/PaletteWrapper";
import { createClient } from "@/lib/supabase";
import type { Profile, Checkin, WeeklyReflection, Pronouns } from "@/lib/supabase";
import { isMorning, P, cn } from "@/lib/utils";

interface HomeClientProps {
  profile: Profile;
  todaysCheckins: Checkin[];
  weeklyReflection: WeeklyReflection | null;
}

const PRONOUN_OPTIONS: { value: Pronouns; label: string }[] = [
  { value: "she", label: "she / her" },
  { value: "they", label: "they / them" },
  { value: "he", label: "he / him" },
];

export function HomeClient({ profile, todaysCheckins, weeklyReflection }: HomeClientProps) {
  const morning = isMorning();
  const [pronouns, setPronouns] = useState<Pronouns>(profile.pronouns ?? "they");
  const [savingPronouns, setSavingPronouns] = useState(false);

  const hasEveningCheckin = todaysCheckins.some((c) => c.type === "evening");
  const lastCheckin = todaysCheckins[todaysCheckins.length - 1];

  const paletteEvent = weeklyReflection ? "weekly" : "base";

  async function handlePronounChange(next: Pronouns) {
    if (next === pronouns || savingPronouns) return;
    setSavingPronouns(true);
    setPronouns(next);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ pronouns: next })
      .eq("id", profile.id);
    setSavingPronouns(false);
  }

  return (
    <PaletteWrapper event={paletteEvent}>
      <AppShell>
        <div className="space-y-12 pb-8 animate-fade-up">

          <section className="space-y-5">
            <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
              {P.portrait(pronouns)}
            </p>
            <PortraitDisplay portrait={profile.portrait} />
          </section>

          <div className="divider" />

          {weeklyReflection && (
            <section className="space-y-4">
              <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                This week
              </p>
              <div className="space-y-4">
                {weeklyReflection.content.split(/\n\n+/).filter(Boolean).map((para, i) => (
                  <p key={i} className="text-[0.9375rem] leading-relaxed text-ink dark:text-dark-text">
                    {para}
                  </p>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-4">
            {lastCheckin ? (
              <div className="space-y-3">
                <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                  {lastCheckin.type === "morning" ? "This morning" : "This evening"}
                </p>
                <p className="portrait-text text-ink-secondary dark:text-dark-text-secondary italic">
                  &ldquo;{lastCheckin.ai_response}&rdquo;
                </p>
                {!hasEveningCheckin && !morning && (
                  <Link
                    href="/checkin?type=evening"
                    className="inline-block text-xs tracking-widest uppercase text-ink dark:text-dark-text border-b border-ink dark:border-dark-text pb-0.5 mt-2"
                  >
                    Evening check-in
                  </Link>
                )}
              </div>
            ) : (
              <DailyPrompt morning={morning} pronouns={pronouns} />
            )}
          </section>

          <div className="divider" />

          {/* Pronouns selector */}
          <section className="space-y-3">
            <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
              Pronouns
            </p>
            <div className="flex border border-border dark:border-dark-border">
              {PRONOUN_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handlePronounChange(opt.value)}
                  disabled={savingPronouns}
                  className={cn(
                    "flex-1 py-3 text-xs tracking-widest uppercase transition-all duration-200",
                    "border-r border-border dark:border-dark-border last:border-r-0",
                    pronouns === opt.value
                      ? "bg-ink dark:bg-dark-text text-bone dark:text-dark-bg"
                      : "text-ink-secondary dark:text-dark-text-secondary hover:text-ink dark:hover:text-dark-text"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

        </div>
      </AppShell>
    </PaletteWrapper>
  );
}

function DailyPrompt({ morning, pronouns }: { morning: boolean; pronouns: Pronouns }) {
  const obj = P.object(pronouns);
  const subj = P.subject(pronouns);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
          {morning ? "Good morning" : "This evening"}
        </p>
        <p className="heading-editorial text-[1.3rem] leading-[1.45] text-ink dark:text-dark-text">
          {morning ? (
            <>
              What is one thing you&apos;ll do today that{" "}
              <span className="accent-script">{subj}</span> would do?
            </>
          ) : (
            <>
              Did you show up as{" "}
              <span className="accent-script">{obj}</span> today?
            </>
          )}
        </p>
      </div>
      <Link
        href={`/checkin?type=${morning ? "morning" : "evening"}`}
        className="inline-block w-full text-center py-4 bg-ink dark:bg-dark-text text-bone dark:text-dark-bg text-sm tracking-widest uppercase"
      >
        {morning ? "Set your intention" : "Reflect"}
      </Link>
    </div>
  );
}
