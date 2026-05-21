import type { OutputLanguage, OutputLanguageId } from "./types";

// Initial language pack — EU/Balkan focus + major global languages.
// To add a language: append an entry here. Everything else picks it up automatically.
//
// Future global expansion (not yet active): Hindi, Mandarin, Arabic, Turkish,
// Polish, Dutch, Indonesian, Japanese, Korean.

export const OUTPUT_LANGUAGES: ReadonlyArray<OutputLanguage> = [
  {
    id: "auto",
    label: "Auto",
    promptName: "the same language as the transcript",
  },
  {
    id: "en",
    label: "English",
    promptName: "English",
  },
  {
    id: "sl",
    label: "Slovenian",
    promptName: "Slovenian",
    nativeNote: "Use natural Slovenian creator and social media phrasing. Do not mix Slovenian with Croatian, Serbian, or Bosnian.",
  },
  {
    id: "hr",
    label: "Croatian",
    promptName: "Croatian",
    nativeNote:
      "Write in Croatian using Latin script only. Do not use Cyrillic. Use natural Croatian creator and social media phrasing. Do not mix Croatian with Serbian or Bosnian.",
  },
  {
    id: "sr-latn",
    label: "Serbian Latin",
    promptName: "Serbian (Latin script)",
    nativeNote:
      "Write in Serbian using Latin script only. Do not use Cyrillic. Do not mix with Croatian or Bosnian.",
  },
  {
    id: "bs",
    label: "Bosnian",
    promptName: "Bosnian",
    nativeNote:
      "Use natural Bosnian creator and social media phrasing. Do not mix with Serbian or Croatian.",
  },
  {
    id: "de",
    label: "German",
    promptName: "German",
    nativeNote: "Use natural German creator and social media phrasing.",
  },
  {
    id: "it",
    label: "Italian",
    promptName: "Italian",
    nativeNote: "Use natural Italian creator and social media phrasing.",
  },
  {
    id: "es",
    label: "Spanish",
    promptName: "Spanish",
    nativeNote: "Use natural Spanish creator and social media phrasing.",
  },
  {
    id: "fr",
    label: "French",
    promptName: "French",
    nativeNote: "Use natural French creator and social media phrasing.",
  },
  {
    id: "pt",
    label: "Portuguese",
    promptName: "Portuguese",
    nativeNote: "Use natural Portuguese creator and social media phrasing.",
  },
];

export function isValidLanguageId(id: unknown): id is OutputLanguageId {
  return typeof id === "string" && OUTPUT_LANGUAGES.some((l) => l.id === id);
}

export function getLanguageById(id: OutputLanguageId): OutputLanguage {
  return OUTPUT_LANGUAGES.find((l) => l.id === id) ?? OUTPUT_LANGUAGES[0];
}
