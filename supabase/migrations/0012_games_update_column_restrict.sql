-- RLS의 USING/WITH CHECK는 행 단위 제어만 가능하다. "wiki_body만 고칠 수 있다"는
-- 컬럼 단위 제어라서 컬럼 권한(GRANT)으로 별도로 좁혀야 한다. 이게 없으면 로그인한
-- 누구나 자기 세션으로 games의 name/bgg_rank/image_url 등을 직접 REST 호출해 바꿀 수 있었다.
revoke update on public.games from authenticated;
grant update (wiki_body) on public.games to authenticated;
