# Virnix Gold Dataset Findings

**Date:** 2026-05-19
**Generations:** 12 (across 10 unique creators, 2 Ali Abdaal videos)
**Model:** claude-sonnet-4-6
**Average elapsed:** ~27,000ms
**Average cost:** ~$0.04–0.05 per generation

---

## Dataset Overview

| Creator | Video | Score | Category | Verdict |
|---------|-------|-------|----------|---------|
| Steven Bartlett | Diary of CEO — prep disaster | **90** | Storytelling/founder | GOLD STANDARD |
| Naval Ravikant | Joe Rogan #1309 | **80** | Philosophy/mechanism | GOLD |
| Iman Gadzhi | Dream Life 2025 | 55 | Creator economy | STRONG |
| Alex Hormozi | Business frameworks | 50 | Founder/frameworks | STRONG |
| Ali Abdaal | Procrastination science | 45 | Educational | GOOD |
| Andrew Huberman | Fears & traumas | 45 | Science/mechanism | GOOD |
| Simon Sinek | Golden Circle TEDx | 45 | Framework lecture | AVERAGE |
| Dan Koe | Get ahead 99% | 30* | Philosophy/self-improvement | GOOD (underscored) |
| Ali Abdaal | Passive income | 30* | Educational/data | GOOD (underscored) |
| My First Million | Sam Parr / Hampton | 30* | Founder storytelling | GOOD (underscored) |
| Gary Vee | USC Talk 2019 | 25 | Motivation/hustle | WEAK FIT |
| Jordan Peterson | Self-improvement | 20* | Philosophy | GOOD (severely underscored) |

*Score does not reflect actual output quality — see scorer calibration section.

---

## Finding 1: Story + Specific Detail = Highest Virality

The two highest-scoring outputs in the dataset share one structure: a single specific story with an embarrassing or vulnerable detail.

**Bartlett (90):** "Spent 5 hours on the wrong guest. Walked in. Didn't know the name. Asked him to spell it. Got 'K.'"

**Naval (80):** "Your inbox never empties. Not email. Your mind. Every unresolved moment from the last 30 years is still in there."

Both contain:
1. A single anchoring story (Bartlett's prep disaster) or a single metaphor breakthrough (Naval's inbox zero)
2. A specific concrete detail that proves it's real ("Got 'K'", "30 years")
3. A counter-intuitive outcome (worst-prepared episode = most downloaded; clearing mind = reading emails)

**Implication:** The strongest Virnix input is a transcript with ONE specific story that has a clear before/after. Multiple frameworks or advice-loops dilute output quality.

---

## Finding 2: The Virality Scorer Has a Philosophical Content Blind Spot

The heuristic `estimateViralityScore()` significantly underrates content that is:
- Philosophical or framework-driven without confessional vocabulary
- High-quality but delivered by a narrator, not a protagonist
- Abstract mechanism explanations without standard emotional keywords

**Evidence:**

| Creator | viralityScore | Actual Output Quality | Gap |
|---------|--------------|----------------------|-----|
| Jordan Peterson | 20 | 31/45 (post-ready) | SEVERE |
| Dan Koe | 30 | 32/45 (post-ready) | HIGH |
| Ali Abdaal (passive income) | 30 | 33/45 (post-ready) | HIGH |
| MFM / Sam Parr | 30 | 35/45 (post-ready) | HIGH |

**Root cause:** The scorer rewards EMOTIONAL_WORDS (fear, death, shame, broken) and confession patterns. Philosophical content uses mechanism vocabulary (anti-vision, extinguish, trust, order) which the scorer doesn't reward. A Peterson "clean your room" transcript produces stronger practical output than a Gary Vee hype session, yet scores 5 points lower.

**What this means for users:** viralityScore is a relative ranking tool (choosing between tiktok vs. tiktok_alt), not an absolute quality judge. The score cannot be trusted for cross-creator comparison.

**Recommended fix:** Add mechanism-reframe vocabulary to EMOTIONAL_WORDS or create a separate `hasMechanismReframe()` scorer that rewards framework inversions.

---

## Finding 3: Gary Vee Is a Definitively Weak Input Class

This is the clearest falsifiable finding in the dataset.

Motivation-adjacent content (hustle, mindset, work harder, believe in yourself) cannot be rescued by prompt engineering. The input determines the output ceiling.

Gary Vee's transcript generated:
- TikTok: 2/5 — advice-as-performance, no mechanism
- Twitter: 2/5 — generic regret framing
- Only one strong line in the entire generation: "Your parents' money is a cage. It just has nicer walls."

