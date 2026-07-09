create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null unique,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles are viewable by everyone"
  on profiles for select
  using (true);

-- 회원가입 시 이메일 로컬파트로 닉네임을 자동 생성한다 (spec에 별도 닉네임 입력 화면 없음).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  base_nickname text;
  final_nickname text;
begin
  base_nickname := split_part(new.email, '@', 1);
  final_nickname := base_nickname;

  while exists (select 1 from public.profiles where nickname = final_nickname) loop
    final_nickname := base_nickname || lpad(floor(random() * 10000)::text, 4, '0');
  end loop;

  insert into public.profiles (id, nickname) values (new.id, final_nickname);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
