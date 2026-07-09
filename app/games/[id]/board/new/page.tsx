import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PostForm } from "./post-form";
import type { PostCategory } from "../actions";

const CATEGORIES: PostCategory[] = ["strategy", "variant", "meetup"];

export default async function NewPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cat?: string }>;
}) {
  const { id } = await params;
  const { cat } = await searchParams;
  const gameId = Number(id);
  const initialCategory = (CATEGORIES.includes(cat as PostCategory) ? cat : "strategy") as PostCategory;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: game } = await supabase.from("games").select("id, name").eq("id", gameId).maybeSingle();
  if (!game) notFound();

  return <PostForm gameId={game.id} gameName={game.name} initialCategory={initialCategory} />;
}
