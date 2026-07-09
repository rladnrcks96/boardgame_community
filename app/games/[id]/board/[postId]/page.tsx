import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CommentForm } from "./comment-form";

const CATEGORY_LABELS: Record<string, string> = {
  strategy: "공략",
  variant: "변형룰",
  meetup: "모임구인",
};

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string; postId: string }>;
}) {
  const { id, postId } = await params;
  const gameId = Number(id);

  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("id, title, body, category, created_at, profiles(nickname)")
    .eq("id", Number(postId))
    .eq("game_id", gameId)
    .maybeSingle();
  if (!post) notFound();

  const { data: comments } = await supabase
    .from("comments")
    .select("id, body, created_at, profiles(nickname)")
    .eq("post_id", post.id)
    .order("created_at", { ascending: true });

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="mx-auto max-w-2xl p-4">
      <Link
        href={`/games/${gameId}/board?cat=${post.category}`}
        className="mb-3 flex items-center gap-1 text-xs text-muted-foreground"
      >
        <ArrowLeft className="size-3" />
        게시판 · {CATEGORY_LABELS[post.category]}
      </Link>

      <h2 className="text-sm font-bold">{post.title}</h2>
      <p className="mt-1 text-[10px] text-muted-foreground">
        {post.profiles?.nickname} · {new Date(post.created_at).toLocaleDateString("ko-KR")}
      </p>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{post.body}</p>

      <div className="mt-5 border-t pt-3">
        <p className="mb-2 text-xs font-bold text-muted-foreground">댓글 ({comments?.length ?? 0})</p>
        <div className="space-y-2 text-sm">
          {(comments ?? []).map((c) => (
            <div key={c.id}>
              <span className="font-medium">{c.profiles?.nickname}</span>
              <p className="text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
        <CommentForm postId={post.id} isLoggedIn={!!user} />
      </div>
    </main>
  );
}
