export type CreatorEnergyId =
  | "tactical"
  | "contrarian"
  | "analytical"
  | "reflective"
  | "relatable"
  | "harsh-truth";

export interface CreatorEnergy {
  id: CreatorEnergyId;
  label: string;
  tagline: string;
  promptDirective: string;
}
