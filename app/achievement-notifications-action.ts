"use server";

import { createClient } from "@/lib/supabase/server";
import { consumePendingAchievements } from "@/lib/achievements";

export async function checkPendingAchievements(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  return consumePendingAchievements(supabase, user.id);
}
