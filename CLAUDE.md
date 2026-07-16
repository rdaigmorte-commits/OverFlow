# CLAUDE.md — OverFlow

> Fichier d'instructions permanent, lu automatiquement par Claude Code au démarrage.
> Garde-le concis (< 200 lignes). Ajoute une règle seulement quand tu as dû corriger
> deux fois la même chose. Supprime ce qui n'est plus vrai.

## Projet
OverFlow — POC de mise en relation de joueurs (gaming) à Utrecht. Objectif : quantifier
et valider la demande locale, et faire monter le PM en compétence sur un mode de travail agentique.
Side project, pas d'enjeu commercial ni de deadline. Rien n'est en prod ; les données en base sont des tests.

## Stack
Next.js 14 (App Router) · React 18 / TypeScript · Zustand · React Hook Form + Zod ·
Tailwind · Supabase (SDK + SSR) · cible de déploiement : Vercel (non configuré à ce jour).

## Rôles (modèle opérationnel)
- **PM (humain)** — priorisation et stratégie. Arbitre, tranche les P0, décide du lancement.
- **PO (Claude en chat)** — owner du backlog : structure, rédige, maintient les US, signale les dérives.
- **DEV (toi, Claude Code)** — exécution dans le repo + tenue du backlog GitHub.
  → Après chaque livraison d'US (commit), pusher immédiatement sur GitHub (`git push origin main`).
  L'agent PO se base sur le dépôt GitHub pour rédiger les US — il doit toujours avoir la version à jour.

## Gouvernance — garde-fous permanents
1. **Stop + rapport avant écriture.** Pour toute opération à effet de bord (modif de code,
   migration, fermeture/création d'issue), présente d'abord un plan, exécute, puis rends compte
   de ce qui a été RÉELLEMENT fait. On compare toujours résultat vs instructions.
2. **Point d'arrêt sur les tâches de backlog.** Reste en lecture seule et attends validation
   explicite du PM avant toute écriture sur le backlog.
3. **Jamais de suppression d'issue.** On ferme en `superseded` avec commentaire de traçabilité.
   Ne jamais détruire la mémoire produit.
4. **Périmètre borné.** Respecte le scope/hors-scope de chaque US. Ne déborde pas « pour bien faire ».
5. **Sécurité.** Aucun secret en `NEXT_PUBLIC_`. Jamais de contact joueur (Discord/email) exposé
   avant accord mutuel. Vérifier au niveau réseau, pas seulement à l'affichage.
6. **Permissions.** Si une commande échoue par manque de scope, signale-le au PM avec la commande
   exacte à exécuter. Ne contourne pas.
7. **Révocations Postgres.** Chaque fonction/colonne de ce projet reçoit potentiellement DEUX
   grants distincts et cumulatifs à la création : un grant `PUBLIC` (`=X`, hérité par tous les
   rôles, y compris `anon`) ET un grant nommé direct (`anon`/`authenticated`). `REVOKE ... FROM
   anon` seul ne retire pas un grant `PUBLIC` sous-jacent, et vice versa — pour verrouiller
   vraiment une fonction, révoquer LES DEUX : `REVOKE ... FROM PUBLIC; REVOKE ... FROM anon;`.
   Même principe pour les colonnes : `REVOKE` par colonne ne retire pas un `GRANT` posé au niveau
   table entière. Toujours vérifier via `pg_proc.proacl` ou `information_schema.column_privileges`
   après un `REVOKE` — ne jamais supposer qu'il a fonctionné juste parce que la requête s'exécute
   sans erreur.

## Priorisation (grille)
- **P0** — ne peut pas être lancé en prod sans ça (« avant prod », pas « avant ce soir »).
- **P1** — nécessaire pour valider la demande à Utrecht (donnée d'apprentissage du POC).
- **P2** — souhaitable avant lancement : tient la promesse produit ou un chemin joueur réel.
- **P3** — craft, polish, dette invisible, ou idée future.

Boussole anti-dérive : *un joueur d'Utrecht verra-t-il ou ressentira-t-il ce travail ?*
Si non, c'est du craft/plaisir (légitime, mais à doser), pas de la validation.

## Format d'US
`US-<DOMAINE>-<NN>` · Titre · Priorité (+ justification) · Intention (persona + problème) ·
Périmètre (dans / hors scope) · Résultat attendu (testable, vérifiable oui/non) ·
Garde-fous · Done= (checklist) · Dépendances.
Les conventions permanentes vivent ici, pas dans chaque US.

## Source de vérité
GitHub Projects = backlog officiel. `BACKLOG.md` = version de référence rédigée par le PO.
`DECISIONS.md` = journal des arbitrages (le pourquoi). Ce fichier = règles permanentes.

## Rituel « Fin de session »
Quand le PM écrit **"Fin de session"**, exécute dans l'ordre :
1. Résume ce qui a été fait pendant la session (US touchées, code modifié, issues créées/fermées).
2. Mets à jour la section « État courant » ci-dessous (date + 3-5 lignes max).
3. Ajoute les décisions prises au fichier `DECISIONS.md` (date · décision · raison courte).
4. Si une règle a dû être corrigée 2 fois, propose-la en ajout à ce CLAUDE.md (ne l'ajoute
   qu'après accord du PM).
5. Commite les fichiers de mémoire (`CLAUDE.md`, `BACKLOG.md`, `DECISIONS.md`) avec un message clair.
6. Rends un court compte rendu de fin de session au PM.

## État courant
_(mis à jour à chaque « Fin de session »)_
- 2026-06-25 — 5 US livrées et fermées : ONB-02 #68 (refonte conversationnelle onboarding 5 étapes,
  looking_for, slides, animations), CITY-01 #69 (débranding Utrecht — 0 occurrence restante en .ts/.tsx),
  DATA-01 #52 (tracking funnel onboarding_events : start/complete/abandon), GEO-01 #70 (question binaire
  Utrecht step 1, badge accent MatchCard, slot IrlEventBlock), ONB-02 #71 (polish steps 2–5 : StyleCard,
  émojis, IRL checkbox déplacée, consentement). Hook notification son (Hand) configuré dans ~/.claude/settings.json.
