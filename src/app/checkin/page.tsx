"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { AppShell } from "@/components/layout/AppShell";
import { PaletteWrapper, type PaletteEvent } from "@/components/ui/PaletteWrapper";
import { cn, getTodayString, P, type Pronouns } from "@/lib/utils";

function CheckinContent() {
  const router = useRouter();
  const params = useSearchParams();
  const type = (params.get("type") || "morning") as "morning" | "evening";

  const [content, setContent] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [pronouns, setPronouns] = useState<Pronouns>("they");

  const paletteEvent: PaletteEvent = done
    ? type === "morning" ? "morning" : "evening"
    : "base";

  const handleSubmit = async () => {
    if (content.trim().length < 3) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/onboarding"); return; }

    try {
      const [profileRes, commitmentsRes, logsRes] = await Promise.all([
        supabase.from("profiles").select("portrait, pronouns").eq("user_id", user.id).single(),
        type === "evening"
          ? supabase.from("commitments").select("*").eq("user_id", user.id).order("position")
          : Promise.resolve({ data: [] }),
        type === "evening"
          ? supabase.from("commitment_logs").select("*").eq("user_id", user.id).eq("date", getTodayString())
          : Promise.resolve({ data: [] }),
      ]);

      const profile = profileRes.data;
      if (profile?.pronouns) setPronouns(profile.pronouns);

      const commitmentContext = (commitmentsRes.data || []).map((c: { id: string; content: string }) => {
        const log = (logsRes.data || []).find((l: { commitment_id: string; kept: boolean }) => l.commitment_id === c.id);
        return { content: c.content, kept: log?.kept };
      });

      const res = await fetch("/api/checkin-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          content,
          portrait: profile?.portrait || "",
          pronouns: profile?.pronouns || "they",
          commitments: commitmentContext,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await supabase.from("checkins").insert({
        user_id: user.id,
        type,
        content,
        ai_response: data.response,
        date: getTodayString(),
      });

      setResponse(data.response);
      setDone(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const obj = P.object(pronouns);
  const subj = P.subject(pronouns);

  return (
    <PaletteWrapper event={paletteEvent}>
      <AppShell>
        <div className="space-y-10 pb-8">
          {!done ? (
            <div className="space-y-10 animate-fade-up">
              <div className="space-y-3">
                <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                  {type === "morning" ? "Morning intention" : "Evening reflection"}
                </p>
                <h1 className="heading-editorial text-[1.5rem] leading-[1.4] text-ink dark:text-dark-text">
                  {type === "morning" ? (
                    <>
                      What is one thing you&apos;ll do today that{" "}
                      <span className="accent-script">{subj}</span> would do?
                    </>
                  ) : (
                    <>
                      Did you show up as{" "}
                      <span className="accent-script">{obj}</span> today?{" "}
                      What got in the way?
                    </>
                  )}
                </h1>
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  type === "morning"
                    ? `${subj.charAt(0).toUpperCase() + subj.slice(1)} would wake up early and...`
                    : "I mostly did, but..."
                }
                className="w-full min-h-[160px] bg-transparent text-ink dark:text-dark-text placeholder:text-ink-faint dark:placeholder:text-dark-text-secondary text-[0.9375rem] leading-relaxed resize-none outline-none border-b border-border dark:border-dark-border pb-3"
                autoFocus
              />

              {error && (
                <p className="text-sm text-ink-secondary dark:text-dark-text-secondary">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || content.trim().length < 3}
                className={cn(
                  "w-full py-4 text-sm tracking-widest uppercase transition-all",
                  !loading && content.trim().length >= 3
                    ? "bg-ink dark:bg-dark-text text-bone dark:text-dark-bg"
                    : "bg-border dark:bg-dark-border text-ink-faint cursor-not-allowed"
                )}
              >
                {loading ? "..." : type === "morning" ? "Set intention" : "Reflect"}
              </button>
            </div>
          ) : (
            <div className="space-y-10 animate-fade-up">
              <div className="space-y-3">
                <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                  {type === "morning" ? "Your morning" : "Your evening"}
                </p>
                <p className="portrait-text text-ink dark:text-dark-text">
                  &ldquo;{content}&rdquo;
                </p>
              </div>

              <div className="divider" />

              <div className="space-y-2">
                <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                  Script
                </p>
                <p className="portrait-text text-ink-secondary dark:text-dark-text-secondary italic leading-relaxed">
                  {response}
                </p>
              </div>

              <button
                onClick={() => router.push("/home")}
                className="w-full py-4 bg-ink dark:bg-dark-text text-bone dark:text-dark-bg text-sm tracking-widest uppercase"
              >
                Back home
              </button>
            </div>
          )}
        </div>
      </AppShell>
    </PaletteWrapper>
  );
}

export default function CheckinPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-bone dark:bg-dark-bg" />}>
      <CheckinContent />
    </Suspense>
  );
}
