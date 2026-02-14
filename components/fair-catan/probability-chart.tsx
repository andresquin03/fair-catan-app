"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { computeProbabilities, expectedProbabilities } from "@/lib/dice-engine"

interface ProbabilityChartProps {
  bag: number[]
}

export function ProbabilityChart({ bag }: ProbabilityChartProps) {
  const probs = computeProbabilities(bag)
  const expected = expectedProbabilities()
  const maxProb = Math.max(...Object.values(probs), ...Object.values(expected), 1)
  const isEmpty = bag.length === 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-base">Next-Roll Probabilities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: 11 }, (_, i) => i + 2).map((num) => {
            const prob = probs[num]
            const exp = expected[num]
            const barWidth = isEmpty ? 0 : (prob / maxProb) * 100
            const expBarWidth = (exp / maxProb) * 100
            return (
              <div key={num} className="flex items-center gap-2">
                <span className="w-6 text-right text-xs font-medium text-muted-foreground">
                  {num}
                </span>
                <div className="relative h-5 flex-1 overflow-hidden rounded-sm bg-muted">
                  {/* Expected probability marker line (neutral) */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-muted-foreground/30"
                    style={{ left: `${expBarWidth}%` }}
                  />
                  {/* Actual probability bar — always uses accent via --primary */}
                  <div
                    className="h-full rounded-sm bg-primary transition-all duration-300"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
                  {isEmpty ? "—" : `${prob.toFixed(1)}%`}
                </span>
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-primary" />
            Current
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-0.5 bg-muted-foreground/30" />
            Expected
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
