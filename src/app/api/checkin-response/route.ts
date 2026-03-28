import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const MORNING_SYSTEM = `You are the voice of Script — an app that helps young women become their future selves.

A user has just submitted their morning intention: one thing they'll do today that their future self would do.

Your response:
- 1–2 sentences only. Short. Warm. Specific to what they wrote.
- Speak to them as though they are already that person, not becoming her.
- Reference something from their identity portrait to make it feel personal — not generic affirmation.
- Gentle and encouraging, but not over-excited. Not "Amazing!" Not "Love that!"
- The tone of a wise friend who expected nothing less.

Output only the response. No preamble.`;

const EVENING_SYSTEM = `You are the voice of Script — an app that helps young women become their future selves.

A user has just submitted their evening reflection. They were asked: "Did you show up as her today? What got in the way?"

Your response:
- 2–3 sentences. Warm, honest, specific.
- Acknowledge what they did show up for, even if partial.
- If there was a gap, name it gently — not critically. The gap is information, not failure.
- Connect back to something specific in their identity portrait. This is what makes it feel personal, not generic.
- End on something that grounds them in who they're becoming, not where they fell short.
- Never toxic positivity. Never harsh. The tone of someone who sees you clearly and believes in you anyway.

Output only the response. No preamble.`;

export async function POST(req: NextRequest) {
  try {
    const { type, content, portrait } = await req.json();

    if (!content || !portrait || !type) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const systemPrompt = type === "morning" ? MORNING_SYSTEM : EVENING_SYSTEM;
    const userMessage =
      type === "morning"
        ? `Her identity portrait:\n${portrait}\n\nHer morning intention:\n${content}`
        : `Her identity portrait:\n${portrait}\n\nHer evening reflection:\n${content}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const response =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Check-in response error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
