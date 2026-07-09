import { test, expect } from "@playwright/test";
import { createConfirmedUser, deleteUserByEmail, loginAs } from "./helpers/auth";
import { getGameIdByBggId, cleanupUserContent } from "./helpers/games";

test("로그인 사용자가 본문을 수정해 저장하면 상세 페이지와 편집 이력에 반영된다", async ({ page }) => {
  const email = `e2e-wikiedit-save-${Date.now()}@example.com`;
  const user = await createConfirmedUser(email, "password1234");
  const gameId = await getGameIdByBggId(167791); // 테라포밍 마스

  try {
    await loginAs(page, email, "password1234");
    await page.goto(`/games/${gameId}/edit`);
    await page.locator("textarea").fill("새로 작성한 위키 본문입니다");
    await page.getByRole("button", { name: "저장" }).click();

    await page.waitForURL(`/games/${gameId}`);
    await expect(page.getByText("새로 작성한 위키 본문입니다")).toBeVisible();
    await page.getByText(/편집 이력 \(\d+\)/).click();
    await expect(page.getByText(/편집 이력 \(1\)/)).toBeVisible();
  } finally {
    await cleanupUserContent(user!.id);
    await deleteUserByEmail(email);
  }
});

test("비로그인 사용자가 편집 페이지로 이동하면 로그인 페이지로 리다이렉트된다", async ({ page }) => {
  const gameId = await getGameIdByBggId(162886); // 스피릿 아일랜드
  await page.goto(`/games/${gameId}/edit`);
  await expect(page).toHaveURL("/login");
});

test("빈 본문으로 저장을 시도하면 에러가 표시되고 저장되지 않는다", async ({ page }) => {
  const email = `e2e-wikiedit-empty-${Date.now()}@example.com`;
  await createConfirmedUser(email, "password1234");
  const gameId = await getGameIdByBggId(266192); // 윙스팬

  try {
    await loginAs(page, email, "password1234");
    await page.goto(`/games/${gameId}/edit`);
    await page.locator("textarea").fill("");
    await page.getByRole("button", { name: "저장" }).click();

    await expect(page.getByText("내용을 입력해주세요")).toBeVisible();
    await expect(page).toHaveURL(`/games/${gameId}/edit`);
  } finally {
    await deleteUserByEmail(email);
  }
});

test("두 사용자가 같은 문서를 순차로 저장하면 나중 저장이 최종 본문이 되고 이력에 둘 다 남는다", async ({ browser }) => {
  const emailA = `e2e-wikiedit-concurrent-a-${Date.now()}@example.com`;
  const emailB = `e2e-wikiedit-concurrent-b-${Date.now()}@example.com`;
  const userA = await createConfirmedUser(emailA, "password1234");
  const userB = await createConfirmedUser(emailB, "password1234");
  const gameId = await getGameIdByBggId(161936); // 팬데믹 레거시 시즌1

  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  try {
    const pageA = await contextA.newPage();
    await loginAs(pageA, emailA, "password1234");
    await pageA.goto(`/games/${gameId}/edit`);
    await pageA.locator("textarea").fill("A의 편집");
    await pageA.getByRole("button", { name: "저장" }).click();
    await pageA.waitForURL(`/games/${gameId}`);

    const pageB = await contextB.newPage();
    await loginAs(pageB, emailB, "password1234");
    await pageB.goto(`/games/${gameId}/edit`);
    await pageB.locator("textarea").fill("B의 편집");
    await pageB.getByRole("button", { name: "저장" }).click();
    await pageB.waitForURL(`/games/${gameId}`);

    await expect(pageB.getByText("B의 편집")).toBeVisible();
    await pageB.getByText(/편집 이력 \(\d+\)/).click();
    await expect(pageB.getByText(/편집 이력 \(2\)/)).toBeVisible();
  } finally {
    await contextA.close();
    await contextB.close();
    await cleanupUserContent(userA!.id);
    await cleanupUserContent(userB!.id);
    await deleteUserByEmail(emailA);
    await deleteUserByEmail(emailB);
  }
});

test("첫 위키 편집 시 업적 토스트가 표시되고, 두 번째 편집에는 다시 표시되지 않는다", async ({ page }) => {
  const email = `e2e-wikiedit-achievement-${Date.now()}@example.com`;
  const user = await createConfirmedUser(email, "password1234");
  const firstGameId = await getGameIdByBggId(233078); // 트와일라잇 임페리움 4판
  const secondGameId = await getGameIdByBggId(220308); // 가이아 프로젝트

  try {
    await loginAs(page, email, "password1234");

    await page.goto(`/games/${firstGameId}/edit`);
    await page.locator("textarea").fill("첫 편집");
    await page.getByRole("button", { name: "저장" }).click();
    await expect(page.getByText("업적 획득! 첫 위키 편집")).toBeVisible();

    await page.goto(`/games/${secondGameId}/edit`);
    await page.locator("textarea").fill("두 번째 편집");
    await page.getByRole("button", { name: "저장" }).click();
    await page.waitForURL(`/games/${secondGameId}`);
    await expect(page.getByText("업적 획득!")).not.toBeVisible();
  } finally {
    await cleanupUserContent(user!.id);
    await deleteUserByEmail(email);
  }
});
