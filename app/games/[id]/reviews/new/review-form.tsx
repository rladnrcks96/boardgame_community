"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { saveReview } from "../actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

type Tag = { id: number; name: string; category: string };

export function ReviewForm({
  gameId,
  gameName,
  tags,
  initialRating,
  initialBody,
  initialTagIds,
}: {
  gameId: number;
  gameName: string;
  tags: Tag[];
  initialRating: number;
  initialBody: string;
  initialTagIds: number[];
}) {
  const [rating, setRating] = useState(initialRating);
  const [body, setBody] = useState(initialBody);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(initialTagIds);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  function toggleTag(id: number) {
    setSelectedTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  async function handleSubmit() {
    setPending(true);
    setError(null);
    const result = await saveReview(gameId, rating, body, selectedTagIds);
    setPending(false);

    if (result.status === "error") {
      setError(result.message);
      return;
    }
    if (result.achievement) {
      toast(`업적 획득! ${result.achievement}`);
    }
    router.push(`/games/${gameId}`);
  }

  const mechanicTags = tags.filter((t) => t.category === "mechanic");
  const experienceTags = tags.filter((t) => t.category === "experience");

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h2 className="mb-3 text-sm font-bold">리뷰 작성 — {gameName}</h2>

      <p className="mb-1 text-xs text-muted-foreground">별점</p>
      <div className="mb-4 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n}점`}>
            <Star className={n <= rating ? "size-5 fill-current" : "size-5 text-muted-foreground"} />
          </button>
        ))}
      </div>

      <p className="mb-1 text-xs text-muted-foreground">태그 (선택, 여러 개 가능)</p>
      <p className="mb-1 text-[10px] text-muted-foreground">게임성</p>
      <div className="mb-2 flex flex-wrap gap-3">
        {mechanicTags.map((tag) => (
          <label key={tag.id} className="flex items-center gap-1.5 text-xs">
            <Checkbox checked={selectedTagIds.includes(tag.id)} onCheckedChange={() => toggleTag(tag.id)} />
            {tag.name}
          </label>
        ))}
      </div>
      <p className="mb-1 text-[10px] text-muted-foreground">플레이 경험</p>
      <div className="mb-4 flex flex-wrap gap-3">
        {experienceTags.map((tag) => (
          <label key={tag.id} className="flex items-center gap-1.5 text-xs">
            <Checkbox checked={selectedTagIds.includes(tag.id)} onCheckedChange={() => toggleTag(tag.id)} />
            {tag.name}
          </label>
        ))}
      </div>

      <p className="mb-1 text-xs text-muted-foreground">리뷰 본문</p>
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="이 게임에 대한 생각을 남겨주세요" />

      {error && <p role="alert" data-slot="field-error" className="mt-2 text-sm text-destructive">{error}</p>}

      <div className="mt-3 flex gap-2">
        <Button onClick={handleSubmit} disabled={pending}>등록</Button>
        <Button variant="outline" onClick={() => router.push(`/games/${gameId}`)}>취소</Button>
      </div>
    </main>
  );
}
