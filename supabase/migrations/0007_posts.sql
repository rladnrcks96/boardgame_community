create table posts (
  id bigint generated always as identity primary key,
  game_id bigint not null references games (id) on delete cascade,
  author_id uuid not null references profiles (id),
  category text not null check (category in ('strategy', 'variant', 'meetup')),
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index posts_game_category_idx on posts (game_id, category, created_at desc);

alter table posts enable row level security;

create policy "posts are viewable by everyone" on posts for select using (true);
create policy "authenticated users can create posts" on posts for insert to authenticated with check (auth.uid() = author_id);
