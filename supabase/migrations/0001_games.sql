create table games (
  id bigint generated always as identity primary key,
  bgg_id integer not null unique,
  name text not null,
  image_url text,
  min_players integer,
  max_players integer,
  playtime_min integer,
  playtime_max integer,
  difficulty_label text,
  categories text[] not null default '{}',
  bgg_rank integer not null,
  wiki_body text,
  created_at timestamptz not null default now()
);

create index games_bgg_rank_idx on games (bgg_rank);

alter table games enable row level security;

create policy "games are viewable by everyone"
  on games for select
  using (true);
