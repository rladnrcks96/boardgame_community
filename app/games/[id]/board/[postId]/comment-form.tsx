"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createComment } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CommentForm({ postId, isLoggedIn }: { postId: number; isLoggedIn: boolean }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    setPending(true);
    setError(null);
    const result = await createComment(postId, body);
    setPending(false);

    if (result.status === "error") {
      setError(result.message);
      return;
    }
    if (result.achievement) {
      toast(`업적 획득! ${result.achievement}`);
    }
    setBody("");
    router.refresh();
  }

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="댓글을 입력하세요" />
        <Button onClick={handleSubmit} disabled={pending}>등록</Button>
      </div>
      {error && <p role="alert" data-slot="field-error" className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
