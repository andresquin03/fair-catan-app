"use client"

import { useCallback, useEffect, useReducer, useRef, useState } from "react"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import {
  Dices,
  Moon,
  Sun,
  Undo2,
  RotateCcw,
  Share2,
  Keyboard,
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
import { AccentPicker, type AccentColor } from "./accent-picker"

import {
  type BagSize,
  type DiceRoll,
  type GameState,
  buildBag,
  createInitialState,
  getDiceCombination,
} from "@/lib/dice-engine"

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
  const { theme, setTheme } = useTheme()
  const [state, dispatch] = useReducer(gameReducer, createInitialState(72))
  const [rolling, setRolling] = useState(false)
  const [currentRoll, setCurrentRoll] = useState<DiceRoll | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const rollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [pendingBagSize, setPendingBagSize] = useState<string | null>(null)
  const [accentColor, setAccentColor] = useState<AccentColor>("orange")

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
    setHydrated(true)
  }, [])

  // Persist accent color changes
  const handleAccentChange = useCallback((color: AccentColor) => {
    setAccentColor(color)
    try { localStorage.setItem("fair-catan-accent", color) } catch {}
  }, [])

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
      toast.info("Bag empty — new cycle started")
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
          toast.info("Bag empty — new cycle will start on next roll")
        }, 300)
      }
    }, animDuration)
  }, [rolling, state.bag, state.bagSize])

  const doUndo = useCallback(() => {
    if (state.previousBag && state.history.length > 0) {
      const prevRoll =
        state.history.length >= 2
          ? state.history[state.history.length - 2]
          : null
      setCurrentRoll(prevRoll)
      dispatch({ type: "UNDO" })
      toast("Last roll undone")
    }
  }, [state.previousBag, state.history])

  const requestReset = useCallback(() => {
    setShowResetDialog(true)
  }, [])

  const confirmReset = useCallback(() => {
    dispatch({ type: "RESET", bagSize: state.bagSize })
    setCurrentRoll(null)
    setShowResetDialog(false)
    toast.success("Cycle reset")
  }, [state.bagSize])

  const requestBagSizeChange = useCallback((size: string) => {
    if (size === String(state.bagSize)) return
    setPendingBagSize(size)
  }, [state.bagSize])

  const confirmBagSizeChange = useCallback(() => {
    if (!pendingBagSize) return
    dispatch({ type: "SET_BAG_SIZE", bagSize: Number(pendingBagSize) as BagSize })
    setCurrentRoll(null)
    setPendingBagSize(null)
    toast.success(`Bag size changed to ${pendingBagSize}`)
  }, [pendingBagSize])

  const cancelBagSizeChange = useCallback(() => {
    setPendingBagSize(null)
  }, [])

  const doShare = useCallback(() => {
    const lines: string[] = ["Fair Catan - Roll Summary", ""]
    lines.push(`Bag size: ${state.bagSize}`)
    lines.push(`Rolls this cycle: ${state.rollCount}`)
    lines.push(`Remaining in bag: ${state.bag.length} / ${state.bagSize}`)
    lines.push("")

    if (state.history.length > 0) {
      lines.push("Last 10 rolls:")
      const recent = state.history.slice(-10)
      for (const roll of recent) {
        lines.push(`  ${roll.die1} + ${roll.die2} = ${roll.sum}`)
      }
    }

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      toast.success("Summary copied to clipboard!")
    })
  }, [state])

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
      <div className={cn("min-h-screen bg-background", accentColor !== "orange" && `accent-${accentColor}`)}>
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <Dices className="h-7 w-7 text-primary" />
              <div>
                <h1 className="font-display text-xl font-bold text-foreground">
                  Fair Catan
                </h1>
                <p className="text-xs text-muted-foreground">
                  A fair 2d6 bag dice roller
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={String(state.bagSize)}
                onValueChange={requestBagSizeChange}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="36">36</SelectItem>
                  <SelectItem value="72">72</SelectItem>
                  <SelectItem value="144">144</SelectItem>
                </SelectContent>
              </Select>
              <div className="hidden items-center gap-1 sm:flex" aria-label="Accent color">
                <AccentPicker value={accentColor} onChange={handleAccentChange} />
              </div>
              <div className="h-5 w-px bg-border hidden sm:block" role="separator" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setTheme(theme === "dark" ? "light" : "dark")
                    }
                    aria-label="Toggle theme"
                  >
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle theme</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="mx-auto max-w-6xl px-4 py-6">
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Left Column – Dice + Controls */}
            <div className="flex flex-col gap-6 lg:col-span-2">
              {/* Dice Area */}
              <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <DiceDisplay roll={currentRoll} rolling={rolling} />

                {/* ROLL button */}
                <Button
                  onClick={doRoll}
                  disabled={rolling}
                  size="lg"
                  className="h-14 w-full max-w-xs text-lg font-bold shadow-md"
                >
                  <Dices className="mr-2 h-5 w-5" />
                  {rolling ? "Rolling..." : "ROLL"}
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
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={doUndo}
                        disabled={!state.previousBag || state.history.length === 0}
                      >
                        <Undo2 className="mr-1.5 h-3.5 w-3.5" />
                        Undo
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span className="flex items-center gap-1.5">
                        Undo last roll
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
                        Reset
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reset cycle</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={doShare}>
                        <Share2 className="mr-1.5 h-3.5 w-3.5" />
                        Share
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy summary to clipboard</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Stats Card */}
              <StatsCard history={state.history} bagSize={state.bagSize} />

              {/* Keyboard shortcuts hint */}
              <div className="hidden items-center justify-center gap-4 text-xs text-muted-foreground lg:flex">
                <span className="flex items-center gap-1.5">
                  <Keyboard className="h-3.5 w-3.5" />
                  Shortcuts:
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                    Space
                  </kbd>
                  Roll
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                    {"Ctrl+Z"}
                  </kbd>
                  Undo
                </span>
              </div>
            </div>

            {/* Right Column – Charts + History */}
            <div className="flex flex-col gap-6 lg:col-span-3">
              <ProbabilityChart bag={state.bag} />
              <BagStatus bag={state.bag} bagSize={state.bagSize} />
              <RollHistory history={state.history} />
            </div>
          </div>
        </main>
      </div>

      {/* Reset confirmation */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset cycle?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restart the bag and clear the current cycle history. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bag size change confirmation */}
      <AlertDialog open={pendingBagSize !== null} onOpenChange={(open) => { if (!open) cancelBagSizeChange() }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change bag size?</AlertDialogTitle>
            <AlertDialogDescription>
              Changing bag size will restart the cycle. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelBagSizeChange}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBagSizeChange}>
              Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}
