import { test, expect } from "@playwright/test";
import { createConfirmedUser, deleteUserByEmail, loginAs } from "./helpers/auth";
import { getGameIdByBggId, cleanupUserContent } from "./helpers/games";

test("별점과 본문으로 리뷰를 등록하면 목록에 추가되고 평균 평점이 재계산된다", async ({ page }) => {
  const email = `e2e-review-basic-${Date.now()}@example.com`;
  const user = await createConfirmedUser(email, "password1234");
  const gameId = await getGameIdByBggId(68448); // 7원더스

  try {
    await loginAs(page, email, "password1234");
    await page.goto(`/games/${gameId}/reviews/new`);
    await page.getByRole("button", { name: "4점" }).click();
    await page.locator("textarea").fill("재미있는 카드 드래프트 게임입니다");
    await page.getByRole("button", { name: "등록" }).click();

    await page.waitForURL(`/games/${gameId}`);
    await expect(page.getByText("4.0 (1개 리뷰)")).toBeVisible();
    await page.getByRole("tab", { name: "리뷰" }).click();
    await expect(page.getByText("재미있는 카드 드래프트 게임입니다")).toBeVisible();
  } finally {
    await cleanupUserContent(user!.id);
    await deleteUserByEmail(email);
  }
});

test("태그를 선택해 등록하면 리뷰와 게임 상세 태그 집계에 함께 표시된다", async ({ page }) => {
  const email = `e2e-review-tags-${Date.now()}@example.com`;
  const user = await createConfirmedUser(email, "password1234");
  const gameId = await getGameIdByBggId(230802); // 아줄

  try {
    await loginAs(page, email, "password1234");
    await page.goto(`/games/${gameId}/reviews/new`);
    await page.getByRole("button", { name: "5점" }).click();
    await page.getByText("마피아류").click();
    await page.getByText("파티게임").click();
    await page.locator("textarea").fill("가볍게 즐기기 좋아요");
    await page.getByRole("button", { name: "등록" }).click();

    await page.waitForURL(`/games/${gameId}`);
    await expect(page.getByText("마피아류 1명")).toBeVisible();
    await expect(page.getByText("파티게임 1명")).toBeVisible();
    await page.getByRole("tab", { name: "리뷰" }).click();
    await expect(page.getByText("마피아류", { exact: true })).toBeVisible();
  } finally {
    await cleanupUserContent(user!.id);
    await deleteUserByEmail(email);
  }
});

test("태그 없이 등록하면 태그 없이 리뷰만 등록된다", async ({ page }) => {
  const email = `e2e-review-notags-${Date.now()}@example.com`;
  const user = await createConfirmedUser(email, "password1234");
  const gameId = await getGameIdByBggId(148228); // 스플렌더

  try {
    await loginAs(page, email, "password1234");
    await page.goto(`/games/${gameId}/reviews/new`);
    await page.getByRole("button", { name: "3점" }).click();
    await page.locator("textarea").fill("무난합니다");
    await page.getByRole("button", { name: "등록" }).click();

    await page.waitForURL(`/games/${gameId}`);
    await expect(page.getByText("아직 태그가 달린 리뷰가 없습니다")).toBeVisible();
  } finally {
    await cleanupUserContent(user!.id);
    await deleteUserByEmail(email);
  }
});

test("리뷰 작성 화면에는 고정 목록 밖의 태그를 자유 입력할 수 있는 UI가 없다", async ({ page }) => {
  const email = `e2e-review-fixedtags-${Date.now()}@example.com`;
  await createConfirmedUser(email, "password1234");
  const gameId = await getGameIdByBggId(178900); // 코드네임

  try {
    await loginAs(page, email, "password1234");
    await page.goto(`/games/${gameId}/reviews/new`);

    await expect(page.getByText("마피아류")).toBeVisible();
    await expect(page.locator('input[type="text"]')).toHaveCount(0);
  } finally {
    await deleteUserByEmail(email);
  }
});

test("이미 리뷰를 남긴 게임에 다시 등록하면 기존 리뷰가 수정되고 중복 생성되지 않는다", async ({ page }) => {
  const email = `e2e-review-update-${Date.now()}@example.com`;
  const user = await createConfirmedUser(email, "password1234");
  const gameId = await getGameIdByBggId(30549); // 팬데믹

  try {
    await loginAs(page, email, "password1234");
    await page.goto(`/games/${gameId}/reviews/new`);
    await page.getByRole("button", { name: "3점" }).click();
    await page.locator("textarea").fill("첫 리뷰");
    await page.getByRole("button", { name: "등록" }).click();
    await page.waitForURL(`/games/${gameId}`);

    await page.goto(`/games/${gameId}/reviews/new`);
    await page.getByRole("button", { name: "5점" }).click();
    await page.locator("textarea").fill("생각이 바뀌었어요, 최고");
    await page.getByRole("button", { name: "등록" }).click();
    await page.waitForURL(`/games/${gameId}`);

    await expect(page.getByText("5.0 (1개 리뷰)")).toBeVisible();
    await page.getByRole("tab", { name: "리뷰" }).click();
    await expect(page.getByText("생각이 바뀌었어요, 최고")).toBeVisible();
    await expect(page.getByText("첫 리뷰")).not.toBeVisible();
  } finally {
    await cleanupUserContent(user!.id);
    await deleteUserByEmail(email);
  }
});

test("비로그인 사용자가 리뷰 작성 페이지로 이동하면 로그인 페이지로 리다이렉트된다", async ({ page }) => {
  const gameId = await getGameIdByBggId(36218); // 도미니언
  await page.goto(`/games/${gameId}/reviews/new`);
  await expect(page).toHaveURL("/login");
});

test("첫 리뷰 작성 시 업적 토스트가 표시되고, 두 번째 리뷰에는 다시 표시되지 않는다", async ({ page }) => {
  const email = `e2e-review-achievement-${Date.now()}@example.com`;
  const user = await createConfirmedUser(email, "password1234");
  const firstGameId = await getGameIdByBggId(3076); // 푸에르토리코
  const secondGameId = await getGameIdByBggId(31260); // 아그리콜라

  try {
    await loginAs(page, email, "password1234");

    await page.goto(`/games/${firstGameId}/reviews/new`);
    await page.getByRole("button", { name: "4점" }).click();
    await page.locator("textarea").fill("첫 리뷰");
    await page.getByRole("button", { name: "등록" }).click();
    await expect(page.getByText("업적 획득!")).toBeVisible();

    await page.goto(`/games/${secondGameId}/reviews/new`);
    await page.getByRole("button", { name: "4점" }).click();
    await page.locator("textarea").fill("두 번째 리뷰");
    await page.getByRole("button", { name: "등록" }).click();
    await page.waitForURL(`/games/${secondGameId}`);
    await expect(page.getByText("업적 획득!")).not.toBeVisible();
  } finally {
    await cleanupUserContent(user!.id);
    await deleteUserByEmail(email);
  }
});
