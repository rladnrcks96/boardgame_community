import { redirect } from "next/navigation";
import { Award } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ProfileTabs } from "@/components/profile/profile-tabs";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { profile, badges, editedGames, reviews, posts, comments } = await getProfile(user.id);

  return (
    <main className="mx-auto max-w-2xl p-4">
      <div className="flex items-center gap-3">
        <Avatar className="size-12">
          <AvatarFallback>{profile?.nickname?.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-bold">{profile?.nickname}</p>
          <p className="text-[10px] text-muted-foreground">
            {profile?.created_at && new Date(profile.created_at).toLocaleDateString("ko-KR")} 가입
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {badges.map((label) => (
          <span key={label} className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px]">
            <Award className="size-3" />
            {label}
          </span>
        ))}
      </div>

      <ProfileTabs editedGames={editedGames} reviews={reviews} posts={posts} comments={comments} />
    </main>
  );
}
