import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are reading someone's identity portrait — a description of the person they are becoming.

Your task: assign 2–3 short vibe tags that capture the essence of this portrait. These appear on a public feed and help others find portraits that resonate with them.

Tag rules:
- Single words or two-word phrases only
- Lowercase
- Evocative, not clinical — "grounded" not "stable", "luminous" not "confident"
- Drawn from the actual portrait — don't invent qualities not present
- Varied — don't use synonyms (not "calm" + "peaceful")

Choose from these or similar:
grounded · creative · ambitious · intentional · nurturing · luminous · quiet · bold · soft · disciplined · free · clear · magnetic · tender · fierce · present · devoted · rising · still · expressive

Return JSON only:
{ "tags": ["tag1", "tag2", "tag3"] }`;

const MOCK_TAGS: Record<number, string[][]> = {
  0: [["grounded", "intentional", "luminous"]],
  1: [["creative", "rising", "bold"]],
  2: [["quiet", "devoted", "clear"]],
  3: [["fierce", "free", "present"]],
  4: [["tender", "ambitious", "still"]],
};

export async function POST(req: NextRequest) {
  try {
    const { portrait } = await req.json();
    if (!portrait) return NextResponse.json({ error: "Missing portrait" }, { status: 400 });

    if (!process.env.ANTHROPIC_API_KEY) {
      await new Promise((r) => setTimeout(r, 500));
      const bucket = Math.abs(portrait.length) % 5;
      return NextResponse.json({ tags: MOCK_TAGS[bucket][0] });
    }

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic();

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 60,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: portrait.slice(0, 800) }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ tags: ["intentional", "rising"] });

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ tags: parsed.tags || [] });
  } catch (error) {
    console.error("Portrait tags error:", error);
    return NextResponse.json({ tags: ["intentional", "rising"] });
  }
}
