"use client"

import { useCallback, useEffect, useReducer, useRef, useState } from "react"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import {
  Dices,
  Moon,
  Sun,
  Undo2,
  RotateCcw,
  Share2,
  Keyboard,
  Maximize,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { DiceDisplay } from "./dice-display"
import { ProbabilityChart } from "./probability-chart"
import { BagStatus } from "./bag-status"
import { RollHistory } from "./roll-history"
import { StatsCard } from "./stats-card"
import { AccentPicker, type AccentColor, ACCENT_TOKENS } from "./accent-picker"
import { LanguagePicker } from "./language-picker"

import {
  type BagSize,
  type DiceRoll,
  type GameState,
  createInitialState,
  getDiceCombination,
} from "@/lib/dice-engine"
import { type Lang, t } from "@/lib/translations"

// ─── Reducer ────────────────────────────────────────────────────
type Action =
  | { type: "ROLL"; roll: DiceRoll; newBag: number[] }
  | { type: "UNDO" }
  | { type: "RESET"; bagSize: BagSize }
  | { type: "SET_BAG_SIZE"; bagSize: BagSize }
  | { type: "HYDRATE"; state: GameState }

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "ROLL":
      return {
        ...state,
        previousBag: [...state.bag],
        bag: action.newBag,
        history: [...state.history, action.roll],
        rollCount: state.rollCount + 1,
      }
    case "UNDO": {
      if (!state.previousBag || state.history.length === 0) return state
      return {
        ...state,
        bag: state.previousBag,
        previousBag: null,
        history: state.history.slice(0, -1),
        rollCount: state.rollCount - 1,
      }
    }
    case "RESET":
      return createInitialState(action.bagSize)
    case "SET_BAG_SIZE":
      return createInitialState(action.bagSize)
    case "HYDRATE":
      return action.state
    default:
      return state
  }
}

// ─── localStorage helpers ───────────────────────────────────────
const STORAGE_KEY = "fair-catan-state"

function saveState(state: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Quota exceeded or other error; silently fail.
  }
}

function loadState(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as GameState
    // Basic validation
    if (
      Array.isArray(parsed.bag) &&
      Array.isArray(parsed.history) &&
      typeof parsed.bagSize === "number"
    ) {
      return parsed
    }
  } catch {
    // Corrupt data; ignore.
  }
  return null
}

