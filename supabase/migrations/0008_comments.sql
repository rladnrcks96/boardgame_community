create table comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references posts (id) on delete cascade,
  author_id uuid not null references profiles (id),
  body text not null,
  created_at timestamptz not null default now()
);

create index comments_post_id_idx on comments (post_id, created_at);

alter table comments enable row level security;

create policy "comments are viewable by everyone" on comments for select using (true);
create policy "authenticated users can create comments" on comments for insert to authenticated with check (auth.uid() = author_id);
