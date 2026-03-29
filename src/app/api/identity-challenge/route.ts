import { NextRequest, NextResponse } from "next/server";

const GENERATE_SYSTEM = `You are the voice of Script — generating a personalised identity challenge.

You have been given someone's identity portrait. Your task is to generate a {DURATION}-day challenge built entirely from who they said they were becoming.

The challenge is not a habit tracker. It is not a productivity plan. It is a series of small, specific actions that close the gap between who they are and who the portrait describes.

Rules for each day's action:
- Specific and concrete — not "be more present", but "eat one meal today without your phone"
- Drawn from the portrait — every action should feel like it came from reading their specific words
- Achievable in a single day — nothing that requires resources, travel, or special circumstances
- Varied across the {DURATION} days — different dimensions of the portrait, not all the same area
- Short — one sentence, no longer

Return JSON in this exact format:
{
  "title": "A short, evocative name for this challenge (3–6 words)",
  "days": [
    { "day": 1, "action": "..." },
    { "day": 2, "action": "..." },
    ...
  ]
}

The title should feel like something you'd want to tell someone about. Not generic ("Growth Challenge") — specific to their portrait.

Output only the JSON. No preamble.`;

const REFLECTION_SYSTEM = `You are the voice of Script — writing a closing reflection on a completed identity challenge.

The person just completed a {DURATION}-day challenge. You have their portrait, the daily actions they completed, and which days they marked as done.

Write a reflection of 2–3 paragraphs:
1. What did completing these actions reveal about who they already are? What did it ask of them?
2. What patterns emerged — where did they show up consistently, and where did resistance appear?
3. A single, true sentence about what this challenge added to their story.

Tone: warm, unhurried, specific. Like someone who watched the whole challenge unfold.

Output only the reflection. No heading. No preamble.`;

const MOCK_CHALLENGE_7 = {
  title: "The Quiet Presence Challenge",
  days: [
    { day: 1, action: "Spend the first 10 minutes of your morning in silence before reaching for your phone." },
    { day: 2, action: "Say no to one thing today that you would usually say yes to out of obligation." },
    { day: 3, action: "Write down three things you did this week that she would have done." },
    { day: 4, action: "Eat one meal today without any screen in front of you." },
    { day: 5, action: "Tell someone something true that you've been keeping to yourself." },
    { day: 6, action: "Do one thing today that is entirely for your own pleasure — nothing productive about it." },
    { day: 7, action: "Write a single sentence that describes who you were this week. Make it honest." },
  ],
};

const MOCK_CHALLENGE_21 = {
  title: "The Becoming Challenge",
  days: [
    { day: 1, action: "Spend the first 10 minutes of your morning in silence before reaching for your phone." },
    { day: 2, action: "Say no to one thing today that you would usually say yes to out of obligation." },
    { day: 3, action: "Write down three things you did this week that she would have done." },
    { day: 4, action: "Eat one meal today without any screen in front of you." },
    { day: 5, action: "Tell someone something true that you've been keeping to yourself." },
    { day: 6, action: "Do one thing today that is entirely for your own pleasure — nothing productive about it." },
    { day: 7, action: "Write a single sentence about who you were this week. Make it honest." },
    { day: 8, action: "Go somewhere alone today — a walk, a café, anywhere. No companion, no podcast." },
    { day: 9, action: "Cancel or decline something on your calendar that you've been dreading." },
    { day: 10, action: "Dress today exactly as she would dress, even if you have nowhere to go." },
    { day: 11, action: "Do the thing you've been putting off for more than a week." },
    { day: 12, action: "Have a conversation today where you listen more than you speak." },
    { day: 13, action: "Write down what you are no longer available for. Keep it." },
    { day: 14, action: "Do something today that costs you comfort but costs you nothing else." },
    { day: 15, action: "Reach out to someone you've been meaning to reconnect with." },
    { day: 16, action: "Remove one thing from your environment that doesn't belong in her life." },
    { day: 17, action: "Set a boundary today — out loud, to an actual person." },
    { day: 18, action: "Create something today. Anything. Don't share it." },
    { day: 19, action: "Read or watch something that makes you think, not just feel." },
    { day: 20, action: "Write a letter to yourself from her — what does she want you to know right now?" },
    { day: 21, action: "Look at the last 21 days and write one true sentence about who you became in them." },
  ],
};

const MOCK_REFLECTION = `Twenty-one days is long enough to see through performance. The first week you showed up with intention — the actions felt deliberate, even exciting. By the second week, the resistance started: the days where you marked nothing, where the challenge met something in your life that didn't want to move. That friction is the data. That's where the actual work is.

What emerged clearly was that you don't struggle with knowing what she would do. You know. The gap is in the moment of choice — when the easier version is right there, and the portrait version requires something extra. The challenge didn't solve that. It just made it visible, which is the first step.

Twenty-one days closer. Not finished — just more honest about the distance.`;

export async function POST(req: NextRequest) {
  try {
    const { mode, portrait, duration, days, completedDays, pronouns = "they" } = await req.json();

    if (!mode || !portrait) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      await new Promise((r) => setTimeout(r, 1200));
      if (mode === "generate") {
        return NextResponse.json(duration === 21 ? MOCK_CHALLENGE_21 : MOCK_CHALLENGE_7);
      }
      let reflection = MOCK_REFLECTION;
      if (pronouns === "he") {
        reflection = reflection.replace(/\bshe\b/g, "he").replace(/\bher\b/g, "his").replace(/\bShe\b/g, "He");
      } else if (pronouns === "they") {
        reflection = reflection.replace(/\bshe\b/g, "they").replace(/\bher\b/g, "their").replace(/\bShe\b/g, "They");
      }
      return NextResponse.json({ reflection });
    }

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic();
    const pronounLabel = pronouns === "he" ? "His" : pronouns === "they" ? "Their" : "Her";

    if (mode === "generate") {
      const system = GENERATE_SYSTEM.replace(/\{DURATION\}/g, String(duration));
      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: duration === 21 ? 1200 : 600,
        system,
        messages: [{ role: "user", content: `${pronounLabel} identity portrait:\n${portrait}` }],
      });
      const text = response.content[0].type === "text" ? response.content[0].text : "{}";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return NextResponse.json({ error: "Parse error" }, { status: 500 });
      return NextResponse.json(JSON.parse(jsonMatch[0]));
    }

    // reflection mode
    const system = REFLECTION_SYSTEM.replace(/\{DURATION\}/g, String(duration));
    const completedList = (days as { day: number; action: string }[])
      .map((d) => `Day ${d.day} (${(completedDays as number[]).includes(d.day) ? "done" : "skipped"}): ${d.action}`)
      .join("\n");

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system,
      messages: [{
        role: "user",
        content: `${pronounLabel} portrait:\n${portrait}\n\nChallenge actions:\n${completedList}`,
      }],
    });

    const reflection = response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ reflection });
  } catch (error) {
    console.error("Identity challenge error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
