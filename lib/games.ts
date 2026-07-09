import { createClient } from "@/lib/supabase/server";

export async function getGames(query?: string) {
  const supabase = await createClient();
  let request = supabase
    .from("games")
    .select("id, name, image_url, bgg_rank")
    .order("bgg_rank", { ascending: true });

  if (query) {
    request = request.ilike("name", `%${query}%`);
  }

  const { data } = await request;
  return data ?? [];
}

export type TagCount = { name: string; count: number };

export async function getGameDetail(idParam: string) {
  const id = Number(idParam);
  if (!Number.isInteger(id)) return null;

  const supabase = await createClient();

  const { data: game } = await supabase
    .from("games")
    .select(
      "id, name, image_url, min_players, max_players, playtime_min, playtime_max, difficulty_label, categories, bgg_rank, wiki_body",
    )
    .eq("id", id)
    .maybeSingle();

  if (!game) return null;

  const { data: revisions } = await supabase
    .from("game_wiki_revisions")
    .select("id, created_at, profiles(nickname)")
    .eq("game_id", id)
    .order("created_at", { ascending: false });

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, body, created_at, profiles(nickname), review_tags(tags(name))")
    .eq("game_id", id)
    .order("created_at", { ascending: false });

  const reviewList = reviews ?? [];
  const averageRating =
    reviewList.length > 0
      ? reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length
      : null;

  const tagCounts = new Map<string, number>();
  for (const review of reviewList) {
    for (const rt of review.review_tags ?? []) {
      const name = rt.tags?.name;
      if (name) tagCounts.set(name, (tagCounts.get(name) ?? 0) + 1);
    }
  }
  const tagAggregation: TagCount[] = Array.from(tagCounts, ([name, count]) => ({ name, count }));

  return {
    game,
    revisions: revisions ?? [],
    reviews: reviewList,
    averageRating,
    tagAggregation,
  };
}
