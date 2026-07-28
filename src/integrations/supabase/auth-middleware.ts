import { supabase } from "./client";

/**
 * Supplies the authenticated, RLS-scoped Supabase client to client functions.
 */
export async function requireSupabaseAuth() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("Unauthorized: please sign in and try again.");
  }

  return {
    supabase,
    userId: data.user.id,
    claims: {
      sub: data.user.id,
      ...data.user.app_metadata,
      ...data.user.user_metadata,
    },
  };
}
