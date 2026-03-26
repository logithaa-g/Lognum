import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL || ''
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = URL && KEY ? createClient(URL, KEY) : null
export const isReady  = () => !!supabase

// ── Auth ──────────────────────────────────────────────
export async function signUp(email, password, username) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { username } }
  })
  if (error) throw error
  return data
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export function onAuthChange(cb) {
  return supabase.auth.onAuthStateChange((_e, session) => cb(session))
}

// ── Profile ───────────────────────────────────────────
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles').select('*').eq('id', userId).single()
  if (error) throw error
  return data
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles').update(updates).eq('id', userId).select().single()
  if (error) throw error
  return data
}

export async function recordWin(userId, coinsEarned = 50) {
  // fetch current
  const p = await getProfile(userId)
  const newStreak   = (p.current_streak || 0) + 1
  const highStreak  = Math.max(newStreak, p.highest_streak || 0)
  return updateProfile(userId, {
    games_played: (p.games_played || 0) + 1,
    games_won:    (p.games_won    || 0) + 1,
    current_streak: newStreak,
    highest_streak: highStreak,
    coins: (p.coins || 0) + coinsEarned,
  })
}

export async function recordLoss(userId) {
  const p = await getProfile(userId)
  return updateProfile(userId, {
    games_played: (p.games_played || 0) + 1,
    current_streak: 0,
  })
}

// ── Rooms ─────────────────────────────────────────────
function genCode() {
  return Array.from({ length: 6 }, () =>
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]
  ).join('')
}

export async function createRoom(gameType, hostId, hostName, gameConfig = {}) {
  const code = genCode()
  const { data, error } = await supabase.from('rooms').insert({
    code, game_type: gameType,
    host_id: hostId, host_name: hostName,
    status: 'waiting', game_config: gameConfig, game_state: {}
  }).select().single()
  if (error) throw error
  return data
}

export async function joinRoom(code, guestId, guestName) {
  // Find room first
  const { data: room, error: findErr } = await supabase
    .from('rooms').select('*').eq('code', code.toUpperCase().trim()).single()
  if (findErr || !room) throw new Error('Room not found')
  if (room.status !== 'waiting') throw new Error('Room already started or full')

  const { data, error } = await supabase
    .from('rooms')
    .update({ guest_id: guestId, guest_name: guestName, status: 'lobby' })
    .eq('id', room.id)
    .select().single()
  if (error) throw error
  return data
}

export async function updateRoom(roomId, updates) {
  const { data, error } = await supabase
    .from('rooms').update(updates).eq('id', roomId).select().single()
  if (error) throw error
  return data
}

export async function getRoom(code) {
  const { data, error } = await supabase
    .from('rooms').select('*').eq('code', code.toUpperCase()).single()
  if (error) throw error
  return data
}

export function subscribeRoom(roomId, cb) {
  if (!supabase) return () => {}
  const ch = supabase.channel(`room-${roomId}`)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'rooms',
      filter: `id=eq.${roomId}`
    }, p => cb(p.new))
    .subscribe()
  return () => supabase.removeChannel(ch)
}
