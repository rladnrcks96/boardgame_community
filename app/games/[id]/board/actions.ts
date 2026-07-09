"use server";

import { createClient } from "@/lib/supabase/server";
import { awardIfFirst } from "@/lib/achievements";

export type CreatePostResult =
  | { status: "error"; message: string }
  | { status: "success"; achievement: string | null; postId: number };

const CATEGORIES = ["strategy", "variant", "meetup"] as const;
export type PostCategory = (typeof CATEGORIES)[number];

export async function createPost(
  gameId: number,
  category: PostCategory,
  title: string,
  body: string,
): Promise<CreatePostResult> {
  if (!title.trim()) {
    return { status: "error", message: "제목을 입력해주세요" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "로그인이 필요합니다" };
  }

  const { data: post, error } = await supabase
    .from("posts")
    .insert({ game_id: gameId, author_id: user.id, category, title: title.trim(), body })
    .select("id")
    .single();

  if (error || !post) {
    return { status: "error", message: "등록 중 문제가 발생했습니다" };
  }

  const achievement = await awardIfFirst(supabase, user.id, "first_post");

  return { status: "success", achievement, postId: post.id };
}
