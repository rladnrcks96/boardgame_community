"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type EditedGame = { gameId: number; name: string; editedAt: string };
type Review = { id: number; rating: number; game_id: number; games: { name: string } | null };
type Post = { id: number; title: string; game_id: number };
type Comment = { id: number; body: string; post_id: number; posts: { game_id: number; title: string } | null };

export function ProfileTabs({
  editedGames,
  reviews,
  posts,
  comments,
}: {
  editedGames: EditedGame[];
  reviews: Review[];
  posts: Post[];
  comments: Comment[];
}) {
  return (
    <Tabs defaultValue="wiki" className="mt-4">
      <TabsList>
        <TabsTrigger value="wiki">위키 편집</TabsTrigger>
        <TabsTrigger value="review">리뷰</TabsTrigger>
        <TabsTrigger value="post">게시글·댓글</TabsTrigger>
      </TabsList>

      <TabsContent value="wiki">
        {editedGames.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">아직 활동이 없습니다</p>
        ) : (
          <div className="mt-3 space-y-2 text-sm">
            {editedGames.map((g) => (
              <Link key={g.gameId} href={`/games/${g.gameId}`} className="flex items-center justify-between rounded-md border p-2">
                <span>{g.name}</span>
                <span className="text-xs text-muted-foreground">{new Date(g.editedAt).toLocaleDateString("ko-KR")}</span>
              </Link>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="review">
        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">아직 활동이 없습니다</p>
        ) : (
          <div className="mt-3 space-y-2 text-sm">
            {reviews.map((r) => (
              <Link key={r.id} href={`/games/${r.game_id}`} className="flex items-center justify-between rounded-md border p-2">
                <span>{r.games?.name}</span>
                <span className="text-xs text-muted-foreground">★{r.rating}</span>
              </Link>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="post">
        {posts.length === 0 && comments.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">아직 활동이 없습니다</p>
        ) : (
          <div className="mt-3 space-y-2 text-sm">
            {posts.map((p) => (
              <Link key={`post-${p.id}`} href={`/games/${p.game_id}/board/${p.id}`} className="block rounded-md border p-2">
                {p.title}
              </Link>
            ))}
            {comments.map((c) => (
              <Link
                key={`comment-${c.id}`}
                href={`/games/${c.posts?.game_id}/board/${c.post_id}`}
                className="block rounded-md border p-2 text-muted-foreground"
              >
                {c.posts?.title} · {c.body}
              </Link>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
