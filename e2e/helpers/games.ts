import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function getGameIdByBggId(bggId: number) {
  const { data, error } = await admin().from("games").select("id").eq("bgg_id", bggId).single();
  if (error) throw error;
  return data.id as number;
}

export async function insertWikiRevision(gameId: number, editorId: string, content: string) {
  const { error } = await admin().from("game_wiki_revisions").insert({ game_id: gameId, editor_id: editorId, content });
  if (error) throw error;
}

export async function insertReview(
  gameId: number,
  userId: string,
  rating: number,
  body: string,
  tagNames: string[] = [],
) {
  const db = admin();
  const { data: review, error } = await db
    .from("reviews")
    .insert({ game_id: gameId, user_id: userId, rating, body })
    .select("id")
    .single();
  if (error) throw error;

  if (tagNames.length > 0) {
    const { data: tags, error: tagsError } = await db.from("tags").select("id, name").in("name", tagNames);
    if (tagsError) throw tagsError;
    await db.from("review_tags").insert(tags.map((t) => ({ review_id: review.id, tag_id: t.id })));
  }
}

export async function cleanupUserContent(userId: string) {
  const db = admin();
  await db.from("review_tags").delete().in(
    "review_id",
    (await db.from("reviews").select("id").eq("user_id", userId)).data?.map((r) => r.id) ?? [],
  );
  await db.from("reviews").delete().eq("user_id", userId);
  await db.from("game_wiki_revisions").delete().eq("editor_id", userId);
}
