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

  const editedGames = Array.from(
    new Map(
      (revisions ?? []).map((r) => [
        r.game_id,
        { gameId: r.game_id, name: r.games?.name ?? "", editedAt: r.created_at },
      ]),
    ).values(),
  );

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
