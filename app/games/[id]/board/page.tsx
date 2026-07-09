import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS = {
  strategy: "공략",
  variant: "변형룰",
  meetup: "모임구인",
} as const;

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cat?: string }>;
}) {
  const { id } = await params;
  const { cat } = await searchParams;
  const gameId = Number(id);
  const category = (cat && cat in CATEGORY_LABELS ? cat : "strategy") as keyof typeof CATEGORY_LABELS;

  const supabase = await createClient();
  const { data: game } = await supabase.from("games").select("id, name").eq("id", gameId).maybeSingle();
  if (!game) notFound();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, body, created_at")
    .eq("game_id", gameId)
    .eq("category", category)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-2xl p-4">
      <Link href={`/games/${gameId}`} className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
        <ArrowLeft className="size-3" />
        {game.name}
      </Link>
      <h2 className="mb-3 text-sm font-bold">게시판</h2>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <Link
            key={key}
            href={`/games/${gameId}/board?cat=${key}`}
            className={cn(
              "rounded-full border px-2.5 py-1",
              key === category ? "border-foreground font-bold" : "border-border text-muted-foreground",
            )}
          >
            {label}
          </Link>
        ))}
        <Button asChild size="sm" className="ml-auto">
          <Link href={`/games/${gameId}/board/new?cat=${category}`}>글쓰기</Link>
        </Button>
      </div>

      <div className="mt-3 space-y-2">
        {(posts ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">아직 글이 없습니다</p>
        ) : (
          posts!.map((post) => (
            <Link
              key={post.id}
              href={`/games/${gameId}/board/${post.id}`}
              className="block rounded-md border p-2 text-sm"
            >
              {post.title}
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
