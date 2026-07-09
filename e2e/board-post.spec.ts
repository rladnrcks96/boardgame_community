import { test, expect } from "@playwright/test";
import { createConfirmedUser, deleteUserByEmail, loginAs } from "./helpers/auth";
import { getGameIdByBggId, cleanupUserContent } from "./helpers/games";

test("카테고리를 선택해 글을 작성하면 해당 카테고리 목록 최상단에 표시된다", async ({ page }) => {
  const email = `e2e-board-create-${Date.now()}@example.com`;
  const user = await createConfirmedUser(email, "password1234");
  const gameId = await getGameIdByBggId(187645); // 스타워즈: 리벨리온

  try {
    await loginAs(page, email, "password1234");
    await page.goto(`/games/${gameId}/board/new`);
    await page.getByRole("button", { name: "변형룰" }).click();
    await page.getByPlaceholder("제목을 입력해주세요").fill("초반 세팅 변형룰 제안");
    await page.locator("textarea").fill("이렇게 하면 더 빠르게 시작할 수 있어요");
    await page.getByRole("button", { name: "등록" }).click();

    await page.waitForURL(new RegExp(`/games/${gameId}/board\\?cat=variant`));
    const firstPost = page.locator("a[href^='/games/']:not([href*='/new'])[href*='/board/']").first();
    await expect(firstPost).toContainText("초반 세팅 변형룰 제안");
  } finally {
    await cleanupUserContent(user!.id);
    await deleteUserByEmail(email);
  }
});

test("제목 없이 등록을 시도하면 에러가 표시된다", async ({ page }) => {
  const email = `e2e-board-notitle-${Date.now()}@example.com`;
  await createConfirmedUser(email, "password1234");
  const gameId = await getGameIdByBggId(199792); // 에버델

  try {
    await loginAs(page, email, "password1234");
    await page.goto(`/games/${gameId}/board/new`);
    await page.locator("textarea").fill("본문만 입력");
    await page.getByRole("button", { name: "등록" }).click();

    await expect(page.getByText("제목을 입력해주세요")).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/games/${gameId}/board/new`));
  } finally {
    await deleteUserByEmail(email);
  }
});

test("비로그인 사용자도 게시판 글 목록과 본문을 볼 수 있다", async ({ page }) => {
  const gameId = await getGameIdByBggId(237182); // 루트
  await page.goto(`/games/${gameId}/board`);
  await expect(page.getByRole("heading", { name: "게시판" })).toBeVisible();
});

test("비로그인 사용자가 글쓰기 페이지로 이동하면 로그인 페이지로 리다이렉트된다", async ({ page }) => {
  const gameId = await getGameIdByBggId(115746); // 반지의 전쟁 2판
  await page.goto(`/games/${gameId}/board/new`);
  await expect(page).toHaveURL("/login");
});

test("첫 게시글 작성 시 업적 토스트가 표시되고, 두 번째 게시글에는 다시 표시되지 않는다", async ({ page }) => {
  const email = `e2e-board-achievement-${Date.now()}@example.com`;
  const user = await createConfirmedUser(email, "password1234");
  const firstGameId = await getGameIdByBggId(124361); // 콘코르디아
  const secondGameId = await getGameIdByBggId(199792); // 에버델

  try {
    await loginAs(page, email, "password1234");

    await page.goto(`/games/${firstGameId}/board/new`);
    await page.getByPlaceholder("제목을 입력해주세요").fill("첫 게시글");
    await page.locator("textarea").fill("내용");
    await page.getByRole("button", { name: "등록" }).click();
    await expect(page.getByText("업적 획득! 첫 게시글 작성")).toBeVisible();

    await page.goto(`/games/${secondGameId}/board/new`);
    await page.getByPlaceholder("제목을 입력해주세요").fill("두 번째 게시글");
    await page.locator("textarea").fill("내용");
    await page.getByRole("button", { name: "등록" }).click();
    await page.waitForURL(new RegExp(`/games/${secondGameId}/board`));
    await expect(page.getByText("업적 획득!")).not.toBeVisible();
  } finally {
    await cleanupUserContent(user!.id);
    await deleteUserByEmail(email);
  }
});
