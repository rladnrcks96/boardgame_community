import Image from "next/image";
import Link from "next/link";
import { Star, ImageOff } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: games } = await supabase
    .from("games")
    .select("id, name, image_url, bgg_rank")
    .order("bgg_rank", { ascending: true });

  return (
    <main className="mx-auto max-w-6xl p-4">
      <h1 className="mb-3 text-xs font-bold text-muted-foreground">BGG 랭킹 순</h1>
      <div className="grid grid-cols-2 gap-3 @md:grid-cols-4 md:grid-cols-4">
        {(games ?? []).map((game) => (
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
                  리뷰 없음
                </span>
              </div>
              <span className="truncate text-xs font-medium">{game.name}</span>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
