import { NextRequest, NextResponse } from "next/server";

const MOCK_MORNING = "That's exactly the kind of thing she'd do without thinking twice about it. Today is already hers.";
const MOCK_EVENING = "Showing up partially still counts — she doesn't require a perfect day to make progress. The gap you named isn't a failure, it's just information. She files it and moves on.";

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
    const { type, content, portrait, pronouns = "she" } = await req.json();

    if (!content || !portrait || !type) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      await new Promise((r) => setTimeout(r, 800));
      const mockBase = type === "morning" ? MOCK_MORNING : MOCK_EVENING;
      const mock = pronouns === "he"
        ? mockBase.replace(/\bshe\b/g, "he").replace(/\bher\b/g, "him").replace(/\bShe\b/g, "He")
        : mockBase;
      return NextResponse.json({ response: mock });
    }

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic();

    const pronounLine = pronouns === "he" ? "Use he/him pronouns." : "Use she/her pronouns.";
    const systemPrompt = (type === "morning" ? MORNING_SYSTEM : EVENING_SYSTEM) + "\n\n" + pronounLine;
    const poss = pronouns === "he" ? "His" : "Her";
    const userMessage =
      type === "morning"
        ? `${poss} identity portrait:\n${portrait}\n\n${poss} morning intention:\n${content}`
        : `${poss} identity portrait:\n${portrait}\n\n${poss} evening reflection:\n${content}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const response = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ response });
  } catch (error) {
    console.error("Check-in response error:", error);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
