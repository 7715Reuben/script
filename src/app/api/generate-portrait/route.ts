import { NextRequest, NextResponse } from "next/server";

const MOCK_PORTRAIT = `She moves through her days with a quietness that isn't emptiness — it's choice. The chaos that used to pull at her doesn't reach her the same way anymore. She has learned, somewhere along the way, to be selective with her energy, and that selectiveness has become one of the most beautiful things about her.

Her work is an extension of who she is, not a performance of who she thinks she should be. She has built something that required her to grow into it — and she did. There is a particular kind of pride she carries about that, not loud, not announced, just present. She knows what she made and what it cost her.

The people around her feel it immediately — that she is genuinely interested in them, that she listens in a way most people don't. Her relationships are not accumulated; they are chosen. The ones who know her well consider themselves lucky, and she knows it, and she tries not to take it for granted.

Alone, she is good company to herself. That took time. She reads, she thinks, she has opinions about things that matter and lets go of things that don't. She wakes up most mornings with something close to anticipation — not for what's planned, but for what might become possible.`;

const SYSTEM_PROMPT = `You are the voice of Script — an app that helps young women manifest their future selves through a practice called scripting.

Your only task right now is to read a user's free-written vision of their future self and transform it into an Identity Portrait.

An Identity Portrait is:
- Written in second person, present tense ("She wakes up..." or "You move through...")
- A portrait of who someone IS, not a list of what they've achieved
- 3–4 paragraphs. Each paragraph holds one dimension of this person: how she carries herself, her relationship with her work or creativity, her relationships with others, her inner life.
- Poetic but not overwrought. Specific but not prescriptive.
- Written as though this person already fully exists and you are simply describing her.

Tone guidance:
- Warm, intimate, quietly confident
- Never hype-y, never corporate, never clinical
- Speak to the aspirational without toxic positivity
- If the user mentioned something specific — a place, a feeling, a relationship — honour it with specificity. Don't flatten their vision into generic language.
- The portrait should feel like something worth reading every morning. Something that makes you feel seen.

What NOT to do:
- Do not list goals or achievements as bullet points
- Do not use phrases like "you are on a journey" or "you are working toward"
- Do not use corporate wellness language
- Do not start every sentence with "You"
- Do not be generic — "she is confident and kind" is not a portrait

Output only the portrait text. No preamble. No closing note. Just the portrait, starting immediately.`;

export async function POST(req: NextRequest) {
  try {
    const { rawScript } = await req.json();

    if (!rawScript || rawScript.trim().length < 10) {
      return NextResponse.json({ error: "Too short" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      await new Promise((r) => setTimeout(r, 2200));
      return NextResponse.json({ portrait: MOCK_PORTRAIT });
    }

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic();

    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Here is what she wrote:\n\n${rawScript}` }],
    });

    const portrait = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ portrait });
  } catch (error) {
    console.error("Portrait generation error:", error);
    return NextResponse.json({ error: "Failed to generate portrait" }, { status: 500 });
  }
}
