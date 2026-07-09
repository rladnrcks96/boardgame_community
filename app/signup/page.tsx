"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type SignupResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";

export default function SignupPage() {
  const [result, formAction, isPending] = useActionState<
    SignupResult | null,
    FormData
  >(async (_prev, formData) => signup(formData), null);

  return (
    <main className="mx-auto max-w-sm p-4">
      <h1 className="mb-4 text-center text-sm font-bold">회원가입</h1>
      <form action={formAction}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">이메일</FieldLabel>
            <Input id="email" name="email" type="email" required placeholder="you@example.com" />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">비밀번호</FieldLabel>
            <Input id="password" name="password" type="password" required minLength={8} />
          </Field>
          {result?.status === "error" && <FieldError>{result.message}</FieldError>}
          <Button type="submit" disabled={isPending}>
            가입하기
          </Button>
        </FieldGroup>
      </form>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        이미 계정이 있으신가요? <Link href="/login" className="underline">로그인</Link>
      </p>
    </main>
  );
}
