import { createClient } from "@supabase/supabase-js";
import type { Page } from "@playwright/test";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function createConfirmedUser(email: string, password: string) {
  const { data, error } = await admin().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user;
}

export async function createUnconfirmedUser(email: string, password: string) {
  const { data, error } = await admin().auth.admin.createUser({
    email,
    password,
    email_confirm: false,
  });
  if (error) throw error;
  return data.user;
}

export async function generateSignupConfirmationLink(email: string, password: string) {
  const { data, error } = await admin().auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: { redirectTo: "http://localhost:3000/auth/confirm" },
  });
  if (error) throw error;
  return data.properties;
}

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호").fill(password);
  await page.getByRole("button", { name: "로그인" }).click();
  await page.waitForURL("/");
}

export async function deleteUserByEmail(email: string) {
  const { data } = await admin().auth.admin.listUsers();
  const user = data.users.find((u) => u.email === email);
  if (user) await admin().auth.admin.deleteUser(user.id);
}
