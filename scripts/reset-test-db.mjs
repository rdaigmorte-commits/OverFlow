/**
 * reset-test-db.mjs — Wipe complet de la base de test OverFlow
 *
 * Usage :
 *   SUPABASE_SERVICE_ROLE_KEY=<clé> node scripts/reset-test-db.mjs
 *
 * Ou avec la clé dans .env.scripts (non commité) :
 *   node -r dotenv/config scripts/reset-test-db.mjs dotenv_config_path=.env.scripts
 *
 * Ce que fait le script (dans l'ordre) :
 *   1. DELETE public.match_requests (toutes les lignes)
 *   2. DELETE public.profiles       (toutes les lignes)
 *   3. Supprime tous les comptes auth.users sauf ADMIN_EMAIL
 *      via supabase.auth.admin.deleteUser() — pas de DELETE SQL direct
 *   4. Re-pose app_metadata.role='admin' sur ADMIN_EMAIL (sécurité)
 *   5. Vérifie et affiche le compte final
 *
 * Idempotent : relançable à chaque campagne de test.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─── Config ──────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = 'romain.daigmorte@gmail.com';

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env.local');
  const vars = {};
  try {
    const lines = readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const [key, ...rest] = line.split('=');
      if (key && rest.length) vars[key.trim()] = rest.join('=').trim();
    }
  } catch { /* .env.local absent — ok si vars dans process.env */ }
  return {
    url:            process.env.NEXT_PUBLIC_SUPABASE_URL         ?? vars['NEXT_PUBLIC_SUPABASE_URL'],
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY        ?? vars['SUPABASE_SERVICE_ROLE_KEY'],
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { url, serviceRoleKey } = loadEnv();

  if (!url || !serviceRoleKey) {
    console.error('❌  SUPABASE_SERVICE_ROLE_KEY manquant.');
    console.error('    Passe-le en variable d\'environnement :');
    console.error('    SUPABASE_SERVICE_ROLE_KEY=<clé> node scripts/reset-test-db.mjs');
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('\n🗑️  OverFlow — Reset base de test');
  console.log('─'.repeat(50));

  // ── 1. Vider match_requests ───────────────────────────────────────────────
  console.log('\n[1/5] Suppression de match_requests…');
  const { error: mrErr } = await supabase.from('match_requests').delete().gte('id', '00000000-0000-0000-0000-000000000000');
  if (mrErr) { console.error('❌  match_requests :', mrErr.message); process.exit(1); }
  console.log('     ✓ match_requests vide');

  // ── 2. Vider profiles ─────────────────────────────────────────────────────
  console.log('\n[2/5] Suppression des profils…');
  const { error: prErr } = await supabase.from('profiles').delete().gte('id', '00000000-0000-0000-0000-000000000000');
  if (prErr) { console.error('❌  profiles :', prErr.message); process.exit(1); }
  console.log('     ✓ profiles vide');

  // ── 3. Lister les comptes auth ────────────────────────────────────────────
  console.log('\n[3/5] Récupération des comptes auth…');
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) { console.error('❌  listUsers :', listErr.message); process.exit(1); }

  const toDelete = users.filter((u) => u.email !== ADMIN_EMAIL);
  const toKeep   = users.filter((u) => u.email === ADMIN_EMAIL);

  console.log(`     ${users.length} compte(s) trouvé(s) — ${toDelete.length} à supprimer, ${toKeep.length} conservé`);

  // ── 4. Supprimer les comptes non-admin ────────────────────────────────────
  console.log('\n[4/5] Suppression des comptes non-admin…');
  for (const user of toDelete) {
    const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
    if (delErr) {
      console.error(`❌  Impossible de supprimer ${user.email} : ${delErr.message}`);
    } else {
      console.log(`     ✓ ${user.email} supprimé`);
    }
  }

  // ── 5. Re-poser app_metadata.role='admin' sur le compte PM ───────────────
  if (toKeep.length > 0) {
    console.log('\n[5/5] Re-pose du rôle admin sur le compte PM…');
    const pmId = toKeep[0].id;
    const { error: roleErr } = await supabase.auth.admin.updateUserById(pmId, {
      app_metadata: { ...toKeep[0].app_metadata, role: 'admin' },
    });
    if (roleErr) {
      console.error('❌  Impossible de re-poser le rôle admin :', roleErr.message);
    } else {
      console.log(`     ✓ app_metadata.role='admin' confirmé sur ${ADMIN_EMAIL}`);
    }
  } else {
    console.log('\n[5/5] Compte PM absent — le rôle admin sera posé à la prochaine connexion.');
    console.log('      Après reconnexion, exécute manuellement en SQL :');
    console.log(`      UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb WHERE email = '${ADMIN_EMAIL}';`);
  }

  // ── Vérification finale ───────────────────────────────────────────────────
  console.log('\n─'.repeat(50));
  console.log('📊  État final :');

  const { count: mrCount } = await supabase.from('match_requests').select('*', { count: 'exact', head: true });
  const { count: prCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { data: { users: finalUsers } } = await supabase.auth.admin.listUsers();

  console.log(`     match_requests : ${mrCount ?? '?'} (attendu : 0)`);
  console.log(`     profiles       : ${prCount ?? '?'} (attendu : 0)`);
  console.log(`     auth.users     : ${finalUsers.length} (attendu : 1 — admin uniquement)`);

  const adminUser = finalUsers.find((u) => u.email === ADMIN_EMAIL);
  if (adminUser) {
    const role = adminUser.app_metadata?.role ?? '(absent)';
    console.log(`     admin role     : ${role} (attendu : admin)`);
  }

  const ok = mrCount === 0 && prCount === 0 && finalUsers.length === 1 && adminUser?.app_metadata?.role === 'admin';
  console.log('\n' + (ok ? '✅  Reset complet — base prête pour les tests.' : '⚠️  Vérification échouée — voir ci-dessus.'));
  console.log('─'.repeat(50) + '\n');
}

main().catch((err) => { console.error('❌  Erreur inattendue :', err); process.exit(1); });
