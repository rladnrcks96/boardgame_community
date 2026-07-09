"use server";

import { createClient } from "@/lib/supabase/server";
import { awardIfFirst } from "@/lib/achievements";

export type SaveReviewResult =
  | { status: "error"; message: string }
  | { status: "success"; achievement: string | null };

export async function saveReview(
  gameId: number,
  rating: number,
  body: string,
  tagIds: number[],
): Promise<SaveReviewResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "로그인이 필요합니다" };
  }

  const { data: review, error } = await supabase
    .from("reviews")
    .upsert(
      { game_id: gameId, user_id: user.id, rating, body, updated_at: new Date().toISOString() },
      { onConflict: "game_id,user_id" },
    )
    .select("id")
    .single();

  if (error || !review) {
    return { status: "error", message: "저장 중 문제가 발생했습니다" };
  }

  await supabase.from("review_tags").delete().eq("review_id", review.id);
  if (tagIds.length > 0) {
    await supabase.from("review_tags").insert(tagIds.map((tagId) => ({ review_id: review.id, tag_id: tagId })));
  }

  const achievement = await awardIfFirst(supabase, user.id, "first_review");

  return { status: "success", achievement };
}
