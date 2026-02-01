import { cookies } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { supabaseEnv } from "@/lib/env";

export function supabaseServer() {
  return createServerClient(
    supabaseEnv.SUPABASE_URL,
    supabaseEnv.SUPABASE_ANON_KEY,
    { cookies }
  );
}