**The pattern:** High-energy delivery + low-substance content = competent but forgettable output. The AI reproduces the energy without the insight because there's no insight to extract.

**Creator types to avoid targeting:**
- Motivational speakers (Gary Vee, Tony Robbins, Grant Cardone)
- Reaction/commentary channels
- Entertainment and gaming
- News/current events

---

## Finding 4: "Everyone's Doing This Backwards" Opener Is Overdistributed

The hook fired in **5 of 12 generations (42%)**.

Affected outputs: Bartlett, Ali Abdaal passive income, MFM, Peterson, Huberman.

This is the most urgent prompt engineering fix identified. A creator's content feed would show the same opening line multiple times per week, destroying pattern freshness.

**Current TIKTOK_OPENING_LINES pool:**
- "Everyone's doing this backwards." (fired 5/12)
- "Nobody teaches you this part until it's already cost you." (fired 2/12 — Gadzhi, Naval)
- "Here's the part they always skip:" (fired 2/12 — Dan Koe, Gary Vee)
- "The data says something completely different." (fired 2/12 — Sinek, Ali Abdaal procrastination)
- "Nobody talks about this —" (fired 1/12 — Hormozi)

**Fix:** Expand the opener pool from 5 to 12–15 openers and add a deduplication check across recent generations for the same user.

---

## Finding 5: LinkedIn Consistently Produces the Strongest Individual Lines

In 4 of 12 generations, the LinkedIn opening line was the strongest output across all platforms:

- **Huberman:** "Therapists don't just help you forget trauma — they make you retell it until it loses its charge."
- **MFM:** "He did 70 sales meetings. Every single person said no."
- **Ali Abdaal passive income:** "A website about tree removal in Michigan has paid $2,000/month since 2015."
- **Peterson:** "The worst advice I ever followed: start with your five-year vision."

**Why:** LinkedIn's format rewards single-sentence openers that function as standalone thesis statements. The format constraint forces Virnix to distill the transcript to its single most provocative claim — and it does this well.

**Implication:** LinkedIn is Virnix's most consistently high-quality output format. If a user only posts on one platform, LinkedIn should be the recommendation.

---

## Finding 6: Three Psychological Mechanisms Dominate High-Scoring Outputs

Across all 12 generations, the highest-performing outputs use one of three mechanisms:

**1. Mechanism Reframe** (Naval, Huberman, Dan Koe, Peterson)
> Reframes a concept the reader thinks they understand into something they've never considered.
> "Meditation isn't clearing your mind. It's reading the emails you've been ignoring since childhood."
> "You can't erase a fear. You have to extinguish it — then replace it."

**2. Confession + Specific Detail** (Bartlett, MFM)
> A real failure with a detail specific enough to prove it happened.
> "Spent 5 hours on the wrong guest. Got 'K.'"
> "He did 70 sales meetings. Every single person said no."

**3. Data Contrast** (Ali Abdaal, Gadzhi, Hormozi)
> A specific number that reframes the reader's assumption about scale or effort.
> "$12,000 in the S&P 500 for $100/month. Or one local lead gen site."
> "People need 7 hours of your content before they spend a dollar. Not followers. Hours."

**All three mechanisms are already in the prompt architecture.** The gold dataset confirms they're working. No new mechanisms are needed — the existing system needs better input (story-rich transcripts) more than better prompts.

---

## Finding 7: Known Framework Content Has Diminishing Returns

Simon Sinek (Golden Circle) produced the weakest output among non-Gary Vee creators despite having a clear framework, specific examples, and decent emotional stakes.

**Reason:** The "Start With Why" framework is public knowledge. Virnix can only extract novelty that's present in the source. When the source is teaching a framework the world already knows, the output feels derivative even when technically well-constructed.

**Pattern:** The more famous the original source, the less novel the Virnix output.

**Affected content types:**
- TEDx talks presenting known frameworks
- Books being explained on podcasts
- Well-known business/philosophy concepts being recycled

**Strong content types:**
- Personal failure stories with specific detail (Bartlett, MFM)
- Counter-intuitive metaphors the creator coined themselves (Naval)
- Research findings the creator discovered and is applying (Huberman, Gadzhi)

---

## Creator Fit Tiers — Validated

### Tier 1 — Ideal Input (score ceiling 75–95)
- Specific personal failure stories with before/after arc
- Counter-intuitive metaphors the creator invented
- Interview confessions with embarrassing specificity
- **Examples:** Bartlett (90), Naval (80)

