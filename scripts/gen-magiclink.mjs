/**
 * gen-magiclink.mjs — Génère un Magic Link de test sans envoi d'email
 *
 * Utilise l'API admin Supabase (generateLink) pour produire le lien
 * directement dans le terminal. Pratique en mode test Resend (domaine
 * non vérifié) ou pour créer des comptes de test arbitraires.
 *
 * Usage :
 *   node scripts/gen-magiclink.mjs liam@test.local
 *   node scripts/gen-magiclink.mjs sophie@test.local --port 3000
 *   node scripts/gen-magiclink.mjs romain.daigmorte@gmail.com --port 3001
 *
 * Options :
 *   --port <n>   Port du serveur de dev (défaut : 3001)
 *
 * Prérequis :
 *   SUPABASE_SERVICE_ROLE_KEY dans .env.local (déjà présent si tu as
 *   lancé le script de reset). La clé n'est jamais exposée côté client.
 *
 * Le lien généré est valable 1 heure. Colle-le tel quel dans le navigateur.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─── Parsing args ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const email = args.find((a) => !a.startsWith('--'));
const portArg = args.find((a) => a.startsWith('--port'));
const port = portArg ? portArg.split('=')[1] ?? args[args.indexOf(portArg) + 1] : '3001';

if (!email) {
  console.error('Usage : node scripts/gen-magiclink.mjs <email> [--port <n>]');
  console.error('Exemple : node scripts/gen-magiclink.mjs liam@test.local --port 3001');
  process.exit(1);
}

// ─── Config ───────────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env.local');
  const vars = {};
  try {
    const lines = readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const [key, ...rest] = line.split('=');
      if (key && rest.length) vars[key.trim()] = rest.join('=').trim();
    }
  } catch { /* .env.local absent */ }
  return {
    url:            process.env.NEXT_PUBLIC_SUPABASE_URL        ?? vars['NEXT_PUBLIC_SUPABASE_URL'],
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY       ?? vars['SUPABASE_SERVICE_ROLE_KEY'],
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { url, serviceRoleKey } = loadEnv();

  if (!url || !serviceRoleKey) {
    console.error('❌  SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local');
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const redirectTo = `http://localhost:${port}/auth/callback`;

  console.log(`\n🔗  Génération du Magic Link`);
  console.log(`    email       : ${email}`);
  console.log(`    redirect_to : ${redirectTo}\n`);

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo },
  });

  if (error) {
    console.error('❌  Erreur :', error.message);
    process.exit(1);
  }

  const link = data?.properties?.action_link;
  if (!link) {
    console.error('❌  Lien introuvable dans la réponse :', JSON.stringify(data));
    process.exit(1);
  }

  console.log('✅  Magic Link (valable 1h) :\n');
  console.log(link);
  console.log('\n👆  Colle ce lien dans le navigateur. Aucun email envoyé.\n');
}

main().catch((err) => { console.error('❌  Erreur inattendue :', err); process.exit(1); });
