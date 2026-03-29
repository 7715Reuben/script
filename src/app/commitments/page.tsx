"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { AppShell } from "@/components/layout/AppShell";
import { PaletteWrapper } from "@/components/ui/PaletteWrapper";
import { cn } from "@/lib/utils";
import type { Commitment } from "@/lib/supabase";

const MAX = 5;

export default function CommitmentsPage() {
  const router = useRouter();
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/onboarding"); return; }
      const { data } = await supabase
        .from("commitments")
        .select("*")
        .eq("user_id", user.id)
        .order("position");
      setCommitments(data || []);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleAdd() {
    const text = draft.trim();
    if (!text || commitments.length >= MAX) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("commitments")
      .insert({ user_id: user.id, content: text, position: commitments.length })
      .select()
      .single();

    if (data) setCommitments((prev) => [...prev, data]);
    setDraft("");
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("commitments").delete().eq("id", id);
    setCommitments((prev) => prev.filter((c) => c.id !== id));
  }

  if (loading) return <div className="min-h-dvh bg-bone dark:bg-dark-bg" />;

  return (
    <PaletteWrapper event="base">
    <AppShell>
      <div className="space-y-10 pb-8 animate-fade-up">

        <div className="space-y-2">
          <button
            onClick={() => router.push("/home")}
            className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary hover:text-ink-secondary dark:hover:text-dark-text-secondary transition-colors"
          >
            ← Back
          </button>
          <h1 className="heading-editorial text-[1.5rem] leading-[1.4] text-ink dark:text-dark-text">
            Commitments
          </h1>
          <p className="text-[0.9375rem] text-ink-secondary dark:text-dark-text-secondary leading-relaxed">
            The things your future self does without negotiating. Up to {MAX}. The AI will name them when you don&apos;t keep them.
          </p>
        </div>

        {commitments.length > 0 && (
          <ul className="space-y-0 border-t border-border dark:border-dark-border">
            {commitments.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-4 py-4 border-b border-border dark:border-dark-border"
              >
                <span className="text-[0.9375rem] text-ink dark:text-dark-text leading-relaxed">
                  {c.content}
                </span>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="flex-shrink-0 text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary hover:text-ink-secondary dark:hover:text-dark-text-secondary transition-colors"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        {commitments.length < MAX && (
          <div className="space-y-4">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="I move my body before I look at my phone"
              className="w-full bg-transparent text-ink dark:text-dark-text placeholder:text-ink-faint dark:placeholder:text-dark-text-secondary text-[0.9375rem] border-b border-border dark:border-dark-border pb-3 outline-none"
              autoFocus
            />
            <button
              onClick={handleAdd}
              disabled={!draft.trim() || saving}
              className={cn(
                "w-full py-4 text-sm tracking-widest uppercase transition-all",
                draft.trim() && !saving
                  ? "bg-ink dark:bg-dark-text text-bone dark:text-dark-bg"
                  : "bg-border dark:bg-dark-border text-ink-faint cursor-not-allowed"
              )}
            >
              Add commitment
            </button>
            <p className="text-xs text-ink-faint dark:text-dark-text-secondary text-center">
              {commitments.length} of {MAX}
            </p>
          </div>
        )}

        {commitments.length >= MAX && (
          <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary text-center">
            Remove one to add another
          </p>
        )}

      </div>
    </AppShell>
    </PaletteWrapper>
  );
}
