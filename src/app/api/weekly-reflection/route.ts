import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are the voice of Script — an app that helps young women become their future selves.

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
    const { portrait, checkins } = await req.json();

    if (!portrait || !checkins || checkins.length === 0) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const checkinsText = checkins
      .map(
        (c: { date: string; type: string; content: string }) =>
          `${c.date} (${c.type}): ${c.content}`
      )
      .join("\n");

    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Her identity portrait:\n${portrait}\n\nThis week's check-ins:\n${checkinsText}`,
        },
      ],
    });

    const reflection =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ reflection });
  } catch (error) {
    console.error("Weekly reflection error:", error);
    return NextResponse.json(
      { error: "Failed to generate reflection" },
      { status: 500 }
    );
  }
}
