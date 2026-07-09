import { test, expect } from "@playwright/test";

test("메인 페이지에 시딩된 게임이 BGG 랭킹 순으로 카드로 표시된다", async ({ page }) => {
  await page.goto("/");

  const cards = page.locator("a[href^='/games/']");
  await expect(cards).toHaveCount(25);

  const firstCardText = await cards.first().innerText();
  expect(firstCardText).toContain("글룸헤이븐");
  expect(firstCardText).toContain("BGG #1");
});

test("자체 리뷰가 없는 게임은 평균 평점 대신 리뷰 없음을 표시한다", async ({ page }) => {
  await page.goto("/");

  const firstCard = page.locator("a[href^='/games/']").first();
  await expect(firstCard).toContainText("리뷰 없음");
});
