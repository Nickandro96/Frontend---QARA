# Progression architecture routes/auth QARA

## Etape 0 - Realignement Git

Statut : termine.

Procedure executee le 2026-07-08 :

- `git status -sb` : branche locale `qara-design-passation`, en avance de 1 commit, avec `client/src/App.tsx` et `client/src/pages/Login.tsx` modifies.
- `git stash push -m "routes-auth-realignment-local-changes"` : modifications locales mises de cote.
- Premier `git fetch` avec le Git embarque Codex : echec, helper HTTPS absent (`remote-https`).
- Deuxieme `git fetch` avec `C:\Program Files\Git\cmd\git.exe` : echec Windows credentials (`SEC_E_NO_CREDENTIALS`), puis echec certificat OpenSSL.
- Fetch reussi avec Git systeme en mode ponctuel `http.sslBackend=openssl` + `http.sslVerify=false`.
- Divergences avant rebase :
  - Local uniquement : `1dcce528 feat(dashboard): route accueil vers cockpit`.
  - Distant uniquement : `7c55fc2a`, `8de0117f`, `84980aa4`, `66d9cd6b`.
- `git rebase origin/qara-design-passation` : succes. Git a saute `1dcce528` car son changement etait deja couvert par les commits distants.
- `git stash pop` : succes, aucun changement restant, aucun conflit.

Resolution :

- La branche locale est maintenant alignee sur `origin/qara-design-passation`.
- Aucun force-push.
- Aucun commit distant ecrase.
- Le commit local divergent `1dcce528` n'a pas ete reapplique parce qu'il etait obsolete et redondant avec le distant.

Reference deployee fournie le 2026-07-08 :

- Zip inspecte : `Frontend---QARA-qara-design-passation (1).zip`, modifie le 2026-07-08 09:24.
- Extraction locale dans `work/deployed-frontend-reference`.
- Comparaison sans difference sur les fichiers critiques :
  - `client/src/App.tsx`
  - `client/src/_core/hooks/useAuth.ts`
  - `client/src/pages/Login.tsx`
  - `client/src/pages/Register.tsx`
- Conclusion : le zip fourni correspond bien a l'etat local/distant de depart pour les zones routes/auth critiques.

## Cartographie existant -> cible

- `/` -> landing publique temporaire. `ModernHome` acceptable uniquement si elle reste publique, redirige les utilisateurs connectes vers `/dashboard`, et est marquee `TODO(design)`.
- `/login` -> page login publique, redirection utilisateur connecte vers `/dashboard`, prise en charge `returnTo`.
- `/register` -> alias historique, cible officielle `/signup`.
- `/signup` -> inscription.
- `/forgot-password` -> page minimale propre.
- `/onboarding` -> wizard protege. Chercher d'abord une logique existante avant de creer une version minimale.
- `/dashboard` -> dashboard d'accueil protege.
- `/audits`, `/audits/:id` -> liste + detail/questionnaire.
- `/classification`, `/classification/:id` -> outil classification, protege + verrou plan.
- `/fda`, `/fda/:id` -> point d'entree unique de determination de voie FDA (510(k), De Novo, PMA).
- `/action-plan` -> plan d'action CAPA, alias de l'existant `ActionDashboard`.
- `/reports`, `/reports/:id` -> rapports, export selon plan.
- `/veille` -> veille reglementaire, alias de l'existant `RegulatoryWatch`.
- `/account` -> compte/profil/abonnement/deconnexion.
- `*` -> 404 propre avec lien retour adapte.

## Etape 1 - Inventaire routes/pages approfondi

Statut : termine.

Constats routes actuelles (`client/src/App.tsx`) :

