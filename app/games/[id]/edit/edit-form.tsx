"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveWikiEdit } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function EditForm({
  gameId,
  gameName,
  initialContent,
}: {
  gameId: number;
  gameName: string;
  initialContent: string;
}) {
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setPending(true);
    setError(null);
    const result = await saveWikiEdit(gameId, content);
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

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h2 className="mb-3 text-sm font-bold">위키 편집 — {gameName}</h2>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={10}
        placeholder="게임 규칙을 요약해주세요"
      />
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
      <div className="mt-3 flex gap-2">
        <Button onClick={handleSave} disabled={pending}>저장</Button>
        <Button variant="outline" onClick={() => router.push(`/games/${gameId}`)}>취소</Button>
      </div>
    </main>
  );
}
