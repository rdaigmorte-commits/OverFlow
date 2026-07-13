# OverFlow — Backlog produit (refonte du 2026-06-18, v2)

> Source de vérité : GitHub Projects. Ce fichier est la version de référence rédigée
> par le PO (Claude) et validée par le PM (toi). Il sert à (re)construire les issues.
> v2 : intègre les findings de la vérification croisée (US-SEC-04, enrichissements).

---

## Méthodologie

### Modèle opérationnel (rôles)
- **PM (humain)** — garant de la priorisation et de la stratégie. Arbitre, tranche les P0, décide du lancement.
- **PO (Claude chat)** — owner du backlog. Structure, rédige et maintient les US, propose les priorités, signale les dérives.
- **DEV (Claude Code)** — exécute les US dans le repo et tient le backlog GitHub à jour.

### Grille de priorité
- **P0** — Ne peut pas être lancé en prod sans ça (« avant prod », pas « avant ce soir »).
- **P1** — Nécessaire pour valider la demande à Utrecht (donnée d'apprentissage du POC).
- **P2** — Souhaitable avant lancement : tient la promesse produit ou améliore un chemin joueur réel.
- **P3** — Craft, polish, dette invisible pour l'utilisateur, ou idée future.

### Convention de nommage
`US-<DOMAINE>-<NN>` — domaines : SEC, DATA, ACT, LAND, UX, MATCH, ONB, HOME, RET, TECH, AUTH, OPS.

### Format d'US
Titre · Priorité (+ justification) · Intention · Périmètre (dans/hors scope) ·
Résultat attendu (testable) · Garde-fous · Done= · Dépendances.
Les conventions permanentes vivent dans CLAUDE.md, pas dans chaque US.

---

## P0 — Bloque une mise en ligne responsable

### US-SEC-01 · Sécuriser l'accès admin
**Priorité : P0** — L'accès au back-office et aux stats produit ne peut pas reposer sur un secret exposé côté client.

**Intention** — En tant que fondateur-admin, je dois être le seul à accéder au dashboard `/admin`, pour protéger les données agrégées. Aujourd'hui le mot de passe est lisible dans le bundle JS public et contournable via la console.

**Périmètre**
- *Dans le scope :* authentification serveur de `/admin` ; protection de la route côté serveur ; révocation de l'ancien secret.
- *Hors scope :* refonte du dashboard ; multi-admins ; rôles granulaires.

**Résultat attendu (testable)**
- La chaîne de l'ancien mot de passe n'apparaît plus dans le bundle client.
- Accéder à `/admin` sans session admin valide renvoie vers un login.
- Forcer l'état via la console (sessionStorage) ne donne plus accès au contenu ni aux RPC.
- Les 9 RPC de stats ne sont appelables que par une session admin authentifiée.

**Garde-fous**
- Nouveau secret jamais préfixé `NEXT_PUBLIC_`.
- Ancien mot de passe considéré comme définitivement brûlé.
- Ne pas casser l'auth Magic Link des pages joueur.

**Done =** route protégée serveur · ancien secret révoqué · 4 conditions vérifiées · issue à jour.
**Dépendances** — aucune.

---

### US-SEC-02 · Protéger les contacts et l'intégrité des demandes de match
**Priorité : P0** — Tient la promesse privacy-first ET ferme une faille d'usurpation/spam. Fusion ex-#27 + finding [C2].

**Intention** — En tant que joueur, mon contact ne doit être révélé qu'après accord mutuel, et personne ne doit créer une demande en mon nom. Aujourd'hui le contact s'affiche dès le clic « Let's Play », et la RLS INSERT (`WITH CHECK true`, rôle public) permet usurpation et gonflage du compteur.

**Périmètre**
- *Dans le scope :* RLS de `match_requests` (INSERT conditionné à l'identité réelle ; SELECT restreint à ses lignes) ; flow de demande en 2 temps ; masquage des contacts tant que statut ≠ `accepted` ; états visuels des cartes selon le statut (aucun bouton / "Request sent" / "Connected").
- *Hors scope :* messagerie ; notifications push ; refonte de l'algo de matching ; bouton "Cancel request" (→ P2, refinement).

**Résultat attendu (testable)**
- Une demande ne peut être créée que par l'émetteur authentifié (impossible de forger `sender_id`).
- Un utilisateur ne lit que les demandes où il est émetteur ou destinataire.
- Le contact du destinataire n'est pas dans la réponse réseau tant que statut ≠ `accepted`.
- Le compteur inbound ne peut pas être gonflé par insertions arbitraires.
- Le destinataire peut accepter/refuser avant tout échange de contact.
- Les cartes reflètent visuellement le statut de la demande.

**Garde-fous**
- Conserver la contrainte UNIQUE(sender_id, receiver_id).
- Aucun contact côté client avant acceptation (vérifier le payload réseau, pas que l'affichage).
- Ne pas régresser le matching (fetch limité aux PUBLIC_PROFILE_FIELDS).

**Done =** RLS corrigées · flow 2 temps · contacts masqués (vérifié réseau) · états cartes · issue à jour.
**Dépendances** — recoupe US-AUTH-01 (auth) et US-SEC-04 (verify_jwt).

---

### US-SEC-03 · Consentement explicite au partage de contact
**Priorité : P0** — Garantie RGPD (Pays-Bas). État actuel AGGRAVÉ : `consent: true` est hardcodé silencieusement → consentement falsifié, pire qu'absent.

**Intention** — En tant que joueur, je dois être informé et donner un consentement explicite au partage de mon contact après accord mutuel. Aujourd'hui `consent: true` est écrit en dur sans rien demander.

**Périmètre**
- *Dans le scope :* RETIRER d'abord le `consent: true` hardcodé (app/onboarding/page.tsx:212) ; texte de consentement clair ; stockage du vrai consentement (champ `consent` existant) ; blocage soumission sans consentement.
- *Hors scope :* politique de confidentialité complète ; bannière cookies ; droits d'accès/suppression RGPD (plus tard).

**Résultat attendu (testable)**
- Aucun chemin de code n'écrit `consent` sans interaction explicite de l'utilisateur.
- L'onboarding affiche un texte explicite sur le partage de contact.
- Le profil ne peut être soumis sans consentement donné.
- `consent` reflète le choix réel de l'utilisateur en base.

**Garde-fous**
- Texte compréhensible par un non-juriste (anglais probable — à confirmer PM).
- Ne pas alourdir au point de casser le taux de complétion.
- Vérifier qu'aucun autre chemin de sauvegarde ne réintroduit un consentement hardcodé.

**Done =** hardcode retiré · texte affiché · soumission bloquée sans consentement · `consent` réel persisté · issue à jour.
**Dépendances** — aucune.

---

### US-SEC-04 · Sécuriser l'Edge Function notify-match
**Priorité : P0** — Deux problèmes sur la même fonction : un vecteur de spam email actif, et une contrainte d'envoi à lever avant prod.

**Intention** — En tant que joueur, je dois recevoir mes notifications (et personne ne doit pouvoir en déclencher en mon nom). Aujourd'hui l'Edge Function est déployée avec `verify_jwt: false` (aucune auth) et, combinée à la RLS ouverte, permet le spam. De plus, l'envoi est bridé en mode test (un seul destinataire whitelisté Resend).

**Périmètre**
- *Dans le scope :* activer la vérification d'authentification sur l'Edge Function (`verify_jwt: true` ou contrôle équivalent) ; débloquer l'envoi multi-destinataires quand le compte Resend le permettra (retirer `POC_EMAIL` codé en dur + le footer exposant l'email réel).
- *Hors scope :* refonte du template email ; système de préférences de notification.

**Résultat attendu (testable)**
- L'Edge Function rejette les appels non authentifiés.
- Un appel direct à notify-match sans session valide ne déclenche aucun email.
- (Pré-prod, dépendance Resend) les emails partent à la vraie adresse du destinataire, pas à `POC_EMAIL`.
- (Pré-prod) le footer n'expose plus l'adresse réelle du destinataire.

**Garde-fous**
- Le mode test actuel (POC_EMAIL) est une contrainte assumée tant que Resend ne whiteliste qu'une adresse : NE PAS le « corriger » avant que l'envoi multi-destinataires soit disponible — juste le tracer comme bloquant pré-lancement.
- RESEND_API_KEY doit être configurée à DEUX endroits : variables d'env Vercel (Next.js) ET secrets Supabase (Edge Function).

**Done =** auth activée sur la fonction · appel non authentifié rejeté · dépendance Resend tracée pour le go-live · issue à jour.
**Dépendances** — cohérent avec US-SEC-02 (RLS) ; dépendance externe : upgrade compte Resend.

---

## P1 — Nécessaire pour valider la demande à Utrecht

### US-DATA-01 · Tracking du taux de complétion de l'onboarding
**Priorité : P1** — Donnée d'apprentissage n°1 du POC. Stockage tranché : table Supabase. Ex-#15.

**Intention** — En tant que PM, je dois savoir à quelle étape les utilisateurs abandonnent l'onboarding, pour itérer avec des données.

**Périmètre**
- *Dans le scope :* table `onboarding_events` dans Supabase ; enregistrement des actions `start` / `complete` / `abandon` par étape ; moyen de consulter le funnel (requête ou affichage admin simple).
- *Hors scope :* outil d'analytics tiers (Vercel Analytics écarté) ; dashboards élaborés ; tracking hors onboarding.

**Résultat attendu (testable)**
- Chaque action d'étape (start/complete/abandon) génère un événement horodaté rattachable à une session/profil.
- On peut produire un décompte par étape (combien commencent, finissent, abandonnent chaque étape).
- Aucune donnée personnelle inutile n'est loggée (avancement seulement).

**Garde-fous**
- Minimisation des données (RGPD).
- Le tracking ne ralentit pas l'onboarding perçu.

**Done =** table créée · events start/complete/abandon enregistrés · funnel consultable · issue à jour.
**Dépendances** — aucune.

---

### US-ACT-01 · Pré-inscription à l'événement pilote
**Priorité : P1** — La présence à l'événement d'Utrecht est une métrique de succès directe du POC. Ex-#19.

**Intention** — En tant que joueur intéressé, je peux signaler que je veux participer à l'événement pilote IRL, pour que le PM mesure l'intérêt réel.

**Périmètre**
- *Dans le scope :* migration schema (`interested_in_irl_event` sur `profiles`) ; bloc de pré-inscription visible uniquement si `matches.length === 0` ; principe opt-in explicite ; moyen admin de compter/lister les intéressés.
- *Hors scope :* billetterie ; gestion de capacité ; emails de relance (rétention).

**Résultat attendu (testable)**
- Le champ `interested_in_irl_event` existe et est persisté.
- Le joueur signale son intérêt via une action opt-in explicite (jamais coché par défaut).
- Le bloc n'apparaît que lorsque le joueur n'a aucun match.
- L'admin obtient le nombre et la liste des intéressés.

**Garde-fous**
- Migration non destructive (défaut sûr pour profils existants).
- Opt-in strict (pas opt-out) — exigence RGPD.
- Ne pas exposer la liste des intéressés côté public.

**Done =** migration · opt-in explicite · affichage conditionnel · décompte admin · issue à jour.
**Dépendances** — aucune.

---

### US-LAND-01 · Landing dynamique avec compteur Utrecht
**Priorité : P1** — Ancre le POC géographiquement, sert la conversion. Ex-#26. *DEV : vérifier le code déjà existant.*

**Intention** — En tant que visiteur d'Utrecht, je vois une preuve d'activité locale, pour avoir envie de rejoindre.

**Périmètre**
- *Dans le scope :* compteur réel basé sur les données (joueurs à Utrecht) ; argument IRL above the fold ; liste des jeux les plus représentés (social proof secondaire, fallback statique).
- *Hors scope :* A/B testing ; multi-villes ; animations lourdes.

**Résultat attendu (testable)**
- La landing affiche un compteur reflétant une donnée réelle (pas codée en dur).
- Le compteur se rafraîchit (ISR ~1h) à mesure que des profils Utrecht sont créés.
- L'argument IRL est visible sans scroll.
- Aucune donnée personnelle exposée (agrégat uniquement).

**Garde-fous**
- Dégradation propre si donnée indisponible (fallback, pas d'écran cassé).
- Agrégat seulement, jamais de noms/contacts.

**Done =** compteur réel + ISR · argument IRL above the fold · jeux représentés · agrégat sûr · issue à jour.
**Dépendances** — aucune.

---

## P2 — Souhaitable avant lancement (promesse / expérience joueur)

### US-UX-01 · Confirmation explicite après soumission de l'onboarding
**Priorité : P2** — Petit effort, vrai gain sur un chemin que tout joueur emprunte. Ex-#17.

**Intention** — En tant que joueur qui termine l'onboarding, je reçois un retour visuel clair (succès/erreur) à la sauvegarde, pour ne pas rester dans le doute.

**Périmètre**
- *Dans le scope :* loading pendant la sauvegarde ; confirmation de succès ; message d'erreur exploitable (ex. timeout Supabase).
- *Hors scope :* refonte visuelle de l'onboarding ; retry automatique.

**Résultat attendu (testable)**
- Indicateur de chargement visible pendant la sauvegarde.
- Confirmation explicite en cas de succès.
- Message clair en cas d'échec ; le travail n'est pas silencieusement perdu.

**Garde-fous**
- Pas de faux succès si la sauvegarde a échoué côté serveur.

**Done =** loading + succès + erreur gérés · issue à jour.
**Dépendances** — aucune.

---

### US-MATCH-01 · Page profil détaillé `/profile/[id]`
**Priorité : P2** — Débloque « voir avant de contacter », lève une dépendance pour US-HOME-01. Ex-#10.

**Intention** — En tant que joueur, je peux consulter le profil détaillé d'un autre joueur avant de le contacter.

**Périmètre**
- *Dans le scope :* route `/profile/[id]` ; affichage des champs publics ; lien depuis les MatchCards.
- *Hors scope :* édition ; messagerie ; affichage de contacts (protégé par US-SEC-02).
- *À trancher en refinement :* afficher ou non le score de compatibilité ; bouton "Request match" depuis la page (interaction avec le flow 2-temps de US-SEC-02).

**Résultat attendu (testable)**
- La route `/profile/[id]` affiche les champs publics du profil ciblé.
- Aucun contact (Discord/email) affiché (respect US-SEC-02).
- Les MatchCards renvoient vers cette page.

**Garde-fous**
- Réutiliser strictement les PUBLIC_PROFILE_FIELDS.
- Gérer proprement un id inexistant (pas d'écran cassé).

**Done =** route fonctionnelle · champs publics seulement · liens MatchCards · issue à jour.
**Dépendances** — cohérence avec US-SEC-02.

---

### US-ONB-01 · Micro-célébration post-onboarding
**Priorité : P2** — Polish sur un chemin joueur réel, légitime sur un side project « cool ». Ex-#25.

**Intention** — En tant que joueur qui vient de compléter son profil, je vis un petit moment gratifiant.

**Périmètre**
- *Dans le scope :* animation/feedback ponctuel à la complétion.
- *Hors scope :* gamification, badges, récompenses récurrentes (= rétention).

**Résultat attendu (testable)**
- Un feedback de célébration s'affiche à la complétion réussie.
- Pas de déclenchement en cas d'échec de sauvegarde.

**Garde-fous**
- Léger, non bloquant, skippable ; ne retarde pas l'écran suivant.

**Done =** célébration au bon moment · non bloquante · issue à jour.
**Dépendances** — cohérent avec US-UX-01.

---

## P3 — Craft, futur, ou dette invisible

### US-HOME-01 · Bannière de notification sur `/matches`
**Priorité : P3** — Engagement, pas validation. Ex-#23.

**Intention** — En tant que joueur, je vois une bannière quand quelqu'un veut jouer avec moi.

**Périmètre**
- *Dans le scope :* bannière sur `/matches` des demandes entrantes, avec lien vers le demandeur.
- *Hors scope :* notifications email/push ; temps réel.

**Résultat attendu (testable)**
- Une demande entrante affiche une bannière pour le destinataire.
- La bannière renvoie vers le profil du demandeur (US-MATCH-01).

**Garde-fous**
- Respecter US-SEC-02 : pas de contact avant acceptation.

**Done =** bannière fonctionnelle · lien correct · issue à jour.
**Dépendances** — US-MATCH-01, US-SEC-02.

---

### US-RET-01 · Mécanismes de rétention (digest, nouveaux matches)
**Priorité : P3** — Prématuré : retenir avant d'avoir prouvé la demande. Parqué. Ex-#28.

**Intention** — En tant que joueur, j'ai une raison de revenir (nouveaux matches, digest).

**Périmètre**
- *Dans le scope (futur) :* signal de nouveaux matches depuis la dernière visite ; éventuel email digest.
- *Hors scope (POC) :* tout, tant que la demande n'est pas validée.

**Résultat attendu (testable)** — à spécifier en refinement futur.

**Garde-fous**
- Ne pas démarrer avant décision explicite du PM (anti-dérive « réseau social »).

**Done =** n/a (parking).
**Dépendances** — validation préalable de la demande (résultats POC).

---

### US-TECH-01 · Solder la dette de typage dans `lib/match.ts`
**Priorité : P3** — Invisible pour l'utilisateur. Ex-[F2].

**Intention** — En tant que DEV, je veux des types propres (`platform`/`style` en `string[]`) pour supprimer les `normalizeArray()` défensifs.

**Périmètre**
- *Dans le scope :* migration des lignes legacy `string` → `string[]` ; type `string[]` exclusif ; suppression des normalisations devenues inutiles.
- *Hors scope :* refonte de l'algo de matching.

**Résultat attendu (testable)**
- Plus aucune ligne en base n'a `platform`/`style` en `string` simple.
- Le type `Profile` déclare `string[]` sans union.
- Le matching fonctionne identiquement après suppression des `normalizeArray()`.

**Garde-fous**
- Migration non destructive et réversible ; vérification avant bascule.

**Done =** données migrées · type nettoyé · matching non régressé · issue à jour.
**Dépendances** — aucune.

---

### US-AUTH-01 · Magic Link renforcé + multi-appareil
**Priorité : P3** — Déjà « post-POC ». Ex-#41.

**Intention** — En tant que joueur, je peux me reconnecter de façon fiable depuis plusieurs appareils, avec une RLS durcie.

**Périmètre**
- *Dans le scope (futur) :* durcissement RLS post-POC ; gestion multi-appareil ; gérer l'edge case « ordre inversé » (clic du magic link AVANT remplissage de l'onboarding → liaison profil→user_id par email peut rater).
- *Hors scope (POC) :* tout changement complexifiant l'inscription pendant la validation.

**Résultat attendu (testable)** — à spécifier en refinement futur, inclure le cas « ordre inversé ».

**Garde-fous**
- Coordonner avec US-SEC-02 pour ne pas dupliquer les changements RLS.

**Done =** n/a (post-POC).
**Dépendances** — US-SEC-02 (RLS).

---

### US-OPS-01 · Checklist de déploiement Vercel
**Priorité : P3 (→ P0 le jour du lancement)** — Jalon de mise en prod. Rien n'est déployé. Ex-#47.

**Intention** — En tant que PM, je dispose d'une checklist fiable pour passer en production sans oublier d'étape critique.

**Périmètre**
- *Dans le scope :* checklist de déploiement ; configurer RESEND_API_KEY aux DEUX endroits (env Vercel + secrets Supabase) ; fixer l'URL hardcodée de l'Edge Function `notify-match` (ex-[E3]) ; valider les 5 parcours de test E2E de l'ancienne #29 (5 steps, COUNT au step 2, profils en clair au step 4, Save/Skip, mode édition) ; vérifier que toutes les US-SEC P0 sont closes avant go-live.
- *Hors scope :* CI/CD avancé ; multi-environnements.

**Résultat attendu (testable)**
- Checklist écrite et suivie.
- RESEND_API_KEY configurée aux deux endroits.
- URL de l'Edge Function paramétrée (plus de hardcode).
- 5 parcours E2E validés.
- US-SEC-01/02/03/04 closes avant déploiement.

**Garde-fous**
- Ne pas déployer si une US-SEC P0 est encore ouverte.

**Done =** checklist exécutée · clés + URL OK · E2E validés · pré-requis sécurité validés · issue à jour.
**Dépendances** — US-SEC-01, US-SEC-02, US-SEC-03, US-SEC-04.

---

## Récapitulatif de migration (ancien → nouveau)

| Source | Devient | Priorité | Action |
|---|---|---|---|
| [C3] (audit) | US-SEC-01 | P0 | Créer |
| #27 + [C2] (audit) | US-SEC-02 | P0 | Fusionner |
| [C1] (audit) + consent hardcodé | US-SEC-03 | P0 | Créer (enrichi) |
| ❌-1 + ❌-2 (vérif croisée) | US-SEC-04 | P0 | Créer (nouveau) |
| #15 | US-DATA-01 | P1 | Réécrire (Supabase tranché) |
| #19 | US-ACT-01 | P1 | Réécrire (opt-in RGPD) |
| #26 | US-LAND-01 | P1 | Réécrire (vérifier code) |
| #17 | US-UX-01 | P2 | Réécrire |
| #10 | US-MATCH-01 | P2 | Réécrire |
| #25 | US-ONB-01 | P2 | Réécrire |
| #23 | US-HOME-01 | P3 | Réécrire |
| #28 | US-RET-01 | P3 | Parquer |
| [F2] (audit) | US-TECH-01 | P3 | Créer |
| #41 | US-AUTH-01 | P3 | Réécrire (edge case ordre inversé) |
| #47 | US-OPS-01 | P3 | Réécrire (Resend×2, E2E #29, URL) |

**15 US au total** (4 en P0, 3 en P1, 3 en P2, 5 en P3).
