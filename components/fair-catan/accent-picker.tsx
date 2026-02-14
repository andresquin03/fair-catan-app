"use client"

import { cn } from "@/lib/utils"

export type AccentColor = "orange" | "green" | "blue" | "violet"

interface AccentPickerProps {
  value: AccentColor
  onChange: (color: AccentColor) => void
}

const ACCENTS: { id: AccentColor; label: string; swatch: string }[] = [
  { id: "orange", label: "Orange",  swatch: "bg-[hsl(25,75%,47%)] dark:bg-[hsl(30,80%,55%)]" },
  { id: "green",  label: "Green",   swatch: "bg-[hsl(152,60%,38%)] dark:bg-[hsl(152,55%,50%)]" },
  { id: "blue",   label: "Blue",    swatch: "bg-[hsl(215,70%,48%)] dark:bg-[hsl(215,70%,58%)]" },
  { id: "violet", label: "Violet",  swatch: "bg-[hsl(270,55%,52%)] dark:bg-[hsl(270,55%,62%)]" },
]

export function AccentPicker({ value, onChange }: AccentPickerProps) {
  return (
    <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Accent color">
      {ACCENTS.map((accent) => {
        const selected = value === accent.id
        return (
          <button
            key={accent.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={accent.label}
            onClick={() => onChange(accent.id)}
            className={cn(
              "h-6 w-6 rounded-full transition-all",
              "ring-offset-2 ring-offset-background",
              accent.swatch,
              selected
                ? "ring-2 ring-foreground scale-110"
                : "ring-1 ring-border hover:ring-foreground/50 hover:scale-105"
            )}
          />
        )
      })}
    </div>
  )
}
