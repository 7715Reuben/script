"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { AppShell } from "@/components/layout/AppShell";
import { PaletteWrapper } from "@/components/ui/PaletteWrapper";

type Step = "pick" | "chat" | "synthesizing" | "review" | "done";
type Message = { role: "user" | "assistant"; content: string };

const THEMES = [
  { key: "Mornings", label: "Mornings", description: "How she begins" },
  { key: "Work", label: "Work", description: "What she's building" },
  { key: "Relationships", label: "Relationships", description: "Who she chose" },
  { key: "Body", label: "Body", description: "How she inhabits it" },
  { key: "Voice", label: "Voice", description: "How she speaks" },
  { key: "Values", label: "Values", description: "What she won't cross" },
];

export default function PortraitSessionPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("pick");
  const [theme, setTheme] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [responding, setResponding] = useState(false);
  const [isReady, setIsReady] = useState(false); // AI signalled [ready]
  const [addition, setAddition] = useState("");
  const [profile, setProfile] = useState<{ id: string; portrait: string; pronouns: string; user_id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/onboarding"); return; }
      const { data } = await supabase.from("profiles").select("id, portrait, pronouns, user_id").eq("user_id", user.id).single();
      setProfile(data);
      setLoading(false);
    }
    load();
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  async function startSession(selectedTheme: string) {
    setTheme(selectedTheme);
    setStep("chat");
    setResponding(true);
    setStreamingText("");

    // Opening question — send empty messages (AI goes first)
    await streamChat(selectedTheme, []);
  }

  async function streamChat(currentTheme: string, currentMessages: Message[]) {
    setResponding(true);
    setStreamingText("");

    try {
      const res = await fetch("/api/portrait-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "chat",
          theme: currentTheme,
          messages: currentMessages,
          portrait: profile?.portrait ?? "",
          pronouns: profile?.pronouns ?? "they",
        }),
      });

      if (!res.ok || !res.body) throw new Error("Failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        // Strip [ready] from displayed text
        setStreamingText(fullText.replace(/\s*\[ready\]\s*$/, "").trimEnd());
      }

      const hasReady = fullText.includes("[ready]");
      const cleanText = fullText.replace(/\s*\[ready\]\s*/g, "").trimEnd();

      const assistantMsg: Message = { role: "assistant", content: cleanText };
      setMessages((prev) => [...prev, assistantMsg]);
      setStreamingText("");
      if (hasReady) setIsReady(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something got in the way. Try again." },
      ]);
      setStreamingText("");
    } finally {
      setResponding(false);
    }
  }

  async function send() {
    if (!input.trim() || responding || !profile) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    await streamChat(theme, updated);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }

  async function synthesize() {
    if (!profile) return;
    setStep("synthesizing");

    try {
      const res = await fetch("/api/portrait-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "synthesize",
          theme,
          messages,
          portrait: profile.portrait,
          pronouns: profile.pronouns,
        }),
      });

      const data = await res.json();
      setAddition(data.addition || "");
      setStep("review");
    } catch {
      setStep("chat"); // fall back to chat
    }
  }

  async function acceptAddition() {
    if (!profile || !addition) return;
    const supabase = createClient();

    // Save current portrait as a version
    await supabase.from("portrait_versions").insert({
      user_id: profile.user_id,
      content: profile.portrait,
    });

    // Append new addition to portrait
    const newPortrait = profile.portrait.trimEnd() + "\n\n" + addition;
    await supabase.from("profiles").update({ portrait: newPortrait }).eq("id", profile.id);

    setStep("done");
  }

  if (loading) return <div className="min-h-dvh bg-bone dark:bg-dark-bg" />;

  return (
    <PaletteWrapper event="portrait">
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
            {theme && (
              <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                {theme}
              </p>
            )}
          </div>

          {/* Pick theme */}
          {step === "pick" && (
            <div className="space-y-8 animate-fade-up">
              <div className="space-y-2">
                <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                  Portrait session
                </p>
                <p className="heading-editorial text-[1.3rem] leading-[1.45] text-ink dark:text-dark-text">
                  Which part of her would you like to go deeper on?
                </p>
              </div>
              <div className="space-y-0 border-t border-border dark:border-dark-border">
                {THEMES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => startSession(t.key)}
                    className="w-full text-left py-4 border-b border-border dark:border-dark-border flex items-baseline justify-between group"
                  >
                    <span className="text-[0.9375rem] text-ink dark:text-dark-text group-hover:text-ink-secondary dark:group-hover:text-dark-text-secondary transition-colors">
                      {t.label}
                    </span>
                    <span className="text-xs text-ink-faint dark:text-dark-text-secondary">
                      {t.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat */}
          {step === "chat" && (
            <div className="flex flex-col flex-1">
              <div className="flex-1 space-y-8 pb-6 animate-fade-up">
                {messages.map((msg, i) => (
                  <div key={i} className="space-y-1.5">
                    <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                      {msg.role === "user" ? "You" : "Script"}
                    </p>
                    <div className="space-y-3">
                      {msg.content.split(/\n\n+/).filter(Boolean).map((para, j) => (
                        <p
                          key={j}
                          className={[
                            "text-[0.9375rem] leading-relaxed",
                            msg.role === "user"
                              ? "text-ink-secondary dark:text-dark-text-secondary"
                              : "text-ink dark:text-dark-text",
                          ].join(" ")}
                        >
                          {para}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}

                {streamingText && (
                  <div className="space-y-1.5">
                    <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                      Script
                    </p>
                    <div className="space-y-3">
                      {streamingText.split(/\n\n+/).filter(Boolean).map((para, j, arr) => (
                        <p key={j} className="text-[0.9375rem] leading-relaxed text-ink dark:text-dark-text">
                          {para}
                          {j === arr.length - 1 && (
                            <span className="inline-block w-0.5 h-4 ml-0.5 bg-ink dark:bg-dark-text align-middle animate-pulse" />
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {responding && !streamingText && (
                  <div className="space-y-1.5">
                    <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">Script</p>
                    <span className="text-ink-faint dark:text-dark-text-secondary text-lg tracking-widest">···</span>
                  </div>
                )}

                {isReady && !responding && (
                  <div className="pt-2">
                    <button
                      onClick={synthesize}
                      className="w-full py-4 bg-ink dark:bg-dark-text text-bone dark:text-dark-bg text-sm tracking-widest uppercase"
                    >
                      See what I noticed →
                    </button>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {!isReady && (
                <div className="sticky bottom-0 pt-4 pb-safe bg-bone dark:bg-dark-bg border-t border-border dark:border-dark-border">
                  <div className="flex gap-4 items-end">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => { setInput(e.target.value); autoResize(e.target); }}
                      onKeyDown={handleKeyDown}
                      placeholder="Your answer…"
                      rows={1}
                      disabled={responding}
                      className="flex-1 bg-transparent text-ink dark:text-dark-text placeholder:text-ink-faint dark:placeholder:text-dark-text-secondary text-[0.9375rem] leading-relaxed resize-none outline-none"
                    />
                    <button
                      onClick={send}
                      disabled={!input.trim() || responding}
                      className="flex-shrink-0 text-xs tracking-widest uppercase text-ink dark:text-dark-text disabled:text-ink-faint dark:disabled:text-dark-text-secondary transition-colors pb-1"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Synthesizing */}
          {step === "synthesizing" && (
            <div className="flex-1 flex items-center justify-center animate-fade-up">
              <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                Reading what emerged…
              </p>
            </div>
          )}

          {/* Review addition */}
          {step === "review" && (
            <div className="space-y-10 animate-fade-up">
              <div className="space-y-2">
                <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                  What I'd add to your portrait
                </p>
                <p className="portrait-text text-ink dark:text-dark-text leading-relaxed">
                  {addition}
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={acceptAddition}
                  className="w-full py-4 bg-ink dark:bg-dark-text text-bone dark:text-dark-bg text-sm tracking-widest uppercase"
                >
                  Add to my portrait
                </button>
                <button
                  onClick={() => router.push("/home")}
                  className="w-full py-3 text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary hover:text-ink-secondary transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* Done */}
          {step === "done" && (
            <div className="space-y-8 animate-fade-up">
              <div className="space-y-3">
                <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                  Your portrait has evolved.
                </p>
                <p className="heading-editorial text-[1.3rem] leading-[1.45] text-ink dark:text-dark-text">
                  She is becoming more specific.
                </p>
                <p className="text-[0.9375rem] leading-relaxed text-ink-secondary dark:text-dark-text-secondary">
                  The new layer has been added to your portrait. It will be there every time you come back.
                </p>
              </div>
              <button
                onClick={() => router.push("/home")}
                className="inline-block w-full text-center py-4 bg-ink dark:bg-dark-text text-bone dark:text-dark-bg text-sm tracking-widest uppercase"
              >
                Back to home
              </button>
            </div>
          )}

        </div>
      </AppShell>
    </PaletteWrapper>
  );
}
