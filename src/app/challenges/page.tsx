"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { AppShell } from "@/components/layout/AppShell";
import { PaletteWrapper } from "@/components/ui/PaletteWrapper";
import { getTodayString } from "@/lib/utils";
import { PremiumGate } from "@/components/ui/PremiumGate";

type ChallengeDay = { day: number; action: string };

type Challenge = {
  id: string;
  user_id: string;
  title: string;
  duration: number;
  days: ChallengeDay[];
  started_at: string;
  reflection: string | null;
  created_at: string;
};

type Step = "home" | "picking" | "generating" | "active" | "reflecting" | "complete";

function getDayNumber(startedAt: string, today: string): number {
  const start = new Date(startedAt);
  const now = new Date(today);
  const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1; // day 1-based
}

function isComplete(challenge: Challenge, today: string): boolean {
  return getDayNumber(challenge.started_at, today) > challenge.duration;
}

export default function ChallengesPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("home");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [profile, setProfile] = useState<{ portrait: string; pronouns: string; user_id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [premium, setPremium] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(false);
  const [duration, setDuration] = useState<7 | 21>(7);
  const today = getTodayString();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/onboarding"); return; }

      const [profileRes, challengeRes] = await Promise.all([
        supabase.from("profiles").select("portrait, pronouns, user_id, premium").eq("user_id", user.id).single(),
        supabase
          .from("identity_challenges")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),
      ]);

      setProfile(profileRes.data);
      setPremium(profileRes.data?.premium !== false);

      if (challengeRes.data) {
        const c = challengeRes.data as Challenge;
        setChallenge(c);

        const logsRes = await supabase
          .from("challenge_logs")
          .select("day")
          .eq("challenge_id", c.id);

        const donedays = (logsRes.data || []).map((l: { day: number }) => l.day);
        setCompletedDays(donedays);

        if (isComplete(c, today)) {
          setStep(c.reflection ? "complete" : "reflecting");
        } else {
          setStep("active");
        }
      } else {
        setStep("home");
      }

      setLoading(false);
    }
    load();
  }, [router, today]);

  async function generate() {
    if (!profile) return;
    setGenerating(true);
    setStep("generating");

    try {
      const res = await fetch("/api/identity-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "generate",
          portrait: profile.portrait,
          duration,
          pronouns: profile.pronouns,
        }),
      });

      const data = await res.json();
      const supabase = createClient();
      const { data: saved } = await supabase
        .from("identity_challenges")
        .insert({
          user_id: profile.user_id,
          title: data.title,
          duration,
          days: data.days,
          started_at: today,
        })
        .select()
        .single();

      setChallenge(saved);
      setCompletedDays([]);
      setStep("active");
    } catch {
      setGenerateError(true);
      setStep("picking");
    } finally {
      setGenerating(false);
    }
  }

  async function toggleDay(day: number) {
    if (!challenge || !profile) return;
    const supabase = createClient();
    const currentDay = getDayNumber(challenge.started_at, today);
    if (day > currentDay) return; // can't complete future days

    if (completedDays.includes(day)) {
      await supabase
        .from("challenge_logs")
        .delete()
        .eq("challenge_id", challenge.id)
        .eq("day", day);
      setCompletedDays((prev) => prev.filter((d) => d !== day));
    } else {
      await supabase.from("challenge_logs").upsert({
        user_id: profile.user_id,
        challenge_id: challenge.id,
        day,
        completed_at: today,
      });
      setCompletedDays((prev) => [...prev, day]);
    }
  }

  async function generateReflection() {
    if (!challenge || !profile) return;
    setStep("reflecting");

    try {
      const res = await fetch("/api/identity-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "reflect",
          portrait: profile.portrait,
          duration: challenge.duration,
          days: challenge.days,
          completedDays,
          pronouns: profile.pronouns,
        }),
      });

      const data = await res.json();
      const supabase = createClient();
      await supabase
        .from("identity_challenges")
        .update({ reflection: data.reflection })
        .eq("id", challenge.id);

      setChallenge((prev) => prev ? { ...prev, reflection: data.reflection } : prev);
      setStep("complete");
    } catch {
      setStep("active");
    }
  }

  if (loading) return <div className="min-h-dvh bg-bone dark:bg-dark-bg" />;

  if (!premium) return (
    <PaletteWrapper event="base">
      <AppShell>
        <PremiumGate
          feature="Identity Challenges"
          description="7 or 21-day micro-challenges generated from your specific portrait — not generic, tied directly to who you said you were becoming."
          example="Day 4 — Speak first in one room you usually stay quiet in. Notice what she would have said."
        />
      </AppShell>
    </PaletteWrapper>
  );

  const currentDay = challenge ? getDayNumber(challenge.started_at, today) : 0;
  const doneCount = completedDays.length;

  return (
    <PaletteWrapper event={step === "complete" ? "weekly" : step === "reflecting" ? "evening" : "base"}>
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
              Identity challenge
            </p>
          </div>

          {/* No active challenge */}
          {step === "home" && (
            <div className="space-y-8">
              <div className="space-y-3">
                <p className="heading-editorial text-[1.3rem] leading-[1.45] text-ink dark:text-dark-text">
                  A challenge built from your portrait.
                </p>
                <p className="text-[0.9375rem] leading-relaxed text-ink-secondary dark:text-dark-text-secondary">
                  Not generic. Every action comes from who you said you were becoming. One thing per day. Nothing more.
                </p>
              </div>
              <button
                onClick={() => setStep("picking")}
                className="w-full py-4 bg-ink dark:bg-dark-text text-bone dark:text-dark-bg text-sm tracking-widest uppercase"
              >
                Start a challenge
              </button>
            </div>
          )}

          {/* Duration picker */}
          {step === "picking" && (
            <div className="space-y-8">
              <p className="heading-editorial text-[1.3rem] leading-[1.45] text-ink dark:text-dark-text">
                How long?
              </p>
              <div className="flex border border-border dark:border-dark-border">
                {([7, 21] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={[
                      "flex-1 py-4 text-sm tracking-widest uppercase transition-all border-r border-border dark:border-dark-border last:border-r-0",
                      duration === d
                        ? "bg-ink dark:bg-dark-text text-bone dark:text-dark-bg"
                        : "text-ink-secondary dark:text-dark-text-secondary",
                    ].join(" ")}
                  >
                    {d} days
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-xs text-ink-faint dark:text-dark-text-secondary leading-relaxed">
                  {duration === 7
                    ? "Seven days is enough to feel the difference. A week of showing up as her."
                    : "Twenty-one days builds a pattern. Long enough that it stops feeling like a challenge and starts feeling like a life."}
                </p>
              </div>
              <button
                onClick={() => { setGenerateError(false); generate(); }}
                disabled={generating}
                className="w-full py-4 bg-ink dark:bg-dark-text text-bone dark:text-dark-bg text-sm tracking-widest uppercase disabled:opacity-50"
              >
                Generate my challenge
              </button>
              {generateError && (
                <p className="text-center text-xs text-ink-faint dark:text-dark-text-secondary mt-3">
                  Something interrupted the generation. Try again.
                </p>
              )}
            </div>
          )}

          {/* Generating */}
          {step === "generating" && (
            <div className="flex-1 flex items-center justify-center py-20">
              <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                Reading your portrait…
              </p>
            </div>
          )}

          {/* Active challenge */}
          {step === "active" && challenge && (
            <div className="space-y-8">
              <div className="space-y-1">
                <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                  Day {Math.min(currentDay, challenge.duration)} of {challenge.duration}
                </p>
                <p className="heading-editorial text-[1.2rem] leading-[1.45] text-ink dark:text-dark-text">
                  {challenge.title}
                </p>
              </div>

              {/* Today's action highlighted */}
              {currentDay <= challenge.duration && (
                <div className="space-y-3 border-l-2 border-ink dark:border-dark-text pl-4">
                  <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                    Today
                  </p>
                  <p className="text-[0.9375rem] leading-relaxed text-ink dark:text-dark-text">
                    {challenge.days.find((d) => d.day === currentDay)?.action}
                  </p>
                  <button
                    onClick={() => toggleDay(currentDay)}
                    className={[
                      "text-xs tracking-widest uppercase transition-colors mt-2",
                      completedDays.includes(currentDay)
                        ? "text-ink dark:text-dark-text"
                        : "text-ink-faint dark:text-dark-text-secondary",
                    ].join(" ")}
                  >
                    {completedDays.includes(currentDay) ? "✓ Done" : "Mark as done"}
                  </button>
                </div>
              )}

              {/* All days */}
              <div className="space-y-0 border-t border-border dark:border-dark-border">
                {challenge.days.map((d) => {
                  const isPast = d.day < currentDay;
                  const isFuture = d.day > currentDay;
                  const isDone = completedDays.includes(d.day);
                  return (
                    <div
                      key={d.day}
                      className="flex items-start gap-4 py-4 border-b border-border dark:border-dark-border"
                    >
                      <button
                        onClick={() => isPast || d.day === currentDay ? toggleDay(d.day) : undefined}
                        disabled={isFuture}
                        className="mt-[0.3rem] flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center"
                      >
                        {isDone ? (
                          <span className="w-3 h-3 rounded-full bg-ink dark:bg-dark-text block" />
                        ) : (
                          <span className={[
                            "w-3 h-3 rounded-full border block",
                            isFuture
                              ? "border-ink-faint dark:border-dark-text-secondary opacity-30"
                              : "border-ink-faint dark:border-dark-text-secondary",
                          ].join(" ")} />
                        )}
                      </button>
                      <div className="space-y-0.5 flex-1">
                        <p className="text-[0.7rem] tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                          Day {d.day}
                        </p>
                        <p className={[
                          "text-[0.9375rem] leading-relaxed",
                          isFuture
                            ? "text-ink-faint dark:text-dark-text-secondary"
                            : isDone
                            ? "text-ink-secondary dark:text-dark-text-secondary line-through"
                            : "text-ink dark:text-dark-text",
                        ].join(" ")}>
                          {d.action}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-ink-faint dark:text-dark-text-secondary text-center">
                {doneCount} of {challenge.duration} days done
              </p>

              {currentDay > challenge.duration && (
                <button
                  onClick={generateReflection}
                  className="w-full py-4 bg-ink dark:bg-dark-text text-bone dark:text-dark-bg text-sm tracking-widest uppercase"
                >
                  See what it revealed
                </button>
              )}
            </div>
          )}

          {/* Generating reflection */}
          {step === "reflecting" && (
            <div className="flex-1 flex items-center justify-center py-20">
              <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                Reading the last {challenge?.duration} days…
              </p>
            </div>
          )}

          {/* Complete */}
          {step === "complete" && challenge?.reflection && (
            <div className="space-y-10">
              <div className="space-y-2">
                <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                  {challenge.title} — complete
                </p>
              </div>
              <div className="space-y-4">
                {challenge.reflection.split(/\n\n+/).filter(Boolean).map((para, i) => (
                  <p key={i} className="text-[0.9375rem] leading-relaxed text-ink dark:text-dark-text">
                    {para}
                  </p>
                ))}
              </div>
              <div className="divider" />
              <button
                onClick={() => setStep("picking")}
                className="w-full py-4 border border-ink dark:border-dark-text text-ink dark:text-dark-text text-xs tracking-widest uppercase hover:bg-ink dark:hover:bg-dark-text hover:text-bone dark:hover:text-dark-bg transition-all"
              >
                Start another challenge
              </button>
            </div>
          )}

        </div>
      </AppShell>
    </PaletteWrapper>
  );
}
