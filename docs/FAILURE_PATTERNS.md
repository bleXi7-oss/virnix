# Virnix Failure Patterns

Recurring patterns that degrade output quality. Read this before a generation review.
If you see these patterns in output: flag for prompt engineering.

---

## Failure 1 — Fake Motivation / Empty Affirmation

**What it looks like:**
> "Believe in yourself."
> "You can do anything you put your mind to."
> "Stay positive and keep pushing."
> "Your journey is worth it."
> "Embrace the process."
> "You got this."

**Why it fails:**
- Zero information content — zero emotional stakes
- Reader has heard every one of these 10,000 times
- Signals AI generation immediately
- Produces zero share energy — nobody quotes this

**Root cause in prompts:** When the transcript has a spiritual/motivational angle, the model defaults to affirmation language if the TikTok section lacks specificity constraints.

**Fix already in place:** `ANTI_GENERIC_RULES` + anti-fake-motivation rule added in Phase 8.

**Red flag line to watch for:** Any output that could appear on a motivational poster without modification.

---

## Failure 2 — Corporate Sludge

**What it looks like:**
> "Leverage your unique skillset to unlock your potential."
> "In today's rapidly evolving landscape..."
> "It's important to note that..."
> "As we can see from this data..."
> "Actionable insights for sustainable growth."
> "Game-changing strategies for modern creators."

**Why it fails:**
- LinkedIn corporate-speak triggers immediate reader exit
- Trust destruction: readers associate this language with accounts they mute
- No emotional valence — neither positive nor negative, just gray noise

**Root cause:** Model trained on enormous amounts of corporate writing; without explicit anti-patterns, it defaults here when the transcript has a business/strategy tone.

**Fix already in place:** `ANTI_GENERIC_RULES` list + `CORPORATE_PHRASES` penalty in quality scorer.

**Detection:** If `hasHumanTone()` returns `false`, corporate sludge likely present.

---

## Failure 3 — Hook That Could Apply to Anything

**What it looks like:**
> "This changed everything for me."
> "Nobody talks about this."
> "This is the one thing that matters."
> "Here's what I wish I knew."
> "Stop doing what everyone else is doing."

Used without any transcript-specific detail — these are category templates, not hooks.

**Why it fails:**
- The reader's pattern-recognition instantly categorizes these as content-farm output
- No curiosity gap — there's nothing specific withheld
- If the hook could appear verbatim in 500 other videos, it has zero differentiation value

**Root cause:** Variation system picks an emotional angle but the model doesn't anchor the opening line to transcript-specific content.

**Fix already in place:** Phase 8 added "Name something specific from this transcript" directive to TikTok sections.

**Detection test:** Could this hook appear in a video about a completely unrelated topic? If yes: weak hook.

---

## Failure 4 — Pacing Collapse (Thread Fatigue)

**What it looks like:**
Twitter thread where tweets 4–7 are either:
- Summary restatements of tweets 1–3
- Increasingly weaker versions of the original insight
- Lists without tension ("Here are 5 more things...")
- Momentum-killing transitions ("So what does this mean?")

**Why it fails:**
- Twitter thread readers will drop off at the first tweet that doesn't earn the next
- Re-stating the opening insight is the most common form of thread death
- Lists without emotional stakes turn a thread into a blog post with line breaks

**Root cause:** Model generates the strong insight in tweet 1–2, then "fills" the remaining tweets to hit character targets.

**Detection:** Read tweets 4–7 in isolation. Do they stand alone? If tweet 5 requires the context of tweets 1–4 to make sense, pacing has collapsed.

---

## Failure 5 — Too-Polished AI Language

**What it looks like:**
Output that is technically correct, grammatically perfect, and emotionally inert.

> "In order to truly understand the dynamics at play, we must first examine..."
> "The key insight here is that while many believe X, the reality is Y."
> "What makes this particularly fascinating is the intersection of..."

**Why it fails:**
- Real creators speak in fragments, contractions, repetitions, and emotional shorthand
- Perfectly constructed sentences signal that no human wrote this
- The reader cannot identify the creator's voice — it sounds like a machine trained on a million blog posts

**Root cause:** Model defaults to well-formed prose when not constrained to creator-native patterns.

**Fix already in place:** "Write like a person, not a press release" in `ANTI_GENERIC_RULES`. Creator voice directive in `IDENTITY_BLOCK`.

**Detection:** Read aloud. Does it sound like something a person would actually say? Where does your voice naturally break or hesitate? Those breaks are where the AI got too smooth.

---

## Failure 6 — Vague Educational Language

**What it looks like:**
> "Studies show that consistent habits lead to long-term success."
> "Research suggests that mindset plays a crucial role."
> "Experts agree that the foundation is important."
> "There are many factors that contribute to this outcome."

