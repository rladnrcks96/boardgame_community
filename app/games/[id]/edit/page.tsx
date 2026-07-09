import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGameDetail } from "@/lib/games";
import { EditForm } from "./edit-form";

export default async function EditWikiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const detail = await getGameDetail(id);
  if (!detail) notFound();

  return (
    <EditForm
      gameId={detail.game.id}
      gameName={detail.game.name}
      initialContent={detail.game.wiki_body ?? ""}
    />
  );
}
