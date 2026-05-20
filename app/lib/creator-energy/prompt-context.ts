import type { CreatorEnergyId } from "./types";
import { CREATOR_ENERGIES } from "./options";

// Returns a block for injection into the GENERATION PROFILE section of buildPrompt().
// Returns "" when no energies selected — prompt is identical to default behavior.
export function formatEnergyContext(energyIds: CreatorEnergyId[]): string {
  if (energyIds.length === 0) return "";

  const matched = CREATOR_ENERGIES.filter((e) => energyIds.includes(e.id));
  if (matched.length === 0) return "";

  const labels = matched.map((e) => e.label).join(", ");
  const directives = matched.map((e) => `- ${e.promptDirective}`).join("\n");

  return `Creator energy: ${labels}
Directives:
${directives}
Priority: These energy directives are the primary creative direction for this generation. The variation profile above provides structural and rhythmic scaffolding.
Grounding rule: Use selected energies as creative steering. If an energy does not fit the transcript, use the closest grounded version — never invent facts or emotions to satisfy the direction.`;
}
