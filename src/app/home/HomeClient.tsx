"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PortraitDisplay } from "@/components/ui/PortraitDisplay";
import { PaletteWrapper } from "@/components/ui/PaletteWrapper";
import { createClient } from "@/lib/supabase";
import type { Profile, Checkin, WeeklyReflection, Pronouns, Commitment, CommitmentLog } from "@/lib/supabase";
import { isMorning, P, cn, getTodayString } from "@/lib/utils";

interface HomeClientProps {
  profile: Profile;
  todaysCheckins: Checkin[];
  weeklyReflection: WeeklyReflection | null;
  commitments: Commitment[];
  todaysLogs: CommitmentLog[];
}

const PRONOUN_OPTIONS: { value: Pronouns; label: string }[] = [
  { value: "she", label: "she / her" },
  { value: "they", label: "they / them" },
  { value: "he", label: "he / him" },
];

export function HomeClient({ profile, todaysCheckins, weeklyReflection, commitments, todaysLogs }: HomeClientProps) {
  const morning = isMorning();
  const router = useRouter();
  const [pronouns, setPronouns] = useState<Pronouns>(profile.pronouns ?? "they");
  const [savingPronouns, setSavingPronouns] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/onboarding");
  }

  const hasEveningCheckin = todaysCheckins.some((c) => c.type === "evening");
  const lastCheckin = todaysCheckins[todaysCheckins.length - 1];
  const paletteEvent = weeklyReflection ? "weekly" : "base";

  async function handlePronounChange(next: Pronouns) {
    if (next === pronouns || savingPronouns) return;
    setSavingPronouns(true);
    setPronouns(next);
    const supabase = createClient();
    await supabase.from("profiles").update({ pronouns: next }).eq("id", profile.id);
    setSavingPronouns(false);
  }

  return (
    <PaletteWrapper event={paletteEvent}>
      <AppShell>
        <div className="space-y-12 pb-8 animate-fade-up">

          <section className="space-y-5">
            <div className="flex items-baseline justify-between">
              <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                {P.portrait(pronouns)}
              </p>
              <Link
                href="/portrait-session"
                className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary hover:text-ink-secondary dark:hover:text-dark-text-secondary transition-colors"
              >
                Deepen →
              </Link>
            </div>
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

          <CommitmentsSection
            commitments={commitments}
            todaysLogs={todaysLogs}
            userId={profile.user_id}
          />

          <div className="divider" />

          {/* Journal + Retrospective + Conversation links */}
          <section className="space-y-3">
            <div className="flex gap-0 border border-border dark:border-dark-border">
              <Link
                href="/conversation"
                className="flex-1 py-4 text-center border-r border-border dark:border-dark-border text-xs tracking-widest uppercase text-ink-secondary dark:text-dark-text-secondary hover:bg-ink/5 dark:hover:bg-dark-text/5 transition-colors"
              >
                Talk
              </Link>
              <Link
                href="/journal"
                className="flex-1 py-4 text-center border-r border-border dark:border-dark-border text-xs tracking-widest uppercase text-ink-secondary dark:text-dark-text-secondary hover:bg-ink/5 dark:hover:bg-dark-text/5 transition-colors"
              >
                Journal
              </Link>
              <Link
                href="/retrospective"
                className="flex-1 py-4 text-center text-xs tracking-widest uppercase text-ink-secondary dark:text-dark-text-secondary hover:bg-ink/5 dark:hover:bg-dark-text/5 transition-colors"
              >
                Your month
              </Link>
            </div>
          </section>

          <div className="divider" />

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

          <button
            onClick={handleSignOut}
            className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary hover:text-ink-secondary dark:hover:text-dark-text-secondary transition-colors"
          >
            Sign out
          </button>

        </div>
      </AppShell>
    </PaletteWrapper>
  );
}

type LogMap = Record<string, boolean | undefined>;

function CommitmentsSection({
  commitments,
  todaysLogs,
  userId,
}: {
  commitments: Commitment[];
  todaysLogs: CommitmentLog[];
  userId: string;
}) {
  const initial: LogMap = {};
  todaysLogs.forEach((l) => { initial[l.commitment_id] = l.kept; });

  const [logs, setLogs] = useState<LogMap>(initial);
  const [saving, setSaving] = useState<string | null>(null);

  async function handleToggle(commitmentId: string) {
    if (saving) return;
    setSaving(commitmentId);

    const current = logs[commitmentId];
    const next = current === undefined ? true : current === true ? false : undefined;
    setLogs((prev) => ({ ...prev, [commitmentId]: next }));

    const supabase = createClient();
    if (next === undefined) {
      await supabase
        .from("commitment_logs")
        .delete()
        .eq("commitment_id", commitmentId)
        .eq("date", getTodayString());
    } else {
      await supabase
        .from("commitment_logs")
        .upsert({ user_id: userId, commitment_id: commitmentId, date: getTodayString(), kept: next });
    }
    setSaving(null);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
          Commitments
        </p>
        <Link
          href="/commitments"
          className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary hover:text-ink-secondary dark:hover:text-dark-text-secondary transition-colors"
        >
          {commitments.length === 0 ? "Set up" : "Edit"}
        </Link>
      </div>

      {commitments.length === 0 ? (
        <p className="text-[0.9375rem] text-ink-faint dark:text-dark-text-secondary leading-relaxed">
          The things{" "}
          <Link href="/commitments" className="accent-script text-ink-secondary dark:text-dark-text-secondary">
            she always does
          </Link>
          {" "}&mdash; set them and the AI will hold you to them.
        </p>
      ) : (
        <ul className="space-y-3">
          {commitments.map((c) => {
            const state = logs[c.id];
            return (
              <li key={c.id} className="flex items-start gap-4">
                <button
                  onClick={() => handleToggle(c.id)}
                  disabled={saving === c.id}
                  className="mt-[0.35rem] flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center transition-all duration-150"
                >
                  {state === undefined && (
                    <span className="w-3 h-3 rounded-full border border-ink-faint dark:border-dark-text-secondary block" />
                  )}
                  {state === true && (
                    <span className="w-3 h-3 rounded-full bg-ink dark:bg-dark-text block" />
                  )}
                  {state === false && (
                    <span className="text-[0.6rem] text-ink-faint dark:text-dark-text-secondary leading-none">✕</span>
                  )}
                </button>
                <span className={cn(
                  "text-[0.9375rem] leading-relaxed transition-colors",
                  state === false
                    ? "text-ink-faint dark:text-dark-text-secondary line-through"
                    : "text-ink dark:text-dark-text"
                )}>
                  {c.content}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
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
