"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Award } from "lucide-react";
import { onAchievementEarned } from "@/lib/achievement-events";
import { cn } from "@/lib/utils";

export function AchievementCelebration() {
  const [label, setLabel] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return onAchievementEarned((earnedLabel) => {
      setLabel(earnedLabel);
      setVisible(true);
      confetti({
        particleCount: 130,
        spread: 90,
        startVelocity: 35,
        origin: { y: 0.6 },
        colors: ["#a85c32", "#d9a566", "#ede0cb", "#b3462c"],
      });
    });
  }, []);

  // 오버레이가 없는 논블로킹 팝업이라 클릭을 가로채지 않는다 — 잠시 뒤 자동으로 사라진다.
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!label) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-6 z-50 flex justify-center transition-all duration-300",
        visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0",
      )}
    >
      <div className="flex items-center gap-3 rounded-2xl border bg-card px-5 py-3 shadow-lg ring-1 ring-foreground/10">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent">
          <Award className="size-5 text-accent-foreground" />
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-muted-foreground">업적 획득!</p>
          <p className="text-sm font-medium">{label}</p>
        </div>
      </div>
    </div>
  );
}
