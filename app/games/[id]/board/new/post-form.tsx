"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { celebrateAchievement } from "@/lib/achievement-events";
import { createPost, type PostCategory } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<PostCategory, string> = {
  strategy: "공략",
  variant: "변형룰",
  meetup: "모임구인",
};

export function PostForm({
  gameId,
  gameName,
  initialCategory,
}: {
  gameId: number;
  gameName: string;
  initialCategory: PostCategory;
}) {
  const [category, setCategory] = useState<PostCategory>(initialCategory);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit() {
    setPending(true);
    setError(null);
    const result = await createPost(gameId, category, title, body);
    setPending(false);

    if (result.status === "error") {
      setError(result.message);
      return;
    }
    if (result.achievement) {
      celebrateAchievement(result.achievement);
    }
    router.push(`/games/${gameId}/board?cat=${category}`);
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h2 className="mb-3 text-sm font-bold">글쓰기 — {gameName}</h2>

      <p className="mb-1 text-xs text-muted-foreground">카테고리</p>
      <div className="mb-3 flex gap-2 text-xs">
        {(Object.entries(CATEGORY_LABELS) as [PostCategory, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setCategory(key)}
            className={cn(
              "rounded-full border px-2.5 py-1",
              key === category ? "border-foreground font-bold" : "border-border text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="mb-1 text-xs text-muted-foreground">제목</p>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목을 입력해주세요" />

      <p className="mt-3 mb-1 text-xs text-muted-foreground">본문</p>
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} />

      {error && <p role="alert" data-slot="field-error" className="mt-2 text-sm text-destructive">{error}</p>}

      <div className="mt-3 flex gap-2">
        <Button onClick={handleSubmit} disabled={pending}>등록</Button>
        <Button variant="outline" onClick={() => router.push(`/games/${gameId}/board?cat=${category}`)}>취소</Button>
      </div>
    </main>
  );
}
