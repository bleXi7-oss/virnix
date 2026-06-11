"use client";

import type { CreatorEnergyId } from "../lib/creator-energy/types";
import { CREATOR_ENERGIES } from "../lib/creator-energy/options";

interface Props {
  selectedIds: CreatorEnergyId[];
  onChange: (ids: CreatorEnergyId[]) => void;
}

const PILL_BASE =
  "cursor-pointer rounded-full border px-3 py-1 text-[11px] transition-all";
const PILL_IDLE =
  "border-zinc-200 bg-transparent text-zinc-500 hover:border-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:border-zinc-800 dark:text-zinc-500 dark:hover:border-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-zinc-300";
const PILL_ACTIVE =
  "border-zinc-400 bg-zinc-100 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";

export default function CreatorEnergySelector({ selectedIds, onChange }: Props) {
  const isBalanced = selectedIds.length === 0;

  function toggleBalanced() {
    onChange([]);
  }

  function toggleEnergy(id: CreatorEnergyId) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((e) => e !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div className="mt-5">
      <div className="mb-2.5">
        <span className="block text-[11px] text-zinc-400 dark:text-zinc-600">
          Direction
        </span>
        <span className="block text-[10px] text-zinc-400/60 dark:text-zinc-700">
          Shapes the angle and tone of generated posts.
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={toggleBalanced}
          title="Let Virnix pick the best angle automatically"
          className={`${PILL_BASE} ${isBalanced ? PILL_ACTIVE : PILL_IDLE}`}
        >
          Balanced
        </button>
        {CREATOR_ENERGIES.map((energy) => {
          const isSelected = selectedIds.includes(energy.id);
          return (
            <button
              key={energy.id}
              onClick={() => toggleEnergy(energy.id)}
              title={energy.tagline}
              className={`${PILL_BASE} ${isSelected ? PILL_ACTIVE : PILL_IDLE}`}
            >
              {energy.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
