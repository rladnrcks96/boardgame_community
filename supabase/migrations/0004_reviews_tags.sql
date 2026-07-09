create table reviews (
  id bigint generated always as identity primary key,
  game_id bigint not null references games (id) on delete cascade,
  user_id uuid not null references profiles (id),
  rating smallint not null check (rating between 1 and 5),
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id, user_id)
);

create table tags (
  id bigint generated always as identity primary key,
  name text not null unique,
  category text not null check (category in ('mechanic', 'experience'))
);

create table review_tags (
  review_id bigint not null references reviews (id) on delete cascade,
  tag_id bigint not null references tags (id) on delete cascade,
  primary key (review_id, tag_id)
);

insert into tags (name, category) values
  ('마피아류', 'mechanic'),
  ('덱빌딩', 'mechanic'),
  ('다이스', 'mechanic'),
  ('협력', 'mechanic'),
  ('워커플레이스먼트', 'mechanic'),
  ('타일배치', 'mechanic'),
  ('경매/블러핑', 'mechanic'),
  ('뉴비친화적', 'experience'),
  ('고인물용', 'experience'),
  ('파티게임', 'experience'),
  ('우정파괴', 'experience'),
  ('두뇌게임', 'experience'),
  ('가족용', 'experience'),
  ('라이트', 'experience');

alter table reviews enable row level security;
alter table tags enable row level security;
alter table review_tags enable row level security;

create policy "reviews are viewable by everyone" on reviews for select using (true);
create policy "authenticated users can insert own review" on reviews for insert to authenticated with check (auth.uid() = user_id);
create policy "users can update own review" on reviews for update to authenticated using (auth.uid() = user_id);

create policy "tags are viewable by everyone" on tags for select using (true);

create policy "review tags are viewable by everyone" on review_tags for select using (true);
create policy "users can insert tags on own review" on review_tags for insert to authenticated with check (
  exists (select 1 from reviews where reviews.id = review_id and reviews.user_id = auth.uid())
);
create policy "users can delete tags on own review" on review_tags for delete to authenticated using (
  exists (select 1 from reviews where reviews.id = review_id and reviews.user_id = auth.uid())
);
