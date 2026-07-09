"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type SignupResult =
  | { status: "success" }
  | { status: "error"; message: string };

export async function signup(formData: FormData): Promise<SignupResult> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", message: "이메일과 비밀번호(8자 이상)를 확인해주세요" };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${siteUrl}/auth/confirm` },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return { status: "error", message: "이미 사용 중인 이메일입니다" };
    }
    return { status: "error", message: "가입 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요" };
  }

  // 이미 가입 완료된 이메일로 재가입 시도하면 Supabase는 에러 대신
  // identities가 빈 배열인 유저 객체를 반환한다 (이메일 열거 방지).
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { status: "error", message: "이미 사용 중인 이메일입니다" };
  }

  return { status: "success" };
}
