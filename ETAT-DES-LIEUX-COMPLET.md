# État des lieux complet — chantier « routes, authentification, abonnements »

Document rédigé le 2026-07-08. Destiné à toute personne reprenant ce chantier
sans connaître le projet ni l'historique des interventions précédentes.

## 1. Contexte : qu'est-ce que ce projet ?

QARA est une plateforme web d'aide à la conformité réglementaire pour les
fabricants de dispositifs médicaux (référentiels MDR, IVDR, ISO 13485,
ISO 14971, ISO 9001, FDA QMSR/MDSAP). Elle propose : audits de conformité,
classification de dispositifs, veille réglementaire, rapports, plan
d'action correctif (CAPA).

Le projet est réparti sur deux dépôts distincts :

- **Frontend** (`Nickandro96/Frontend---QARA`) : application React (Vite,
  TypeScript, wouter pour le routage, tRPC côté client), déployée sur
  Vercel.
- **Backend** (`Nickandro96/Backend---QARA`) : API tRPC (Node/Express),
  base de données MySQL (Drizzle ORM), déployé sur Railway.

Les deux dépôts évoluent séparément ; il n'y a pas de monorepo, ce qui
explique certaines limites techniques mentionnées plus bas (type d'API
partagé de façon imparfaite entre les deux côtés).

## 2. Le chantier concerné par ce document

Nom du chantier : **« routes, authentification et parcours utilisateur »**.
Objectif : remettre à plat le système de routes (beaucoup de routes
historiques dupliquées/obsolètes), les gardes d'authentification, la
matrice d'abonnement (Free/Pro), l'état du tableau de bord, et valider le
tout par des parcours de test réels.

Le cahier des charges définissait **8 étapes** (0 à 7). Ce chantier a été
réalisé en deux temps, par deux agents différents :

| Étapes | Réalisées par | Branche |
|---|---|---|
| 0 à 3 | Un premier agent (outil « Codex ») | `qara-design-passation` |
| Audit de reprise + 4 à 7 | Cet agent (Claude) | `claude/qara-routes-auth-stages-xk5awz` |

## 3. Ce qu'a fait le premier agent (Codex), étapes 0 à 3

Commits (auteur Git : `Nickandro96`, exécutés par Codex) :

- `b7e08fa9` — **Étape 0** : réalignement Git (résolution d'un conflit de
  synchronisation local/distant, sans perte de commit).
- `316a2469` — **Étape 1** : inventaire complet des routes et pages
  existantes (beaucoup de doublons historiques identifiés : plusieurs
  dashboards, plusieurs routes FDA, etc.), et décision d'architecture
  cible.
- `2b926592` — **Étape 2** : création de `ProtectedRoute` (garde de
  session + redirection `/login?returnTo=...` + redirection forcée vers
  `/onboarding` si aucun référentiel actif), `PublicOnlyRoute`, layout
  `AuthenticatedLayout` avec sidebar unique, utilitaires de session
  (`client/src/lib/session.ts`), correction d'un bug (`navigate` inutilisé
  dans `useAuth.ts`), gestion des 401 API.
- `a27131df` — **Étape 3** : remplacement complet de la table de routes
  dans `App.tsx` par la table cible (routes propres + alias de
  redirection pour toutes les anciennes routes dupliquées), création des
  pages `Landing`, `ForgotPassword`, `Onboarding` (wizard 4 étapes),
  correction du `returnTo` sur la connexion, 404 propre.

