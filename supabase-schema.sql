-- Run this in your Supabase SQL Editor
-- https://supabase.com/dashboard → your project → SQL Editor

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  game_type TEXT NOT NULL CHECK (game_type IN ('numguess', 'bullscows')),
  host_name TEXT NOT NULL,
  guest_name TEXT,
  state TEXT NOT NULL DEFAULT 'waiting' CHECK (state IN ('waiting', 'ready', 'playing', 'finished')),
  game_config JSONB DEFAULT '{}',
  game_state JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on code for fast lookups
CREATE INDEX IF NOT EXISTS rooms_code_idx ON rooms (code);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rooms_updated_at ON rooms;
CREATE TRIGGER rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read rooms (needed for joining)
CREATE POLICY "Anyone can read rooms" ON rooms
  FOR SELECT USING (true);

-- Allow anyone to insert rooms (host creates room)
CREATE POLICY "Anyone can create rooms" ON rooms
  FOR INSERT WITH CHECK (true);

-- Allow anyone to update rooms (guest joins, game progresses)
CREATE POLICY "Anyone can update rooms" ON rooms
  FOR UPDATE USING (true);

-- Enable Realtime for the rooms table
-- Go to Supabase Dashboard → Database → Replication → enable rooms table
-- OR run:
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;

-- Optional: auto-delete old rooms after 24 hours (run as a cron job or just clean manually)
-- DELETE FROM rooms WHERE created_at < NOW() - INTERVAL '24 hours';
