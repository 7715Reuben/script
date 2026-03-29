# Script — CLAUDE.md

> This file is the single source of truth for how this app is built.
> Read it in full before every session. Do not deviate from it without asking.

---

## What Script Is

Script is a daily identity and manifestation app for young women who are actively working on becoming the best version of themselves.

The core mechanic is **scripting** — a manifestation practice already popular in this community where you write your future life as if it has already happened. Script is the intelligent, AI-powered version of that practice. It helps users define who they are becoming, holds that vision for them, checks in daily, and reflects their growth back to them over time.

This is not a productivity app. It is not a habit tracker. It is not a journalling app.

It is the place you go to remember who you are becoming — and to be held accountable to that person every single day.

---

## The Audience

Understanding this audience is as important as the code.

**Primary user:** Women aged 17–28. Active on TikTok and Instagram. Deeply interested in self-improvement, manifestation, and personal identity. Familiar with concepts like:
- Scripting and the law of attraction
- Red string theory
- The 369 method
- "That girl" culture
- "Main character" energy
- Vision boards and future self journalling
- "Her" — the aspirational future version of themselves

They are not looking for a productivity system. They are looking for something that *feels like it works*. They want to feel seen, understood, and gently guided. They want the app to speak their language, not corporate wellness language.

They will open this app the way they open a journal — with intention and a degree of emotional investment.

**How they talk:**
- "I'm manifesting this."
- "I've been scripting her into existence."
- "She's so that girl."
- "I'm in my [era]."
- "This is so aligned."
- "The universe is responding."

The app should feel fluent in this language without being cringey or forced about it.

---

## Brand Voice and Tone

**Personality:** Wise best friend. Not a life coach. Not a therapist. Not a productivity system. The friend who believes in you completely, speaks to you like the person you're becoming rather than the person you currently are, and occasionally says the thing you needed to hear but weren't saying to yourself.

**Tone attributes:**
- Warm, intimate, and personal
- Quietly confident — never hype-y or over-excited
- Gently challenging — it will name gaps without being harsh
- Aspirational without being toxic positivity
- Poetic where appropriate — language matters in this app

**Tone to avoid:**
- Corporate wellness speak ("optimise your mindset")
- Overly clinical ("based on your input data")
- Condescending ("great job!")
- Generic motivational poster energy ("you've got this!")
- ChatGPT-ish neutrality — Script has a distinct voice

**Example of wrong tone:**
> "You have logged 3 check-ins this week. Great work! Keep it up to reach your goals."

**Example of right tone:**
> "Three days this week you showed up for her. That's not nothing — that's a pattern starting to form."

---

## The Core Product — V1

Build only what is listed here. Do not add features not listed. Do not suggest additions mid-build without asking.

### 1. Onboarding — The Script

The entry experience is a single, open canvas with one prompt. No form fields. No categories. No dropdowns.

**The prompt:**
> *"Close your eyes for a moment. It's three years from now and everything worked. Describe her — the person you became. Not what she achieved. Who she is."*

The user writes freely. Stream of consciousness. No character limit.

When submitted, the AI processes this and generates an **Identity Portrait** — a structured, beautiful reflection of who they described. Not a list of goals. A portrait of a person. Written in second person, present tense, as if this person already exists.

**Example Identity Portrait output (abbreviated):**
> *"She wakes up with intention. Her mornings are hers — unhurried, grounded, beginning before anyone else needs anything from her. She has built something she is genuinely proud of, not because of what it earns but because of what it required her to become. The people in her life are there on purpose. She chose them and they chose her back. She moves through the world with the kind of quiet confidence that doesn't need to announce itself."*

The user can edit this portrait, add to it, and confirm it. This portrait is the north star of the entire app. It lives on the home screen. It never disappears.

### 2. Home Screen — The Portrait

The home screen is the portrait, always visible. Clean, beautiful, typographically considered. The text should feel like something worth reading every morning.

Below the portrait: today's check-in prompt if unanswered, or a reflection on the last check-in if already answered.

No dashboard. No stats on the home screen. Just the portrait and the daily moment.

### 3. Daily Check-ins

Two check-ins per day. Short. Frictionless. Should take under two minutes.

**Morning (intention):**
> *"What is one thing you'll do today that she would do?"*

Free text response. AI acknowledges it briefly and warmly — one or two sentences max.

**Evening (reflection):**
> *"Did you show up as her today? What got in the way?"*

Free text response. AI responds with a reflection — acknowledging what they did, naming the gap if there was one, and connecting it back to something specific in their portrait. This is where the voice of the app matters most.

### 4. Weekly Reflection

