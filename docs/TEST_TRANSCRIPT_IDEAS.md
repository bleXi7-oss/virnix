# Virnix Test Transcript Ideas

Curated list of transcripts to test, organized by testing purpose.
Use this to build the gold dataset across diverse creator types, emotional styles, and content formats.

---

## Priority 1 — Known Strong Performers (Test These First)

These creator types are Tier 1 by segment analysis. Expect high-quality outputs.

| Creator | Content Type | Why Test | Expected Strength |
|---------|-------------|----------|-------------------|
| Dan Koe | Philosophy / identity | Already confirmed "holy shit" output | TikTok, Twitter, LinkedIn |
| Alex Hormozi | Founder / business | High specificity + confession format | Twitter, LinkedIn, YouTube |
| Codie Sanchez | Contrarian business | Withheld knowledge patterns native | TikTok, Twitter |
| Naval Ravikant | Philosophy / aphoristic | Mechanism reframe density is extreme | Twitter, LinkedIn |
| Paul Graham | Founder / essays (read aloud) | Identity tension + paradox density | Twitter, Blog |
| Mark Manson | Counter-intuitive self-improvement | Strong anti-motivation = Virnix's native language | TikTok, Instagram |
| Sahil Bloom | Business frameworks | Clear before/after structures | LinkedIn, Twitter |

**Selection tip:** For each creator, find a 3–10 minute segment where they make ONE core claim and defend it with a personal story or specific mechanism. Avoid multi-topic overviews.

---

## Priority 2 — High-Diversity Test Set

These cover different emotional styles and content formats. Use to stress-test Virnix's range.

| Creator | Content Type | Testing Purpose | Expected Challenge |
|---------|-------------|----------------|-------------------|
| Mel Robbins | Self-improvement / science-backed | Identity tension + validation hooks | Risk: may trigger affirmation patterns |
| Andrew Huberman | Neuroscience educational | Specificity + mechanism language | Risk: academic tone if wrong segment |
| Steven Bartlett | Transformation storytelling | Story arc + personal stakes | Risk: incomplete arc in chunk |
| Lex Fridman (solo) | Philosophical commentary | Emotional depth + identity | Risk: too abstract without personal stake |
| Ali Abdaal | Productivity frameworks | Data density + personal testing | Risk: can trend generic |
| My First Million pod | Founder conversation | High energy + specific numbers | Risk: multi-speaker chunking |

---

## Priority 3 — "Danger" Transcripts (Stress Tests)

Use these to find where Virnix fails. Document failures in `docs/gold-tests/results/`.

| Type | Example Source | Why It's Dangerous |
|------|--------------|-------------------|
| Pure opinion exchange | Any podcast interview | Multi-speaker, no thesis, low chunk density |
| Motivational hype | Gary Vee keynote clips | Input is already generic — output will be too |
| Technical explainer | SaaS tutorial, coding content | Zero emotional stakes, no creator voice |
| Therapy/healing content | Mental health podcasts | Loss framing and urgency = harmful here |
| Comedy commentary | YouTube commentary videos | Humor doesn't survive transcript extraction |
| Breaking news reaction | News pods | Time-sensitive, no evergreen insight |
| Academic lecture | University recordings | Hedging language, passive voice, no personal stake |

**What to document when running danger transcripts:**
- Does the output degrade gracefully (generic but harmless) or actively fail (wrong tone for the content)?
- Does the smart segment selector help or make it worse?
- What failure patterns from `FAILURE_PATTERNS.md` appear?

---

## Priority 4 — Creator Niche Coverage

One representative from each major content niche to ensure platform-wide coverage.

| Niche | Creator to Test | Primary Platform |
|-------|----------------|-----------------|
| Finance / wealth | Graham Stephan or Andrei Jikh | YouTube |
| Relationships / dating | Matthew Hussey | Instagram, TikTok |
| Health / biohacking | Andrew Huberman or Rhonda Patrick | YouTube, LinkedIn |
| Career / productivity | Ali Abdaal or Tiago Forte | YouTube, LinkedIn |
| Creator economy / build in public | Justin Welsh or Dickie Bush | Twitter, LinkedIn |
| Spiritual / mindset | Jay Shetty | Instagram, YouTube |
| Entrepreneurship | Shaan Puri or Steph Smith | Twitter, podcast |
| Investing | Morgan Housel (Psychology of Money style) | Twitter, blog |

---

## Curated "Dream Tests" — Maximum Virnix Showcase

These are the transcripts most likely to produce outputs good enough to be Virnix marketing collateral.

### Dream Test 1 — Dan Koe (already tested)
- Topic: Identity memes and belief systems
- Output quality: Confirmed "holy shit" tier
- Save for: testimonial reference, marketing demo

### Dream Test 2 — Alex Hormozi, "$100M Offers" excerpt
- Find a 5-minute segment where he explains why most offers fail
- Expected: Extremely specific TikTok ("47% of...", "3x revenue"), strong confession format Twitter
- Risk: Some output may try to replicate "100M" specificity not present in the transcript

### Dream Test 3 — Naval Ravikant on leverage
- Any segment from the Naval Almanack or his How to Get Rich podcast
- Expected: Dense aphorism format → exceptional Twitter thread, strong LinkedIn
- Risk: Abstract enough to miss specificity scoring despite strong output

### Dream Test 4 — Mark Manson, counter-intuitive self-improvement
- Find a "The Subtle Art" era recording where he explicitly challenges common advice
- Expected: Anti-motivation voice is Virnix's native language → strongest possible TikTok
- Risk: May include profanity that needs manual review

### Dream Test 5 — Codie Sanchez on "boring businesses"
- Any segment where she explains why unsexy businesses outperform exciting ones
- Expected: Withheld knowledge pattern fires naturally, loss framing throughout
- Risk: May skew finance/business-heavy, Instagram may underperform

---

## Difficult Transcript Types — Log Findings Here

| Transcript type | Date tested | Result | Key failure | Logged in |
|----------------|------------|--------|-------------|-----------|
| (fill as you test) | | | | |

---

## Test Prioritization Matrix

When picking a new transcript to test, score it:

| Factor | 1 point | 2 points | 3 points |
|--------|---------|----------|----------|
| Creator tier | Tier 3 | Tier 2 | Tier 1 |
| Personal stake in transcript | None | Implied | Explicit |
| Specific numbers/data | None | Some | Several |
| Single clear thesis | None | Partial | Yes |
| Emotional charge | Low | Medium | High |
| New niche (not yet tested) | No | — | Yes |

**Score 15+** → Priority test
**Score 10–14** → Normal test
**Score below 10** → Use only for failure/stress testing

---

## Transcript Length Guidance

| Length | Recommendation |
|--------|---------------|
| < 300 words | Use as-is, will be treated as full context |
| 300–600 words | Optimal — full chunk used directly |
| 600–2000 words | Smart segment selector activates — quality depends on selector accuracy |
| 2000+ words | Manual pre-selection of best 500-word segment recommended |
| Full episode (1hr+) | Do not use without pre-selecting a key moment |