### Tier 2 — Strong Input (score ceiling 45–65)
- Research-backed mechanism explanations
- Framework content with specific named examples
- Creator economy / business operations with named metrics
- **Examples:** Gadzhi (55), Hormozi (50), Huberman (45), Ali Abdaal (45)

### Tier 3 — Usable Input (score ceiling 30–45, often underscored)
- Philosophical frameworks without personal story
- Educational content with high data-density but no confession arc
- Founder storytelling where narrator is not the protagonist
- **Examples:** Dan Koe (30), Peterson (20), MFM (30), Ali Abdaal passive income (30)

### Avoid — Weak Input (score ceiling 20–30)
- Pure motivation/hustle content
- Generic success mindset lectures
- High-energy delivery with low-substance insights
- **Examples:** Gary Vee (25)

---

## The Two Best Outputs in the Dataset

### 1. Bartlett TikTok (score 90)
```
Everyone's doing this backwards.
You prep for hours.
Think that's what makes a great interview.
Steven Bartlett spent 5 hours on the wrong guest.
Walked in. Didn't know the name.
Asked him to spell it.
Got 'K.'
That episode became one of his most downloaded ever.
Because he stopped leading. Started following.
Most people have never had someone actually listen for 10 minutes straight.
That's the whole technique.
Here's the exact system...
```
**Why it's the gold standard:** Confession + specific detail + counter-intuitive outcome + self-reflection trigger + platform-perfect pacing.

### 2. Naval TikTok (score 80)
```
Nobody teaches you this part until it's already cost you.
Your inbox never empties.
Not email. Your mind.
Every unresolved moment from the last 30 years is still in there.
Waiting.
Meditation isn't clearing your mind.
It's finally reading the emails you've been ignoring since childhood.
One by one.
Until there's nothing left from before yesterday.
That's inbox zero.
That's when peace actually starts.
Here's the exact system...
```
**Why it works:** The inbox zero metaphor converts an abstract concept (meditation) into something concrete. The "Not email. Your mind." pivot is the mechanism reveal — a two-word sentence that does the work of a paragraph.

---

## Immediate Actionable Recommendations

### Priority 1 — Expand the TikTok opener pool
**Problem:** 5 of the 6 available openers each fired in multiple generations. "Everyone's doing this backwards" appeared 5 times in 12 runs.
**Fix:** Add 8–10 new openers to `app/lib/prompts/platforms/tiktok.ts`. Suggested additions:
- "Nobody told me this until I lost [thing]."
- "I got this completely wrong for [N] years."
- "Most people will never know this because it only shows up after [threshold]."
- "This doesn't sound like much until you do the math."
- "I watched [person] do [thing] and it broke my entire model of [concept]."

### Priority 2 — Fix scorer calibration for philosophical content
**Problem:** viralityScore underrates mechanism-reframe content by 10–30 points.
**Fix:** Add `hasMechanismReframe()` to `app/lib/intelligence/quality.ts`. Signal words: "instead", "actually", "not X but Y", "reframe", "misunderstood", "real reason", "what's actually happening".

### Priority 3 — Improve transcript input guidance for users
**Problem:** Users may paste Gary Vee transcripts expecting great output. Input quality determines output ceiling.
**Fix:** Add a transcript quality hint in the UI: "Best results from personal stories with specific details, research findings, or confession moments."

### Priority 4 — Target creator content for user acquisition
Based on the dataset, Virnix's strongest marketing content should target:
- Podcast hosts / interviewers (Bartlett is the gold case)
- Solo founders with failure stories
- Science communicators (Huberman model)
- Philosophy/self-improvement creators (Naval, Dan Koe)

---

## What NOT to Change

1. **The core prompt architecture** — it's working. Bartlett and Naval prove the system extracts the right content from high-quality inputs.
2. **The LinkedIn format** — consistently strong across all creator types. No changes needed.
3. **The mechanism-reframe patterns** — Naval and Huberman prove these are being captured correctly.
4. **The confession/specificity detection** — Bartlett's "Got 'K'" detail proves the system finds and amplifies transcript-specific moments.

---

## Summary

Virnix works best when the input has a confession or mechanism breakthrough moment. The model can't create insight that isn't in the transcript — it can only surface and amplify it. The current architecture does this well.

The three most actionable improvements are: expand the opener pool, add mechanism-reframe scoring, and educate users on input quality. None of these require architectural changes.

The taste moat is real: Bartlett and Naval outputs are post-ready without edits. The system knows what good looks like. It needs better raw material and slightly more opener variety.