Every Sunday evening, the app generates a weekly reflection automatically based on the seven days of check-ins.

This is not a stats summary. It is a written reflection in the app's voice — patterns noticed, consistent gaps named, moments of alignment celebrated. Two to three paragraphs. Intimate and specific.

**That is the complete V1 scope. Nothing else.**

---

## What Has Been Built

V1 is complete. Beyond the original spec, the following have also been built:

- **Commitments** — up to 5 personal commitments (ways of being, not tasks). Shown on the home screen. Evening AI check-in directly names missed commitments without softening.
- **Journal** — free-write daily journal with auto-save. Past entries browsable inline. Lives at `/journal`.
- **Monthly Retrospective** — AI-generated monthly reflection synthesising check-ins, journal entries, and commitments. Gated at 5 check-ins. Lives at `/retrospective`.
- **Pronoun system** — she/her · they/them · he/him. Defaults to they/them. Settable post-onboarding on the home screen.
- **Name field** — captured at portrait confirmation, gates the continue button.
- **Sign out** — bottom of home screen.

---

## Monetisation Model

**Free tier:**
- Identity portrait (one pass, onboarding)
- 2 daily check-ins
- Commitments
- Journal (last 30 days visible)
- Monthly retrospective

**Premium (~£7.99/month · £49.99/year):**
- Portrait Sessions (guided AI deep-dives that enrich the portrait over time)
- Portrait Evolution (portrait becomes a living document; see how it has changed)
- AI Conversation (full ongoing conversation with an AI that knows your portrait, check-ins, and journal)
- Scripting Sessions (free-write as your future self; AI reflects back what it noticed)
- Identity Challenges (7 or 21-day micro-challenges generated from your specific portrait)
- Full journal and reflection archive (beyond 30 days)

**Growth / acquisition (always free):**
- Anonymous Portrait Feed — opt-in public portraits, no names, no photos. Shareable to Stories. This is the organic growth engine.

---

## The Roadmap

Build in this order. Do not skip ahead. Each feature builds on the last.

### Next — AI Conversation (Premium)

A dedicated conversation screen where the user can talk freely with an AI that has read everything: their portrait, their check-ins, their journal, their commitments. Not a chatbot. A trusted presence that knows them.

- Lives at `/conversation`
- Conversation history persisted in Supabase (`conversations` table: `id, user_id, role, content, created_at`)
- Context window built fresh each request: portrait + last 7 days of check-ins + last 3 journal entries + commitments
- AI never summarises or lists — it speaks in the app's voice
- Premium-gated: free users see a locked state with one example exchange

### After — Portrait Sessions + Portrait Evolution

Guided deep-dive conversations that add specificity to the portrait: her relationships, her mornings, her body, her work, her voice. Each session produces a portrait "layer" that gets appended to or woven into the existing portrait.

Portrait Evolution: store portrait versions with timestamps. Show a before/after comparison — "this is where you started, this is where you are now." The portrait is not static; it grows as the user grows.

- `portrait_versions` table: `id, user_id, content, created_at`
- Current portrait is always the latest version
- A "Your portrait has evolved" moment — ceremonial, warm, significant

### After — Scripting Sessions (Premium)

A separate writing mode. The user writes in first person, present tense, as their future self. Stream of consciousness. No prompts. Just space.

When they submit, the AI reads it and responds with:
1. What felt genuinely true — the parts that sounded like real belief
2. What felt like performance — the parts that sounded like wishful thinking
3. One thing it noticed they haven't put in their portrait yet

This feeds back into Portrait Evolution.

### After — Identity Challenges (Premium)

7 or 21-day micro-challenges generated from the user's specific portrait. Not generic. Tied to who they said they were becoming.

- AI generates a challenge set on request
- One action per day, surfaced on the home screen alongside the check-in
- At the end, a short reflection on what the challenge revealed
- Repeatable — new challenge generated each time

### After — Anonymous Portrait Feed (Free — Growth Engine)

Opt-in. Users can make their portrait public. No names, no photos, no follows. Just the writing.

- A browsable feed of other people's portraits
- Filterable by vibe/theme (AI-tagged on generation)
- Shareable as a Story card (portrait text on brand background)
- This is the primary acquisition channel — something you'd screenshot and send

### Later — Vision Board (V2)

AI-generated visual imagery based on the portrait. Updated as the portrait evolves. Shareable to Instagram and TikTok Stories.

### Later — Soundtrack (V3)

A playlist that sounds like the person they're becoming. Integrated with Spotify or Apple Music.

### Later — Full Community Layer (V4)

Shared scripting sessions. A credibility layer showing consistency over time. Replies and encouragement on public portraits.

