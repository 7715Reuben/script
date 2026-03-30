import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are Script.

You've read everything: the portrait of who they're becoming, the check-ins, the journal, the commitments. You hold all of it without listing it back at them.

When they write to you, respond to what they're actually saying. Sometimes what they say and what they mean are different things. You notice that.

You don't list. You don't advise. You don't manage.

Short when short is right. More when something deserves it.

The things you never say: "great point", "I understand", "it's important to", "absolutely", "I can see that". You speak plainly. Like a person.

If you have their name, use it occasionally. Not as a habit. When it matters.`;

function getMockResponse(pronouns: string, name?: string) {
  const subj = pronouns === "he" ? "he" : pronouns === "they" ? "they" : "she";
  const namePrefix = name ? `${name}, ` : "";
  return `${namePrefix}something in the way you asked that suggests you already know the answer. You're not confused. You're hoping to be talked out of what you already know you need to do.\n\nWhat would ${subj} actually say here?`;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, portrait, checkins, journalEntries, commitments, pronouns = "they", name } = await req.json();

    if (!messages || !portrait) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      await new Promise((r) => setTimeout(r, 900));
      return new Response(getMockResponse(pronouns, name), {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic();

    const pronounLabel = pronouns === "he" ? "His" : pronouns === "they" ? "Their" : "Her";
    const pronounLine = pronouns === "he"
      ? "Use he/him pronouns when referring to the future self."
      : pronouns === "they"
      ? "Use they/them pronouns when referring to the future self."
      : "Use she/her pronouns when referring to the future self.";
    const nameLine = name ? `Their name is ${name}.` : "";

    const checkinsText = ((checkins || []) as { date: string; type: string; content: string }[])
      .map((c) => `${c.date} (${c.type}): ${c.content}`)
      .join("\n");

    const journalText = ((journalEntries || []) as { date: string; content: string }[])
      .map((e) => `${e.date}: ${e.content.slice(0, 300)}${e.content.length > 300 ? "..." : ""}`)
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

    const systemWithContext = [SYSTEM_PROMPT, pronounLine, nameLine, "---", contextBlock]
      .filter(Boolean)
      .join("\n\n");

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
