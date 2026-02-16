"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { type Lang, t } from "@/lib/translations"

function hslFromToken(token: string): string {
  return token.replace(/ /g, ", ")
}

export type AccentColor = "orange" | "green" | "blue" | "violet"

// ─── Single source of truth for accent colour tokens ────────────
export const ACCENT_TOKENS: Record<AccentColor, {
  light: Record<string, string>
  dark: Record<string, string>
}> = {
  orange: {
    light: {
      "--primary": "25 75% 47%",
      "--primary-foreground": "40 40% 99%",
      "--ring": "25 75% 47%",
      "--accent": "16 65% 52%",
      "--accent-foreground": "40 40% 99%",
      "--chart-1": "25 75% 47%",
    },
    dark: {
      "--primary": "30 80% 55%",
      "--primary-foreground": "25 20% 8%",
      "--ring": "30 80% 55%",
      "--accent": "16 70% 58%",
      "--accent-foreground": "25 20% 8%",
      "--chart-1": "30 80% 55%",
    },
  },
  green: {
    light: {
      "--primary": "152 60% 38%",
      "--primary-foreground": "152 30% 97%",
      "--ring": "152 60% 38%",
      "--accent": "162 50% 44%",
      "--accent-foreground": "152 30% 97%",
      "--chart-1": "152 60% 38%",
    },
    dark: {
      "--primary": "152 55% 50%",
      "--primary-foreground": "152 30% 8%",
      "--ring": "152 55% 50%",
      "--accent": "162 50% 52%",
      "--accent-foreground": "152 30% 8%",
      "--chart-1": "152 55% 50%",
    },
  },
  blue: {
    light: {
      "--primary": "215 70% 48%",
      "--primary-foreground": "215 30% 97%",
      "--ring": "215 70% 48%",
      "--accent": "205 65% 55%",
      "--accent-foreground": "215 30% 97%",
      "--chart-1": "215 70% 48%",
    },
    dark: {
      "--primary": "215 70% 58%",
      "--primary-foreground": "215 30% 8%",
      "--ring": "215 70% 58%",
      "--accent": "205 65% 62%",
      "--accent-foreground": "215 30% 8%",
      "--chart-1": "215 70% 58%",
    },
  },
  violet: {
    light: {
      "--primary": "270 55% 52%",
      "--primary-foreground": "270 30% 97%",
      "--ring": "270 55% 52%",
      "--accent": "280 50% 58%",
      "--accent-foreground": "270 30% 97%",
      "--chart-1": "270 55% 52%",
    },
    dark: {
      "--primary": "270 55% 62%",
      "--primary-foreground": "270 30% 8%",
      "--ring": "270 55% 62%",
      "--accent": "280 50% 65%",
      "--accent-foreground": "270 30% 8%",
      "--chart-1": "270 55% 62%",
    },
  },
}

// Swatch colors for picker (inline styles so Tailwind doesn't purge dynamic classes)
const ACCENTS: {
  id: AccentColor
  label: string
  light: string
  dark: string
}[] = [
  { id: "orange", label: "Orange", light: hslFromToken(ACCENT_TOKENS.orange.light["--primary"]), dark: hslFromToken(ACCENT_TOKENS.orange.dark["--primary"]) },
  { id: "green", label: "Green", light: hslFromToken(ACCENT_TOKENS.green.light["--primary"]), dark: hslFromToken(ACCENT_TOKENS.green.dark["--primary"]) },
  { id: "blue", label: "Blue", light: hslFromToken(ACCENT_TOKENS.blue.light["--primary"]), dark: hslFromToken(ACCENT_TOKENS.blue.dark["--primary"]) },
  { id: "violet", label: "Violet", light: hslFromToken(ACCENT_TOKENS.violet.light["--primary"]), dark: hslFromToken(ACCENT_TOKENS.violet.dark["--primary"]) },
]

interface AccentPickerProps {
  value: AccentColor
  onChange: (color: AccentColor) => void
  lang: Lang
}

export function AccentPicker({ value, onChange, lang }: AccentPickerProps) {
  const [open, setOpen] = useState(false)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const current = ACCENTS.find((a) => a.id === value) ?? ACCENTS[0]
  const currentBg = isDark ? current.dark : current.light

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${t(lang, "accentColor")}: ${current.label}`}
          className={cn(
            "h-7 w-7 rounded-full transition-transform hover:scale-110",
            "ring-2 ring-offset-2 ring-offset-background ring-foreground/30",
          )}
          style={{ backgroundColor: `hsl(${currentBg})` }}
        />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-auto p-3"
      >
        <p className="mb-2 text-xs font-medium text-muted-foreground">{t(lang, "accentColor")}</p>
        <div className="flex items-center gap-2" role="radiogroup" aria-label={t(lang, "accentColor")}>
          {ACCENTS.map((accent) => {
            const selected = value === accent.id
            const bg = isDark ? accent.dark : accent.light
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
                  selected
                    ? "ring-2 ring-foreground scale-110"
                    : "ring-1 ring-border hover:ring-foreground/50 hover:scale-105",
                )}
                style={{ backgroundColor: `hsl(${bg})` }}
              />
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
