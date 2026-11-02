-- ============================================================
-- Migration: Add MRT reward columns to game_sessions
-- Run ONLY this file in Supabase SQL Editor
-- ============================================================

-- Step 1: Add new columns to existing game_sessions table
alter table game_sessions
  add column if not exists placement        int not null default 4,
  add column if not exists mrt_rewarded     numeric not null default 0,
  add column if not exists reward_tx_hash   text;

-- Step 2: Drop the old view first (required before changing column structure)
drop view if exists game_leaderboard;

-- Step 3: Recreate with MRT totals column added
create view game_leaderboard as
select
  wallet_address,
  max(final_score)      as best_score,
  count(*)              as total_games,
  sum(mrt_rewarded)     as total_mrt_earned,
  max(played_at)        as last_played,
  rank() over (order by max(final_score) desc) as rank
from game_sessions
group by wallet_address
order by best_score desc;
