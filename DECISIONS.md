# DECISIONS.md — Journal des arbitrages OverFlow

> Format : `date · décision · raison courte`

---

## 2026-07-13

- Issues sécurité fermées en version expurgée sur le tracker public, détail complet gardé en
  interne (mémoire + rapport privé) · Le repo GitHub est public : publier la recette
  d'exploitation exacte d'une faille avant son correctif reviendrait à la rendre disponible à
  n'importe qui.
- Prise de contrôle de profil anonyme (SEC-09) corrigée via un `claim_token` généré côté client
  plutôt qu'en imposant un compte obligatoire · Préserve le flow "profil sans compte", choix
  produit assumé du POC (onboarding sans friction), tout en fermant le contournement identifié.
- Next.js mis à jour en patch (14.2.5 → 14.2.35) mais pas de passage à Next 16 pour l'instant ·
  Les CVE restantes après le patch ne s'appliquent quasiment pas à l'usage réel d'OverFlow (pas
  de next/image distant, pas de rewrites, pas d'i18n) ; une migration majeure (React 19) mérite
  sa propre session de tests, pas un `--force` glissé dans une série de correctifs sécurité.
- Seuils de rate limiting laissés à 5 créations de profil / IP / heure malgré un risque de faux
  positifs sur IP partagée (wifi d'événement, CGNAT mobile) · Décision PM explicite après avoir
  été informé du risque concret pour l'événement pilote Utrecht (US-ACT-01) ; trivial à remonter
  plus tard si besoin.

---

## 2026-07-10

- Reskin candy finalisé sur login/profile/admin · Complète le reskin dark→light entamé en session précédente ; login et admin héritaient déjà correctement des tokens, seul profile/edit avait des résidus de l'ancien style (chips violet/noir, bannières Tailwind brutes).
- Email jamais partagé avec les autres joueurs, séparé du bloc "coordonnées partageables" · L'email sert uniquement au magic link + notifications (confirmé en lisant `notify-match`) ; RPC `get_match_contact` modifiée pour ne plus jamais le retourner à un pair. Les 5 toggles "Share on mutual match" par champ retirés au profit d'un seul consentement global sur Discord/PSN/Steam/Autre.
- "Strong fit" exige désormais jeu ET plateforme en commun, en plus du score ≥ 60 · Sans ce gate, deux joueurs sans rien de jouable ensemble (juste style/langue/ville) pouvaient être étiquetés "Strong fit". Score plafonné à 59 quand le gate n'est pas rempli, pour que le % affiché ne contredise jamais le badge de tier.
- Formule de matching alignée entre `lib/match.ts` (app) et la RPC Supabase `get_match_opportunities` (dashboard admin) · Elles utilisaient deux barèmes complètement différents (poids, seuils, max). **Règle permanente actée** : toute évolution de l'algorithme doit être répercutée des deux côtés le même jour.
- `looking_for`/`open_irl` reste hors du score de matching · Mesure une intention différente (veut-on se rencontrer) de la compatibilité (a-t-on des points communs) ; mélanger les deux aurait pénalisé de vrais matchs pour une dimension différente. Mis en avant autrement : badge "IRL" (désormais mutuel, bug corrigé), filtre "Down to meet" (remplace "Near me", POC concentré sur Utrecht), tri secondaire à tier égal.
- Profils déjà matchés (demande acceptée, mutuel) sortent de la grille de découverte · "Let's play" n'a plus de sens une fois matché ; nouvel onglet "🤝 Matched" dans l'encart Invitations, coordonnées révélées et retrouvables à tout moment (persistant, plus seulement dans un modal ponctuel).
- US-HOME-01 (#58), US-TECH-02 (#72), US-TECH-01 (#60) fermées · Vérifiées et complétées cette session (voir commentaires de traçabilité sur chaque issue GitHub).

---

## 2026-06-25 (session 2)

- Badges texte (EN, NL, FR…) à la place des emojis drapeaux dans les chips langue · Les emojis drapeaux ne s'affichent pas sur Windows — cible principale du POC Utrecht.
- `open_irl` dérivé depuis `looking_for` (valeurs store : `'irl'` / `'both'`) · Supprime la redondance UX avec la question "You're here to…" au step 3. La colonne reste en base.
- Règle "push après chaque livraison US" ajoutée à CLAUDE.md · L'agent PO lit le dépôt GitHub pour rédiger les US — il doit voir le code à jour.

---

## 2026-06-18

- Scinder US-SEC-04 (#48) en deux : SEC-05 (admin RPCs) + SEC-06 (gate UI) · SEC-06 est P2, déjà couvert par forbidden state côté client pour l'instant.
- Retirer l'email de l'onboarding (SEC-02) · Conformité RGPD + réduction surface d'attaque. Email uniquement via Magic Link post-onboarding.
- REVOKE SELECT table-level sur profiles pour anon/authenticated + GRANT par colonne · Le REVOKE colonne seul ne suffit pas à surcharger un GRANT table-level en PostgreSQL.
- Liaison profil↔compte par UUID (link_profile_to_auth) et non par email · Email peut être null depuis SEC-02 ; l'UUID du profil est la seule clé fiable.

---

## 2026-06-25

- Compteur landing (app/page.tsx) sans filtre `.ilike('city', '%utrecht%')` · App rendue city-agnostic (US-CITY-01) — affiche tous les joueurs, pas seulement Utrecht.
- `looking_for TEXT DEFAULT 'both'` ajouté à la table profiles · Nouvelle donnée de qualification sans migration destructive pour profils existants.
- Table `onboarding_events` (session_id UUID, step, action) pour tracking funnel · session_id non lié au profileId — minimisation RGPD. Appels fire-and-forget (non bloquants).
- Question binaire "Are you based in Utrecht?" en step 1 plutôt que champ texte libre · Qualification intentionnelle du marché Utrecht pour le POC ; city reste stockée en TEXT libre.
- `profile/edit/page.tsx` laissé hors scope du polish émojis (US-ONB-02 #71) · Dette assumée : inconsistance visuelle onboarding vs edit, à traiter dans une US ultérieure.
- Checkbox open_irl déplacée du step 4 au step 3 (vibe) · Cohérence sémantique : l'intention IRL relève du profil joueur (vibe), pas du setup technique.
- Consentement step 5 sans mention Discord/email · Ces données ne sont pas encore collectées à ce stade — consentement sur données inexistantes = non-conforme RGPD.

---

## 2026-06-24

- Utiliser `useOverflowStore.getState()` dans `handleSession` (auth/callback) plutôt que la closure React · Next.js App Router rend côté serveur avec `profileId = null` (pas de localStorage) ; le `useEffect` capture cette closure vide avant que Zustand ne rehydrate. `getState()` bypass le cycle de rendu et lit l'état mémoire synchrone.
- Remplacer `select('*')` par `PUBLIC_PROFILE_FIELDS` dans `/matches` · Après le REVOKE table-level SEC-02, `select=*` retourne 401 pour anon et authenticated (email/discord/user_id non sélectionnables).
- Stocker `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local` (gitignoré) et non en ligne de commande · Shell history est un vecteur d'exposition. `.env.local` est gitignoré par Next.js par défaut et jamais injecté dans le bundle client (pas de préfixe `NEXT_PUBLIC_`).
- Script `gen-magiclink.mjs` pour contourner Resend en mode test · Resend test mode bloque tout envoi sauf vers l'adresse propriétaire du compte (alias +xxx refusés par 550). `auth.admin.generateLink` produit le lien sans envoi email, via service_role uniquement.
