import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Déclenché par Vercel Cron (voir vercel.json). Vercel injecte automatiquement
// `Authorization: Bearer ${CRON_SECRET}` sur les requêtes cron si la variable
// d'env CRON_SECRET est définie sur le projet — c'est notre seule protection,
// pas de JWT utilisateur ici (appel serveur-à-serveur).
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Server misconfigured: missing Supabase service role key' }, { status: 500 });
  }

  // La clé service_role est un JWT signé par Supabase — elle satisfait le
  // verify_jwt de l'Edge Function sans avoir besoin d'un secret supplémentaire
  // côté Supabase.
  const res = await fetch(`${supabaseUrl}/functions/v1/weekly-digest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
  });

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
