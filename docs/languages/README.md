# Virnix Language System — LANG-A

**Phase:** LANG-A
**Date:** 2026-05-21
**Status:** Implemented.

---

## What was implemented

- `app/lib/languages/types.ts` — `OutputLanguageId`, `OutputLanguage` types
- `app/lib/languages/options.ts` — `OUTPUT_LANGUAGES`, `isValidLanguageId()`, `getLanguageById()`
- `app/lib/languages/prompt-context.ts` — `formatLanguageContext(id)` → prompt injection string
- `app/components/LanguageSelector.tsx` — "Write in" pill selector in HeroCard

---

## Default behavior

**Auto (default)**: No language instruction is injected into the prompt. Claude generates output in the transcript's natural language. If transcript language is ambiguous, Claude defaults to English.

**Explicit language**: A native-language directive is injected into the GENERATION PROFILE block of the prompt. The model is instructed to:
- Write natively in the selected language
- Not literally translate English viral hook formulas
- Use natural creator and social media phrasing for that language and region

---

## Language options

| ID | Label | Notes |
|----|-------|-------|
| auto | Auto | No injection — keeps transcript language |
| en | English | |
| sl | Slovenian | Regional note: use natural Slovenian phrasing, no-mix with Croatian/Serbian/Bosnian |
| hr | Croatian | Regional note: no-mix with Serbian or Bosnian |
| sr-latn | Serbian Latin | Latin script only, no Cyrillic, no-mix note |
| bs | Bosnian | Regional note: no-mix with Serbian or Croatian |
| de | German | Regional note injected |
| it | Italian | Regional note injected |
| es | Spanish | Regional note injected |
| fr | French | Regional note injected |
| pt | Portuguese | Regional note injected |

---

## Regional rules (Balkan languages)

- Do not mix Slovenian, Croatian, Serbian, and Bosnian — they are distinct languages.
- For Serbian: Latin script by default. No Cyrillic injection.
- No-mix notes are explicit in each prompt directive to prevent code-switching.

---

## Prompt injection

Language context injects **after `energyContext`** and **before the platform requirements block** in the GENERATION PROFILE:

```
━━━ GENERATION PROFILE ━━━
{variationBlock}
{promptContext}
{timelineContext}
{energyContext}
{languageContext}   ← LANG-A injection point

Apply this angle to all 5 platforms...
```

For "auto": `formatLanguageContext("auto")` returns `""` — prompt is byte-for-byte identical to pre-LANG-A.

Priority hierarchy in the prompt:
1. Output language — mandatory, overrides all stylistic instructions
2. Creator Energy — primary creative steering
3. Variation profile — structural scaffolding, secondary

---

## Security

- Client sends `outputLanguage` in request body (string)
- Server validates against `OUTPUT_LANGUAGES` allowlist via `isValidLanguageId()`
- Unknown values (or omitted field) fall back to `"auto"` — never injected raw into prompts
- No new environment variables required

---

## Credits impact

Language selection = **+0 credits** in LANG-A. Future premium language packs may introduce per-language pricing, but not in this phase.

---

## Mock mode

`getMockResult()` is returned before any prompt is built. Language parameter is passed through but has no effect on mock output. No mock changes needed.

---

## How to add a new language

1. Add an entry to `OUTPUT_LANGUAGES` in `app/lib/languages/options.ts`
2. The `OutputLanguageId` union type will need the new ID added in `app/lib/languages/types.ts`
3. The UI pill appears automatically via `OUTPUT_LANGUAGES.map()`
4. Server allowlist updates automatically via `isValidLanguageId()`

---

## Future global expansion (not yet active)

Planned for a future phase when international creator markets are targeted:

- Hindi
- Mandarin Chinese
- Arabic
- Turkish
- Polish
- Dutch
- Indonesian
- Japanese
- Korean

Right-to-left languages (Arabic) will require additional prompt-level instruction about text direction if the output is rendered in UI components.
