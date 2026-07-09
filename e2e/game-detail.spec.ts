import { test, expect } from "@playwright/test";
import { createConfirmedUser, deleteUserByEmail } from "./helpers/auth";
import { getGameIdByBggId, insertWikiRevision, insertReview, cleanupUserContent } from "./helpers/games";

test("게임 상세 페이지에 메타데이터와 위키 본문이 함께 표시된다", async ({ page }) => {
  const id = await getGameIdByBggId(174430); // 글룸헤이븐
  await page.goto(`/games/${id}`);

  await expect(page.getByRole("heading", { name: "글룸헤이븐" })).toBeVisible();
  await expect(page.getByText("1-4인")).toBeVisible();
});

test("편집 이력이 있는 게임은 편집자와 시각이 목록에 표시된다", async ({ page }) => {
  const email = `e2e-gamedetail-hist-${Date.now()}@example.com`;
  const user = await createConfirmedUser(email, "password1234");
  const gameId = await getGameIdByBggId(224517); // 브라스: 버밍엄
  await insertWikiRevision(gameId, user!.id, "테스트 편집 본문");

  await page.goto(`/games/${gameId}`);
  await page.getByText(/편집 이력 \(\d+\)/).click();
  await expect(page.getByText(new RegExp(email.split("@")[0]))).toBeVisible();

  await cleanupUserContent(user!.id);
  await deleteUserByEmail(email);
});

test("편집 이력이 없는 게임은 이력이 비어있다는 문구가 표시된다", async ({ page }) => {
  const id = await getGameIdByBggId(13); // 카탄
  await page.goto(`/games/${id}`);
  await page.getByText("편집 이력 (0)").click();
  await expect(page.getByText("아직 편집 이력이 없습니다")).toBeVisible();
});

test("리뷰에 태그가 달린 게임은 태그별 집계가 표시된다", async ({ page }) => {
  const email = `e2e-gamedetail-tag-${Date.now()}@example.com`;
  const user = await createConfirmedUser(email, "password1234");
  const gameId = await getGameIdByBggId(342942); // 아크노바
  await insertReview(gameId, user!.id, 5, "좋아요", ["마피아류", "파티게임"]);

  await page.goto(`/games/${gameId}`);
  await expect(page.getByText("마피아류 1명")).toBeVisible();
  await expect(page.getByText("파티게임 1명")).toBeVisible();

  await cleanupUserContent(user!.id);
  await deleteUserByEmail(email);
});

test("리뷰가 없는 게임은 태그 집계 영역에 안내 문구가 표시된다", async ({ page }) => {
  const id = await getGameIdByBggId(822); // 카르카손
  await page.goto(`/games/${id}`);
  await expect(page.getByText("아직 태그가 달린 리뷰가 없습니다")).toBeVisible();
  await expect(page.getByText("리뷰 없음")).toBeVisible();
});
