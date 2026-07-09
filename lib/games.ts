import { createClient } from "@/lib/supabase/server";

export async function getGames(query?: string) {
  const supabase = await createClient();
  let request = supabase
    .from("games")
    .select("id, name, image_url, bgg_rank")
    .order("bgg_rank", { ascending: true });

  if (query) {
    request = request.ilike("name", `%${query}%`);
  }

  const { data } = await request;
  return data ?? [];
}
