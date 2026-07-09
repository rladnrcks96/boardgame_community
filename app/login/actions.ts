"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginResult = { status: "error"; message: string };

export async function login(formData: FormData): Promise<LoginResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", message: "이메일 또는 비밀번호가 올바르지 않습니다" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { status: "error", message: "이메일 인증이 필요합니다" };
    }
    return { status: "error", message: "이메일 또는 비밀번호가 올바르지 않습니다" };
  }

  redirect("/");
}
