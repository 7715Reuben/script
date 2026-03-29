import { NextRequest, NextResponse } from "next/server";

// ─── System prompts ────────────────────────────────────────────────────────

const CHAT_SYSTEM = `You are the voice of Script — helping someone go deeper into their identity portrait.

You are running a guided portrait session. The user has chosen a theme: {THEME}.

Your goal is to ask 3–4 questions that reveal depth about this area of their life — not facts, but truth. What does this theme actually mean for the person they are becoming?

How you ask:
- One question at a time. Never more.
- Questions that open, not close. "What does that feel like?" not "Do you exercise?"
- Go beneath the surface answer. If they give you the polished version, ask what's underneath.
- Be warm, unhurried, genuinely curious.
- After 3–4 exchanges you will naturally sense when you have enough. At that point, end your message with exactly this line on its own: [ready]

Do not explain what you are doing. Do not say "great answer". Do not list anything.
Start with your first question — about {THEME} — addressed to who they are becoming, not who they currently are.`;

const SYNTHESIZE_SYSTEM = `You are the voice of Script — now synthesising what emerged in a portrait session into new portrait content.

You have been given:
1. The user's existing identity portrait
2. A guided conversation about the theme: {THEME}

Your task: write a short, precise addition to their portrait — 2–3 sentences only — based on what genuinely emerged in the conversation.

Requirements:
- Second person, present tense: "She knows…" / "They hold…" / "He moves…"
- Match the exact voice, cadence, and imagery level of their existing portrait
- Only include what they actually revealed — no invention
- Do not repeat anything already in the portrait
- Do not name the theme directly ("her mornings are…" is fine; "when it comes to mornings…" is not)
- Do not begin with "And", "Also", or "Additionally"

Output only the addition. No heading. No preamble. No explanation.`;

// ─── Mock responses ────────────────────────────────────────────────────────

const MOCK_CHAT: Record<string, string[]> = {
  Mornings: [
    "When does her morning actually begin? Not when the alarm goes off — when does she feel herself arrive in the day?",
    "What does she protect in that time, before anyone needs anything from her?",
    "What would it mean if she lost that? What does it say about who she is that she guards it?\n\n[ready]",
  ],
  Work: [
    "What is she building — not the thing itself, but what does it ask her to become?",
    "What part of the work feels like the truest version of her? And what part feels like performance?",
    "If this work were finished and she looked back at it — what would she want it to have required of her?\n\n[ready]",
  ],
  Relationships: [
    "Who is around her? Not their names — what kind of people did she choose?",
    "What did she stop tolerating? What shifted in her that made that possible?",
    "What does she bring to the people she loves that only she can bring?\n\n[ready]",
  ],
  Body: [
    "How does she inhabit her body? Not what she does with it — how does she live inside it?",
    "What is her relationship with it now, compared to what it used to be?",
    "What does she ask of her body, and what does she offer it in return?\n\n[ready]",
  ],
  Voice: [
    "How does she speak? Not the words — the quality of it. What does her voice carry?",
    "What does she say now that she didn't used to? And what has she stopped saying?",
    "When she's in a room, what do people feel from her presence, even before she speaks?\n\n[ready]",
  ],
  Values: [
    "What is the line she doesn't cross? The thing that, if she compromised it, she wouldn't recognise herself?",
    "Where did that come from? Was it always there or did she build it?",
    "What does living by that value cost her sometimes — and why is it worth it?\n\n[ready]",
  ],
};

const MOCK_SYNTHESIS = `She treats her mornings as sacred — not in a rigid way, but in the way of someone who knows that the first hour shapes everything that follows. There is something she does before the world finds her, and she guards it without apology. That quiet is not emptiness; it is where she comes back to herself.`;

// ─── Route ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, theme, messages, portrait, pronouns = "they" } = body;

    if (!mode || !theme) {
      return NextResponse.json({ error: "Missing mode or theme" }, { status: 400 });
    }

    // ── Mock fallback ──────────────────────────────────────────────────────
    if (!process.env.ANTHROPIC_API_KEY) {
      await new Promise((r) => setTimeout(r, 700));

      if (mode === "synthesize") {
        let mock = MOCK_SYNTHESIS;
        if (pronouns === "he") {
          mock = mock
            .replace(/\bShe\b/g, "He").replace(/\bshe\b/g, "he")
            .replace(/\bher\b/g, "his").replace(/\bHer\b/g, "His");
        } else if (pronouns === "they") {
          mock = mock
            .replace(/\bShe\b/g, "They").replace(/\bshe\b/g, "they")
            .replace(/\bher\b/g, "their").replace(/\bHer\b/g, "Their");
        }
        return NextResponse.json({ addition: mock });
      }

      // chat mock — return question based on exchange count
      const userTurns = (messages || []).filter((m: { role: string }) => m.role === "user").length;
      const pool = MOCK_CHAT[theme] || MOCK_CHAT["Mornings"];
      const idx = Math.min(userTurns, pool.length - 1);
      return new Response(pool[idx], {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // ── Live AI ────────────────────────────────────────────────────────────
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic();

    if (mode === "synthesize") {
      const pronounLabel = pronouns === "he" ? "His" : pronouns === "they" ? "Their" : "Her";
      const transcript = (messages as { role: string; content: string }[])
        .map((m) => `${m.role === "user" ? "Them" : "Script"}: ${m.content}`)
        .join("\n\n");

      const system = SYNTHESIZE_SYSTEM.replace(/\{THEME\}/g, theme);

      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        system,
        messages: [
          {
            role: "user",
            content: `${pronounLabel} existing portrait:\n${portrait}\n\nSession conversation (theme: ${theme}):\n${transcript}`,
          },
        ],
      });

      const addition = response.content[0].type === "text" ? response.content[0].text : "";
      return NextResponse.json({ addition });
    }

    // chat mode — stream
    const system = CHAT_SYSTEM.replace(/\{THEME\}/g, theme);

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system,
      messages: (messages as { role: string; content: string }[]).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Portrait session error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
