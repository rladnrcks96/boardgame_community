import { test, expect } from "@playwright/test";
import { deleteUserByEmail } from "./helpers/auth";

test("신규 이메일로 가입하면 즉시 로그인되어 메인 페이지로 이동한다", async ({ page }) => {
  const email = `e2e-signup-${Date.now()}@example.com`;

  try {
    await page.goto("/signup");
    await page.getByLabel("이메일").fill(email);
    await page.getByLabel("비밀번호").fill("password1234");
    await page.getByRole("button", { name: "가입하기" }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("button", { name: "로그아웃" })).toBeVisible();
  } finally {
    await deleteUserByEmail(email);
  }
});

test("이미 가입된 이메일로 다시 가입하면 에러가 표시된다", async ({ page }) => {
  const email = `e2e-signup-dup-${Date.now()}@example.com`;

  try {
    await page.goto("/signup");
    await page.getByLabel("이메일").fill(email);
    await page.getByLabel("비밀번호").fill("password1234");
    await page.getByRole("button", { name: "가입하기" }).click();
    await expect(page).toHaveURL("/");
    await page.getByRole("button", { name: "로그아웃" }).click();

    await page.goto("/signup");
    await page.getByLabel("이메일").fill(email);
    await page.getByLabel("비밀번호").fill("password1234");
    await page.getByRole("button", { name: "가입하기" }).click();

    await expect(page.locator('[data-slot="field-error"]')).toHaveText("이미 사용 중인 이메일입니다");
  } finally {
    await deleteUserByEmail(email);
  }
});