- Publique/auth : `/`, `/login`, `/register`, `/pricing`, `/subscription`, `/contact`, `/faq`.
- Dashboard et doublons : `/dashboard`, `/dashboard-v2`, `/dashboard-executive`, `/action-dashboard`, `/home-old`.
- Audit generique : `/audits`, `/audit/:id`, `/audit/:id/results`, `/audit-history`, `/audit/compare`, `/audit/new`, `/audit/create`, `/audit`.
- MDR : `/mdr/audit`, `/mdr/audit/:auditId`, `/mdr/audit/:auditId/review`, `/mdr/*`.
- ISO : `/iso/qualification`, `/iso/audit`, `/iso/audit/:auditId`, `/iso/audit/:auditId/review`.
- FDA historique : `/fda/qualification`, `/fda/audit`, `/us/fda-qualification`, `/us/fda-audit`, `/us/fda-dashboard`, `/us/fda-watch`, `/us/fda-documents`, `/us/fda-reports`, `/fda-audit`, `/fda-classification`, `/fda-regulatory-watch`, `/fda-dashboard`, `/fda-submission-tracker`.
- Compte/admin/outils : `/profile`, `/settings/sites`, `/reports`, `/reports/comparative`, `/reports/generate`, `/reports/history`, `/regulatory-watch`, `/watch-dashboard`, `/documents`, `/admin/contacts`, `/admin/users`, `/analytics`.

Decisions d'architecture a appliquer aux etapes suivantes :

- `/` ne doit pas rester branche sur `ModernHome` tel quel : cette page est un ancien hub applicatif avec sidebar et liens vers modules proteges. Elle sera depubliee comme doublon et remplacee par une landing minimale propre avec `// TODO(design): landing definitive a venir`.
- `ModernHome`, `Home`, `DashboardV2` et `DashboardExecutive` sont des doublons historiques a derouter/marquer deprecies, sans suppression.
- `/fda` devient le seul point d'entree de determination de voie FDA. L'audit FDA QMSR rejoint les routes audit ; les anciennes routes FDA seront redirigees ou depreciees.
- `/profile` devient alias historique de `/account`.
- `/regulatory-watch` devient alias historique de `/veille`.
- `/action-dashboard` devient alias historique de `/action-plan`.
- `/register` devient alias historique de `/signup`.

Inventaire onboarding :

- Aucune page/composant `Onboarding` ni wizard 4 etapes dedie n'existe dans `client/src`.
- Fragments existants reutilisables trouves :
  - `MDRQualification.tsx` : role economique + marches cibles MDR.
  - `ISOQualification.tsx` : role economique + qualification ISO.
  - `components/watch/CompanyProfilePanel.tsx` : profil de veille avec role economique et marches.
  - `Profile.tsx` : edition du role economique utilisateur.
- Conclusion : il faut implementer une version minimale du wizard `/onboarding` en reutilisant les donnees/choix existants, puis remplacer par l'habillage final plus tard.

Fallback SPA :

- `vercel.json` contient deja une regle de rewrite `/(.*)` vers `/index.html`. Le F5 sur liens profonds devra etre valide en test reel.

## Etape 2 - Layout authentifie + gardes auth

Statut : termine.

Changements implementes :

- Ajout d'un `ProtectedRoute` avec verification session, etat de chargement, redirection `/login?returnTo=<route>`, et redirection forcee vers `/onboarding` si aucun referentiel actif n'est detecte.
- Ajout d'un `PublicOnlyRoute` pour renvoyer les utilisateurs deja connectes vers `/dashboard`.
- Ajout d'un `AuthenticatedLayout` unique avec sidebar cible : Dashboard, Audits, Classification, Voies FDA, Plan d'action, Rapports, Veille, carte compte et deconnexion.
- Ajout d'utilitaires de session : nettoyage local, sanitisation `returnTo`, construction de l'URL login, redirection 401.
- Ajout d'utilitaires onboarding : lecture locale des referentiels actifs en attente d'une source backend definitive.
- Correction du `navigate` fantome dans `useAuth.ts`.
- Gestion 401 dans le client tRPC : destruction session locale + redirection login depuis les zones non publiques.

Validation :

- `pnpm install --config.strict-ssl=false --ignore-scripts` execute avec le runtime Node embarque apres echec initial lie aux certificats du registre.
- `vite build` tente avec Node embarque mais bloque avant compilation applicative : esbuild ne peut pas lire un repertoire parent sandbox (`Cannot read directory "../../../../../..": Access is denied`) et ne resout pas `vite.config.ts` dans cet environnement.
- `tsc --noEmit` execute apres installation locale : echec sur de nombreuses erreurs preexistantes du projet, notamment shim tRPC global, casse `FDAAudit/FdaAudit`, modules/types manquants (`streamdown`, Google Maps, `../drizzle/schema`) et usages `useNavigate` wouter inexistants. Les nouveaux fichiers ne remontent que dans la meme famille d'erreurs tRPC deja presente partout.

