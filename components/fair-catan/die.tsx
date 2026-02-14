"use client"

import { cn } from "@/lib/utils"

interface DieProps {
  value: number
  rolling?: boolean
  size?: "sm" | "md" | "lg"
}

const pipPositions: Record<number, string[]> = {
  1: ["col-start-2 row-start-2"],
  2: ["col-start-3 row-start-1", "col-start-1 row-start-3"],
  3: ["col-start-3 row-start-1", "col-start-2 row-start-2", "col-start-1 row-start-3"],
  4: [
    "col-start-1 row-start-1",
    "col-start-3 row-start-1",
    "col-start-1 row-start-3",
    "col-start-3 row-start-3",
  ],
  5: [
    "col-start-1 row-start-1",
    "col-start-3 row-start-1",
    "col-start-2 row-start-2",
    "col-start-1 row-start-3",
    "col-start-3 row-start-3",
  ],
  6: [
    "col-start-1 row-start-1",
    "col-start-3 row-start-1",
    "col-start-1 row-start-2",
    "col-start-3 row-start-2",
    "col-start-1 row-start-3",
    "col-start-3 row-start-3",
  ],
}

const sizeClasses = {
  sm: "h-8 w-8 rounded-md p-1",
  md: "h-16 w-16 rounded-lg p-2",
  lg: "h-24 w-24 rounded-xl p-3 md:h-28 md:w-28 md:p-4",
}

const pipSizeClasses = {
  sm: "h-1.5 w-1.5",
  md: "h-2.5 w-2.5",
  lg: "h-3.5 w-3.5 md:h-4 md:w-4",
}

export function Die({ value, rolling = false, size = "lg" }: DieProps) {
  const positions = pipPositions[value] || []

  return (
    <div
      className={cn(
        "grid grid-cols-3 grid-rows-3 place-items-center",
        "bg-card border-2 border-border shadow-lg",
        sizeClasses[size],
        rolling && "animate-dice-roll"
      )}
    >
      {positions.map((pos, i) => (
        <div
          key={i}
          className={cn(
            "rounded-full bg-foreground",
            pipSizeClasses[size],
            pos
          )}
        />
      ))}
    </div>
  )
}
