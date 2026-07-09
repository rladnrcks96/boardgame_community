"use server";

import { createClient } from "@/lib/supabase/server";
import { awardIfFirst } from "@/lib/achievements";

export type SaveWikiEditResult =
  | { status: "error"; message: string }
  | { status: "success"; achievement: string | null };

export async function saveWikiEdit(gameId: number, content: string): Promise<SaveWikiEditResult> {
  const trimmed = content.trim();
  if (!trimmed) {
    return { status: "error", message: "내용을 입력해주세요" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "로그인이 필요합니다" };
  }

  const { error: updateError } = await supabase
    .from("games")
    .update({ wiki_body: trimmed })
    .eq("id", gameId);
  if (updateError) {
    return { status: "error", message: "저장 중 문제가 발생했습니다" };
  }

  await supabase.from("game_wiki_revisions").insert({
    game_id: gameId,
    editor_id: user.id,
    content: trimmed,
  });

  const achievement = await awardIfFirst(supabase, user.id, "first_wiki_edit");

  return { status: "success", achievement };
}