---

## Design Principles

These are non-negotiable for every screen.

**Mobile-first, always.** Every single decision is made for a phone screen first.

**Calm and intentional.** This app should feel like a deep breath. No notifications anxiety. No red badges. No urgency patterns. If a screen feels busy, strip it back.

**Typography is the design.** The portrait, the check-in responses, the reflections — these are beautifully typeset text. Invest in how it reads. Font choice, line height, spacing, and contrast are the primary design elements.

**Cursive as accent, not default.** A cursive or script typeface is used sparingly — to emphasise a single word or short phrase within an otherwise clean sans-serif or serif context. Think the way Hinge uses it: one word in a heading, a key phrase in the portrait, the name of a section. Never full paragraphs in cursive. The contrast between the clean type and the script is the effect.

**Light default, dark mode available.** The base palette is light — warm bone white (not pure white, not cream — bone: `#F5F0EB` or close) with near-black text. Dark mode inverts to a warm dark tone, not harsh black. The app should feel equally considered in both modes. Respect the system preference but allow manual toggle.

**The palette breathes with the moment.** Certain key events trigger a temporary, graceful shift in the colour palette — not a jarring change, a transition. These moments are:
- **Portrait generation** — a warm amber/gold wash while the portrait is being created. The moment of becoming.
- **Morning check-in submitted** — a brief soft rose or blush shift. The start of the day acknowledged.
- **Evening reflection submitted** — a shift to muted indigo or slate. Quieter, more introspective.
- **Weekly reflection arriving** — a slow, ceremonial reveal with a warm tone before returning to base. This is a significant moment.
The palette should return to base within seconds or on the next user interaction. These shifts should feel like the app is responding emotionally, not like a notification or a reward.

**No gamification.** No streaks with fire emojis. No XP. No badges. Gentle, subtle indicators of consistency that don't cheapen the experience.

**Whitespace is intentional.** Resist the urge to fill screens. Empty space makes the words feel important.

**The portrait is always one tap away.** No matter where the user is in the app, their portrait should be reachable immediately.

---

## Aesthetic Reference Points

Use these as visual and tonal references, not copies:

- **Hinge** — the specific use of cursive as typographic accent within a clean black-and-white system. The restraint. Not the dating app context, just that visual language.
- **Locket** — intimacy, something you return to daily
- **Day One** — journalling quality, beautiful typography
- **Notion** — clean, considered, typographically confident
- **Are.na** — editorial, intentional, not trying to be everything

The feeling to aim for: a beautifully designed notebook that happens to be intelligent. Clean enough to feel elevated. Warm enough to feel personal.

---

## Tech Stack

Choose a beginner-friendly stack that:
- Can be deployed publicly within a single session
- Has minimal infrastructure overhead
- Can accommodate AI API calls (Anthropic)
- Can store user data and daily check-ins
- Has strong mobile browser experience (PWA acceptable for V1)

Recommend what makes sense. Explain the reasoning. Confirm before starting.

Preferred deployment: something with a free tier for launch (Vercel, Railway, Supabase).

---

## AI Integration

All AI calls use the Anthropic API (Claude).

**Three AI moments in V1:**

1. **Portrait generation** — on onboarding, converts the user's free-write into a structured identity portrait. This should be the highest quality output in the app. Take the time to get the prompt right.

2. **Check-in response** — acknowledges morning intentions and responds to evening reflections. Short, warm, specific. Must reference something from the portrait to feel personal.

3. **Weekly reflection** — synthesises seven days of check-ins into a personal written reflection. Should feel like it was written by someone who knows them.

**Prompt quality is everything.** The AI outputs are the product. Spend time on the system prompts. They should encode the brand voice completely. A poorly prompted response will feel generic and break the experience immediately.

---

## What Not To Do

- Do not add any feature not listed in the roadmap above without asking
- Do not use corporate wellness language anywhere in the UI
- Do not gamify the experience with streaks, points, or achievement badges
- Do not build a dashboard with charts and metrics for V1
- Do not make the onboarding more than one screen
- Do not install packages not needed for the listed V1 features
- Do not modify confirmed, working features without being asked
- Do not use generic placeholder copy — every word in the UI should be on-brand

---

## Session Protocol

At the start of every new session:
1. Read this file in full
2. State what was completed in the last session
3. State what you plan to build in this session
4. Ask any clarifying questions before writing code
5. Confirm the plan before proceeding

At the end of every session:
1. Summarise exactly what was built
2. Note anything incomplete or requiring follow-up
3. Suggest what the next session should tackle

---

*Last updated: March 2026 — V1 complete, building premium features*
