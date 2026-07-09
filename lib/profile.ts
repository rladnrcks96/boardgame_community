import { createClient } from "@/lib/supabase/server";

export async function getProfile(userId: string) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, created_at")
    .eq("id", userId)
    .single();

  const { data: badgeRows } = await supabase
    .from("user_achievements")
    .select("achievements(label)")
    .eq("user_id", userId);

  const { data: revisions } = await supabase
    .from("game_wiki_revisions")
    .select("game_id, created_at, games(name)")
    .eq("editor_id", userId)
    .order("created_at", { ascending: false });

  // revisions는 created_at desc로 정렬돼 있다. 게임당 가장 최근 편집만 남기려면
  // 이미 본 game_id는 건너뛰어야 한다 (Map에 통째로 넣으면 배열의 "마지막" 값이
  // 남아 가장 오래된 편집일이 남는 반대 결과가 된다).
  const editedGamesMap = new Map<number, { gameId: number; name: string; editedAt: string }>();
  for (const r of revisions ?? []) {
    if (!editedGamesMap.has(r.game_id)) {
      editedGamesMap.set(r.game_id, { gameId: r.game_id, name: r.games?.name ?? "", editedAt: r.created_at });
    }
  }
  const editedGames = Array.from(editedGamesMap.values());

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, game_id, games(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, game_id")
    .eq("author_id", userId)
    .order("created_at", { ascending: false });

  const { data: comments } = await supabase
    .from("comments")
    .select("id, body, post_id, posts(game_id, title)")
    .eq("author_id", userId)
    .order("created_at", { ascending: false });

  return {
    profile,
    badges: (badgeRows ?? []).map((b) => b.achievements?.label).filter((l): l is string => !!l),
    editedGames,
    reviews: reviews ?? [],
    posts: posts ?? [],
    comments: comments ?? [],
  };
}