Ce premier agent n'a pas pu exécuter `vite build` dans son environnement
(sandbox bloquant l'accès à certains répertoires), ni exécuter les 10
parcours de test obligatoires. Son rapport listait ces points comme
« non exécuté », de façon honnête et explicite dans `PROGRESS-routes.md`.

## 4. Ce que cet agent (Claude) a fait — et confirmation d'intégration

**Point important, pour répondre directement à la question « as-tu
intégré les modifications des étapes 0 à 3 » : oui, intégralement.**

Techniquement : cet agent a démarré son travail avec la branche
`claude/qara-routes-auth-stages-xk5awz` déjà positionnée **exactement**
sur le commit `a27131df` (dernier commit de Codex) — c'est-à-dire que
**toute la branche de Codex (étapes 0 à 3) est l'ancêtre Git direct** de
tout le travail qui suit. Aucun fichier livré par Codex n'a été réécrit
ou perdu : `App.tsx`, `ProtectedRoute.tsx`, `PublicOnlyRoute.tsx`,
`session.ts`, `useAuth.ts` n'ont subi aucune modification de la part de
cet agent (vérifié par diff : 0 ligne de différence sur ces fichiers
entre le commit de Codex et l'état final).

### 4.1 Phase 0 — Audit de reprise (avant tout nouveau code)

Le rapport de Codex n'a pas été pris pour argent comptant. Vérification
réelle effectuée :

- Confirmation par `git log` que les 4 commits de Codex sont bien
  présents et alignés avec le distant.
- **Environnement local monté de zéro** pour un vrai test de fumée (pas
  seulement une lecture de code) : installation de MariaDB, création de
  la base, application des migrations, réimport du corpus de questions
  MDR (826 questions), démarrage réel du backend et du frontend.
- Test réel : accès à `/dashboard` sans session → redirection login ;
  inscription → onboarding → dashboard ; tout fonctionne comme déclaré.
- **Un écart réel trouvé** (déjà anticipé par Codex en étape 3, qui
  l'avait noté comme « point restant pour l'étape 5 ») : la page
  `Dashboard.tsx` conservait sa propre sidebar interne, en plus de la
  nouvelle sidebar `AuthenticatedLayout` — les deux se superposaient
  visuellement, avec deux libellés de plan contradictoires affichés en
  même temps (« Plan Pro » vs « Plan Free »). Non bloquant pour la suite,
  traité à l'étape 5 comme prévu.

Commit : `0352d76`.

### 4.2 Étape 4 — Matrice d'abonnement centralisée

- Création de `client/src/lib/plans.ts` : source de vérité unique par
  **capacité** (`canUseClassification`, `canUseFDA`, `canUseVeille`,
  `canExportReports`, `canUseAI`, `maxReferentiels`), et non par nom de
  plan codé en dur dans chaque page.
- Création de `client/src/components/LockedFeature.tsx` : composant
  réutilisable (écran plein ou bloc inline) avec cadenas + plan requis +
  bouton vers `/account`. Une fonctionnalité verrouillée reste toujours
  visible, jamais masquée ni une erreur.
- Remplacement des verrouillages dispersés (`UpgradeRequired`, vérifs
  `subscriptionTier === "free"` copiées-collées dans 5 pages
  différentes) par cette source unique, dans les pages réellement
  routées : `Classification.tsx`, `FdaClassification.tsx`,
  `RegulatoryWatch.tsx`, `Reports.tsx`.
- **Correction de fond** : `Reports.tsx` bloquait entièrement les
  comptes Free, alors que le cahier des charges prévoit un rapport
  visible à l'écran sans export pour ce plan. Corrigé : le score reste
  visible pour tous, seul le bloc d'export est verrouillé.

Commit : `bef9e88`.

### 4.3 Étape 5 — Dashboard et états vides

- Suppression de la sidebar interne dupliquée de `Dashboard.tsx` (cause
  de l'écart trouvé en Phase 0).
- Référentiels actifs réellement branchés sur le choix fait à
  l'onboarding (au lieu d'un jeu de référentiels codé en dur qui
  s'affichait quel que soit le choix réel de l'utilisateur — vérifié :
  un compte de test avec MDR + ISO 13485 sélectionnés affichait quand
  même IVDR et FDA à tort avant correction).
- Suppression des données de démonstration inventées (nom d'entreprise
  fictif, indicateurs positifs par défaut) au profit de zéros neutres
  avec commentaires `// TODO(data)` explicites là où aucun endpoint
  backend n'existe encore.
- États vides « Travaux en cours » / « Veille » : remplacement de listes
  fictives par un message d'invitation avec bouton d'action.

Commit : `a354b09`.

### 4.4 Étape 6 — Exécution réelle des 10 parcours de test obligatoires

Tous exécutés pour de vrai contre l'environnement local (navigateur
Chromium piloté automatiquement), pas seulement décrits :

1. Accès direct sans session (`/dashboard`, `/audits`, `/reports`,
   `/account`) → redirection login. **OK**
2. Login avec `returnTo` vers `/reports` → atterrissage sur `/reports`
   après connexion. **OK**
3. Nouveau compte → onboarding forcé → 2 référentiels → dashboard
   conforme. **OK**
4. Navigation complète (7 entrées de sidebar + bouton précédent) →
   **échec au premier essai** (voir ci-dessous), corrigé, puis **OK**.
5. F5 sur chaque route protégée → **OK** (8 routes testées).
6. Plan Free : classification/FDA/veille verrouillés avec upsell, accès
   direct par URL → écran verrouillé. **OK**
7. Plan Pro : tout accessible. **OK**
8. Déconnexion → bouton précédent ne réaffiche aucune page protégée.
   **OK**
9. URL inexistante → 404 propre. **OK**
10. Parcours métier complet (login → carte MDR → créer un audit →
    répondre à 3 questions réelles → retour dashboard → le travail
    apparaît dans « Travaux en cours »). **OK**

**L'échec du parcours 4** : en testant la navigation, un clic sur
« Rapports » depuis la page `/action-plan` était intercepté par une
sidebar fantôme — `ActionDashboard.tsx` (page « Plan d'action »)
utilisait encore un ancien composant `ProfessionalLayout` qui rendait sa
propre sidebar interne, exactement le même type de bug que celui trouvé
sur le Dashboard à l'étape 5. Corrigé (suppression du wrapper), et par la
même occasion, nettoyage de deux autres pages qui gardaient un ancien
`<header>` interne redondant (`AuditsList.tsx` route `/audits`,
`Profile.tsx` route `/account`) — moins critiques (pas de superposition
bloquante) mais contraires à la règle « une seule sidebar pour toutes les
routes protégées ». Re-testé avec succès après correction.

Commit : `ea896ad`.

### 4.5 Étape 7 — Build, types, failles backend

- `vite build` (build de production) : **passe**, ~20 secondes, aucune
  erreur.
- `tsc --noEmit` (vérification de types stricte) : deux erreurs
  **fatales** empêchaient même l'analyse du projet — corrigées dans un
  commit séparé `fix(legacy)` car sans lien avec ce chantier :
  - Deux fichiers strictement identiques ne différant que par la casse
    (`FdaAudit.tsx` / `FDAAudit.tsx`), tous deux orphelins (aucune route
    ne les utilise). Le doublon mort a été supprimé.
  - `@types/node` manquant en dépendance alors que la configuration
    TypeScript l'exige. Ajouté.
- Après ces deux corrections, il reste **271 erreurs de types
  préexistantes**, aucune dans les fichiers de ce chantier : elles
  viennent toutes d'un décalage entre le type d'API partagé
  (`AppRouter`) utilisé côté frontend et la forme réelle du routeur
  backend — un problème déjà identifié avant ce chantier (documenté côté
  backend comme « Lot 2 », un chantier à part entière). Non corrigées ici
  (corriger cela demanderait de réécrire l'infrastructure de partage de
  types entre les deux dépôts, hors périmètre routes/auth). Documentées
  en détail dans `PROGRESS-routes.md`.
- **Failles backend trouvées et consignées (non corrigées ici, lot dédié
  à prévoir)** : tous les endpoints sensibles (classification, FDA,
  veille) vérifient la session, mais **aucun ne vérifie le plan
  d'abonnement côté serveur**. Le verrouillage Free/Pro créé à l'étape 4
  n'existe que côté frontend : un compte Free techniquement outillé
  pourrait appeler l'API directement pour contourner l'écran verrouillé.
  Détail complet (fichiers, endpoints, criticité) dans
  `PROGRESS-routes.md`, section « Failles backend à corriger ».

Commits : `0cd1857` (correctifs legacy), `c93f970` (documentation).

## 5. État des branches — clarification du point qui vous inquiète

Il n'y a **aucune divergence de code, aucune perte, aucun travail fait
« à côté »** : vérifié techniquement (`git merge-base --is-ancestor`)
que `qara-design-passation` est un ancêtre Git strict de
`claude/qara-routes-auth-stages-xk5awz`. Autrement dit, cette dernière
branche contient **100 % du travail de Codex, dans l'ordre, sans aucune
modification**, plus les commits de cet agent par-dessus.

Le seul problème est un problème de **nom de branche**, pas de contenu :

- `qara-design-passation` est restée figée au dernier commit de Codex
  (`a27131df`) — logique, Codex n'a pas continué à commiter dessus après
  cette phase.
- `claude/qara-routes-auth-stages-xk5awz` contient ce même commit **plus**
  les 6 commits de cet agent.
- Cet agent a tenté de mettre à jour `qara-design-passation` pour qu'elle
  pointe aussi vers le dernier état (une simple avance rapide, sans
  aucun risque de conflit) — **refusé par le serveur Git avec une erreur
  403** (restriction de permission sur cette session de travail
  spécifique, l'agent n'a apparemment le droit de pousser que sur
  `claude/qara-routes-auth-stages-xk5awz`).

**Recommandation pour n'avoir plus qu'une seule branche visible** : une
personne ayant les droits d'écriture sur `qara-design-passation` (ou sur
les réglages du dépôt) peut simplement faire pointer cette branche vers
`claude/qara-routes-auth-stages-xk5awz` (avance rapide, sans risque de
perte — confirmé ci-dessus qu'il n'y a aucune divergence à résoudre), ou
alternativement supprimer `qara-design-passation` et continuer uniquement
sur `claude/qara-routes-auth-stages-xk5awz`. Dans les deux cas, aucune
opération destructive n'est nécessaire : c'est une simple avance rapide.

## 6. Confusion de déploiement rencontrée (résolue)

Note pour mémoire : lors des tests de validation, une confusion est
survenue entre la preview Vercel de la branche `main` (qui n'a reçu
aucune modification de ce chantier — c'est normal, le chantier n'a
jamais été mergé vers `main`, comme demandé) et celle de la branche de
travail. Confirmé par lecture du code : `main` contient encore l'ancienne
version de `Login.tsx` (mention « Manus OAuth », pas de gestion de
`returnTo`). La preview à utiliser pour tester ce chantier est celle
générée pour `claude/qara-routes-auth-stages-xk5awz`, pas celle de
`main`.

## 7. Récapitulatif fichier par fichier (travail de cet agent uniquement)

| Fichier | Nature du changement |
|---|---|
| `PROGRESS-routes.md` | Journal détaillé, mis à jour à chaque étape |
| `client/src/lib/plans.ts` | **Nouveau** — matrice de capacités par plan |
| `client/src/components/LockedFeature.tsx` | **Nouveau** — écran/bloc verrouillé réutilisable |
| `client/src/pages/Dashboard.tsx` | Réécrit : sidebar dupliquée supprimée, données réelles |
| `client/src/pages/Classification.tsx` | Verrouillage centralisé (`hasCapability`) |
| `client/src/pages/FdaClassification.tsx` | Idem |
| `client/src/pages/RegulatoryWatch.tsx` | Idem |
| `client/src/pages/Reports.tsx` | Verrouillage corrigé (export seul, pas la page) + header dupliqué retiré |
| `client/src/pages/ActionDashboard.tsx` | Sidebar interne dupliquée retirée (correctif test 4) |
| `client/src/pages/AuditsList.tsx` | Header interne redondant retiré |
| `client/src/pages/Profile.tsx` | Header interne redondant retiré |
| `client/src/components/AuthenticatedLayout.tsx` | Libellé de plan unifié via `plans.ts` |
| `client/src/pages/Documents.tsx` | Import mort retiré |
| `client/src/pages/FdaAudit.tsx` | **Supprimé** — doublon exact et mort de `FDAAudit.tsx` |
| `package.json` / `pnpm-lock.yaml` | Ajout de `@types/node` |

## 8. Ce qui reste à faire (dette connue, non traitée dans ce chantier)

1. **Failles backend** : ajouter une vérification de plan côté serveur
   (voir § « Failles backend à corriger » dans `PROGRESS-routes.md`).
2. **Persistance des référentiels actifs** : stockés uniquement en
   `localStorage` côté navigateur, faute de champ backend dédié
   (`users`/`organisations` n'ont pas de colonne pour ça). Un changement
   de navigateur fait perdre le choix (l'utilisateur est juste renvoyé
   proprement vers `/onboarding`, ce n'est pas cassé, mais pas idéal).
3. **271 erreurs TypeScript préexistantes**, dominées par le décalage de
   type d'API partagé entre frontend et backend (« Lot 2 » déjà identifié
   côté backend).
4. **Unification des branches** décrite au § 5.

## 9. Comment retester ce chantier

Voir `PROGRESS-routes.md`, section « Audit de reprise », pour la
procédure complète de montage d'un environnement local (MariaDB, import
du corpus MDR, lancement backend + frontend). Pour tester le déploiement,
utiliser la preview Vercel de `claude/qara-routes-auth-stages-xk5awz`
(pas celle de `main`), après avoir vérifié que la variable
`VITE_API_URL` de Vercel est bien scopée sur cette branche.
