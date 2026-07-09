create table game_wiki_revisions (
  id bigint generated always as identity primary key,
  game_id bigint not null references games (id) on delete cascade,
  editor_id uuid not null references profiles (id),
  content text not null,
  created_at timestamptz not null default now()
);

create index game_wiki_revisions_game_id_idx on game_wiki_revisions (game_id, created_at desc);

alter table game_wiki_revisions enable row level security;

create policy "wiki revisions are viewable by everyone"
  on game_wiki_revisions for select
  using (true);

create policy "authenticated users can add wiki revisions"
  on game_wiki_revisions for insert
  to authenticated
  with check (auth.uid() = editor_id);
