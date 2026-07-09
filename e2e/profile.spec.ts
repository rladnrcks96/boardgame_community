import { test, expect } from "@playwright/test";
import { createConfirmedUser, deleteUserByEmail, loginAs } from "./helpers/auth";
import { getGameIdByBggId, insertWikiRevision, insertReview, grantAchievement, cleanupUserContent } from "./helpers/games";

test("위키를 편집하고 리뷰를 남기고 업적을 획득한 사용자의 프로필에 각 목록과 뱃지가 표시된다", async ({ page }) => {
  const email = `e2e-profile-activity-${Date.now()}@example.com`;
  const user = await createConfirmedUser(email, "password1234");
  const editedGameId = await getGameIdByBggId(174430); // 글룸헤이븐
  const reviewedGameId = await getGameIdByBggId(224517); // 브라스: 버밍엄
  await insertWikiRevision(editedGameId, user!.id, "테스트 편집");
  await insertReview(reviewedGameId, user!.id, 4, "좋은 게임입니다");
  await grantAchievement(user!.id, "first_wiki_edit");

  try {
    await loginAs(page, email, "password1234");
    await page.goto("/profile");

    await expect(page.getByText("첫 위키 편집")).toBeVisible();
    await expect(page.getByText("글룸헤이븐")).toBeVisible();
    await page.getByRole("tab", { name: "리뷰" }).click();
    await expect(page.getByText("브라스: 버밍엄")).toBeVisible();
  } finally {
    await cleanupUserContent(user!.id);
    await deleteUserByEmail(email);
  }
});

test("아무 활동도 없는 신규 사용자의 프로필에는 각 탭에 아직 활동이 없다는 문구가 표시된다", async ({ page }) => {
  const email = `e2e-profile-empty-${Date.now()}@example.com`;
  await createConfirmedUser(email, "password1234");

  try {
    await loginAs(page, email, "password1234");
    await page.goto("/profile");

    await expect(page.getByText("아직 활동이 없습니다")).toBeVisible();
    await page.getByRole("tab", { name: "리뷰" }).click();
    await expect(page.getByText("아직 활동이 없습니다")).toBeVisible();
    await page.getByRole("tab", { name: "게시글·댓글" }).click();
    await expect(page.getByText("아직 활동이 없습니다")).toBeVisible();
  } finally {
    await deleteUserByEmail(email);
  }
});
