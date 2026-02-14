"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DiceRoll } from "@/lib/dice-engine"
import { expectedProbabilities } from "@/lib/dice-engine"

interface StatsCardProps {
  history: DiceRoll[]
  bagSize: number
}

export function StatsCard({ history, bagSize }: StatsCardProps) {
  const rollCount = history.length

  // Compute most frequent number
  const freq: Record<number, number> = {}
  for (let i = 2; i <= 12; i++) freq[i] = 0
  for (const roll of history) freq[roll.sum]++

  let mostFrequent = 7
  let maxCount = 0
  for (const [num, count] of Object.entries(freq)) {
    if (count > maxCount) {
      maxCount = count
      mostFrequent = Number(num)
    }
  }

  // Expected vs observed for top numbers
  const expected = expectedProbabilities()
  const topNums = [6, 7, 8]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-base">Cycle Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Rolls this cycle</span>
            <span className="font-display text-2xl font-bold text-foreground">
              {rollCount}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Most frequent</span>
            <span className="font-display text-2xl font-bold text-foreground">
              {rollCount > 0 ? mostFrequent : "—"}
            </span>
            {rollCount > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {maxCount}x ({((maxCount / rollCount) * 100).toFixed(1)}%)
              </span>
            )}
          </div>
        </div>

        {rollCount > 0 && (
          <div className="mt-4">
            <span className="text-xs text-muted-foreground">Expected vs Observed</span>
            <div className="mt-1.5 flex flex-col gap-1">
              {topNums.map((num) => {
                const observed =
                  rollCount > 0
                    ? ((freq[num] / rollCount) * 100).toFixed(1)
                    : "0.0"
                return (
                  <div
                    key={num}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-foreground">{num}</span>
                    <span className="text-muted-foreground">
                      exp {expected[num].toFixed(1)}%
                    </span>
                    <span className="font-medium tabular-nums text-foreground">
                      obs {observed}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
