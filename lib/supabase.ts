import { createBrowserClient } from '@supabase/ssr';

// Client à utiliser dans tous les composants 'use client'
// Il stocke la session dans les cookies, compatible SSR + navigation Next.js
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
