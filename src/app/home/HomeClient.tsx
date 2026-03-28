"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PortraitDisplay } from "@/components/ui/PortraitDisplay";
import { PaletteWrapper } from "@/components/ui/PaletteWrapper";
import type { Profile, Checkin, WeeklyReflection } from "@/lib/supabase";
import { isMorning } from "@/lib/utils";

interface HomeClientProps {
  profile: Profile;
  todaysCheckins: Checkin[];
  weeklyReflection: WeeklyReflection | null;
}

export function HomeClient({ profile, todaysCheckins, weeklyReflection }: HomeClientProps) {
  const morning = isMorning();
  const hasMorningCheckin = todaysCheckins.some((c) => c.type === "morning");
  const hasEveningCheckin = todaysCheckins.some((c) => c.type === "evening");
  const lastCheckin = todaysCheckins[todaysCheckins.length - 1];

  const paletteEvent = weeklyReflection ? "weekly"
    : hasMorningCheckin && !hasEveningCheckin ? "base"
    : "base";

  return (
    <PaletteWrapper event={paletteEvent}>
      <AppShell>
        <div className="space-y-12 pb-8 animate-fade-up">

          {/* Portrait */}
          <section className="space-y-5">
            <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
              Her portrait
            </p>
            <PortraitDisplay portrait={profile.portrait} />
          </section>

          {/* Divider */}
          <div className="divider" />

          {/* Weekly reflection — shown if it exists and it's Sunday */}
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

          {/* Daily moment */}
          <section className="space-y-4">
            {lastCheckin ? (
              // Show last AI response
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
              // Show today's prompt
              <DailyPrompt morning={morning} />
            )}
          </section>

        </div>
      </AppShell>
    </PaletteWrapper>
  );
}

function DailyPrompt({ morning }: { morning: boolean }) {
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
              <span className="accent-script">she</span> would do?
            </>
          ) : (
            <>
              Did you show up as{" "}
              <span className="accent-script">her</span> today?
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
