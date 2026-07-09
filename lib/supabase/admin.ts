import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// service_role 키로 RLS를 우회한다 — 시딩 스크립트, 서버 전용 작업에서만 사용한다. 클라이언트 코드에서 import하지 않는다.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