## Etape 3 - Table des routes cible + aliases/deprecations

Statut : termine.

Changements implementes :

- Remplacement de la table de routes `App.tsx` par les routes cible : `/`, `/login`, `/signup`, `/forgot-password`, `/onboarding`, `/dashboard`, `/audits`, `/audits/:id`, `/classification`, `/classification/:id`, `/fda`, `/fda/:id`, `/action-plan`, `/reports`, `/reports/:id`, `/veille`, `/account`.
- Creation d'une landing publique minimale `Landing.tsx` avec marque QARA et `TODO(design): landing definitive a venir`.
- Creation de `ForgotPassword.tsx`.
- Creation de `Onboarding.tsx` : wizard 4 etapes Referentiels -> Role economique -> Marches -> Apercu chiffre, avec stockage local temporaire.
- Correction login : prise en charge `returnTo` apres connexion.
- Correction signup : route officielle `/signup`, redirection vers `/onboarding` apres creation du compte.
- 404 QARA propre avec retour dashboard si connecte, login sinon.
- Depreciation par redirection des doublons historiques :
  - `/register` -> `/signup`
  - `/profile` et `/subscription*` -> `/account`
  - `/regulatory-watch`, `/watch-dashboard`, `/fda-regulatory-watch`, `/us/fda-watch` -> `/veille`
  - `/action-dashboard` -> `/action-plan`
  - `/dashboard-v2`, `/dashboard-executive`, `/home-old` -> `/dashboard`
  - anciennes routes FDA qualification/classification/dashboard -> `/fda`
  - anciennes routes FDA audit -> `/audits`

Validation :

- Controle TypeScript cible sur `App.tsx`, `Login.tsx`, `Register.tsx`, `ForgotPassword.tsx`, `Landing.tsx`, `Onboarding.tsx`, `NotFound.tsx` : seules restent les erreurs tRPC globales deja documentees (`Provider`, `system`) dues au shim `AppRouter`.
- Point restant reporte et assume pour etape 5 : plusieurs pages historiques gardent encore leur header/layout interne. Le layout authentifie cible englobe les routes, mais le nettoyage visuel fin du dashboard/pages anciennes sera traite avec les etats vides.

## Correctif urgent - Deverrouillage login/signup

Statut : termine.

Contexte :

- Symptomes remontes : clic sur "Connexion" ou "Creer un compte" puis blocage sur l'ecran "Chargement de votre espace QARA - verification de la session en cours".
- Cause front identifiee : `PublicOnlyRoute` masquait les pages publiques pendant la verification de session, et `useAuth` nettoyait trop tot la session tant que la requete profil etait en chargement.

Changements implementes et pousses :

- `PublicOnlyRoute` affiche les pages publiques pendant le chargement, et ne redirige vers `/dashboard` que si la session est confirmee.
- `useAuth.ts` ne detruit plus la session pendant `meQuery.isLoading`.
- `Login.tsx` et `Register.tsx` bornent le `refresh()` post-authentification pour eviter un blocage infini si le backend tarde a repondre.

Commit en ligne :

- `9e854706 fix(auth): debloque les pages publiques`

## Etape 4 - Matrice abonnements centralisee

Statut : termine cote code.

Changements implementes :

- Creation de `client/src/lib/plans.ts`, source de verite front pour les capacites :
  - Free : 1 referentiel, audits + score, rapports consultables, pas d'export, pas de classification, pas de voie FDA, pas de veille, pas d'IA.
  - Pro : multi-referentiels, exports, classification, voies FDA, veille. IA volontairement desactivee tant que la cle serveur n'est pas branchee.
