create table achievements (
  id bigint generated always as identity primary key,
  key text not null unique,
  label text not null
);

create table user_achievements (
  user_id uuid not null references profiles (id) on delete cascade,
  achievement_id bigint not null references achievements (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

insert into achievements (key, label) values
  ('first_wiki_edit', '첫 위키 편집'),
  ('first_review', '첫 리뷰 작성'),
  ('first_post', '첫 게시글 작성'),
  ('first_comment', '첫 댓글 작성'),
  ('first_post_liked', '첫 좋아요 받음');

alter table achievements enable row level security;
alter table user_achievements enable row level security;

create policy "achievements are viewable by everyone" on achievements for select using (true);
create policy "user achievements are viewable by everyone" on user_achievements for select using (true);
create policy "users can insert own achievement" on user_achievements for insert to authenticated with check (auth.uid() = user_id);
