"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { AppShell } from "@/components/layout/AppShell";
import type { MonthlyRetrospective, Profile } from "@/lib/supabase";

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function RetrospectivePage() {
  const router = useRouter();
  const [retrospectives, setRetrospectives] = useState<MonthlyRetrospective[]>([]);
  const [current, setCurrent] = useState<MonthlyRetrospective | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const thisMonth = getCurrentMonth();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/onboarding"); return; }

      const [retroRes, profileRes] = await Promise.all([
        supabase
          .from("monthly_retrospectives")
          .select("*")
          .eq("user_id", user.id)
          .order("month", { ascending: false }),
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      ]);

      const all = retroRes.data || [];
      const thisMonthRetro = all.find((r) => r.month === thisMonth) || null;
      const past = all.filter((r) => r.month !== thisMonth);

      setCurrent(thisMonthRetro);
      setRetrospectives(past);
      setProfile(profileRes.data || null);
      setLoading(false);
    }
    load();
  }, [router, thisMonth]);

  async function handleGenerate() {
    if (!profile || generating) return;
    setGenerating(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [year, month] = thisMonth.split("-");
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(Number(year), Number(month), 0).toISOString().slice(0, 10);

    const { data: checkins } = await supabase
      .from("checkins")
      .select("date, type, content")
      .eq("user_id", user.id)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date");

    const { data: journalEntries } = await supabase
      .from("journal_entries")
      .select("date, content")
      .eq("user_id", user.id)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date");

    const res = await fetch("/api/monthly-retrospective", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        portrait: profile.portrait,
        checkins: checkins || [],
        journalEntries: journalEntries || [],
        month: thisMonth,
        pronouns: profile.pronouns,
      }),
    });

    if (res.ok) {
      const { retrospective } = await res.json();
      const { data } = await supabase
        .from("monthly_retrospectives")
        .upsert({ user_id: user.id, content: retrospective, month: thisMonth })
        .select()
        .single();
      if (data) setCurrent(data);
    }

    setGenerating(false);
  }

  if (loading) return <div className="min-h-dvh bg-bone dark:bg-dark-bg" />;

  return (
    <AppShell>
      <div className="space-y-10 pb-12 animate-fade-up">

        <div className="flex items-baseline justify-between">
          <button
            onClick={() => router.push("/home")}
            className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary hover:text-ink-secondary transition-colors"
          >
            ← Back
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
            {formatMonth(thisMonth)}
          </p>
          <h1 className="heading-editorial text-[1.3rem] leading-[1.45] text-ink dark:text-dark-text">
            Your month in reflection
          </h1>
        </div>

        {current ? (
          <div className="space-y-4">
            {current.content.split(/\n\n+/).filter(Boolean).map((para, i) => (
              <p key={i} className="text-[0.9375rem] leading-relaxed text-ink dark:text-dark-text">
                {para}
              </p>
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-[0.9375rem] leading-relaxed text-ink-secondary dark:text-dark-text-secondary">
              A month of check-ins and journal entries, seen whole. Ready when you are.
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-4 bg-ink dark:bg-dark-text text-bone dark:text-dark-bg text-sm tracking-widest uppercase disabled:opacity-50 transition-opacity"
            >
              {generating ? "Reflecting..." : "Generate this month's reflection"}
            </button>
          </div>
        )}

        {retrospectives.length > 0 && (
          <>
            <div className="divider" />
            <div className="space-y-0 border-t border-border dark:border-dark-border">
              {retrospectives.map((retro) => (
                <div
                  key={retro.id}
                  className="border-b border-border dark:border-dark-border"
                >
                  <button
                    onClick={() => setExpandedId(expandedId === retro.id ? null : retro.id)}
                    className="w-full text-left py-4"
                  >
                    <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                      {formatMonth(retro.month)}
                    </p>
                    {expandedId !== retro.id && (
                      <p className="mt-1 text-[0.9375rem] text-ink-secondary dark:text-dark-text-secondary truncate">
                        {retro.content.split("\n")[0]}
                      </p>
                    )}
                  </button>
                  {expandedId === retro.id && (
                    <div className="pb-5 space-y-4">
                      {retro.content.split(/\n\n+/).filter(Boolean).map((para, i) => (
                        <p key={i} className="text-[0.9375rem] leading-relaxed text-ink dark:text-dark-text">
                          {para}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </AppShell>
  );
}
