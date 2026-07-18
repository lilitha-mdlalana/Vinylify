import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Server-only Supabase admin client (service role — bypasses RLS).
 * The service key must never reach the browser; "server-only" enforces
 * this module can't be imported from client components.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (client) {
    return client;
  }
  const url = process.env.SUPABASE_URL;
  // New-style secret key (sb_secret_…) or legacy service_role JWT — same privileges
  const serviceKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY) must be set in the environment."
    );
  }
  client = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
  return client;
}
