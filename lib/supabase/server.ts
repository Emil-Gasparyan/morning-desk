import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Supabase client for route handlers. Reads the signed-in person's session
// from cookies, so database rules (RLS) apply exactly as in the browser.
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    },
  );
}
