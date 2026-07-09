import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

const ACHIEVEMENT_LABELS = {
  first_wiki_edit: "첫 위키 편집",
  first_review: "첫 리뷰 작성",
  first_post: "첫 게시글 작성",
  first_comment: "첫 댓글 작성",
  first_post_liked: "첫 좋아요 받음",
} as const;

export type AchievementKey = keyof typeof ACHIEVEMENT_LABELS;

// 해당 유형의 첫 행동이면 뱃지를 지급하고 라벨을 반환한다. 이미 획득했으면 null.
export async function awardIfFirst(
  supabase: SupabaseClient<Database>,
  userId: string,
  key: AchievementKey,
): Promise<string | null> {
  const { data: achievement } = await supabase
    .from("achievements")
    .select("id")
    .eq("key", key)
    .single();

  if (!achievement) return null;

  const { error } = await supabase
    .from("user_achievements")
    .insert({ user_id: userId, achievement_id: achievement.id });

  if (error) {
    if (error.code === "23505") return null; // 이미 획득 (unique 제약 위반)
    throw error;
  }

  return ACHIEVEMENT_LABELS[key];
}
