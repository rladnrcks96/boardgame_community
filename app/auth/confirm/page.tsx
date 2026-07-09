"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConfirmPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      router.replace("/login?confirmed=0");
      return;
    }

    const supabase = createClient();
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(async ({ error }) => {
      // 인증만 완료하고, 로그인은 Scenario 2에서 사용자가 직접 하도록 세션을 남기지 않는다.
      await supabase.auth.signOut();
      router.replace(error ? "/login?confirmed=0" : "/login?confirmed=1");
    });
  }, [router]);

  return null;
}
