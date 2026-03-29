"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { AppShell } from "@/components/layout/AppShell";
import { PaletteWrapper } from "@/components/ui/PaletteWrapper";
import { getTodayString } from "@/lib/utils";
import type { JournalEntry } from "@/lib/supabase";

type SaveState = "idle" | "saving" | "saved";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

export default function JournalPage() {
  const router = useRouter();
  const [todayContent, setTodayContent] = useState("");
  const [todayId, setTodayId] = useState<string | null>(null);
  const [pastEntries, setPastEntries] = useState<JournalEntry[]>([]);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const today = getTodayString();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/onboarding"); return; }
      setUserId(user.id);

      const { data } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      const entries = data || [];
      const todayEntry = entries.find((e) => e.date === today);
      const past = entries.filter((e) => e.date !== today);

      if (todayEntry) {
        setTodayContent(todayEntry.content);
        setTodayId(todayEntry.id);
      }
      setPastEntries(past);
      setLoading(false);
    }
    load();
  }, [router, today]);

  const save = useCallback(async (content: string) => {
    if (!userId) return;
    setSaveState("saving");
    const supabase = createClient();

    if (todayId) {
      await supabase
        .from("journal_entries")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", todayId);
    } else {
      const { data } = await supabase
        .from("journal_entries")
        .upsert({ user_id: userId, content, date: today, updated_at: new Date().toISOString() })
        .select()
        .single();
      if (data) setTodayId(data.id);
    }
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 2000);
  }, [userId, todayId, today]);

  function handleChange(val: string) {
    setTodayContent(val);
    setSaveState("idle");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (val.trim()) {
      saveTimer.current = setTimeout(() => save(val), 1500);
    }
  }

  if (loading) return <div className="min-h-dvh bg-bone dark:bg-dark-bg" />;

  return (
    <PaletteWrapper event="morning">
    <AppShell>
      <div className="space-y-10 pb-12 animate-fade-up">

        <div className="flex items-baseline justify-between">
          <button
            onClick={() => router.push("/home")}
            className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary hover:text-ink-secondary transition-colors"
          >
            ← Back
          </button>
          {saveState !== "idle" && (
            <span className="text-xs text-ink-faint dark:text-dark-text-secondary transition-opacity">
              {saveState === "saving" ? "Saving..." : "Saved"}
            </span>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
            {formatDate(today)}
          </p>
          <textarea
            value={todayContent}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="What's on your mind today..."
            className="w-full min-h-[260px] bg-transparent text-ink dark:text-dark-text placeholder:text-ink-faint dark:placeholder:text-dark-text-secondary text-[0.9375rem] leading-relaxed resize-none outline-none"
            autoFocus
          />
        </div>

        {pastEntries.length > 0 && (
          <>
            <div className="divider" />
            <div className="space-y-0 border-t border-border dark:border-dark-border">
              {pastEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="border-b border-border dark:border-dark-border"
                >
                  <button
                    onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                    className="w-full text-left py-4 space-y-1"
                  >
                    <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                      {formatDateShort(entry.date)}
                    </p>
                    {expandedEntry !== entry.id && (
                      <p className="text-[0.9375rem] text-ink-secondary dark:text-dark-text-secondary truncate">
                        {entry.content.split("\n")[0]}
                      </p>
                    )}
                  </button>
                  {expandedEntry === entry.id && (
                    <p className="pb-5 text-[0.9375rem] text-ink dark:text-dark-text leading-relaxed whitespace-pre-wrap">
                      {entry.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </AppShell>
    </PaletteWrapper>
  );
}
