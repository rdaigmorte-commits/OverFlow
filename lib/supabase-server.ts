import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Client à utiliser dans les Server Components et Route Handlers
// Ne pas utiliser dans les composants 'use client'
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Appelé depuis un Server Component — les cookies seront
            // rafraîchis par le middleware, pas de problème.
          }
        },
      },
    }
  );
}