// ─── Component ──────────────────────────────────────────────────
export function FairCatanGame() {
  const { resolvedTheme, setTheme } = useTheme()
  const [state, dispatch] = useReducer(gameReducer, createInitialState(72))
  const [rolling, setRolling] = useState(false)
  const [currentRoll, setCurrentRoll] = useState<DiceRoll | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const rollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [pendingBagSize, setPendingBagSize] = useState<string | null>(null)
  const [accentColor, setAccentColor] = useState<AccentColor>("orange")
  const [lang, setLang] = useState<Lang>("en")
  const [fullscreen, setFullscreen] = useState(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = loadState()
    if (saved) {
      dispatch({ type: "HYDRATE", state: saved })
      // Restore the last roll visual
      if (saved.history.length > 0) {
        setCurrentRoll(saved.history[saved.history.length - 1])
      }
    }
    // Restore accent color
    const savedAccent = localStorage.getItem("fair-catan-accent") as AccentColor | null
    if (savedAccent && ["orange", "green", "blue", "violet"].includes(savedAccent)) {
      setAccentColor(savedAccent)
    }
    // Restore language (or auto-detect)
    const savedLang = localStorage.getItem("fair-catan-lang") as Lang | null
    if (savedLang && ["en", "es"].includes(savedLang)) {
      setLang(savedLang)
    } else {
      setLang(navigator.language.startsWith("es") ? "es" : "en")
    }
    setHydrated(true)
  }, [])

  // Persist accent color
  const handleAccentChange = useCallback((color: AccentColor) => {
    setAccentColor(color)
    try { localStorage.setItem("fair-catan-accent", color) } catch { }
  }, [])

  // Persist language
  const handleLangChange = useCallback((newLang: Lang) => {
    setLang(newLang)
    try { localStorage.setItem("fair-catan-lang", newLang) } catch { }
  }, [])

  // Apply accent CSS variables whenever accent or resolved theme changes
  useEffect(() => {
    const isDark = resolvedTheme === "dark"
    const tokens = ACCENT_TOKENS[accentColor][isDark ? "dark" : "light"]
    const root = document.documentElement
    for (const [prop, value] of Object.entries(tokens)) {
      root.style.setProperty(prop, value)
    }
  }, [accentColor, resolvedTheme])

  // Persist state changes to localStorage
  useEffect(() => {
    if (hydrated) {
      saveState(state)
    }
  }, [state, hydrated])

  const doRoll = useCallback(() => {
    if (rolling) return
    let bag = state.bag

    // If bag is empty, auto-refill
    if (bag.length === 0) {
      const newState = createInitialState(state.bagSize)
      dispatch({ type: "RESET", bagSize: state.bagSize })
      bag = newState.bag
      toast.info(t(lang, "bagEmpty"))
    }

    // Draw from bag
    const idx = Math.floor(Math.random() * bag.length)
    const sum = bag[idx]
    const newBag = [...bag]
    newBag.splice(idx, 1)

    const [die1, die2] = getDiceCombination(sum)
    const roll: DiceRoll = { sum, die1, die2 }

    // Animate
    setRolling(true)
    // Show random dice faces during animation
    const animDuration = 500
    const animInterval = 80
    let elapsed = 0

    const intervalId = setInterval(() => {
      elapsed += animInterval
      if (elapsed < animDuration) {
        setCurrentRoll({
          sum: 0,
          die1: Math.floor(Math.random() * 6) + 1,
          die2: Math.floor(Math.random() * 6) + 1,
        })
      }
    }, animInterval)

    rollTimeoutRef.current = setTimeout(() => {
      clearInterval(intervalId)
      setRolling(false)
      setCurrentRoll(roll)
      dispatch({ type: "ROLL", roll, newBag })

      // Check if bag is now empty after this roll
      if (newBag.length === 0) {
        setTimeout(() => {
          toast.info(t(lang, "bagEmptyNext"))
        }, 300)
      }
    }, animDuration)
  }, [rolling, state.bag, state.bagSize, lang])

  const doUndo = useCallback(() => {
    if (state.previousBag && state.history.length > 0) {
      const prevRoll =
        state.history.length >= 2
          ? state.history[state.history.length - 2]
          : null
      setCurrentRoll(prevRoll)
      dispatch({ type: "UNDO" })
      toast(t(lang, "lastRollUndone"))
    }
  }, [state.previousBag, state.history, lang])

  const requestReset = useCallback(() => {
    setShowResetDialog(true)
  }, [])

  const confirmReset = useCallback(() => {
    dispatch({ type: "RESET", bagSize: state.bagSize })
    setCurrentRoll(null)
    setShowResetDialog(false)
    toast.success(t(lang, "cycleReset"))
  }, [state.bagSize, lang])

  const requestBagSizeChange = useCallback((size: string) => {
    if (size === String(state.bagSize)) return
    setPendingBagSize(size)
  }, [state.bagSize])

  const confirmBagSizeChange = useCallback(() => {
    if (!pendingBagSize) return
    dispatch({ type: "SET_BAG_SIZE", bagSize: Number(pendingBagSize) as BagSize })
    setCurrentRoll(null)
    setPendingBagSize(null)
    toast.success(`${t(lang, "bagSizeChanged")} ${pendingBagSize}`)
  }, [pendingBagSize, lang])

  const cancelBagSizeChange = useCallback(() => {
    setPendingBagSize(null)
  }, [])

  const doShare = useCallback(() => {
    const lines: string[] = [t(lang, "rollSummary"), ""]
    lines.push(`${t(lang, "bagSize")}: ${state.bagSize}`)
    lines.push(`${t(lang, "rollsThisCycle")}: ${state.rollCount}`)
    lines.push(`${t(lang, "remainingInBag")}: ${state.bag.length} / ${state.bagSize}`)
    lines.push("")

    if (state.history.length > 0) {
      lines.push(`${t(lang, "lastRolls")}:`)
      const recent = state.history.slice(-10)
      for (const roll of recent) {
        lines.push(`  ${roll.die1} + ${roll.die2} = ${roll.sum}`)
      }
    }

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      toast.success(t(lang, "summaryCopied"))
    })
  }, [state, lang])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.code === "Space") {
        e.preventDefault()
        doRoll()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault()
        doUndo()
      }
      if (e.key === "Escape") {
        setFullscreen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [doRoll, doUndo])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rollTimeoutRef.current) clearTimeout(rollTimeoutRef.current)
    }
  }, [])

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Dices className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
              <div>
                <h1 className="font-display text-lg font-bold text-foreground sm:text-xl">
                  Fair Catan
                </h1>
                <p className="hidden text-xs text-muted-foreground sm:block">
                  {t(lang, "subtitle")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-3">
              <Select
                value={String(state.bagSize)}
                onValueChange={requestBagSizeChange}
              >
                <SelectTrigger className="w-[4.5rem] sm:w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="36">36</SelectItem>
                  <SelectItem value="72">72</SelectItem>
                  <SelectItem value="144">144</SelectItem>
                </SelectContent>
              </Select>
              <div className="hidden h-5 w-px bg-border sm:block" role="separator" aria-hidden />
              <div className="flex items-center gap-1 sm:gap-1.5" aria-label="Appearance">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setTheme((resolvedTheme ?? "light") === "dark" ? "light" : "dark")
                      }
                      aria-label={t(lang, "toggleTheme")}
                    >
                      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t(lang, "toggleTheme")}</TooltipContent>
                </Tooltip>
                <AccentPicker value={accentColor} onChange={handleAccentChange} lang={lang} />
              </div>
              <div className="hidden h-5 w-px bg-border sm:block" role="separator" aria-hidden />
              <LanguagePicker value={lang} onChange={handleLangChange} />
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="mx-auto max-w-6xl px-4 py-6">
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Left Column – Dice + Controls */}
            <div className="flex flex-col gap-6 lg:col-span-2">
              {/* Dice Area */}
              <div className="relative flex flex-col items-center gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-3 top-3 h-9 w-9"
                      onClick={() => setFullscreen(true)}
                      aria-label={t(lang, "fullscreen")}
                    >
                      <Maximize className="h-4.5 w-4.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t(lang, "fullscreen")}</TooltipContent>
                </Tooltip>
                <DiceDisplay roll={currentRoll} rolling={rolling} lang={lang} />

                {/* ROLL button */}
                <Button
                  onClick={doRoll}
                  disabled={rolling}
                  size="lg"
                  className="h-14 w-full max-w-xs text-lg font-bold shadow-md"
                >
                  <Dices className="mr-2 h-5 w-5" />
                  {rolling ? t(lang, "rolling") : t(lang, "roll")}
                </Button>

                {/* Remaining indicator */}
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 min-w-32 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{
                        width: `${(state.bag.length / state.bagSize) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium tabular-nums text-muted-foreground">
                    {state.bag.length} / {state.bagSize}
                  </span>
                </div>

                {/* Undo / Reset / Share */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={doUndo}
                        disabled={!state.previousBag || state.history.length === 0}
                      >
                        <Undo2 className="mr-1.5 h-3.5 w-3.5" />
                        {t(lang, "undo")}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span className="flex items-center gap-1.5">
                        {t(lang, "undoLast")}
                        <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                          {"Ctrl+Z"}
                        </kbd>
                      </span>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={requestReset}>
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                        {t(lang, "reset")}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t(lang, "resetCycle")}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={doShare}>
                        <Share2 className="mr-1.5 h-3.5 w-3.5" />
                        {t(lang, "share")}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t(lang, "shareSummary")}</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Stats Card */}
              <StatsCard history={state.history} bagSize={state.bagSize} lang={lang} />

              {/* Keyboard shortcuts hint */}
              <div className="hidden items-center justify-center gap-4 text-xs text-muted-foreground lg:flex">
                <span className="flex items-center gap-1.5">
                  <Keyboard className="h-3.5 w-3.5" />
                  {t(lang, "shortcuts")}:
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                    Space
                  </kbd>
                  {t(lang, "roll")}
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                    {"Ctrl+Z"}
                  </kbd>
                  {t(lang, "undo")}
                </span>
              </div>
            </div>

            {/* Right Column – Charts + History */}
            <div className="flex flex-col gap-6 lg:col-span-3">
              <ProbabilityChart bag={state.bag} lang={lang} />
              <BagStatus bag={state.bag} bagSize={state.bagSize} lang={lang} />
              <RollHistory history={state.history} lang={lang} />
            </div>
          </div>
        </main>
      </div>

      {/* Reset confirmation */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(lang, "resetConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(lang, "resetConfirmMessage")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t(lang, "cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t(lang, "reset")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bag size change confirmation */}
      <AlertDialog open={pendingBagSize !== null} onOpenChange={(open) => { if (!open) cancelBagSizeChange() }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(lang, "changeBagTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(lang, "changeBagMessage")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelBagSizeChange}>{t(lang, "cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBagSizeChange}>
              {t(lang, "change")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Fullscreen dice overlay */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={() => setFullscreen(false)}
            aria-label={t(lang, "exitFullscreen")}
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="pointer-events-none md:scale-150 lg:scale-[1.75]">
            <DiceDisplay roll={currentRoll} rolling={rolling} lang={lang} hideHint />
          </div>

          <Button
            onClick={doRoll}
            disabled={rolling}
            size="lg"
            className="h-14 w-full max-w-xs text-lg font-bold shadow-md"
          >
            <Dices className="mr-2 h-5 w-5" />
            {rolling ? t(lang, "rolling") : t(lang, "roll")}
          </Button>

          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 min-w-32 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{
                  width: `${(state.bag.length / state.bagSize) * 100}%`,
                }}
              />
            </div>
            <span className="text-sm font-medium tabular-nums text-muted-foreground">
              {state.bag.length} / {state.bagSize}
            </span>
          </div>
        </div>
      )}
    </TooltipProvider>
  )
}
