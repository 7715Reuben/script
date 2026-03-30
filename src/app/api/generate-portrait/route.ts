import { NextRequest, NextResponse } from "next/server";

const MOCK_PORTRAIT = `She moves through her days with a quietness that isn't emptiness. It's choice. The chaos that used to pull at her doesn't reach her the same way anymore. She has learned to be selective with her energy, and that selectiveness has become one of the most beautiful things about her.

Her work is an extension of who she is, not a performance of who she thinks she should be. She has built something that required her to grow into it, and she did. There is a particular kind of pride she carries about that. Not loud, not announced, just present. She knows what she made and what it cost her.

The people around her feel it immediately. That she is genuinely interested in them. That she listens in a way most people don't. Her relationships aren't accumulated; they're chosen. The ones who know her well consider themselves lucky, and she knows it, and she tries not to take it for granted.

Alone, she is good company to herself. That took time. She reads, she thinks, she has opinions about things that matter and lets go of the things that don't. She wakes up most mornings with something close to anticipation. Not for what's planned. For what might become possible.`;

const SYSTEM_PROMPT = `You are the voice of Script.

Read what this person wrote about their future self and write their Identity Portrait.

The portrait:
- Third person, present tense, using the pronouns specified
- Three to four paragraphs. Each one holds a different dimension of this person: how they carry themselves, their relationship with work or creativity, the people they chose, their inner world
- Written as though this person already fully exists and you are describing someone you know well

The writing:
- Specific and embodied. Not "she is confident." What does confidence look like in how she moves through a room? What specific thing does she no longer do?
- Vary sentence length. Short sentences carry weight. Longer ones can breathe.
- Honor anything specific they mentioned. A place, a feeling, a relationship, a habit. Don't flatten it into generic language.
- Don't start too many sentences with the subject pronoun
- Don't use "she is on a journey" or "she is working toward." Those are progress reports, not portraits.
- Don't use: "truly", "deeply", "genuinely", or any corporate wellness language

Output only the portrait. Nothing else. Start immediately.`;

export async function POST(req: NextRequest) {
  try {
    const { rawScript, pronouns = "she" } = await req.json();

    if (!rawScript || rawScript.trim().length < 10) {
      return NextResponse.json({ error: "Too short" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      await new Promise((r) => setTimeout(r, 2200));
      let mock = MOCK_PORTRAIT;
      if (pronouns === "he") {
        mock = mock
          .replace(/\bherself\b/g, "himself")
          .replace(/\bshe\b/g, "he")
          .replace(/\bher\b/g, "him")
          .replace(/\bHer\b/g, "His")
          .replace(/\bShe\b/g, "He");
      } else if (pronouns === "they") {
        mock = mock
          .replace(/\bherself\b/g, "themselves")
          .replace(/\bshe\b/g, "they")
          .replace(/\bher\b/g, "them")
          .replace(/\bHer\b/g, "Their")
          .replace(/\bShe\b/g, "They");
      }
      return NextResponse.json({ portrait: mock });
    }

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic();

    const pronounLine = pronouns === "he"
      ? "Use he/him/his pronouns throughout."
      : pronouns === "they"
      ? "Use they/them/their pronouns throughout."
      : "Use she/her/hers pronouns throughout.";

    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 800,
      system: SYSTEM_PROMPT + "\n\n" + pronounLine,
      messages: [{ role: "user", content: `Here is what they wrote:\n\n${rawScript}` }],
    });

    const portrait = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ portrait });
  } catch (error) {
    console.error("Portrait generation error:", error);
    return NextResponse.json({ error: "Failed to generate portrait" }, { status: 500 });
  }
}
