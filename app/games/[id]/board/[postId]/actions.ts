"use server";

import { createClient } from "@/lib/supabase/server";
import { awardIfFirst } from "@/lib/achievements";

export type CreateCommentResult =
  | { status: "error"; message: string }
  | { status: "success"; achievement: string | null };

export async function createComment(postId: number, body: string): Promise<CreateCommentResult> {
  if (!body.trim()) {
    return { status: "error", message: "댓글을 입력해주세요" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "로그인이 필요합니다" };
  }

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: user.id,
    body: body.trim(),
  });

  if (error) {
    return { status: "error", message: "등록 중 문제가 발생했습니다" };
  }

  const achievement = await awardIfFirst(supabase, user.id, "first_comment");

  return { status: "success", achievement };
}
