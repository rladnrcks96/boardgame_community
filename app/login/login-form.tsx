"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type LoginResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";

export function LoginForm({ confirmed }: { confirmed?: boolean }) {
  const [result, formAction, isPending] = useActionState<
    LoginResult | null,
    FormData
  >(async (_prev, formData) => login(formData), null);

  return (
    <main className="mx-auto max-w-sm p-4">
      <h1 className="mb-4 text-center text-sm font-bold">로그인</h1>
      {confirmed && (
        <p role="status" className="mb-4 rounded-md bg-muted p-3 text-sm">
          인증이 완료되었습니다
        </p>
      )}
      <form action={formAction}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">이메일</FieldLabel>
            <Input id="email" name="email" type="email" required placeholder="you@example.com" />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">비밀번호</FieldLabel>
            <Input id="password" name="password" type="password" required />
          </Field>
          {result?.status === "error" && <FieldError>{result.message}</FieldError>}
          <Button type="submit" disabled={isPending}>
            로그인
          </Button>
        </FieldGroup>
      </form>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        계정이 없으신가요? <Link href="/signup" className="underline">회원가입</Link>
      </p>
    </main>
  );
}