- 2026-06-25 (session 2) — US-ONB-04 #73 livrée : badges texte langues (EN/NL/FR…) à la place des
  drapeaux emoji (non rendus Windows), checkbox open_irl supprimée du step 3, open_irl dérivé
  automatiquement depuis looking_for dans saveProfile(). Règle push-après-US ajoutée à CLAUDE.md.
- 2026-07-10 — Grosse session /matches + landing. Reskin candy finalisé (login/profile/admin).
  Algorithme de matching durci (Strong fit exige jeu+plateforme, score plafonné, formule alignée
  app/admin — voir DECISIONS.md). Nouvel onglet "Matched" avec révélation de contact persistante ;
  profils déjà matchés sortent de la grille. Badge/filtre IRL corrigés (mutuel, "Down to meet"
  remplace "Near me"). Cards de match repensées (raisons neutres, jeux mis en avant, icônes
  cohérentes RPG/plateforme/langue). Landing : hero moins redondant, visuel "squad" responsive
  avec duos connectés. US fermées : #58 (HOME-01), #72 (TECH-02), #60 (TECH-01). 9 profils
  TEST_* restent en base pour tests visuels — à nettoyer (`DELETE FROM profiles WHERE name LIKE
  'TEST_%'`), ainsi que le profil "Léa" créé pour tester le flow de match.
- 2026-07-13 — Audit sécurité complet (14 points) + corrections. 2 P0 corrigés et vérifiés en
  conditions réelles (#79, #80 — RLS onboarding_events, prise de contrôle de profil via
  claim_token). 8 points Haute/Moyenne/Basse traités dans la foulée (CSP/headers, fonctions SQL
  durcies, CORS notify-match, Next.js 14.2.35, pages d'erreur, rate limiting maison Postgres).
  Next.js 16 et validation Zod volontairement différés — 4 issues ouvertes pour la suite
  (#81-#84, P2/P3, non bloquantes). Détail technique complet en mémoire (jamais publié en clair
  sur le tracker public tant qu'une faille n'est pas corrigée).
- 2026-07-16 — US-SEC-14 #85 (P0) livrée et fermée : `link_profile_to_auth` permettait à
  n'importe quel compte authentifié de s'approprier un profil non réclamé (profile_id public,
  aucune vérification de possession). Corrigé en alignant sur le pattern `claim_token` déjà en
  place ailleurs (`app/auth/callback/page.tsx`). ESLint configuré (`next/core-web-vitals`),
  0 warning sur le code existant. Les deux commits sont déjà pushés sur `main`.
