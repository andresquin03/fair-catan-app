"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DiceRoll } from "@/lib/dice-engine"
import { type Lang, t } from "@/lib/translations"

interface StatsCardProps {
  history: DiceRoll[]
  bagSize: number
  lang: Lang
}

export function StatsCard({ history, bagSize, lang }: StatsCardProps) {
  const rollCount = history.length

  // Compute frequency per sum (2–12)
  const freq: Record<number, number> = {}
  for (let i = 2; i <= 12; i++) freq[i] = 0
  for (const roll of history) freq[roll.sum]++

  const maxCount = rollCount > 0 ? Math.max(...Object.values(freq)) : 0
  const mostFrequentNums =
    rollCount > 0
      ? ([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const).filter((n) => freq[n] === maxCount)
      : []

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-base">{t(lang, "cycleStats")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">{t(lang, "rollsThisCycle")}</span>
            <span className="font-display text-2xl font-bold text-foreground">
              {rollCount}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">{t(lang, "mostFrequent")}</span>
            <span className="font-display text-2xl font-bold text-foreground">
              {rollCount > 0 ? mostFrequentNums.join(", ") : "—"}
            </span>
            {rollCount > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {maxCount}x ({((maxCount / rollCount) * 100).toFixed(1)}%)
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
