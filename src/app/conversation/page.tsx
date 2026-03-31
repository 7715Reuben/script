"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { AppShell } from "@/components/layout/AppShell";
import { PaletteWrapper } from "@/components/ui/PaletteWrapper";
import { PremiumGate } from "@/components/ui/PremiumGate";
import { getTodayString } from "@/lib/utils";
import type { Conversation } from "@/lib/supabase";

type Message = { role: "user" | "assistant"; content: string };

const OPENING_PROMPTS = [
  "Something's been on my mind lately.",
  "I need to think something through.",
  "I don't know where to start.",
  "I've been feeling off.",
  "Tell me what you see in me right now.",
];

const CONVERSATION_EXAMPLE = `Something in the way you asked that suggests you already know the answer. You're not confused. You're hoping to be talked out of what you already know you need to do. What would your future self actually say here?`;

export default function ConversationPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [premium, setPremium] = useState(true);
  const [responding, setResponding] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [context, setContext] = useState<{
    portrait: string;
    checkins: unknown[];
    journalEntries: unknown[];
    commitments: unknown[];
    pronouns: string;
    name: string | null;
    userId: string;
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const today = getTodayString();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/onboarding"); return; }

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

      const [profileRes, historyRes, checkinsRes, journalRes, commitmentsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase
          .from("conversations")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })
          .limit(80),
        supabase
          .from("checkins")
          .select("date, type, content")
          .eq("user_id", user.id)
          .gte("date", sevenDaysAgoStr)
          .order("date", { ascending: false })
          .limit(14),
        supabase
          .from("journal_entries")
          .select("date, content")
          .eq("user_id", user.id)
          .gte("date", thirtyDaysAgoStr)
          .order("date", { ascending: false })
          .limit(3),
        supabase
          .from("commitments")
          .select("content")
          .eq("user_id", user.id)
          .order("position"),
      ]);

      const hist: Message[] = (historyRes.data || []).map((m: Conversation) => ({
        role: m.role,
        content: m.content,
      }));

      setMessages(hist);
      setContext({
        portrait: profileRes.data?.portrait ?? "",
        checkins: checkinsRes.data ?? [],
        journalEntries: journalRes.data ?? [],
        commitments: commitmentsRes.data ?? [],
        pronouns: profileRes.data?.pronouns ?? "they",
        name: profileRes.data?.name ?? null,
        userId: user.id,
      });
      setPremium(profileRes.data?.premium !== false);
      setLoading(false);
    }
    load();
  }, [router, today]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  async function send(text: string) {
    if (!text.trim() || responding || !context) return;

    const userMessage: Message = { role: "user", content: text.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setResponding(true);
    setStreamingText("");

    // Save user message
    const supabase = createClient();
    await supabase.from("conversations").insert({
      user_id: context.userId,
      role: "user",
      content: userMessage.content,
    });

    try {
      const res = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.slice(-20), // last 20 for context window
          portrait: context.portrait,
          checkins: context.checkins,
          journalEntries: context.journalEntries,
          commitments: context.commitments,
          pronouns: context.pronouns,
          name: context.name,
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
        setStreamingText(fullText);
      }

      const assistantMessage: Message = { role: "assistant", content: fullText };
      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingText("");

      // Save assistant message
      await supabase.from("conversations").insert({
        user_id: context.userId,
        role: "assistant",
        content: fullText,
      });
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  if (loading) return <div className="min-h-dvh bg-bone dark:bg-dark-bg" />;

  if (!premium) return (
    <PaletteWrapper event="evening">
      <AppShell><PremiumGate
        feature="Talk to Script"
        description="A conversation with an AI that has read your portrait, your check-ins, your journal — and speaks to you like the person you're becoming."
        example={CONVERSATION_EXAMPLE}
      /></AppShell>
    </PaletteWrapper>
  );

  const isEmpty = messages.length === 0 && !streamingText;

  return (
    <PaletteWrapper event="evening">
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
            Script
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-8 pb-6">
          {isEmpty ? (
            <div className="space-y-8 animate-fade-up">
              <p className="heading-editorial text-[1.3rem] leading-[1.45] text-ink dark:text-dark-text">
                What&apos;s on your mind?
              </p>
              <div className="space-y-2">
                {OPENING_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => send(prompt)}
                    className="block w-full text-left py-3 border-b border-border dark:border-dark-border text-[0.9375rem] text-ink-secondary dark:text-dark-text-secondary hover:text-ink dark:hover:text-dark-text transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-fade-up">
              {messages.map((msg, i) => (
                <MessageBlock key={i} role={msg.role} content={msg.content} />
              ))}
              {streamingText && (
                <MessageBlock role="assistant" content={streamingText} streaming />
              )}
              {responding && !streamingText && (
                <div className="space-y-1">
                  <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
                    Script
                  </p>
                  <span className="text-ink-faint dark:text-dark-text-secondary text-lg tracking-widest">···</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="sticky bottom-0 pt-4 pb-safe bg-bone dark:bg-dark-bg border-t border-border dark:border-dark-border">
          <div className="flex gap-4 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoResize(e.target);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Say something…"
              rows={1}
              disabled={responding}
              className="flex-1 bg-transparent text-ink dark:text-dark-text placeholder:text-ink-faint dark:placeholder:text-dark-text-secondary text-[0.9375rem] leading-relaxed resize-none outline-none"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || responding}
              className="flex-shrink-0 text-xs tracking-widest uppercase text-ink dark:text-dark-text disabled:text-ink-faint dark:disabled:text-dark-text-secondary transition-colors pb-1"
            >
              Send
            </button>
          </div>
        </div>

      </div>
    </AppShell>
    </PaletteWrapper>
  );
}

function MessageBlock({
  role,
  content,
  streaming = false,
}: {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
        {role === "user" ? "You" : "Script"}
      </p>
      <div className="space-y-3">
        {content.split(/\n\n+/).filter(Boolean).map((para, i) => (
          <p
            key={i}
            className={[
              "text-[0.9375rem] leading-relaxed",
              role === "user"
                ? "text-ink-secondary dark:text-dark-text-secondary"
                : "text-ink dark:text-dark-text",
            ].join(" ")}
          >
            {para}
            {streaming && i === content.split(/\n\n+/).filter(Boolean).length - 1 && (
              <span className="inline-block w-0.5 h-4 ml-0.5 bg-ink dark:bg-dark-text align-middle animate-pulse" />
            )}
          </p>
        ))}
      </div>
    </div>
  );
}
