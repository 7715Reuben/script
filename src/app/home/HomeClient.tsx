"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PortraitDisplay } from "@/components/ui/PortraitDisplay";
import { PaletteWrapper } from "@/components/ui/PaletteWrapper";
import type { Profile, Checkin, WeeklyReflection } from "@/lib/supabase";
import { isMorning, P } from "@/lib/utils";

interface HomeClientProps {
  profile: Profile;
  todaysCheckins: Checkin[];
  weeklyReflection: WeeklyReflection | null;
}

export function HomeClient({ profile, todaysCheckins, weeklyReflection }: HomeClientProps) {
  const morning = isMorning();
  const pronouns = profile.pronouns ?? "she";
  const hasMorningCheckin = todaysCheckins.some((c) => c.type === "morning");
  const hasEveningCheckin = todaysCheckins.some((c) => c.type === "evening");
  const lastCheckin = todaysCheckins[todaysCheckins.length - 1];

  const paletteEvent = weeklyReflection ? "weekly" : "base";

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

        </div>
      </AppShell>
    </PaletteWrapper>
  );
}

function DailyPrompt({ morning, pronouns }: { morning: boolean; pronouns: "she" | "he" }) {
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
