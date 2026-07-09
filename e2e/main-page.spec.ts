import { test, expect } from "@playwright/test";

test("메인 페이지에 시딩된 게임이 BGG 랭킹 순으로 카드로 표시된다", async ({ page }) => {
  await page.goto("/");

  const cards = page.locator("a[href^='/games/']");
  await expect(cards).toHaveCount(25);

  // 실제 BGG 순위는 주기적으로 바뀌므로 특정 게임을 하드코딩하지 않고,
  // 카드 순서가 실제로 랭킹 오름차순인지만 검증한다.
  const rankTexts = await cards.locator("span:has-text('BGG #')").allInnerTexts();
  const ranks = rankTexts.map((t) => Number(t.replace("BGG #", "")));
  const sorted = [...ranks].sort((a, b) => a - b);
  expect(ranks).toEqual(sorted);
});

test("자체 리뷰가 없는 게임은 평균 평점 대신 리뷰 없음을 표시한다", async ({ page }) => {
  await page.goto("/");

  const firstCard = page.locator("a[href^='/games/']").first();
  await expect(firstCard).toContainText("리뷰 없음");
});
