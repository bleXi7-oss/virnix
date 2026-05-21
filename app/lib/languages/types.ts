export type OutputLanguageId =
  | "auto"
  | "en"
  | "sl"
  | "hr"
  | "sr-latn"
  | "bs"
  | "de"
  | "it"
  | "es"
  | "fr"
  | "pt";

export interface OutputLanguage {
  id: OutputLanguageId;
  label: string;
  promptName: string;
  nativeNote?: string;
}
