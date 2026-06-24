# DECISIONS.md — Journal des arbitrages OverFlow

> Format : `date · décision · raison courte`

---

## 2026-06-18

- Scinder US-SEC-04 (#48) en deux : SEC-05 (admin RPCs) + SEC-06 (gate UI) · SEC-06 est P2, déjà couvert par forbidden state côté client pour l'instant.
- Retirer l'email de l'onboarding (SEC-02) · Conformité RGPD + réduction surface d'attaque. Email uniquement via Magic Link post-onboarding.
- REVOKE SELECT table-level sur profiles pour anon/authenticated + GRANT par colonne · Le REVOKE colonne seul ne suffit pas à surcharger un GRANT table-level en PostgreSQL.
- Liaison profil↔compte par UUID (link_profile_to_auth) et non par email · Email peut être null depuis SEC-02 ; l'UUID du profil est la seule clé fiable.

---

## 2026-06-24

- Utiliser `useOverflowStore.getState()` dans `handleSession` (auth/callback) plutôt que la closure React · Next.js App Router rend côté serveur avec `profileId = null` (pas de localStorage) ; le `useEffect` capture cette closure vide avant que Zustand ne rehydrate. `getState()` bypass le cycle de rendu et lit l'état mémoire synchrone.
- Remplacer `select('*')` par `PUBLIC_PROFILE_FIELDS` dans `/matches` · Après le REVOKE table-level SEC-02, `select=*` retourne 401 pour anon et authenticated (email/discord/user_id non sélectionnables).
- Stocker `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local` (gitignoré) et non en ligne de commande · Shell history est un vecteur d'exposition. `.env.local` est gitignoré par Next.js par défaut et jamais injecté dans le bundle client (pas de préfixe `NEXT_PUBLIC_`).
- Script `gen-magiclink.mjs` pour contourner Resend en mode test · Resend test mode bloque tout envoi sauf vers l'adresse propriétaire du compte (alias +xxx refusés par 550). `auth.admin.generateLink` produit le lien sans envoi email, via service_role uniquement.
