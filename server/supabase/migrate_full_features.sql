-- ============================================================
-- MetaRace Full Feature Migration
-- Run in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── Player Profiles ───────────────────────────────────────────────
create table if not exists player_profiles (
  wallet_address text primary key,
  username       text not null unique,
  avatar_seed    text,                    -- seed for Dicebear avatar generation
  bio            text default '',
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
alter table player_profiles enable row level security;
create policy "Public read profiles" on player_profiles for select using (true);

-- ── Welcome Claims ────────────────────────────────────────────────
create table if not exists welcome_claims (
  wallet_address text primary key,
  claimed_at     timestamptz default now(),
  tx_hash        text
);
alter table welcome_claims enable row level security;

-- ── Player Horses (owned horses) ─────────────────────────────────
create table if not exists player_horses (
  id             uuid primary key default uuid_generate_v4(),
  wallet_address text not null,
  horse_id       int not null,            -- 0=Storm,1=Thunder,2=Phantom,3=Celestial
  horse_name     text not null,
  tier           text not null,
  purchased_at   timestamptz default now(),
  is_active      boolean default false,   -- currently selected horse
  tx_hash        text,
  unique(wallet_address, horse_id)
);
alter table player_horses enable row level security;
create policy "Public read horses" on player_horses for select using (true);

-- ── Race Entries ──────────────────────────────────────────────────
create table if not exists race_entries (
  id             uuid primary key default uuid_generate_v4(),
  wallet_address text not null,
  horse_id       int not null default 0,
  track_id       int not null default 0,
  entry_fee      numeric not null default 20,
  session_id     uuid references game_sessions(id) on delete set null,
  entered_at     timestamptz default now()
);
alter table race_entries enable row level security;

-- ── Daily Spins ───────────────────────────────────────────────────
create table if not exists daily_spins (
  wallet_address text primary key,
  last_spin_at   timestamptz,
  streak         int default 0,
  total_spins    int default 0,
  total_earned   numeric default 0
);
alter table daily_spins enable row level security;

-- ── Referrals ─────────────────────────────────────────────────────
create table if not exists referrals (
  id               uuid primary key default uuid_generate_v4(),
  referrer_wallet  text not null,
  referred_wallet  text not null unique,
  reward_paid      boolean default false,
  reward_tx_hash   text,
  created_at       timestamptz default now()
);
alter table referrals enable row level security;

-- ── Achievements ──────────────────────────────────────────────────
create table if not exists achievements (
  id             uuid primary key default uuid_generate_v4(),
  wallet_address text not null,
  achievement_id text not null,           -- e.g. 'first_race', 'first_win', '10_races'
  earned_at      timestamptz default now(),
  unique(wallet_address, achievement_id)
);
alter table achievements enable row level security;
create policy "Public read achievements" on achievements for select using (true);

-- ── Update game_leaderboard view to include username ──────────────
drop view if exists game_leaderboard;
create view game_leaderboard as
select
  gs.wallet_address,
  coalesce(pp.username, gs.wallet_address) as display_name,
  pp.avatar_seed,
  max(gs.final_score)      as best_score,
  count(*)                 as total_games,
  sum(gs.mrt_rewarded)     as total_mrt_earned,
  count(*) filter (where gs.placement = 1) as wins,
  max(gs.played_at)        as last_played,
  rank() over (order by max(gs.final_score) desc) as rank
from game_sessions gs
left join player_profiles pp on pp.wallet_address = gs.wallet_address
group by gs.wallet_address, pp.username, pp.avatar_seed
order by best_score desc;

-- ── Indexes for performance ───────────────────────────────────────
create index if not exists idx_game_sessions_wallet on game_sessions(wallet_address);
create index if not exists idx_game_sessions_played_at on game_sessions(played_at);
create index if not exists idx_race_entries_wallet on race_entries(wallet_address);
create index if not exists idx_achievements_wallet on achievements(wallet_address);
