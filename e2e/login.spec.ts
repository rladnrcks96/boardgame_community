import { test, expect } from "@playwright/test";
import { createConfirmedUser, deleteUserByEmail } from "./helpers/auth";

test("가입된 계정과 올바른 비밀번호로 로그인하면 메인 페이지로 이동한다", async ({ page }) => {
  const email = `e2e-login-${Date.now()}@example.com`;
  const password = "password1234";
  await createConfirmedUser(email, password);

  await page.goto("/login");
  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호").fill(password);
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(page).toHaveURL("/");

  await deleteUserByEmail(email);
});

test("잘못된 비밀번호로 로그인하면 에러가 표시된다", async ({ page }) => {
  const email = `e2e-login-wrongpw-${Date.now()}@example.com`;
  const password = "password1234";
  await createConfirmedUser(email, password);

  await page.goto("/login");
  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호").fill("wrong-password");
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(page.locator('[data-slot="field-error"]')).toHaveText("이메일 또는 비밀번호가 올바르지 않습니다");

  await deleteUserByEmail(email);
});
