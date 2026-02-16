"use client"

import { Die } from "./die"
import type { DiceRoll } from "@/lib/dice-engine"
import { type Lang, t } from "@/lib/translations"

interface DiceDisplayProps {
  roll: DiceRoll | null
  rolling: boolean
  lang: Lang
  hideHint?: boolean
}

export function DiceDisplay({ roll, rolling, lang, hideHint }: DiceDisplayProps) {
  const hasRoll = roll !== null

  return (
    // Fixed-height container so nothing below ever shifts.
    // h-[11rem] = dice (h-24/md:h-28) + gap-4 + sum line (text-4xl ~2.5rem) + breathing room
    // md:h-[12.5rem] accounts for the larger md dice.
    <div className="flex h-[11rem] flex-col items-center gap-4 md:h-[12.5rem]">
      {/* ── Dice row ── */}
      <div className="flex items-center gap-4 md:gap-6">
        {hasRoll ? (
          <>
            <Die value={roll.die1} rolling={rolling} size="lg" />
            <Die value={roll.die2} rolling={rolling} size="lg" />
          </>
        ) : (
          <>
            <div className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-border md:h-28 md:w-28">
              <span className="text-2xl text-muted-foreground">?</span>
            </div>
            <div className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-border md:h-28 md:w-28">
              <span className="text-2xl text-muted-foreground">?</span>
            </div>
          </>
        )}
      </div>

      {/* ── Sum / hint – always present, visibility toggled via opacity ── */}
      <div
        className="flex items-center gap-2 transition-opacity duration-200"
        style={{ opacity: hasRoll && !rolling ? 1 : 0 }}
        aria-hidden={!hasRoll || rolling}
      >
        <span className="font-display text-4xl font-bold text-foreground">
          {roll?.sum ?? "\u00A0"}
        </span>
      </div>

      {/* Hint text – only visible when no roll has been made */}
      {!hideHint && (
        <p
          className="text-sm text-muted-foreground transition-opacity duration-200"
          style={{ opacity: !hasRoll ? 1 : 0 }}
          aria-hidden={hasRoll}
        >
          {t(lang, "pressRoll")}
        </p>
      )}
    </div>
  )
}
