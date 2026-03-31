"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PortraitDisplay } from "@/components/ui/PortraitDisplay";
import { PaletteWrapper } from "@/components/ui/PaletteWrapper";
import { ShareCard } from "@/components/ui/ShareCard";
import { createClient } from "@/lib/supabase";
import type { Profile, Checkin, WeeklyReflection, Pronouns, Commitment, CommitmentLog } from "@/lib/supabase";

type TodaysChallenge = {
  challengeId: string;
  title: string;
  day: number;
  action: string;
  done: boolean;
} | null;
import { isMorning, P, cn, getTodayString } from "@/lib/utils";

interface HomeClientProps {
  profile: Profile;
  todaysCheckins: Checkin[];
  weeklyReflection: WeeklyReflection | null;
  commitments: Commitment[];
  todaysLogs: CommitmentLog[];
  todaysChallenge: TodaysChallenge;
}

const PRONOUN_OPTIONS: { value: Pronouns; label: string }[] = [
  { value: "she", label: "she / her" },
  { value: "they", label: "they / them" },
  { value: "he", label: "he / him" },
];

export function HomeClient({ profile, todaysCheckins, weeklyReflection, commitments, todaysLogs, todaysChallenge }: HomeClientProps) {
  const morning = isMorning();
  const router = useRouter();
  const [pronouns, setPronouns] = useState<Pronouns>(profile.pronouns ?? "they");
  const [savingPronouns, setSavingPronouns] = useState(false);
  const [portraitPublic, setPortraitPublic] = useState(profile.portrait_public ?? false);
  const [togglingPublic, setTogglingPublic] = useState(false);
  const [isPremium, setIsPremium] = useState(profile.premium ?? true);
  const [showShareCard, setShowShareCard] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/onboarding");
  }

  async function handleDevTogglePremium() {
    const next = !isPremium;
    setIsPremium(next);
    await fetch("/api/premium", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: next ? "upgrade" : "downgrade" }),
    });
  }

  const hasEveningCheckin = todaysCheckins.some((c) => c.type === "evening");
  const lastCheckin = todaysCheckins[todaysCheckins.length - 1];
  const paletteEvent = weeklyReflection ? "weekly" : "base";

  async function handlePortraitPublicToggle() {
    if (togglingPublic) return;
    setTogglingPublic(true);
    const next = !portraitPublic;
    setPortraitPublic(next);
    const supabase = createClient();

    if (next) {
      // Tag the portrait on first publish
      try {
        const res = await fetch("/api/portrait-tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ portrait: profile.portrait }),
        });
        const data = await res.json();
        await supabase
          .from("profiles")
          .update({ portrait_public: true, portrait_tags: data.tags })
          .eq("id", profile.id);
      } catch {
        await supabase.from("profiles").update({ portrait_public: true }).eq("id", profile.id);
      }
    } else {
      await supabase.from("profiles").update({ portrait_public: false }).eq("id", profile.id);
    }
    setTogglingPublic(false);
  }

  async function handlePronounChange(next: Pronouns) {
    if (next === pronouns || savingPronouns) return;
    setSavingPronouns(true);
    setPronouns(next);
    const supabase = createClient();
    await supabase.from("profiles").update({ pronouns: next }).eq("id", profile.id);
    setSavingPronouns(false);
  }

  return (
    <>
    <PaletteWrapper event={paletteEvent}>
      <AppShell>
        <div className="space-y-12 pb-8 animate-fade-up">

          <section className="space-y-5">
            <div className="flex items-baseline justify-between">
              <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                {P.portrait(pronouns)}
              </p>
              <div className="flex items-baseline gap-4">
              <button
                onClick={() => setShowShareCard(true)}
                className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary hover:text-ink-secondary dark:hover:text-dark-text-secondary transition-colors"
              >
                Share
              </button>
              <Link
                href="/portrait-evolution"
                className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary hover:text-ink-secondary dark:hover:text-dark-text-secondary transition-colors"
              >
                Evolution
              </Link>
              <Link
                href="/portrait-session"
                className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary hover:text-ink-secondary dark:hover:text-dark-text-secondary transition-colors"
              >
                Deepen →
              </Link>
            </div>
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
            pronouns={pronouns}
          />

          {todaysChallenge && (
            <>
              <div className="divider" />
              <ChallengeSection challenge={todaysChallenge} userId={profile.user_id} />
            </>
          )}

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

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                  Anonymous portrait feed
                </p>
                <p className="text-[0.8rem] text-ink-faint dark:text-dark-text-secondary leading-relaxed">
                  {portraitPublic
                    ? "Your portrait is visible anonymously."
                    : "Share your portrait. No name. No photo."}
                </p>
              </div>
              <button
                onClick={handlePortraitPublicToggle}
                disabled={togglingPublic}
                className={cn(
                  "flex-shrink-0 w-10 h-6 rounded-full transition-all duration-200 relative",
                  portraitPublic ? "bg-ink dark:bg-dark-text" : "bg-border dark:bg-dark-border"
                )}
              >
                <span className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-bone dark:bg-dark-bg transition-all duration-200",
                  portraitPublic ? "left-5" : "left-1"
                )} />
              </button>
            </div>
            {portraitPublic && (
              <Link
                href="/feed"
                className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary hover:text-ink-secondary transition-colors"
              >
                Browse the feed →
              </Link>
            )}
          </section>

          <button
            onClick={handleSignOut}
            className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary hover:text-ink-secondary dark:hover:text-dark-text-secondary transition-colors"
          >
            Sign out
          </button>

          {/* Dev tool — remove before launch */}
          <button
            onClick={handleDevTogglePremium}
            className="text-[0.6rem] tracking-widest uppercase text-ink-faint/30 dark:text-dark-text-secondary/20 hover:text-ink-faint dark:hover:text-dark-text-secondary transition-colors"
          >
            Dev: {isPremium ? "disable" : "enable"} premium
          </button>

        </div>
      </AppShell>
    </PaletteWrapper>

    {showShareCard && (
      <ShareCard
        portrait={profile.portrait}
        tags={profile.portrait_tags ?? []}
        onClose={() => setShowShareCard(false)}
      />
    )}
    </>
  );
}

