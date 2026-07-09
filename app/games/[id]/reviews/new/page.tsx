import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewForm } from "./review-form";

export default async function NewReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const gameId = Number(id);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: game } = await supabase.from("games").select("id, name").eq("id", gameId).maybeSingle();
  if (!game) notFound();

  const { data: tags } = await supabase.from("tags").select("id, name, category").order("id");

  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id, rating, body, review_tags(tag_id)")
    .eq("game_id", gameId)
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <ReviewForm
      gameId={game.id}
      gameName={game.name}
      tags={tags ?? []}
      initialRating={existingReview?.rating ?? 5}
      initialBody={existingReview?.body ?? ""}
      initialTagIds={existingReview?.review_tags.map((rt) => rt.tag_id) ?? []}
    />
  );
}
