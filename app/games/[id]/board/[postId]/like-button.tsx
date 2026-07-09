"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleLike } from "./actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LikeButton({
  postId,
  initialLiked,
  initialCount,
  isLoggedIn,
}: {
  postId: number;
  initialLiked: boolean;
  initialCount: number;
  isLoggedIn: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleClick() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (pending) return;

    setPending(true);
    const result = await toggleLike(postId);
    setPending(false);
    if (result.status === "error") return;

    setLiked(result.liked);
    setCount((c) => (result.liked ? c + 1 : c - 1));
  }

  return (
    <Button variant={liked ? "default" : "outline"} size="sm" onClick={handleClick} disabled={pending}>
      <Heart className={cn("size-3.5", liked && "fill-current")} />
      좋아요 {count}
    </Button>
  );
}
