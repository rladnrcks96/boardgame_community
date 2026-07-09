"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

export type ToggleLikeResult =
  | { status: "error"; message: string }
  | { status: "success"; liked: boolean };

export async function toggleLike(postId: number): Promise<ToggleLikeResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "로그인이 필요합니다" };
  }

  const { data: existing } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
    return { status: "success", liked: false };
  }

  await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });

  const { data: post } = await supabase.from("posts").select("author_id").eq("id", postId).single();
  if (post) {
    // 작성자에게 지급하는 업적이라 RLS를 우회하는 admin 클라이언트를 쓴다 (일반 세션은 남의 user_achievements에 못 씀).
    await awardIfFirst(createAdminClient(), post.author_id, "first_post_liked", { selfTriggered: false });
  }

  return { status: "success", liked: true };
}
