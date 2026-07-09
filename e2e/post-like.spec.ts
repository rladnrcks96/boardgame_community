import { test, expect } from "@playwright/test";
import { createConfirmedUser, deleteUserByEmail, loginAs } from "./helpers/auth";
import { getGameIdByBggId, insertPost, cleanupUserContent } from "./helpers/games";

test("좋아요를 클릭하면 수가 1 증가하고 버튼이 활성 상태가 된다", async ({ page }) => {
  const authorEmail = `e2e-like-basic-author-${Date.now()}@example.com`;
  const likerEmail = `e2e-like-basic-liker-${Date.now()}@example.com`;
  const author = await createConfirmedUser(authorEmail, "password1234");
  await createConfirmedUser(likerEmail, "password1234");
  const gameId = await getGameIdByBggId(174430);
  const postId = await insertPost(gameId, author!.id, "strategy", "좋아요 테스트 글", "본문");

  try {
    await loginAs(page, likerEmail, "password1234");
    await page.goto(`/games/${gameId}/board/${postId}`);
    await page.getByRole("button", { name: /좋아요 0/ }).click();

    await expect(page.getByRole("button", { name: /좋아요 1/ })).toBeVisible();
  } finally {
    await cleanupUserContent(author!.id);
    await deleteUserByEmail(authorEmail);
    await deleteUserByEmail(likerEmail);
  }
});

test("이미 누른 좋아요를 다시 클릭하면 취소되고 수가 감소한다", async ({ page }) => {
  const authorEmail = `e2e-like-toggle-author-${Date.now()}@example.com`;
  const likerEmail = `e2e-like-toggle-liker-${Date.now()}@example.com`;
  const author = await createConfirmedUser(authorEmail, "password1234");
  await createConfirmedUser(likerEmail, "password1234");
  const gameId = await getGameIdByBggId(224517);
  const postId = await insertPost(gameId, author!.id, "strategy", "좋아요 토글 테스트 글", "본문");

  try {
    await loginAs(page, likerEmail, "password1234");
    await page.goto(`/games/${gameId}/board/${postId}`);
    await page.getByRole("button", { name: /좋아요 0/ }).click();
    await expect(page.getByRole("button", { name: /좋아요 1/ })).toBeVisible();

    await page.getByRole("button", { name: /좋아요 1/ }).click();
    await expect(page.getByRole("button", { name: /좋아요 0/ })).toBeVisible();
  } finally {
    await cleanupUserContent(author!.id);
    await deleteUserByEmail(authorEmail);
    await deleteUserByEmail(likerEmail);
  }
});

test("비로그인 사용자가 좋아요를 클릭하면 로그인 페이지로 이동한다", async ({ page }) => {
  const authorEmail = `e2e-like-guest-author-${Date.now()}@example.com`;
  const author = await createConfirmedUser(authorEmail, "password1234");
  const gameId = await getGameIdByBggId(342942);
  const postId = await insertPost(gameId, author!.id, "strategy", "게스트 좋아요 테스트 글", "본문");

  try {
    await page.goto(`/games/${gameId}/board/${postId}`);
    await page.getByRole("button", { name: /좋아요 0/ }).click();
    await expect(page).toHaveURL("/login");
  } finally {
    await cleanupUserContent(author!.id);
    await deleteUserByEmail(authorEmail);
  }
});

test("본인 게시글이 처음 좋아요를 받으면 작성자에게만 업적 토스트가 표시된다", async ({ page, browser }) => {
  const authorEmail = `e2e-like-achievement-author-${Date.now()}@example.com`;
  const likerEmail = `e2e-like-achievement-liker-${Date.now()}@example.com`;
  const author = await createConfirmedUser(authorEmail, "password1234");
  await createConfirmedUser(likerEmail, "password1234");
  const gameId = await getGameIdByBggId(822);
  const postId = await insertPost(gameId, author!.id, "strategy", "첫 좋아요 테스트 글", "본문");

  try {
    // liker가 좋아요를 누르는 시점에는 liker 화면에 토스트가 뜨지 않는다
    await loginAs(page, likerEmail, "password1234");
    await page.goto(`/games/${gameId}/board/${postId}`);
    await page.getByRole("button", { name: /좋아요 0/ }).click();
    await expect(page.getByRole("button", { name: /좋아요 1/ })).toBeVisible();
    await expect(page.getByText("업적 획득!")).not.toBeVisible();

    // 작성자가 재로그인해서 아무 페이지든 열면 토스트가 뜬다
    const authorContext = await browser.newContext();
    const authorPage = await authorContext.newPage();
    await loginAs(authorPage, authorEmail, "password1234");
    await expect(authorPage.getByText("업적 획득! 첫 좋아요 받음")).toBeVisible({ timeout: 10000 });
    await authorContext.close();
  } finally {
    await cleanupUserContent(author!.id);
    await deleteUserByEmail(authorEmail);
    await deleteUserByEmail(likerEmail);
  }
});

test("이미 첫 좋아요 업적을 획득한 사용자의 다른 게시글이 또 좋아요를 받아도 토스트가 다시 표시되지 않는다", async ({ page, browser }) => {
  const authorEmail = `e2e-like-repeat-author-${Date.now()}@example.com`;
  const likerEmail = `e2e-like-repeat-liker-${Date.now()}@example.com`;
  const author = await createConfirmedUser(authorEmail, "password1234");
  await createConfirmedUser(likerEmail, "password1234");
  const gameId = await getGameIdByBggId(13);
  const postA = await insertPost(gameId, author!.id, "strategy", "글 A", "본문");
  const postB = await insertPost(gameId, author!.id, "strategy", "글 B", "본문");

  try {
    await loginAs(page, likerEmail, "password1234");
    await page.goto(`/games/${gameId}/board/${postA}`);
    await page.getByRole("button", { name: /좋아요 0/ }).click();
    await expect(page.getByRole("button", { name: /좋아요 1/ })).toBeVisible();

    // 작성자가 첫 업적을 소비(확인)하도록 한 번 로그인
    const authorContext = await browser.newContext();
    const authorPage = await authorContext.newPage();
    await loginAs(authorPage, authorEmail, "password1234");
    await expect(authorPage.getByText("업적 획득! 첫 좋아요 받음")).toBeVisible({ timeout: 10000 });

    await page.goto(`/games/${gameId}/board/${postB}`);
    await page.getByRole("button", { name: /좋아요 0/ }).click();
    await expect(page.getByRole("button", { name: /좋아요 1/ })).toBeVisible();

    await authorPage.goto("/");
    await expect(authorPage.getByText("업적 획득!")).not.toBeVisible();
    await authorContext.close();
  } finally {
    await cleanupUserContent(author!.id);
    await deleteUserByEmail(authorEmail);
    await deleteUserByEmail(likerEmail);
  }
});
