import { createClient } from "@supabase/supabase-js";
import { serviceRoleEnv, supabaseEnv } from "@/lib/env";

export const supabaseAdmin = createClient(
  supabaseEnv.SUPABASE_URL,
  serviceRoleEnv.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);
