import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are the voice of Script — reading someone's scripting session with honest, caring attention.

The user has just written freely as their future self — first person, present tense, stream of consciousness. You have also been given their identity portrait.

Your task is to respond with three things:

1. **What felt true** — the parts that had the quality of real belief. Not performance, not wishful thinking. Where did the writing become specific, embodied, unguarded? These are the sentences that sounded like memory rather than aspiration. Be specific — quote or closely reference what they wrote.

2. **What felt like performance** — the parts that sounded like they were writing what they thought they should write. Vague. Generic. The sentences any person might write. Do not be harsh — just honest. Name it clearly and briefly.

3. **One thing not in their portrait yet** — something genuine that emerged in this writing that isn't already in their portrait. Not an observation — a specific quality, belief, or truth about who they are. This is the most valuable thing you offer.

Format your response as JSON with exactly these three keys:
{
  "true": "...",
  "performance": "...",
  "notInPortrait": "..."
}

Each value is 2–4 sentences. The "notInPortrait" value is 1–2 sentences, written as a portrait fragment (second person, present tense) ready to be added.

Do not be gentle to the point of uselessness. The person came here to grow, not to be reassured.`;

const MOCK_RESPONSE = {
  true: `The part about the morning was real — specific, unhurried, like you'd already lived it. "I make coffee before I check anything" carried actual weight. That's not something you invented; that's something you already know about yourself.`,
  performance: `The sections about work became vague. "I'm building something meaningful" and "my work matters" — anyone could write those. There was no detail, no texture. When the writing got ambitious, it lost its grip on the actual person.`,
  notInPortrait: `She knows what she's doing before she needs to justify it to anyone. The confidence in her doesn't ask for permission first.`,
};

export async function POST(req: NextRequest) {
  try {
    const { script, portrait, pronouns = "they" } = await req.json();

    if (!script || !portrait) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      await new Promise((r) => setTimeout(r, 1400));
      let mock = { ...MOCK_RESPONSE };
      if (pronouns === "he") {
        mock.notInPortrait = mock.notInPortrait
          .replace(/\bShe\b/g, "He").replace(/\bshe\b/g, "he")
          .replace(/\bher\b/g, "his").replace(/\bHer\b/g, "His");
      } else if (pronouns === "they") {
        mock.notInPortrait = mock.notInPortrait
          .replace(/\bShe\b/g, "They").replace(/\bshe\b/g, "they")
          .replace(/\bher\b/g, "their").replace(/\bHer\b/g, "Their");
      }
      return NextResponse.json(mock);
    }

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic();

    const pronounLabel = pronouns === "he" ? "His" : pronouns === "they" ? "Their" : "Her";

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 700,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `${pronounLabel} identity portrait:\n${portrait}\n\n---\n\n${pronounLabel} scripting session:\n${script}`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "{}";

    // Extract JSON — handle markdown code fences if present
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse response" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Scripting session error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