type LogMap = Record<string, boolean | undefined>;

function CommitmentsSection({
  commitments,
  todaysLogs,
  userId,
  pronouns,
}: {
  commitments: Commitment[];
  todaysLogs: CommitmentLog[];
  userId: string;
  pronouns: Pronouns;
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
            {P.subject(pronouns)} always does
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

function ChallengeSection({
  challenge,
  userId,
}: {
  challenge: NonNullable<TodaysChallenge>;
  userId: string;
}) {
  const [done, setDone] = useState(challenge.done);
  const [saving, setSaving] = useState(false);

  async function toggleDone() {
    if (saving) return;
    setSaving(true);
    const supabase = createClient();
    if (done) {
      await supabase
        .from("challenge_logs")
        .delete()
        .eq("challenge_id", challenge.challengeId)
        .eq("day", challenge.day);
      setDone(false);
    } else {
      await supabase.from("challenge_logs").upsert({
        user_id: userId,
        challenge_id: challenge.challengeId,
        day: challenge.day,
        completed_at: getTodayString(),
      });
      setDone(true);
    }
    setSaving(false);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
          Challenge · Day {challenge.day}
        </p>
        <Link
          href="/challenges"
          className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary hover:text-ink-secondary dark:hover:text-dark-text-secondary transition-colors"
        >
          View all
        </Link>
      </div>
      <p className={cn(
        "text-[0.9375rem] leading-relaxed transition-colors",
        done ? "text-ink-faint dark:text-dark-text-secondary line-through" : "text-ink dark:text-dark-text"
      )}>
        {challenge.action}
      </p>
      <button
        onClick={toggleDone}
        disabled={saving}
        className={cn(
          "text-xs tracking-widest uppercase transition-colors",
          done ? "text-ink dark:text-dark-text" : "text-ink-faint dark:text-dark-text-secondary"
        )}
      >
        {done ? "✓ Done" : "Mark as done"}
      </button>
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
