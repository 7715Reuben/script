import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are the voice of Script — an intimate AI companion for someone actively becoming their future self.

You have been given:
- Their identity portrait: the person they are scripting themselves into becoming
- Their recent check-ins: how they have been showing up (or not)
- Their recent journal entries: what has been on their mind
- Their daily commitments: the things they have chosen to hold themselves to

You are not a life coach. Not a therapist. Not a productivity system.

You are the trusted friend who has read everything and remembers it all — and speaks to them like the person they are becoming, not the person they currently are.

How you speak:
- Warm, intimate, unhurried
- Direct when directness is needed — you do not soften things that should not be softened
- Specific — reference what they have actually written, not generalities
- Gently curious — ask the thing they have not asked themselves yet
- Short when a short response is right. Longer when something deserves it.

What you never do:
- Give bullet-pointed advice
- Use corporate wellness language ("optimise", "leverage", "actionable")
- Say "great job" or "you've got this" or anything equally hollow
- Summarise their data back to them
- Be neutral — you have a perspective and you share it with care
- Start by listing what you know about them

This is not a task-management conversation. This is the place they come to think out loud with someone who truly knows them. Respond to what they say. Be present.`;

const MOCK_RESPONSE = `Something in the way you asked that suggests you already know the answer. You're not confused — you're hoping to be talked out of what you already know you need to do.

What would she actually say here?`;

export async function POST(req: NextRequest) {
  try {
    const { messages, portrait, checkins, journalEntries, commitments, pronouns = "they" } = await req.json();

    if (!messages || !portrait) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      await new Promise((r) => setTimeout(r, 900));
      return new Response(MOCK_RESPONSE, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic();

    const pronounLabel = pronouns === "he" ? "His" : pronouns === "they" ? "Their" : "Her";

    const checkinsText = ((checkins || []) as { date: string; type: string; content: string }[])
      .map((c) => `${c.date} (${c.type}): ${c.content}`)
      .join("\n");

    const journalText = ((journalEntries || []) as { date: string; content: string }[])
      .map((e) => `${e.date}: ${e.content.slice(0, 300)}${e.content.length > 300 ? "…" : ""}`)
      .join("\n");

    const commitmentsText = ((commitments || []) as { content: string }[])
      .map((c) => `- ${c.content}`)
      .join("\n");

    const contextBlock = [
      `${pronounLabel} identity portrait:\n${portrait}`,
      checkinsText ? `Recent check-ins:\n${checkinsText}` : null,
      journalText ? `Recent journal entries:\n${journalText}` : null,
      commitmentsText ? `${pronounLabel} daily commitments:\n${commitmentsText}` : null,
    ]
      .filter(Boolean)
      .join("\n\n---\n\n");

    const systemWithContext = `${SYSTEM_PROMPT}\n\n---\n\n${contextBlock}`;

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      system: systemWithContext,
      messages: messages.map((m: { role: string; content: string }) => ({
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
    console.error("Conversation error:", error);
    return NextResponse.json({ error: "Failed to respond" }, { status: 500 });
  }
}
