// ============================================================
// Fair Catan – Bag-based 2d6 dice engine
// ============================================================

/** Base distribution for a standard 2d6 in a 36-draw cycle. */
const BASE_DISTRIBUTION: Record<number, number> = {
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  7: 6,
  8: 5,
  9: 4,
  10: 3,
  11: 2,
  12: 1,
}

export type BagSize = 36 | 72 | 144

export interface DiceRoll {
  sum: number
  die1: number
  die2: number
}

export interface GameState {
  bag: number[]
  history: DiceRoll[]
  bagSize: BagSize
  rollCount: number
  /** Snapshot of the bag right before the last roll (for undo). */
  previousBag: number[] | null
}

/** Build a bag of sums proportional to the 2d6 distribution. */
export function buildBag(size: BagSize = 72): number[] {
  const multiplier = size / 36
  const bag: number[] = []
  for (const [sum, count] of Object.entries(BASE_DISTRIBUTION)) {
    for (let i = 0; i < count * multiplier; i++) {
      bag.push(Number(sum))
    }
  }
  return shuffle(bag)
}

/** Fisher-Yates shuffle (in-place). */
export function shuffle<T>(array: T[]): T[] {
  const a = [...array]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Given a target sum (2-12), return a random valid (die1, die2) pair.
 * Both dice must be in range [1, 6].
 */
export function getDiceCombination(sum: number): [number, number] {
  const pairs: [number, number][] = []
  for (let d1 = 1; d1 <= 6; d1++) {
    const d2 = sum - d1
    if (d2 >= 1 && d2 <= 6) {
      pairs.push([d1, d2])
    }
  }
  return pairs[Math.floor(Math.random() * pairs.length)]
}

/** Count remaining occurrences per sum value in the bag. */
export function countRemaining(bag: number[]): Record<number, number> {
  const counts: Record<number, number> = {}
  for (let i = 2; i <= 12; i++) counts[i] = 0
  for (const v of bag) counts[v] = (counts[v] || 0) + 1
  return counts
}

/** Compute probability percentages for the next roll. */
export function computeProbabilities(bag: number[]): Record<number, number> {
  const counts = countRemaining(bag)
  const total = bag.length
  const probs: Record<number, number> = {}
  for (let i = 2; i <= 12; i++) {
    probs[i] = total > 0 ? (counts[i] / total) * 100 : 0
  }
  return probs
}

/** The "expected" 2d6 probability percentages (for a truly random roll). */
export function expectedProbabilities(): Record<number, number> {
  const probs: Record<number, number> = {}
  for (let i = 2; i <= 12; i++) {
    probs[i] = (BASE_DISTRIBUTION[i] / 36) * 100
  }
  return probs
}

/** Initial state factory. */
export function createInitialState(bagSize: BagSize = 72): GameState {
  return {
    bag: buildBag(bagSize),
    history: [],
    bagSize,
    rollCount: 0,
    previousBag: null,
  }
}
