import { NextRequest, NextResponse } from "next/server";

const MOCK_REFLECTION = `Something shifted this week, even if it was quiet. There were moments where you showed up exactly as her — not because it was easy, but because it was starting to feel natural. That's worth noting. The version of you that does these things without having to convince herself is closer than she was seven days ago.

The gaps were real too. There were a couple of days where the intention was there but the follow-through got swallowed by something easier or something louder. That's not a character flaw, it's a pattern — and patterns can be worked with. The question for next week isn't "why didn't I?" but "what would make it easier to say yes?"

She's still becoming. That doesn't stop. But this week added something to the foundation, even in the places that felt like they didn't.`;

const SYSTEM_PROMPT = `You are the voice of Script — an app that helps people become their future selves.

It is Sunday evening. You have been given a week's worth of check-ins and a user's identity portrait. Your task is to write the weekly reflection.

The weekly reflection is:
- 2–3 paragraphs. Intimate and personal.
- A genuine synthesis of the week, not a summary. Find the patterns — what kept showing up? What was notably absent?
- Name specific things they wrote about. Vagueness breaks trust.
- Celebrate what deserves to be celebrated, without over-inflating it.
- Name gaps or patterns of avoidance without judgment — with curiosity.
- Close by anchoring them back to who they're becoming. Not a motivational finish — a grounding one.

What this is NOT:
- Not a list of what they did
- Not a performance review
- Not generic weekly wrap-up language
- Not "Here are your highlights from this week!"

The tone: a wise, caring friend who has been paying very close attention all week.

Output only the reflection. No heading. No preamble.`;

export async function POST(req: NextRequest) {
  try {
    const { portrait, checkins, pronouns = "she" } = await req.json();

    if (!portrait || !checkins || checkins.length === 0) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      await new Promise((r) => setTimeout(r, 1200));
      let mock = MOCK_REFLECTION;
      if (pronouns === "he") {
        mock = mock.replace(/\bherself\b/g, "himself").replace(/\bshe\b/g, "he").replace(/\bher\b/g, "him").replace(/\bShe\b/g, "He").replace(/\bHer\b/g, "His");
      } else if (pronouns === "they") {
        mock = mock.replace(/\bherself\b/g, "themselves").replace(/\bshe\b/g, "they").replace(/\bher\b/g, "them").replace(/\bShe\b/g, "They").replace(/\bHer\b/g, "Their");
      }
      return NextResponse.json({ reflection: mock });
    }

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic();

    const checkinsText = checkins
      .map((c: { date: string; type: string; content: string }) =>
        `${c.date} (${c.type}): ${c.content}`
      )
      .join("\n");

    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 600,
      system: SYSTEM_PROMPT + `\n\n${pronouns === "he" ? "Use he/him/his pronouns." : pronouns === "they" ? "Use they/them/their pronouns." : "Use she/her/hers pronouns."}`,
      messages: [
        {
          role: "user",
          content: `${pronouns === "he" ? "His" : pronouns === "they" ? "Their" : "Her"} identity portrait:\n${portrait}\n\nThis week's check-ins:\n${checkinsText}`,
        },
      ],
    });

    const reflection = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ reflection });
  } catch (error) {
    console.error("Weekly reflection error:", error);
    return NextResponse.json({ error: "Failed to generate reflection" }, { status: 500 });
  }
}
