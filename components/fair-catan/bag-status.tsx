"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { countRemaining } from "@/lib/dice-engine"
import { type Lang, t } from "@/lib/translations"

interface BagStatusProps {
  bag: number[]
  bagSize: number
  lang: Lang
}

export function BagStatus({ bag, bagSize, lang }: BagStatusProps) {
  const counts = countRemaining(bag)
  const baseMax = bagSize / 36

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-base">{t(lang, "bagStatus")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-11 gap-1">
          {Array.from({ length: 11 }, (_, i) => i + 2).map((num) => {
            const count = counts[num]
            const maxCount = (num <= 7 ? num - 1 : 13 - num) * baseMax
            const filled = maxCount > 0 ? count / maxCount : 0
            return (
              <div key={num} className="flex flex-col items-center gap-1">
                <div className="relative flex h-12 w-full items-end justify-center overflow-hidden rounded-sm bg-muted">
                  <div
                    className="w-full rounded-sm bg-primary/70 transition-all duration-300"
                    style={{ height: `${filled * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-foreground">{num}</span>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
