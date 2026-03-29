import { NextRequest, NextResponse } from "next/server";

const MOCK_RETROSPECTIVE = `This month held more than you might give it credit for. There were days you moved through life exactly as her — deliberately, with that quiet assurance that doesn't announce itself. And there were stretches where you drifted, where the person you're becoming felt like someone you'd read about rather than someone you were actively inhabiting. Both are real. Both are part of this.

What kept appearing in your check-ins was a tension between the life you're building and the pace at which you're willing to build it. You know who she is. The work is in closing the distance, daily, in the small unglamorous choices that don't feel like progress but are. This month showed you can do that. It also showed the conditions under which you stop.

One month closer. The portrait hasn't changed — but you have, slightly, in the direction of it. That's the whole practice.`;

const SYSTEM_PROMPT = `You are the voice of Script — an app that helps young women become their future selves.

The end of the month has arrived. You have been given a full month of check-ins, journal entries, and the user's identity portrait. Your task is to write the monthly retrospective.

The monthly retrospective is:
- 3 paragraphs. More considered and spacious than the weekly reflection.
- A genuine synthesis of the month as a whole — what arc emerged? What did the month ask of them?
- Draw from specific things they wrote — check-ins and journal entries both. Vagueness breaks trust.
- Name what grew, even if quietly. Name what persisted as a gap or pattern, without judgment.
- The final paragraph should return them to the portrait — not as a goal they failed to reach, but as an orientation. Who are they becoming? What did this month add to that story?

What this is NOT:
- Not a bullet list of accomplishments
- Not a performance review
- Not a stat summary ("you checked in 14 times this month")
- Not generic motivational language

The tone: a wise, caring friend who has watched the whole month unfold and is now sitting down to reflect on it with them — not at them.

Output only the retrospective. No heading. No preamble.`;

export async function POST(req: NextRequest) {
  try {
    const { portrait, checkins, journalEntries, month, pronouns = "she" } = await req.json();

    if (!portrait || !month) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      await new Promise((r) => setTimeout(r, 1800));
      let mock = MOCK_RETROSPECTIVE;
      if (pronouns === "he") {
        mock = mock.replace(/\bherself\b/g, "himself").replace(/\bshe\b/g, "he").replace(/\bher\b/g, "him").replace(/\bShe\b/g, "He").replace(/\bHer\b/g, "His");
      } else if (pronouns === "they") {
        mock = mock.replace(/\bherself\b/g, "themselves").replace(/\bshe\b/g, "they").replace(/\bher\b/g, "them").replace(/\bShe\b/g, "They").replace(/\bHer\b/g, "Their");
      }
      return NextResponse.json({ retrospective: mock });
    }

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic();

    const checkinsText = (checkins as { date: string; type: string; content: string }[])
      .map((c) => `${c.date} (${c.type}): ${c.content}`)
      .join("\n");

    const journalText = (journalEntries as { date: string; content: string }[])
      .map((e) => `${e.date} (journal): ${e.content}`)
      .join("\n");

    const combined = [checkinsText, journalText].filter(Boolean).join("\n\n");
    const pronounLabel = pronouns === "he" ? "His" : pronouns === "they" ? "Their" : "Her";

    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `${pronounLabel} identity portrait:\n${portrait}\n\nThis month's entries:\n${combined || "(no entries this month)"}`,
        },
      ],
    });

    const retrospective = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ retrospective });
  } catch (error) {
    console.error("Monthly retrospective error:", error);
    return NextResponse.json({ error: "Failed to generate retrospective" }, { status: 500 });
  }
}
