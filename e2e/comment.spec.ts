import { test, expect } from "@playwright/test";
import { createConfirmedUser, deleteUserByEmail, loginAs } from "./helpers/auth";
import { getGameIdByBggId, insertPost, cleanupUserContent } from "./helpers/games";

test("댓글을 입력해 등록하면 댓글 목록에 즉시 추가된다", async ({ page }) => {
  const email = `e2e-comment-basic-${Date.now()}@example.com`;
  const user = await createConfirmedUser(email, "password1234");
  const gameId = await getGameIdByBggId(174430);
  const postId = await insertPost(gameId, user!.id, "strategy", "테스트 게시글", "본문");

  try {
    await loginAs(page, email, "password1234");
    await page.goto(`/games/${gameId}/board/${postId}`);
    await page.getByPlaceholder("댓글을 입력하세요").fill("좋은 글이네요");
    await page.getByRole("button", { name: "등록" }).click();

    await expect(page.getByText("좋은 글이네요")).toBeVisible();
  } finally {
    await cleanupUserContent(user!.id);
    await deleteUserByEmail(email);
  }
});

test("빈 댓글로 등록을 시도하면 등록되지 않고 에러가 표시된다", async ({ page }) => {
  const email = `e2e-comment-empty-${Date.now()}@example.com`;
  const user = await createConfirmedUser(email, "password1234");
  const gameId = await getGameIdByBggId(224517);
  const postId = await insertPost(gameId, user!.id, "strategy", "테스트 게시글", "본문");

  try {
    await loginAs(page, email, "password1234");
    await page.goto(`/games/${gameId}/board/${postId}`);
    await page.getByRole("button", { name: "등록" }).click();

    await expect(page.getByText("댓글을 입력해주세요")).toBeVisible();
    await expect(page.getByText("댓글 (0)")).toBeVisible();
  } finally {
    await cleanupUserContent(user!.id);
    await deleteUserByEmail(email);
  }
});

test("비로그인 사용자가 댓글을 입력하고 등록을 누르면 로그인 페이지로 이동한다", async ({ page }) => {
  const authorEmail = `e2e-comment-guest-author-${Date.now()}@example.com`;
  const author = await createConfirmedUser(authorEmail, "password1234");
  const gameId = await getGameIdByBggId(342942);
  const postId = await insertPost(gameId, author!.id, "strategy", "테스트 게시글", "본문");

  try {
    await page.goto(`/games/${gameId}/board/${postId}`);
    await page.getByPlaceholder("댓글을 입력하세요").fill("댓글 시도");
    await page.getByRole("button", { name: "등록" }).click();

    await expect(page).toHaveURL("/login");
  } finally {
    await cleanupUserContent(author!.id);
    await deleteUserByEmail(authorEmail);
  }
});

test("첫 댓글 작성 시 업적 토스트가 표시되고, 두 번째 댓글에는 다시 표시되지 않는다", async ({ page }) => {
  const email = `e2e-comment-achievement-${Date.now()}@example.com`;
  const user = await createConfirmedUser(email, "password1234");
  const gameId = await getGameIdByBggId(822);
  const postA = await insertPost(gameId, user!.id, "strategy", "게시글 A", "본문");
  const postB = await insertPost(gameId, user!.id, "strategy", "게시글 B", "본문");

  try {
    await loginAs(page, email, "password1234");

    await page.goto(`/games/${gameId}/board/${postA}`);
    await page.getByPlaceholder("댓글을 입력하세요").fill("첫 댓글");
    await page.getByRole("button", { name: "등록" }).click();
    await expect(page.getByText("업적 획득!")).toBeVisible();

    await page.goto(`/games/${gameId}/board/${postB}`);
    await page.getByPlaceholder("댓글을 입력하세요").fill("두 번째 댓글");
    await page.getByRole("button", { name: "등록" }).click();
    await expect(page.getByText("두 번째 댓글")).toBeVisible();
    await expect(page.getByText("업적 획득!")).not.toBeVisible();
  } finally {
    await cleanupUserContent(user!.id);
    await deleteUserByEmail(email);
  }
});
