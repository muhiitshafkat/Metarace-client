-- ============================================================
-- MetaRace Supabase Schema
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Users ────────────────────────────────────────────────────────
create table if not exists users (
  id                   uuid primary key default uuid_generate_v4(),
  name                 text not null,
  email                text not null unique,
  gender               text not null,
  password             text not null,
  avatar_public_id     text,
  avatar_url           text,
  role                 text not null default 'user',
  reset_password_token text,
  reset_password_expire timestamptz,
  created_at           timestamptz default now()
);

-- ── Products ─────────────────────────────────────────────────────
create table if not exists products (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  description      text not null,
  highlights       text[] not null default '{}',
  specifications   jsonb not null default '[]',
  price            numeric not null,
  cutted_price     numeric not null,
  images           jsonb not null default '[]',   -- [{public_id, url}]
  brand_name       text not null,
  brand_logo_id    text not null,
  brand_logo_url   text not null,
  category         text not null,
  stock            int not null default 1,
  warranty         int default 1,
  ratings          numeric default 0,
  num_of_reviews   int default 0,
  user_id          uuid references users(id) on delete set null,
  created_at       timestamptz default now()
);

-- ── Reviews ──────────────────────────────────────────────────────
create table if not exists reviews (
  id         uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  name       text not null,
  rating     numeric not null,
  comment    text not null,
  created_at timestamptz default now(),
  unique(product_id, user_id)
);

-- ── Orders ───────────────────────────────────────────────────────
create table if not exists orders (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references users(id) on delete cascade,
  shipping_info  jsonb not null,   -- {address, city, state, country, pincode, phoneNo}
  order_items    jsonb not null,   -- [{name, price, quantity, image, product_id}]
  payment_info   jsonb not null,   -- {id, status}
  paid_at        timestamptz not null,
  total_price    numeric not null default 0,
  order_status   text not null default 'Processing',
  shipped_at     timestamptz,
  delivered_at   timestamptz,
  created_at     timestamptz default now()
);

-- ── Payments ─────────────────────────────────────────────────────
create table if not exists payments (
  id              uuid primary key default uuid_generate_v4(),
  result_status   text not null,
  result_code     text not null,
  result_msg      text not null,
  txn_id          text not null,
  bank_txn_id     text not null,
  order_id        text not null,
  txn_amount      text not null,
  txn_type        text not null,
  gateway_name    text not null,
  bank_name       text not null,
  mid             text not null,
  payment_mode    text not null,
  refund_amt      text not null,
  txn_date        text not null,
  created_at      timestamptz default now()
);

-- ── Row Level Security (RLS) ─────────────────────────────────────
-- We use service role key on the server so RLS is bypassed server-side.
-- Enable RLS anyway as a safety net if anon key is ever used.
alter table users    enable row level security;
alter table products enable row level security;
alter table reviews  enable row level security;
alter table orders   enable row level security;
alter table payments enable row level security;

-- Public can read products and reviews
create policy "Public read products" on products for select using (true);
create policy "Public read reviews"  on reviews  for select using (true);

-- ── Game Sessions ─────────────────────────────────────────────────
-- One row per completed game. wallet_address is the MetaMask address
-- (not a user_id — players don't need a platform account to play).
create table if not exists game_sessions (
  id               uuid primary key default uuid_generate_v4(),
  wallet_address   text not null,
  score            int not null default 0,
  multiplier       numeric not null default 1,
  staked_nft_count int not null default 0,
  final_score      int not null default 0,   -- score * multiplier (rounded)
  medals_claimed   boolean not null default false,
  played_at        timestamptz default now()
);

-- ── Game Leaderboard view ─────────────────────────────────────────
-- Top score per wallet, ranked. Refreshes automatically.
create or replace view game_leaderboard as
select
  wallet_address,
  max(final_score)  as best_score,
  count(*)          as total_games,
  max(played_at)    as last_played,
  rank() over (order by max(final_score) desc) as rank
from game_sessions
group by wallet_address
order by best_score desc;

-- ── RLS for game_sessions ─────────────────────────────────────────
alter table game_sessions enable row level security;
-- Server (service role) bypasses RLS. Public can read leaderboard only.
create policy "Public read game_sessions" on game_sessions for select using (true);

-- ── Game Sessions — add MRT reward columns ────────────────────────
-- Run this if you already created the game_sessions table earlier.
-- If creating fresh, the full table definition below replaces the old one.

alter table game_sessions
  add column if not exists placement        int not null default 4,
  add column if not exists mrt_rewarded     numeric not null default 0,
  add column if not exists reward_tx_hash   text;

-- Recreate leaderboard view to include MRT totals
create or replace view game_leaderboard as
select
  wallet_address,
  max(final_score)          as best_score,
  count(*)                  as total_games,
  sum(mrt_rewarded)         as total_mrt_earned,
  max(played_at)            as last_played,
  rank() over (order by max(final_score) desc) as rank
from game_sessions
group by wallet_address
order by best_score desc;
