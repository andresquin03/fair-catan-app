"use client"

import { Die } from "./die"
import type { DiceRoll } from "@/lib/dice-engine"

interface DiceDisplayProps {
  roll: DiceRoll | null
  rolling: boolean
}

export function DiceDisplay({ roll, rolling }: DiceDisplayProps) {
  if (!roll && !rolling) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-border md:h-28 md:w-28">
            <span className="text-2xl text-muted-foreground">?</span>
          </div>
          <div className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-border md:h-28 md:w-28">
            <span className="text-2xl text-muted-foreground">?</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Press Roll or Space to start</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4 md:gap-6">
        <Die value={roll?.die1 ?? 1} rolling={rolling} size="lg" />
        <Die value={roll?.die2 ?? 1} rolling={rolling} size="lg" />
      </div>
      {roll && !rolling && (
        <div className="flex items-center gap-2">
          <span className="font-display text-4xl font-bold text-foreground">
            {roll.sum}
          </span>
        </div>
      )}
    </div>
  )
}
