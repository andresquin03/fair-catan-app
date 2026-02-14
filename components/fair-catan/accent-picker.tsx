"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

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
  const [open, setOpen] = useState(false)
  const current = ACCENTS.find((a) => a.id === value) ?? ACCENTS[0]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Accent color: ${current.label}. Click to change.`}
          className={cn(
            "h-7 w-7 rounded-full transition-transform hover:scale-110",
            "ring-2 ring-offset-2 ring-offset-background ring-foreground/30",
            current.swatch,
          )}
        />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-auto p-3"
      >
        <p className="mb-2 text-xs font-medium text-muted-foreground">Accent color</p>
        <div className="flex items-center gap-2" role="radiogroup" aria-label="Accent color">
          {ACCENTS.map((accent) => {
            const selected = value === accent.id
            return (
              <button
                key={accent.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={accent.label}
                onClick={() => {
                  onChange(accent.id)
                  setOpen(false)
                }}
                className={cn(
                  "h-8 w-8 rounded-full transition-all",
                  "ring-offset-2 ring-offset-background",
                  accent.swatch,
                  selected
                    ? "ring-2 ring-foreground scale-110"
                    : "ring-1 ring-border hover:ring-foreground/50 hover:scale-105",
                )}
              />
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
