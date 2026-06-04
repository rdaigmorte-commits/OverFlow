import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Ce middleware s'exécute à chaque requête.
// Son rôle : rafraîchir les cookies de session Supabase pour qu'ils
// ne périment pas pendant la navigation — c'est ce qui évite la
// déconnexion fantôme sur /matches.
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT : ne pas écrire de logique entre createServerClient et getUser().
  // Une erreur ici pourrait laisser l'utilisateur déconnecté.
  await supabase.auth.getUser();

  return supabaseResponse;
}

// Définit sur quelles routes le middleware s'applique.
// On exclut les fichiers statiques et les assets Next.js.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
