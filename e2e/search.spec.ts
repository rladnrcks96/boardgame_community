import { test, expect } from "@playwright/test";

test("게임 이름 일부로 검색하면 일치하는 게임이 표시된다", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("게임 이름 검색").fill("글룸");
  await page.getByPlaceholder("게임 이름 검색").press("Enter");

  const cards = page.locator("a[href^='/games/']");
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("글룸헤이븐");
});

test("일치하는 게임이 없으면 검색 결과가 없습니다가 표시된다", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("게임 이름 검색").fill("존재하지않는게임이름");
  await page.getByPlaceholder("게임 이름 검색").press("Enter");

  await expect(page.getByText("검색 결과가 없습니다")).toBeVisible();
});
