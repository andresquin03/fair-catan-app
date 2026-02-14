"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Lang } from "@/lib/translations"

interface LanguagePickerProps {
  value: Lang
  onChange: (lang: Lang) => void
}

const LANGUAGES: { id: Lang; label: string; short: string }[] = [
  { id: "en", label: "English", short: "EN" },
  { id: "es", label: "Español", short: "ES" },
]

export function LanguagePicker({ value, onChange }: LanguagePickerProps) {
  const [open, setOpen] = useState(false)
  const current = LANGUAGES.find((l) => l.id === value) ?? LANGUAGES[0]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Language: ${current.label}. Click to change.`}
          className={cn(
            "flex h-7 items-center rounded-full border border-border bg-card px-2.5",
            "text-xs font-semibold text-foreground",
            "transition-colors hover:bg-muted",
          )}
        >
          {current.short}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-2">
        <div className="flex flex-col gap-0.5" role="radiogroup" aria-label="Language">
          {LANGUAGES.map((lang) => {
            const selected = value === lang.id
            return (
              <button
                key={lang.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  onChange(lang.id)
                  setOpen(false)
                }}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                  selected
                    ? "bg-primary/10 font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span className="w-6 font-semibold">{lang.short}</span>
                <span>{lang.label}</span>
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
