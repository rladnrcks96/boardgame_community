create table post_likes (
  post_id bigint not null references posts (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table post_likes enable row level security;

create policy "post likes are viewable by everyone" on post_likes for select using (true);
create policy "authenticated users can like posts" on post_likes for insert to authenticated with check (auth.uid() = user_id);
create policy "users can remove their own like" on post_likes for delete to authenticated using (auth.uid() = user_id);