**Why it fails:**
- "Studies show" without a study = trust without evidence
- Vague claim + vague solution = zero actionable value
- Educational content requires specificity to earn authority
- A creator can't share this — it makes them look uncredible

**Root cause:** When a transcript has scientific or research content, the model hedges rather than commits.

**Fix partially in place:** Specificity directive and `hasSpecificDetail()` scoring.

**Detection test:** Replace every claim with "according to no one in particular." If the meaning doesn't change, it's vague.

---

## Failure 7 — LinkedIn Corporate Sludge (Separate from #2)

**What it looks like:**
> "Excited to share my thoughts on..."
> "I'm grateful for the journey..."
> "What an incredible opportunity to..."
> "I've been reflecting on my growth..."
> "Honored to be part of..."
> Starting with "I" in a self-congratulatory way

**Why it fails:**
- LinkedIn already has too much of this — readers have developed immunity
- Passive, non-threatening language signals that the creator has nothing risky to say
- The reader scrolls looking for something that might be wrong or uncomfortable — this offers neither

**Root cause:** LinkedIn training data is dominated by professional-networking-safe content. Model defaults here without strong counter-direction.

**Fix already in place:** Phase 5 added founder/operator voice directive to `LINKEDIN_TONE`.

**Detection:** Does the opening make the creator sound like they want something from you (approval) vs. have something for you (insight)?

---

## Failure 8 — No Stakes / Low-Tension Opening

**What it looks like:**
> "Today we're talking about productivity."
> "In this video, I'm going to cover..."
> "Welcome back to another episode."
> "Let's start with the basics."
> "I've been thinking a lot about this topic lately."

**Why it fails:**
- No emotional stake = no reason to keep reading
- The reader doesn't know what they'll lose if they don't read
- No tension = no loop to close

**Root cause:** Model follows the transcript structure rather than extracting the emotional core.

**Detection:** If the first 10 words could be the intro to a webinar, there are no stakes.

---

## Failure 9 — Fake Authority Tone

**What it looks like:**
> "As someone who has helped hundreds of..."
> "With my X years of experience..."
> "I've worked with top companies including..."
> "This is what the data tells us..."
> "I can tell you from experience that..."

Used without any specific evidence in the surrounding text.

**Why it fails:**
- Claims authority without earning it in the text
- Readers detect when authority is asserted vs. demonstrated
- Earned authority: you know something happened because you describe what it felt like
- Asserted authority: you tell the reader to trust you before they have any reason to

**Root cause:** Transcripts from expert/business creators often contain authority language; the model imports it without the supporting story.

---

## Failure 10 — Repetitive Pacing

**What it looks like:**
Every sentence the same length. Every paragraph the same structure. Every section ends the same way.

> "This is important.
> This changes things.
> This matters.
> This is what they don't tell you.
> This is what you need to know."

**Why it fails:**
- Rhythm is a carry mechanism — when rhythm becomes predictable, the reader exits
- Identical cadence signals template-filling rather than thought
- Creator-native content has natural breaks, accelerations, and pauses

**Fix already in place:** `CLEANUP_RULES` includes "Contrast creates tension: one short punchy sentence. Then a longer one that earns it."

---

## Failure Pattern Severity Index

| Pattern | Severity | Frequency | Fix in Place |
|---------|----------|-----------|--------------|
| Fake motivation | Critical | Low (post-Phase 8) | ✅ ANTI_GENERIC_RULES |
| Corporate sludge | Critical | Medium | ✅ ANTI_GENERIC_RULES + quality penalty |
| Generic hook | High | Medium | ✅ Transcript-specific directive |
| Pacing collapse | High | Medium | Partial — CLEANUP_RULES helps |
| Too-polished AI | High | Medium | Partial — creator-voice directive |
| Vague educational | High | Low-medium | Partial — specificity directive |
| LinkedIn corporate | Medium | Low (post-Phase 5) | ✅ LINKEDIN_TONE |
| No stakes opening | Medium | Low | Partial |
| Fake authority | Low-medium | Low | Not explicitly addressed |
| Repetitive pacing | Low | Low | ✅ CLEANUP_RULES contrast rule |

---

## Quick Detection Checklist

Before marking an output as strong:

- [ ] Could the TikTok hook appear in a completely different niche? → Generic hook
- [ ] Does the LinkedIn post start with "I'm excited" or "I'm grateful"? → Corporate sludge
- [ ] Does the Twitter thread restate tweet 1 in tweets 4–7? → Pacing collapse
- [ ] Is there at least one specific number, name, or mechanism? → Specificity check
- [ ] Does any line say "believe in yourself" or equivalent? → Fake motivation
- [ ] Could this pass as AI-generated to a savvy reader? → Too-polished
- [ ] Does the opening sentence contain an emotional stake? → Stakes check
