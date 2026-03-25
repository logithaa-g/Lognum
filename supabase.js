import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

export const isSupabaseReady = () => !!supabase

// Generate a 6-char room code
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// Create a new room
export async function createRoom(gameType, hostName, gameConfig = {}) {
  if (!supabase) throw new Error('Supabase not configured')
  const code = generateRoomCode()
  const { data, error } = await supabase
    .from('rooms')
    .insert({
      code,
      game_type: gameType,
      host_name: hostName,
      state: 'waiting',
      game_config: gameConfig,
      game_state: {}
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// Join a room
export async function joinRoom(code, guestName) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('rooms')
    .update({ guest_name: guestName, state: 'ready' })
    .eq('code', code.toUpperCase())
    .eq('state', 'waiting')
    .select()
    .single()
  if (error) throw error
  return data
}

// Get room by code
export async function getRoom(code) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .single()
  if (error) throw error
  return data
}

// Update room game state
export async function updateRoomState(roomId, updates) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('rooms')
    .update(updates)
    .eq('id', roomId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Subscribe to room changes
export function subscribeToRoom(code, callback) {
  if (!supabase) return () => {}
  const channel = supabase
    .channel(`room-${code}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'rooms',
      filter: `code=eq.${code}`
    }, payload => callback(payload.new))
    .subscribe()
  return () => supabase.removeChannel(channel)
}
