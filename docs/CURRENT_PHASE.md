# Current Phase — Output Language Selection (LANG-A)

Phase started: 2026-05-21
Status: complete

---

## Previous phases (abbreviated)
- UI-POLISH-L (2026-05-21) — dark mode output readability, commit `3c32429` — complete
- CREDITS-A (2026-05-20) — server-side credit system, SQL must be run manually — complete
- SUPABASE-HEARTBEAT-A (2026-05-20) — complete
- AUTH-A (2026-05-20) — magic link auth, production verified — complete

---

## Context

LANG-A adds output language selection to Virnix. Users can choose which language to generate content in. Default is Auto (same as transcript). Language context is injected natively into the prompt — no external translation API.

**Prerequisite before BILLING-A**: Run `docs/credits/SQL.md` in Supabase if not yet done.

---

## What Changed

### New: `app/lib/languages/` module

- `types.ts` — `OutputLanguageId` union type, `OutputLanguage` interface
- `options.ts` — `OUTPUT_LANGUAGES` array (11 options, extensible), `isValidLanguageId()` allowlist guard, `getLanguageById()`
- `prompt-context.ts` — `formatLanguageContext(id)` — empty for "auto", native directive block for explicit selections

### New: `app/components/LanguageSelector.tsx`

Pill-based UI matching CreatorEnergySelector style. Label "Write in". Default: Auto. Shown below Direction controls when idle.

### Modified: `app/lib/types/generation.ts`

`GenerateRequest` now includes `outputLanguage?: OutputLanguageId`.

### Modified: `app/lib/prompts/index.ts`

`buildPrompt` and `buildAdvancedPrompt` accept optional `languageContext` parameter. Injected after `energyContext` in the GENERATION PROFILE block.

### Modified: `app/lib/ai/generate.ts`

`generate()` passes `req.outputLanguage ?? "auto"` to `realGenerate()`. `realGenerate()` calls `formatLanguageContext()` and injects into both `buildPrompt` and `buildAdvancedPrompt`.

### Modified: `app/api/generate/route.ts`

Validates `body.outputLanguage` against allowlist. Unknown values fall back to "auto". Passes validated value to both real-AI and mock `generate()` calls.

### Modified: `app/page.tsx`

- `selectedLanguage` state (default: "auto")
- `outputLanguage` included in generation fetch body
- `LanguageSelector` shown inside HeroCard when idle
- **CreditBadge repositioned to `absolute left-0`** — three-section top bar: credits (left) | logo (center) | auth+theme (right). Eliminates logo/badge collision.

### New: `docs/languages/README.md`

Language system documentation.

---

## Language Options

| ID | Label |
|----|-------|
| auto | Auto (same as transcript) |
| en | English |
| sl | Slovenian |
| hr | Croatian |
| sr-latn | Serbian Latin |
| bs | Bosnian |
| de | German |
| it | Italian |
| es | Spanish |
| fr | French |
| pt | Portuguese |

Future expansion (not active): Hindi, Mandarin, Arabic, Turkish, Polish, Dutch, Indonesian, Japanese, Korean.

---

## Prompt Behavior

**Auto**: No language instruction injected. Claude keeps transcript's natural language.

**Explicit selection**: Injects native directive:
- "Write all outputs natively in [language]."
- "Do not literally translate English viral hook formulas."
- "Use natural creator and social media phrasing for that language and region."
- Regional notes for Balkan languages (script, no-mix rules).
- Priority line: "Output language is mandatory and overrides all other stylistic instructions."

---

## Security / Validation

- Language must pass server-side allowlist check (`isValidLanguageId`)
- Unknown client values coerced to "auto" — never injected raw into prompts
- No new environment variables

---

## Credits Impact

Language selection = +0 credits. All credit rules unchanged.

---

## What Was NOT Changed

- Credits logic, Supabase, auth, billing: untouched
- Creator Energy behavior: untouched
- AI provider: untouched
- No external translation API
- No database persistence of language selection
- Mock mode: unaffected

---

## Validation

- Lint: ✅ clean
- Build: ✅ clean
- Mock mode: ✅ unaffected
- Allowlist: ✅ server-validated, unknown values → "auto"
- Prompt injection: ✅ language context injects into GENERATION PROFILE after energy context
- CreditBadge: ✅ repositioned to left, no logo collision

---

## Next Recommended Step

**BILLING-A — Billing provider evaluation and Pro subscription**

Prerequisites for BILLING-A:
1. Run `docs/credits/SQL.md` in Supabase (if not yet done)
2. Test end-to-end credits: sign in → generate → deduction → CreditBadge updates
3. Optionally test LANG-A with real AI: select Slovenian → generate from English podcast → verify native Slovenian output
4. Evaluate billing provider: Paddle MoR / Lemon Squeezy MoR / Stripe + Stripe Tax (see `docs/PRICING_CREDITS_PLAN.md` Section 16)

BILLING-A will:
1. Implement Pro plan subscription flow
2. Webhook: `subscription.created` → allocate 100 credits
3. Webhook: `invoice.paid` → reset monthly credits
4. Failed payment / cancel handling
5. Pricing page UI
