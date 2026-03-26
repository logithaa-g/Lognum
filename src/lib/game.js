// ── Number Guessing ────────────────────────────────────────────
export const pickSecret = (lo, hi) =>
  Math.floor(Math.random() * (hi - lo + 1)) + lo

export function getHint(guess, secret) {
  const diff = Math.abs(guess - secret)
  const range = secret || 1
  if (diff === 0)            return 'exact'
  if (diff <= range * 0.05)  return 'scorching'
  if (diff <= range * 0.10)  return 'hot'
  if (diff <= range * 0.20)  return 'warm'
  if (diff <= range * 0.35)  return 'cool'
  return 'cold'
}

export const HINTS = {
  exact:     { label: 'Exact! 🎯',       color: '#10b981', emoji: '🎯' },
  scorching: { label: 'Scorching 🔥🔥',  color: '#ef4444', emoji: '🔥🔥' },
  hot:       { label: 'Hot 🔥',          color: '#f97316', emoji: '🔥' },
  warm:      { label: 'Warm 🌤️',         color: '#f59e0b', emoji: '🌤️' },
  cool:      { label: 'Cool 🧊',         color: '#60a5fa', emoji: '🧊' },
  cold:      { label: 'Cold ❄️',         color: '#818cf8', emoji: '❄️' },
}

export const dirHint = (g, s) => g < s ? '↑ Too low' : g > s ? '↓ Too high' : ''

// Computer binary-search guesser
export class BotGuesser {
  constructor(lo, hi) { this.lo = lo; this.hi = hi; this.guess = null }
  next() { this.guess = Math.floor((this.lo + this.hi) / 2); return this.guess }
  update(dir) {
    if (dir === 'low')  this.lo = this.guess + 1
    if (dir === 'high') this.hi = this.guess - 1
  }
}

// ── Bulls & Cows ───────────────────────────────────────────────
export function calcBC(guess, secret) {
  let bulls = 0, cows = 0
  const s = secret.split(''), g = guess.split('')
  for (let i = 0; i < 4; i++) {
    if (g[i] === s[i]) { bulls++; s[i] = 'X'; g[i] = 'X' }
  }
  for (let i = 0; i < 4; i++) {
    if (g[i] !== 'X') {
      const j = s.indexOf(g[i])
      if (j !== -1) { cows++; s[j] = 'X' }
    }
  }
  return { bulls, cows }
}

export function genBCSecret() {
  const d = []
  while (d.length < 4) {
    const n = String(Math.floor(Math.random() * 10))
    if (!d.includes(n)) d.push(n)
  }
  return d.join('')
}

export const validBC = g => /^\d{4}$/.test(g) && new Set(g).size === 4

export function bcInitPool() {
  const p = []
  for (let i = 0; i <= 9999; i++) {
    const s = String(i).padStart(4, '0')
    if (new Set(s).size === 4) p.push(s)
  }
  return p
}

export const bcFilter = (pool, guess, b, c) =>
  pool.filter(code => { const r = calcBC(guess, code); return r.bulls === b && r.cows === c })

export const bcPick = pool => pool[0] || '1234'
