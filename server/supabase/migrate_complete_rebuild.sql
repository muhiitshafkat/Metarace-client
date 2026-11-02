-- ============================================================
-- MetaRace Complete DB Rebuild
-- Run this ONCE in Supabase SQL Editor
-- Safe to run on existing data — uses IF NOT EXISTS + DROP/CREATE
-- ============================================================

-- ── 1. Core game sessions (already exists, ensure columns) ───────
alter table game_sessions
  add column if not exists placement        int not null default 4,
  add column if not exists mrt_rewarded     numeric not null default 0,
  add column if not exists reward_tx_hash   text;

-- ── 2. Player profiles ────────────────────────────────────────────
create table if not exists player_profiles (
  wallet_address text primary key,
  username       text not null unique,
  avatar_seed    text,
  bio            text default '',
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
alter table player_profiles enable row level security;
drop policy if exists "Public read profiles" on player_profiles;
create policy "Public read profiles" on player_profiles for select using (true);

-- ── 3. Welcome claims ─────────────────────────────────────────────
create table if not exists welcome_claims (
  wallet_address text primary key,
  claimed_at     timestamptz default now(),
  tx_hash        text
);
alter table welcome_claims enable row level security;

-- ── 4. Achievements ───────────────────────────────────────────────
create table if not exists achievements (
  id             uuid primary key default uuid_generate_v4(),
  wallet_address text not null,
  achievement_id text not null,
  earned_at      timestamptz default now(),
  unique(wallet_address, achievement_id)
);
alter table achievements enable row level security;
drop policy if exists "Public read achievements" on achievements;
create policy "Public read achievements" on achievements for select using (true);

-- ── 5. Player horses ──────────────────────────────────────────────
create table if not exists player_horses (
  id             uuid primary key default uuid_generate_v4(),
  wallet_address text not null,
  horse_id       int not null,
  horse_name     text not null,
  tier           text not null,
  purchased_at   timestamptz default now(),
  is_active      boolean default false,
  tx_hash        text,
  unique(wallet_address, horse_id)
);
alter table player_horses enable row level security;
drop policy if exists "Public read horses" on player_horses;
create policy "Public read horses" on player_horses for select using (true);

-- ── 6. Race entries ───────────────────────────────────────────────
create table if not exists race_entries (
  id             uuid primary key default uuid_generate_v4(),
  wallet_address text not null,
  horse_id       int not null default 0,
  track_id       int not null default 0,
  entry_fee      numeric not null default 20,
  tx_hash        text,
  session_id     uuid references game_sessions(id) on delete set null,
  entered_at     timestamptz default now()
);
alter table race_entries enable row level security;

-- ── 7. Daily spins ────────────────────────────────────────────────
create table if not exists daily_spins (
  wallet_address text primary key,
  last_spin_at   timestamptz,
  streak         int default 0,
  total_spins    int default 0,
  total_earned   numeric default 0
);
alter table daily_spins enable row level security;

-- ── 8. Referrals ──────────────────────────────────────────────────
create table if not exists referrals (
  id               uuid primary key default uuid_generate_v4(),
  referrer_wallet  text not null,
  referred_wallet  text not null unique,
  reward_paid      boolean default false,
  reward_tx_hash   text,
  created_at       timestamptz default now()
);
alter table referrals enable row level security;

-- ── 9. Leaderboard view (COMPLETE rebuild with all columns) ───────
drop view if exists game_leaderboard;
create view game_leaderboard as
select
  gs.wallet_address,
  coalesce(pp.username, gs.wallet_address)          as display_name,
  pp.avatar_seed,
  max(gs.final_score)                               as best_score,
  count(*)::int                                     as total_games,
  coalesce(sum(gs.mrt_rewarded), 0)                 as total_mrt_earned,
  count(*) filter (where gs.placement = 1)::int     as wins,
  max(gs.played_at)                                 as last_played,
  rank() over (order by max(gs.final_score) desc)::int as rank
from game_sessions gs
left join player_profiles pp on pp.wallet_address = gs.wallet_address
group by gs.wallet_address, pp.username, pp.avatar_seed
order by best_score desc;

-- ── 10. Performance indexes ───────────────────────────────────────
create index if not exists idx_game_sessions_wallet     on game_sessions(wallet_address);
create index if not exists idx_game_sessions_played_at  on game_sessions(played_at);
create index if not exists idx_game_sessions_placement  on game_sessions(placement);
create index if not exists idx_achievements_wallet      on achievements(wallet_address);
create index if not exists idx_race_entries_wallet      on race_entries(wallet_address);
create index if not exists idx_welcome_claims_wallet    on welcome_claims(wallet_address);

-- ── 11. Backfill achievements for existing players ────────────────
-- Awards achievements retroactively based on existing game_sessions data
do $$
declare
  r record;
  total_games int;
  wins int;
  total_mrt numeric;
begin
  for r in select distinct wallet_address from game_sessions loop
    select
      count(*)::int,
      count(*) filter (where placement = 1)::int,
      coalesce(sum(mrt_rewarded), 0)
    into total_games, wins, total_mrt
    from game_sessions
    where wallet_address = r.wallet_address;

    -- Award each achievement if threshold met (ignore if already exists)
    if total_games >= 1 then
      insert into achievements(wallet_address, achievement_id)
      values(r.wallet_address, 'first_race')
      on conflict(wallet_address, achievement_id) do nothing;
    end if;

    if wins >= 1 then
      insert into achievements(wallet_address, achievement_id)
      values(r.wallet_address, 'first_win')
      on conflict(wallet_address, achievement_id) do nothing;
    end if;

    if total_games >= 10 then
      insert into achievements(wallet_address, achievement_id)
      values(r.wallet_address, 'races_10')
      on conflict(wallet_address, achievement_id) do nothing;
    end if;

    if total_games >= 50 then
      insert into achievements(wallet_address, achievement_id)
      values(r.wallet_address, 'races_50')
      on conflict(wallet_address, achievement_id) do nothing;
    end if;

    if wins >= 5 then
      insert into achievements(wallet_address, achievement_id)
      values(r.wallet_address, 'wins_5')
      on conflict(wallet_address, achievement_id) do nothing;
    end if;

    if total_mrt >= 100 then
      insert into achievements(wallet_address, achievement_id)
      values(r.wallet_address, 'mrt_100')
      on conflict(wallet_address, achievement_id) do nothing;
    end if;

    if total_mrt >= 1000 then
      insert into achievements(wallet_address, achievement_id)
      values(r.wallet_address, 'mrt_1000')
      on conflict(wallet_address, achievement_id) do nothing;
    end if;
  end loop;
end $$;

-- ── 12. Backfill welcome achievements for claimed wallets ─────────
insert into achievements(wallet_address, achievement_id)
select wallet_address, 'welcome'
from welcome_claims
on conflict(wallet_address, achievement_id) do nothing;

-- ── Done ──────────────────────────────────────────────────────────
-- After running this:
-- 1. Leaderboard will show wins + total_mrt_earned correctly
-- 2. All existing players get their achievements retroactively
-- 3. All tables exist with correct constraints
-- 4. Indexes improve query performance
