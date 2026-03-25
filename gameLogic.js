// ─── Number Guessing helpers ───────────────────────────────────────────────

export function pickSecret(lo, hi) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo
}

export function getHint(guess, secret) {
  if (guess === secret) return 'exact'
  if (Math.abs(guess - secret) <= Math.ceil((secret) * 0.05)) return 'scorching'
  if (Math.abs(guess - secret) <= Math.ceil((secret) * 0.10)) return 'hot'
  if (Math.abs(guess - secret) <= Math.ceil((secret) * 0.20)) return 'warm'
  if (Math.abs(guess - secret) <= Math.ceil((secret) * 0.35)) return 'cool'
  return 'cold'
}

export const hintMeta = {
  exact:    { label: 'Exact! 🎯',      color: '#10b981', emoji: '🎯' },
  scorching:{ label: 'Scorching 🔥🔥', color: '#ef4444', emoji: '🔥🔥' },
  hot:      { label: 'Hot 🔥',         color: '#f97316', emoji: '🔥' },
  warm:     { label: 'Warm 🌤️',        color: '#f59e0b', emoji: '🌤️' },
  cool:     { label: 'Cool 🧊',        color: '#60a5fa', emoji: '🧊' },
  cold:     { label: 'Cold ❄️',        color: '#818cf8', emoji: '❄️' },
}

export function getDirectionHint(guess, secret) {
  if (guess < secret) return '↑ Too low'
  if (guess > secret) return '↓ Too high'
  return ''
}

// Computer binary search strategy
export class ComputerGuesser {
  constructor(lo, hi) {
    this.lo = lo
    this.hi = hi
    this.low = lo
    this.high = hi
    this.lastGuess = null
  }

  nextGuess() {
    this.lastGuess = Math.floor((this.low + this.high) / 2)
    return this.lastGuess
  }

  feedback(hint) {
    if (hint === 'too_low')  this.low  = this.lastGuess + 1
    if (hint === 'too_high') this.high = this.lastGuess - 1
  }
}

// ─── Bulls & Cows helpers ──────────────────────────────────────────────────

export function calcBullsCows(guess, secret) {
  let bulls = 0, cows = 0
  const s = secret.split(''), g = guess.split('')
  for (let i = 0; i < 4; i++) {
    if (g[i] === s[i]) { bulls++; s[i] = 'B'; g[i] = 'B' }
  }
  for (let i = 0; i < 4; i++) {
    if (g[i] !== 'B') {
      const idx = s.findIndex(c => c === g[i])
      if (idx !== -1) { cows++; s[idx] = 'C' }
    }
  }
  return { bulls, cows }
}

export function generateBCSecret() {
  let d = []
  while (d.length < 4) {
    const n = Math.floor(Math.random() * 10).toString()
    if (!d.includes(n)) d.push(n)
  }
  return d.join('')
}

export function isValidBCGuess(g) {
  if (!/^\d{4}$/.test(g)) return false
  return new Set(g.split('')).size === 4
}

// Computer AI for Bulls & Cows (Knuth-style minimax)
export function bcInitPool() {
  const pool = []
  for (let i = 0; i <= 9999; i++) {
    const s = i.toString().padStart(4, '0')
    if (new Set(s.split('')).size === 4) pool.push(s)
  }
  return pool
}

export function bcFilterPool(pool, guess, bulls, cows) {
  return pool.filter(code => {
    const r = calcBullsCows(guess, code)
    return r.bulls === bulls && r.cows === cows
  })
}

export function bcPickGuess(pool) {
  // Simple: pick first remaining candidate
  return pool[0] || '1234'
}
