import Link from "next/link";
import { Dice5 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/logout-action";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <header className="flex items-center gap-3 border-b px-4 py-3">
      <Link href="/" className="flex items-center gap-1.5 text-sm font-bold">
        <Dice5 className="size-4" />
        보드게임위키
      </Link>
      <div className="ml-auto flex items-center gap-2 text-xs">
        {data.user ? (
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm">
              로그아웃
            </Button>
          </form>
        ) : (
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/login">로그인</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">회원가입</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
