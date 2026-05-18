// Virnix Intelligence Layer — Public API
//
// Re-exports all intelligence modules. Import from here to keep consumer code
// clean and allow internal reorganization without changing import paths.
//
// These modules are reference data only — no side effects, no runtime state.
// Safe to import anywhere in the server-side generation pipeline.

export * from "./hooks";
export * from "./psychology";
export * from "./platforms";
export * from "./emotions";
export * from "./retention";
export * from "./storytelling";
