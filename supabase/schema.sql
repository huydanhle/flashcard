-- Decks table: each user sees only their own decks (enforced by RLS)
create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists decks_user_id_idx on public.decks(user_id);
alter table public.decks enable row level security;

create policy "Users can read own decks"
  on public.decks for select using (auth.uid() = user_id);
create policy "Users can insert own decks"
  on public.decks for insert with check (auth.uid() = user_id);
create policy "Users can update own decks"
  on public.decks for update using (auth.uid() = user_id);
create policy "Users can delete own decks"
  on public.decks for delete using (auth.uid() = user_id);

-- Flashcards table: each user sees only their own cards (enforced by RLS)
create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deck_id uuid references public.decks(id) on delete set null,
  word text not null,
  meaning text not null,
  difficulty_level text check (difficulty_level in ('easy', 'medium', 'hard')),
  last_reviewed timestamptz,
  review_count int not null default 0,
  next_review_at timestamptz,
  created_at timestamptz not null default now()
);

-- For existing DBs: add deck_id if table already existed without it
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'flashcards' and column_name = 'deck_id'
  ) then
    alter table public.flashcards add column deck_id uuid references public.decks(id) on delete set null;
  end if;
end $$;

-- Index for fast lookups by user and quiz "due" queries
create index if not exists flashcards_user_id_idx on public.flashcards(user_id);
create index if not exists flashcards_next_review_at_idx on public.flashcards(user_id, next_review_at);
create index if not exists flashcards_deck_id_idx on public.flashcards(deck_id);

-- RLS: users can only read/insert/update/delete their own rows
alter table public.flashcards enable row level security;

create policy "Users can read own flashcards"
  on public.flashcards for select
  using (auth.uid() = user_id);

create policy "Users can insert own flashcards"
  on public.flashcards for insert
  with check (auth.uid() = user_id);

create policy "Users can update own flashcards"
  on public.flashcards for update
  using (auth.uid() = user_id);

create policy "Users can delete own flashcards"
  on public.flashcards for delete
  using (auth.uid() = user_id);

-- Optional: review_streaks table for dashboard (streak = consecutive days with at least one review)
-- Alternatively streaks can be computed in app from flashcards.last_reviewed.
-- Uncomment if you prefer storing streaks in DB:
/*
create table if not exists public.review_streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak_days int not null default 0,
  last_review_date date
);
alter table public.review_streaks enable row level security;
create policy "Users can read own streak" on public.review_streaks for select using (auth.uid() = user_id);
create policy "Users can upsert own streak" on public.review_streaks for all using (auth.uid() = user_id);
*/
