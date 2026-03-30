import { NextRequest, NextResponse } from "next/server";

const MOCK_REFLECTION = `Something shifted this week, even if it was quiet. There were moments where you showed up exactly as her. Not because it was easy. Because it was starting to feel natural. That's worth sitting with.

The gaps were real too. A couple of days where the intention was there but the follow-through got swallowed by something easier or something louder. That's not a character flaw. It's a pattern. Patterns can be worked with. The question for next week isn't "why didn't I?" It's "what would make it easier to say yes?"

She's still becoming. That doesn't stop. But this week added something to the foundation, even in the places that felt like they didn't.`;

const SYSTEM_PROMPT = `You are Script.

It's the end of the week. You have every check-in from the last seven days and the user's identity portrait.

Write a reflection. Two or three paragraphs. No heading.

Find the actual pattern underneath the week. Not a list of what happened. What kept showing up beneath the surface? Name something specific about a moment that mattered, even if they didn't mark it as significant. If there was consistent avoidance, name it without making it a verdict.

Close by returning them to who she is becoming. Not a pep talk. A landing.

Vary sentence length. Let something breathe. This is the most important thing they'll read this week.

If you have their name, use it once, in the right place. Not the opening.

Output only the reflection.`;

export async function POST(req: NextRequest) {
  try {
    const { portrait, checkins, pronouns = "she", name } = await req.json();

    if (!portrait || !checkins || checkins.length === 0) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      await new Promise((r) => setTimeout(r, 1200));
      let mock = name
        ? MOCK_REFLECTION.replace("She's still becoming.", `${name}, she's still becoming.`)
        : MOCK_REFLECTION;
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

    const pronounLine = pronouns === "he"
      ? "Use he/him pronouns for the future self."
      : pronouns === "they"
      ? "Use they/them pronouns for the future self."
      : "Use she/her pronouns for the future self.";
    const nameLine = name ? `Their name is ${name}.` : "";

    const poss = pronouns === "he" ? "His" : pronouns === "they" ? "Their" : "Her";

    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 600,
      system: [SYSTEM_PROMPT, pronounLine, nameLine].filter(Boolean).join("\n"),
      messages: [
        {
          role: "user",
          content: `${poss} identity portrait:\n${portrait}\n\nThis week's check-ins:\n${checkinsText}`,
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