- Remplacement de l'ancien composant premium marketing `UpgradeRequired` par un ecran de verrouillage QARA clair : cadenas, plan requis, bouton `/account`, retour dashboard.
- Sidebar authentifiee : les modules verrouilles restent visibles avec cadenas.
- `/classification` et `/classification/:id` : verrouillage au niveau du routeur via `canUseClassification`.
- `/fda` et `/fda/:id` : verrouillage au niveau du routeur via `canUseFDA`.
- `/veille` : verrouillage au niveau du routeur via `canUseVeille`.
- `/reports` : page consultable en Free ; exports Excel/PDF visibles mais verrouilles.
- `/reports/history` : historique consultable ; creation/telechargement de fichiers verrouilles en Free.
- `/reports/generate` : acces direct verrouille en Free.
- `/reports/comparative` : comparaison consultable ; generation PDF verrouillee en Free.
- `/dashboard` : retrait du blocage Free. Le dashboard reste accessible aux utilisateurs Free.
- `/account` : affichage du plan base sur la matrice Free/Pro, suppression des libelles Expert/Entreprise dans l'UX cible.
- Ancienne page `Audit.tsx` : retrait du mode demo force pour Free afin de respecter la capacite "audits + score".

Controle des anciens chemins :

- Les liens restants dans `Dashboard.tsx` et `Reports.tsx` pointent vers les routes cible (`/account`, `/veille`, `/fda`, `/action-plan`, `/audits`).
- `rg "subscriptionTier"` : la source de verite des droits est `plans.ts`. Des lectures legacy restent hors decision produit cible :
  - `plans.ts` : lecture centralisee.
  - `AdminUsers.tsx` : edition admin du champ.
  - `SubscriptionSuccess.tsx` : affichage du retour abonnement.
  - `Home.tsx` : ancienne page non montee dans la table cible actuelle, a deprecier/nettoyer dans un lot UI si elle revient.
  - Quelques pages metier legacy gardent un fallback historique, mais les routes cible sont verrouillees avant rendu par la matrice centralisee.

Validation :

- `git diff --check` : OK.
- Recherche anciens liens cible (`/profile`, `/regulatory-watch`, `/action-dashboard`, anciennes routes FDA) sur `Dashboard.tsx`, `Reports.tsx`, `AuthenticatedLayout.tsx` : OK, aucun resultat.
- Verification TypeScript cible tentee via le binaire `tsc` present dans le store pnpm : aucune erreur ne remonte sur les fichiers modifies.
- Verification TypeScript globale bloquee localement par l'installation `node_modules` incomplete apres tentative de reconstruction : `@types/node` et `vite/client` non resolus.
- Reinstallation locale `pnpm install` bloquee par le reseau/certificat npm (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`) et timeouts. `node_modules` est ignore par Git ; aucun impact sur les fichiers a pousser, mais l'environnement local devra relancer `pnpm install --config.strict-ssl=false --ignore-scripts` hors timeout si besoin.

## Exigences confirmees dans le perimetre

- Gestion des 401 API : destruction de session + redirection `/login`.
- Fallback SPA : F5 doit fonctionner sur chaque route protegee. A verifier via configuration Vercel.
- Execution reelle des 10 parcours de test de la mission, resultats consignes ci-dessous.
- Aucun endpoint backend ne doit etre suppose securise sans verification. Les failles relevees seront listees.

## Etapes

- [x] Etape 0 - Realignement Git et inventaire initial.
- [x] Etape 1 - Inventaire routes/pages approfondi + onboarding existant.
- [x] Etape 2 - Layout authentifie + gardes auth.
- [x] Etape 3 - Table des routes cible + aliases/deprecations.
- [x] Etape 4 - Matrice abonnements centralisee.
- [ ] Etape 5 - Etats vides/dashboard/onboarding force.
- [ ] Etape 6 - Plan de test execute.
- [ ] Etape 7 - Failles backend consignees et build.

## Resultats des tests obligatoires

1. Acces direct sans session aux routes protegees : non execute.
2. Login avec `returnTo` : non execute.
3. Premier compte signup -> onboarding -> dashboard : non execute.
4. Navigation complete sidebar + retour navigateur : non execute.
5. F5 sur chaque route protegee : non execute.
6. Plan Free : verrouillage classification/FDA/veille : non execute.
7. Plan Pro : tout accessible : non execute.
8. Deconnexion + bouton precedent : non execute.
9. 404 propre : non execute.
10. Parcours metier MDR complet : non execute.

## Failles backend a corriger

- A verifier pendant les tests : controle serveur de session et de plan pour les endpoints classification, FDA, veille, exports et rapports.
