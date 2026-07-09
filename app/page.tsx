import Image from "next/image";
import Link from "next/link";
import { Star, ImageOff, Search } from "lucide-react";
import { getGames } from "@/lib/games";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const games = await getGames(q);

  return (
    <main className="mx-auto max-w-6xl p-4">
      <form className="mb-4 flex items-center gap-2 rounded-lg border bg-muted px-2.5">
        <Search className="size-3.5 shrink-0 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={q}
          placeholder="게임 이름 검색"
          className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
      </form>

      <h1 className="mb-3 text-xs font-bold text-muted-foreground">
        {q ? `검색 결과` : "BGG 랭킹 순"}
      </h1>

      {games.length === 0 ? (
        <p className="text-sm text-muted-foreground">검색 결과가 없습니다</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 @md:grid-cols-4 md:grid-cols-4">
          {games.map((game) => (
            <Link key={game.id} href={`/games/${game.id}`}>
              <Card className="gap-2 p-2">
                <div className="flex aspect-square items-center justify-center rounded-md bg-muted">
                  {game.image_url ? (
                    <Image
                      src={game.image_url}
                      alt={game.name}
                      width={200}
                      height={200}
                      className="size-full rounded-md object-cover"
                    />
                  ) : (
                    <ImageOff className="size-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>BGG #{game.bgg_rank}</span>
                  <span className="flex items-center gap-0.5">
                    <Star className="size-3" />
                    {game.averageRating !== null ? game.averageRating.toFixed(1) : "리뷰 없음"}
                  </span>
                </div>
                <span className="truncate text-xs font-medium">{game.name}</span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
