import { test, expect } from "@playwright/test";
import { deleteUserByEmail, generateSignupConfirmationLink } from "./helpers/auth";

test("신규 이메일로 가입하면 인증 메일 발송 안내가 표시된다", async ({ page }) => {
  const email = `e2e-signup-${Date.now()}@example.com`;

  await page.goto("/signup");
  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호").fill("password1234");
  await page.getByRole("button", { name: "가입하기" }).click();

  await expect(page.getByRole("status")).toHaveText("인증 메일을 확인해주세요");

  await deleteUserByEmail(email);
});

test("이미 가입된 이메일로 다시 가입하면 에러가 표시된다", async ({ page }) => {
  const email = `e2e-signup-dup-${Date.now()}@example.com`;

  await page.goto("/signup");
  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호").fill("password1234");
  await page.getByRole("button", { name: "가입하기" }).click();
  await expect(page.getByRole("status")).toHaveText("인증 메일을 확인해주세요");

  await page.goto("/signup");
  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호").fill("password1234");
  await page.getByRole("button", { name: "가입하기" }).click();

  await expect(page.locator('[data-slot="field-error"]')).toHaveText("이미 사용 중인 이메일입니다");

  await deleteUserByEmail(email);
});

test("인증 링크를 클릭하면 인증 완료 후 로그인 페이지로 이동한다", async ({ page }) => {
  const email = `e2e-confirm-${Date.now()}@example.com`;
  const password = "password1234";

  const { action_link } = await generateSignupConfirmationLink(email, password);

  await page.goto(action_link);

  await expect(page).toHaveURL(/\/login\?confirmed=1/);
  await expect(page.getByRole("status")).toHaveText("인증이 완료되었습니다");

  await deleteUserByEmail(email);
});
