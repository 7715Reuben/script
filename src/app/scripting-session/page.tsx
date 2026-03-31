"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { P, type Pronouns } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";
import { PaletteWrapper } from "@/components/ui/PaletteWrapper";
import { PremiumGate } from "@/components/ui/PremiumGate";

type Step = "write" | "reading" | "reflect" | "done";

type Reflection = {
  true: string;
  performance: string;
  notInPortrait: string;
};

export default function ScriptingSessionPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("write");
  const [script, setScript] = useState("");
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [profile, setProfile] = useState<{ id: string; portrait: string; pronouns: string; user_id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [premium, setPremium] = useState(true);
  const [addingToPortrait, setAddingToPortrait] = useState(false);
  const [addedToPortrait, setAddedToPortrait] = useState(false);
  const [readError, setReadError] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/onboarding"); return; }
      const { data } = await supabase
        .from("profiles")
        .select("id, portrait, pronouns, user_id, premium")
        .eq("user_id", user.id)
        .single();
      setProfile(data);
      setPremium(data?.premium !== false);
      setLoading(false);
    }
    load();
  }, [router]);

  async function submit() {
    if (!script.trim() || !profile) return;
    setStep("reading");

    try {
      const res = await fetch("/api/scripting-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: script.trim(),
          portrait: profile.portrait,
          pronouns: profile.pronouns,
        }),
      });

      const data = await res.json();
      setReflection(data);
      setStep("reflect");
    } catch {
      setReadError(true);
      setStep("write");
    }
  }

  async function addToPortrait() {
    if (!profile || !reflection?.notInPortrait || addedToPortrait) return;
    setAddingToPortrait(true);
    const supabase = createClient();

    // Save version first
    await supabase.from("portrait_versions").insert({
      user_id: profile.user_id,
      content: profile.portrait,
    });

    // Append
    const newPortrait = profile.portrait.trimEnd() + "\n\n" + reflection.notInPortrait;
    await supabase.from("profiles").update({ portrait: newPortrait }).eq("id", profile.id);

    setAddingToPortrait(false);
    setAddedToPortrait(true);
  }

  if (loading) return <div className="min-h-dvh bg-bone dark:bg-dark-bg" />;

  if (!premium) return (
    <PaletteWrapper event="base">
      <AppShell><PremiumGate
        feature="Scripting sessions"
        description="Write as your future self — first person, present tense. AI reflects back what felt genuinely true, what felt like performance, and what it noticed that isn't in your portrait yet."
        example="The part about the morning was real — specific, unhurried, like you'd already lived it. That's not something you invented; that's something you already know about yourself."
      /></AppShell>
    </PaletteWrapper>
  );

  return (
    <PaletteWrapper event={step === "reflect" ? "evening" : "base"}>
      <AppShell>
        <div className="flex flex-col min-h-[calc(100dvh-3rem)]">

          {/* Header */}
          <div className="flex items-baseline justify-between mb-8">
            <button
              onClick={() => router.push("/home")}
              className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary hover:text-ink-secondary transition-colors"
            >
              ← Back
            </button>
            <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
              Scripting session
            </p>
          </div>

          {/* Write mode */}
          {step === "write" && (
            <div className="flex flex-col flex-1 animate-fade-up">
              <div className="space-y-2 mb-8">
                <p className="heading-editorial text-[1.3rem] leading-[1.45] text-ink dark:text-dark-text">
                  Write as {P.object((profile?.pronouns as Pronouns) ?? "they")}.
                </p>
                <p className="text-[0.9375rem] leading-relaxed text-ink-secondary dark:text-dark-text-secondary">
                  First person. Present tense. What is {P.possessive((profile?.pronouns as Pronouns) ?? "they")} life like right now? Don&apos;t think, just write.
                </p>
              </div>

              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="I wake up and the first thing I feel is…"
                className="flex-1 w-full min-h-[320px] bg-transparent text-ink dark:text-dark-text placeholder:text-ink-faint dark:placeholder:text-dark-text-secondary text-[0.9375rem] leading-relaxed resize-none outline-none"
                autoFocus
              />

              <div className="sticky bottom-0 pt-6 pb-safe bg-bone dark:bg-dark-bg border-t border-border dark:border-dark-border mt-6">
                <button
                  onClick={submit}
                  disabled={script.trim().length < 50}
                  className="w-full py-4 bg-ink dark:bg-dark-text text-bone dark:text-dark-bg text-sm tracking-widest uppercase disabled:opacity-40 transition-opacity"
                >
                  I&apos;m done — read it back
                </button>
                {script.trim().length > 0 && script.trim().length < 50 && (
                  <p className="text-center text-xs text-ink-faint dark:text-dark-text-secondary mt-3">
                    Keep going — say more than this
                  </p>
                )}
                {readError && (
                  <p className="text-center text-xs text-ink-faint dark:text-dark-text-secondary mt-3">
                    Something interrupted the reading. Try again.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Reading state */}
          {step === "reading" && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 animate-fade-up">
              <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                Reading what you wrote…
              </p>
              <p className="text-[0.9375rem] leading-relaxed text-ink-secondary dark:text-dark-text-secondary text-center max-w-xs">
                This takes a moment.
              </p>
            </div>
          )}

          {/* Reflection */}
          {step === "reflect" && reflection && (
            <div className="space-y-10 animate-fade-up pb-8">

              <div className="space-y-3">
                <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                  What felt true
                </p>
                <p className="text-[0.9375rem] leading-relaxed text-ink dark:text-dark-text">
                  {reflection.true}
                </p>
              </div>

              <div className="divider" />

              <div className="space-y-3">
                <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                  What felt like performance
                </p>
                <p className="text-[0.9375rem] leading-relaxed text-ink dark:text-dark-text">
                  {reflection.performance}
                </p>
              </div>

              <div className="divider" />

              <div className="space-y-4">
                <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                  Something not in your portrait yet
                </p>
                <p className="portrait-text text-ink dark:text-dark-text leading-relaxed">
                  {reflection.notInPortrait}
                </p>

                {!addedToPortrait ? (
                  <button
                    onClick={addToPortrait}
                    disabled={addingToPortrait}
                    className="w-full py-4 border border-ink dark:border-dark-text text-ink dark:text-dark-text text-xs tracking-widest uppercase hover:bg-ink dark:hover:bg-dark-text hover:text-bone dark:hover:text-dark-bg transition-all disabled:opacity-50"
                  >
                    {addingToPortrait ? "Adding…" : "Add to my portrait"}
                  </button>
                ) : (
                  <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary text-center py-3">
                    Added to your portrait.
                  </p>
                )}
              </div>

              <div className="divider" />

              <div className="space-y-3">
                <button
                  onClick={() => { setScript(""); setReflection(null); setAddedToPortrait(false); setStep("write"); }}
                  className="w-full py-3 text-xs tracking-widest uppercase text-ink-secondary dark:text-dark-text-secondary hover:text-ink dark:hover:text-dark-text transition-colors border border-border dark:border-dark-border"
                >
                  Write another session
                </button>
                <button
                  onClick={() => router.push("/home")}
                  className="w-full py-3 text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary hover:text-ink-secondary transition-colors"
                >
                  Back to home
                </button>
              </div>

            </div>
          )}

        </div>
      </AppShell>
    </PaletteWrapper>
  );
}
