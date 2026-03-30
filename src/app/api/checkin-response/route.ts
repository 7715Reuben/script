import { NextRequest, NextResponse } from "next/server";

const MORNING_SYSTEM = `You are the voice of Script.

You have the user's identity portrait. They've just written their morning intention: one thing they'll do today as the person they're becoming.

Write one or two sentences back. No more.

Be specific to exactly what they wrote. Not a general affirmation about "showing up." The tone: someone who knows them and expected this. Not surprised. Not gushing. Just certain.

If you have their name, use it once, but only if it feels natural. Not as a greeting.

No "love that." No "amazing." No filler. Say the thing.

Output only the response.`;

const EVENING_SYSTEM = `You are the voice of Script.

You have the user's identity portrait and their commitments. They've just reflected on their day.

Write two or three sentences. Do all of this:
- Acknowledge what they actually did, without over-praising it
- If something slipped, name it plainly. Not cruelly. But don't cushion it into nothing.
- Connect what they said to something specific in their portrait
- End on something that grounds them in who she is becoming, not where they fell short

The tone: a friend who has read everything and won't let you perform growth at her.

If you have their name, use it once, where it actually lands.

Output only the response.`;

const MOCK_MORNING = `That's exactly the kind of thing she'd do without thinking twice about it. Today is already hers.`;
const MOCK_EVENING = `Showing up partially still counts. The gap you named isn't a failure, it's information. She files it and moves on.`;

export async function POST(req: NextRequest) {
  try {
    const { type, content, portrait, pronouns = "they", commitments = [], name } = await req.json();

    if (!content || !portrait || !type) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      await new Promise((r) => setTimeout(r, 800));
      const mockBase = type === "morning" ? MOCK_MORNING : MOCK_EVENING;
      let mock = name ? mockBase.replace(/^That's/, `${name}, that's`) : mockBase;
      if (pronouns === "he") {
        mock = mock.replace(/\bshe\b/g, "he").replace(/\bher\b/g, "him").replace(/\bShe\b/g, "He");
      } else if (pronouns === "they") {
        mock = mock.replace(/\bshe\b/g, "they").replace(/\bher\b/g, "them").replace(/\bShe\b/g, "They");
      }
      return NextResponse.json({ response: mock });
    }

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic();

    const pronounLine = pronouns === "he"
      ? "Use he/him pronouns for the future self."
      : pronouns === "they"
      ? "Use they/them pronouns for the future self."
      : "Use she/her pronouns for the future self.";

    const nameLine = name ? `Their name is ${name}.` : "";

    let commitmentBlock = "";
    if (type === "evening" && commitments.length > 0) {
      const lines = commitments.map((c: { content: string; kept?: boolean }) => {
        const status = c.kept === true ? "kept today" : c.kept === false ? "missed today" : "not logged";
        return `- "${c.content}" — ${status}`;
      }).join("\n");
      commitmentBlock = `\n\nTheir commitments today:\n${lines}\n\nIf any were missed, name them directly. Don't soften it.`;
    }

    const systemPrompt = [
      type === "morning" ? MORNING_SYSTEM : EVENING_SYSTEM,
      pronounLine,
      nameLine,
    ].filter(Boolean).join("\n") + commitmentBlock;

    const poss = pronouns === "he" ? "His" : pronouns === "they" ? "Their" : "Her";
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
