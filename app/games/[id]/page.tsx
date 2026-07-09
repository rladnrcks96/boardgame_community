import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageOff, Star, Pencil } from "lucide-react";
import { getGameDetail } from "@/lib/games";
import { GameDetailTabs } from "@/components/games/game-detail-tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getGameDetail(id);
  if (!detail) notFound();

  const { game, revisions, reviews, averageRating, tagAggregation } = detail;

  return (
    <main className="mx-auto max-w-4xl p-4">
      <div className="flex flex-col gap-4 @md:flex-row md:flex-row">
        <div className="flex aspect-square w-full shrink-0 items-center justify-center rounded-md bg-muted @md:w-40 md:w-40">
          {game.image_url ? (
            <Image src={game.image_url} alt={game.name} width={200} height={200} className="size-full rounded-md object-cover" />
          ) : (
            <ImageOff className="size-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold">{game.name}</h1>
          <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
            <Badge variant="outline">{game.min_players}-{game.max_players}인</Badge>
            <Badge variant="outline">{game.playtime_min}-{game.playtime_max}분</Badge>
            <Badge variant="outline">난이도 {game.difficulty_label}</Badge>
            {game.categories?.map((c: string) => (
              <Badge key={c} variant="outline">{c}</Badge>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm">
            <Star className="size-3.5" />
            {averageRating !== null ? (
              <span>{averageRating.toFixed(1)} ({reviews.length}개 리뷰)</span>
            ) : (
              <span className="text-muted-foreground">리뷰 없음</span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tagAggregation.length > 0 ? (
              tagAggregation.map((t) => (
                <span key={t.name} className="rounded-full bg-muted px-2 py-0.5 text-[10px]">
                  {t.name} {t.count}명
                </span>
              ))
            ) : (
              <span className="text-[10px] text-muted-foreground">아직 태그가 달린 리뷰가 없습니다</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button asChild size="sm" variant="outline">
          <Link href={`/games/${game.id}/board`}>게시판 보기</Link>
        </Button>
      </div>

      <GameDetailTabs
        wiki={
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">위키 본문</span>
              <Button asChild size="sm" variant="outline">
                <Link href={`/games/${game.id}/edit`}>
                  <Pencil />
                  편집
                </Link>
              </Button>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
              {game.wiki_body ?? "아직 작성된 위키 본문이 없습니다"}
            </p>

            <details className="mt-4 text-xs">
              <summary className="cursor-pointer text-muted-foreground">
                편집 이력 ({revisions.length})
              </summary>
              {revisions.length > 0 ? (
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  {revisions.map((r) => (
                    <li key={r.id}>
                      {r.profiles?.nickname} · {new Date(r.created_at).toLocaleDateString("ko-KR")}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-muted-foreground">아직 편집 이력이 없습니다</p>
              )}
            </details>
          </div>
        }
        review={
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">리뷰 ({reviews.length})</span>
              <Button asChild size="sm" variant="outline">
                <Link href={`/games/${game.id}/reviews/new`}>리뷰 작성</Link>
              </Button>
            </div>
            <div className="mt-3 space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-md border p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{review.profiles?.nickname}</span>
                    <span className="flex items-center gap-0.5 text-xs">
                      <Star className="size-3" />
                      {review.rating}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{review.body}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(review.review_tags ?? []).map((rt, i) => (
                      <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-[10px]">
                        {rt.tags?.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        }
      />
    </main>
  );
}
