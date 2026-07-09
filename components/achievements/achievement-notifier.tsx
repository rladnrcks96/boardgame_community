"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { checkPendingAchievements } from "@/app/achievement-notifications-action";
import { celebrateAchievement } from "@/lib/achievement-events";

export function AchievementNotifier() {
  // 이 컴포넌트는 루트 레이아웃에 있어 클라이언트 사이드 전환(예: 로그인 후 리다이렉트)에서
  // 리마운트되지 않는다. pathname을 의존성으로 둬서 매 네비게이션마다 다시 확인한다.
  const pathname = usePathname();

  useEffect(() => {
    checkPendingAchievements().then((labels) => {
      labels.forEach((label) => celebrateAchievement(label));
    });
  }, [pathname]);

  return null;
}
