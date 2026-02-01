import { z } from "zod";

const supabaseSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1)
});

const serviceRoleSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1)
});

const mapboxSchema = z.object({
  MAPBOX_TOKEN: z.string().min(1)
});

const openaiSchema = z.object({
  OPENAI_API_KEY: z.string().min(1)
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().min(1)
});

export const supabaseEnv = supabaseSchema.parse({
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
});

export const serviceRoleEnv = serviceRoleSchema.parse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
});

export const mapboxEnv = mapboxSchema.parse({
  MAPBOX_TOKEN: process.env.MAPBOX_TOKEN
});

export const openaiEnv = openaiSchema.parse({
  OPENAI_API_KEY: process.env.OPENAI_API_KEY
});

export const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN
});
