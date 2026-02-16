"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { DiceRoll } from "@/lib/dice-engine"
import { Die } from "./die"
import { type Lang, t } from "@/lib/translations"

interface RollHistoryProps {
  history: DiceRoll[]
  lang: Lang
}

export function RollHistory({ history, lang }: RollHistoryProps) {
  const recent = history.slice(-20).reverse()

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-base">
          {t(lang, "history")}
          {history.length > 0 && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({t(lang, "last")} {Math.min(history.length, 20)} {t(lang, "of")} {history.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {t(lang, "noRolls")}
          </p>
        ) : (
          <ScrollArea className="h-48">
            <div className="flex flex-col gap-2">
              {recent.map((roll, idx) => (
                <div
                  key={history.length - idx}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2",
                    idx === 0 ? "bg-primary/10" : "bg-muted/50"
                  )}
                >
                  <span className="w-5 text-xs tabular-nums text-muted-foreground">
                    #{history.length - idx}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Die value={roll.die1} size="sm" />
                    <Die value={roll.die2} size="sm" />
                  </div>
                  <span className="ml-auto font-display text-lg font-bold text-foreground">
                    {roll.sum}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
