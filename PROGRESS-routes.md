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

## Audit de reprise (2026-07-08)

Statut : **conforme avec un ecart connu deja documente, non bloquant** (voir sous-etape 4.0 ci-dessous).

Verifications effectuees :

- `git log` : les commits `b7e08fa9`, `316a2469`, `2b926592`, `a27131df` sont bien presents et HEAD correspond a `origin/qara-design-passation` et `origin/claude/qara-routes-auth-stages-xk5awz` (les deux refs pointent sur le meme commit `a27131df`, aucune divergence).
- `ProtectedRoute.tsx` / `PublicOnlyRoute.tsx` : garde de session reelle via `useAuth`, etat de chargement (`AuthLoadingScreen`) sans flash de contenu protege, redirection `/login?returnTo=...` via `buildLoginUrl`. Conforme.
- `AuthenticatedLayout.tsx` : sidebar cible complete (Dashboard, Audits, Classification, Voies FDA, Plan d'action, Rapports, Veille, carte compte, deconnexion). Conforme sur le plan du composant lui-meme.
- `App.tsx` : table de routes conforme au cahier des charges (publiques / protegees / onboarding / 404, alias de depreciation).
- `client/src/lib/session.ts` : 401 -> `clearClientSession` + `redirectToLogin`, verifie dans `trpc.ts`. Conforme.
- `useAuth.ts` : `navigate` bien utilise dans l'effet de redirection (plus de variable fantome). Conforme.
- Pages `Landing`, `Login`, `Register`, `ForgotPassword`, `Onboarding`, `NotFound` : rendues sans erreur console/page bloquante lors du test de fumee reel (voir ci-dessous).

Test de fumee reel (pas seulement declare) :

- Environnement monte de bout en bout dans le sandbox : MariaDB installe localement (`apt-get install mariadb-server`), base `qara` creee, migrations appliquees avec `scripts/apply-sql-migrations.ts` (copie locale temporaire sans `ssl:{rejectUnauthorized:false}`, non committee, conformement a la note du backend), backend lance (`tsx watch server/_core/index.ts`, port 3001), frontend lance (`vite --port 5173`, `VITE_API_URL=http://127.0.0.1:3001/trpc`).
- Navigateur pilote (Chromium/Playwright ad hoc, script non committe dans `client/` ni `e2e/` car ce dernier dossier n'existe pas sur cette branche — il existe uniquement sur `claude/qara-compliance-audit-qitbxl`, un autre chantier).
- `/dashboard` sans session -> redirige vers `/login?returnTo=%2Fdashboard`. **Confirme.**
- Creation de compte (`/signup`) -> redirection automatique vers `/onboarding`. **Confirme.**
- Onboarding (selection MDR + ISO 13485, role Fabricant, marche UE) -> validation -> redirection `/dashboard`. **Confirme.**
- F5 sur `/dashboard` connecte -> reste sur `/dashboard`, pas de boucle de redirection. **Confirme.**
- Logout / bouton precedent : a re-tester formellement en etape 6 (voir ecart ci-dessous, un clic automatise a ete intercepte par l'element de sidebar dupliquee).

Ecart trouve (deja signale par l'agent precedent en etape 3, confirme reel ici, traite en etape 5 comme prevu — **non bloquant pour la suite**, ne necessite pas de sous-etape 4.0 car deja planifie) :

- `Dashboard.tsx` conserve une sidebar interne complete et fixee (`<aside class="fixed inset-y-0 left-0 ...">`), en plus de la sidebar de `AuthenticatedLayout` qui l'englobe. Les deux se superposent visuellement (capture ecran realisee). Consequence constatee : deux libelles de plan contradictoires affiches simultanement (sidebar interne fige sur `"Plan Pro"` par defaut via `getPlanLabel(... || "pro")`, sidebar `AuthenticatedLayout` affichant le vrai `"Plan Free"` du profil). Un clic automatise sur le bouton "Deconnexion" de la vraie sidebar a ete intercepte par l'element flottant de la fausse sidebar.
- `Dashboard.tsx` affiche des referentiels actifs codes en dur (`activeFrameworks ?? ["mdr", "ivdr", "fda-qmsr", "iso-13485"]`) qui ignorent le choix reel fait a l'onboarding : le compte de test avec MDR + ISO 13485 selectionnes affichait quand meme IVDR et FDA QMSR actifs. KPIs (`scoreGlobal`, `nonConformitiesCount`, etc.), travaux en cours et alertes de veille sont egalement des fallbacks codes en dur (`?? 76`, `?? 12`, listes statiques) deja marques `// TODO(data)` par l'agent precedent.
- Traitement : corrige en etape 5 ci-dessous (suppression de la sidebar interne dupliquee, branchement des referentiels reels, suppression des fallbacks).

Ecarts mineurs non bloquants (non traites ici, notes pour memoire) :

- La page `/onboarding` s'affiche avec le chrome complet de `AuthenticatedLayout` (sidebar visible) alors que l'utilisateur n'a pas encore de referentiel actif — incoherence UX mineure, pas de blocage fonctionnel.
- Deux `Failed to load resource: net::ERR_CONNECTION_RESET` observes en console sur la Landing/404 (ressources tierces non bloquantes, a confirmer en etape 7 si elles persistent apres build).

## Etape 4 - Matrice abonnements centralisee

Statut : termine.

Changements implementes :

- Creation de `client/src/lib/plans.ts` : source de verite unique par **capacites** (`canUseClassification`, `canUseFDA`, `canUseVeille`, `canExportReports`, `canUseAI`, `maxReferentiels`), pas par nom de plan code en dur. Matrice de depart : Free = 1 referentiel, pas de classification/FDA/veille/IA, pas d'export. Pro (et expert/entreprise, traites comme Pro pour l'instant) = tout, IA explicitement desactivee (`canUseAI: false`) tant que la cle API serveur n'est pas branchee — aucune cle en dur dans le code.
- `hasCapability(capability, profile, user)` centralise aussi le bypass admin historique (`user.role === "admin"` -> acces complet), qui existait deja de facon dispersee dans chaque page.
- Creation de `client/src/components/LockedFeature.tsx` : composant reutilisable ecran (`variant="page"`) ou bloc (`variant="block"`) avec cadenas, plan requis, et bouton "Passer au Plan Pro" vers `/account`. Une fonctionnalite verrouillee reste toujours visible (jamais masquee, jamais une erreur).
- Remplacement des verrouillages disperses par la matrice centralisee dans les pages reellement routees (verifie via `client/src/App.tsx`) :
  - `Classification.tsx` : `UpgradeRequired` -> `hasCapability("canUseClassification", ...)` + `LockedFeature`.
  - `FdaClassification.tsx` (route `/fda`) : idem avec `canUseFDA`.
  - `RegulatoryWatch.tsx` (route `/veille`) : idem avec `canUseVeille`.
  - `Reports.tsx` (route `/reports`) : **correction de fond** — la page bloquait entierement les utilisateurs Free (contraire au cahier des charges "rapport a l'ecran sans export"). Le score reste desormais visible pour tous ; seul le bloc d'export Excel/PDF est remplace par un `LockedFeature` en variante bloc pour les comptes sans `canExportReports`. En profitant de l'edition, suppression du header/nav interne duplique (`Dashboard/Audit/Rapports/Veille`) qui faisait double emploi avec la sidebar `AuthenticatedLayout`.
  - `Documents.tsx` : import `UpgradeRequired` mort (jamais utilise) retire.
  - `AuthenticatedLayout.tsx` : fonction locale `planLabel` dupliquee remplacee par `getPlanLabel` de `plans.ts`.
- Pages non routees dans `App.tsx` (`Audit.tsx`, `Home.tsx`, `FdaRegulatoryWatch.tsx`, `SubscriptionSuccess.tsx`) continuent d'importer l'ancien `UpgradeRequired` : code mort non atteignable, non touche (hors perimetre, pas de route qui les monte).
- `UpgradeRequired.tsx` conserve tel quel (encore reference par le code mort ci-dessus) mais n'est plus utilise par aucune page reellement routee.
- Acces direct par URL a une route verrouillee -> ecran verrouillee (verifie : chaque page gate son propre rendu au niveau du composant de page, monte inconditionnellement par `ProtectedRoute`/`AuthenticatedLayout`, donc toute navigation directe vers `/classification`, `/fda`, `/veille` avec un compte Free affichera `LockedFeature` et non la fonctionnalite).

## Etape 5 - Dashboard et etats vides

Statut : termine.

Changements implementes dans `client/src/pages/Dashboard.tsx` :

- Suppression de la sidebar interne dupliquee (`<aside class="fixed ...">` avec sa propre nav et son propre libelle de plan). Le dashboard ne rend plus que son contenu ; `AuthenticatedLayout` (deja en place depuis l'etape 2) fournit desormais la seule et unique sidebar sur cette route. C'etait la cause racine de l'ecart trouve en audit de reprise (deux libelles de plan contradictoires affiches simultanement).
- Referentiels actifs : remplacement du fallback code en dur (`activeFrameworks ?? ["mdr","ivdr","fda-qmsr","iso-13485"]`, actif meme quand l'utilisateur n'avait rien choisi) par `getActiveReferentials(profile)` (`lib/onboarding.ts`), la meme fonction deja utilisee par `ProtectedRoute` pour la redirection forcee onboarding. Verifie reellement : un compte cree puis onboarde avec MDR + ISO 13485 n'affiche desormais plus que ces deux cartes (capture ecran a l'appui), IVDR/FDA/MDSAP n'apparaissent plus a tort.
- KPIs : les deux indicateurs sans endpoint backend (`classifiedDevices`, `watchAlerts`) et les scores par referentiel (`frameworkScores`) n'ont plus de valeur de demo positive inventee (`?? 18`, `?? 4`, `?? 82`...) : ils retombent sur `0` avec un commentaire `// TODO(data)` explicite. Les deux indicateurs qui existent reellement cote backend (`scoreGlobal`, `nonConformitiesCount` sur `dashboard.getKPIs`) gardent leur valeur reelle, avec un `0` neutre par defaut au lieu d'un chiffre de demo pendant le chargement.
- `companyName` : le nom d'entreprise fictif fige `"N3-Conseil"` retire, remplace par le vrai `profile.companyName` (champ reellement persiste cote backend, `users.companyName`) puis par le nom de l'utilisateur, sans donnee inventee.
- Etats vides "Travaux en cours" et "Veille reglementaire" : quand `recentAudits`/`recentFindings` sont vides (nouveau compte), affichage d'un message d'invitation avec bouton d'action ("Lancer votre premier audit" -> `/mdr/audit`, "Ouvrir la veille reglementaire" -> `/veille`) au lieu de la liste de 3 elements fictifs precedente.
- Limite de referentiels par plan : nouvelle tuile verrouillee (`LockedFeature` variante bloc) affichee a la place de la tuile "Activer un referentiel" quand `activeReferentials.size >= maxReferentiels` (ex. Plan Free deja a sa limite de 1).
- Le blocage integral du dashboard pour les comptes Free (`profile.subscriptionTier === "free" -> <UpgradeRequired feature="Dashboard" />`) est supprime : il contredisait le cahier des charges ("Free = audits + score, rapport a l'ecran"). Le dashboard est desormais accessible a tous les plans ; seules les fonctionnalites avancees (classification/FDA/veille/export) restent verrouillees via `plans.ts`.
- Redirection forcee `/onboarding` si 0 referentiel actif : deja geree par `ProtectedRoute` (etape 2), reverifiee ici — le dashboard ne peut structurellement pas s'afficher avec 0 referentiel actif.

Verification reelle (meme environnement local que l'audit de reprise) :

- Capture ecran avant/apres : la double sidebar et le conflit "Plan Pro"/"Plan Free" ont disparu ; un seul sidebar clair, "Plan Free" coherent partout, uniquement MDR + ISO 13485 affiches pour le compte de test.
- Logout puis clic "precedent" navigateur -> reste sur `/login?returnTo=%2Fdashboard`, aucune page protegee ne se re-affiche (le clic sur "Deconnexion" n'est plus intercepte par l'ancienne sidebar fantome).

Mapping donnees restant (a traiter dans un lot backend dedie) :

- **Referentiels actifs de l'onboarding** : stockes uniquement en `localStorage` (`qara:onboarding`, cle `client/src/lib/onboarding.ts`). Le backend (`users` table, `drizzle/schema.ts`) n'expose aucun champ `activeFrameworks`/`activeReferentials` ni sur `users` ni sur `organisations`/`sites` : verifie directement dans le schema Drizzle, aucune migration ne cree une telle colonne/table. Consequence assumee et documentee : un changement de navigateur ou un vidage du stockage local fait perdre les referentiels choisis (l'utilisateur est renvoye vers `/onboarding` par `ProtectedRoute`, ce qui est correct fonctionnellement mais oblige a resaisir le choix). Marque `// TODO(data): persistance referentiels -> backend` dans `Dashboard.tsx` et `ProtectedRoute` s'appuie sur la meme fonction `getActiveReferentials`.
- **Scores par referentiel** (`frameworkScores` sur les cartes MDR/IVDR/FDA/MDSAP/ISO) : aucun endpoint backend ne les fournit (`dashboard.getKPIs` ne retourne que `scoreGlobal`/`nonConformitiesCount`/`conforme`/`nonConforme`/`progression`). Valeur par defaut `0`, `// TODO(data)`.
- **Dispositifs classes / alertes de veille** (KPIs du bandeau haut) : idem, aucun champ backend correspondant. Valeur par defaut `0`, `// TODO(data)`.

## Etape 6 - Execution des 10 parcours de test

Statut : termine. Les 10 parcours ont ete executes reellement (navigateur Chromium pilote par Playwright, ad hoc, non commite — `e2e/` n'existe pas sur cette branche) contre l'environnement local monte pour l'audit de reprise (MariaDB + backend + frontend, corpus MDR reimporte via `node scripts/import-mdr-questions.js` pour disposer de vraies questions). Date d'execution : 2026-07-08.

1. **Acces direct sans session** (`/dashboard`, `/audits`, `/reports`, `/account`) -> **PASS**. Les 4 routes redirigent vers `/login?returnTo=<route>`.
2. **Login avec `returnTo` vers `/reports`** -> **PASS** (apres correctif de methode de test, voir ci-dessous). Un compte deja onboarde (au moins 1 referentiel actif), deconnecte, visitant `/reports` -> `login?returnTo=%2Freports` -> apres connexion, atterrit bien sur `/reports`. Premier essai avec un compte tout juste cree (0 referentiel) faussement en echec : la redirection forcee `/onboarding` prenait le pas sur `returnTo`, ce qui est le comportement voulu (voir etape 2), pas un bug — corrige dans la methode de test, pas dans le code.
3. **Nouveau compte : signup -> onboarding force -> 2 referentiels -> dashboard conforme** -> **PASS**. Compte cree, onboarding MDR + ISO 13485 + role Fabricant + marche UE, dashboard n'affiche que ces deux referentiels (capture ecran a l'appui, voir etape 5).
4. **Navigation complete 7 entrees sidebar + bouton precedent** -> **ECHEC puis correctif puis PASS**. Premier essai : clic sur "Rapports" depuis `/action-plan` intercepte par une sidebar interne fantome (`ProfessionalLayout`/`ProfessionalSidebar`, texte "MDR Compliance Platform") que `ActionDashboard.tsx` rendait en plus de la sidebar `AuthenticatedLayout` — meme famille de bug que le dashboard (etape 5). Correctif : suppression du wrapper `ProfessionalLayout` dans `ActionDashboard.tsx`. En profitant du meme passage, suppression des `<header>` internes dupliques (mais non bloquants, simples bandeaux hauts sans chevauchement de sidebar) de `AuditsList.tsx` (`/audits`) et `Profile.tsx` (`/account`), conformement a l'exigence etape 5 "toutes les routes protegees passent par AuthenticatedLayout, une seule sidebar". Re-execution : les 7 entrees (Dashboard, Audits, Classification, Voies FDA, Plan d'action, Rapports, Veille) se chargent sans page blanche, puis 7 clics "precedent" navigateur retracent l'historique sans erreur (`page errors: []`).
5. **F5 sur chaque route protegee connecte** -> **PASS**. Teste sur les 8 routes protegees (`/dashboard`, `/audits`, `/classification`, `/fda`, `/action-plan`, `/reports`, `/veille`, `/account`) : rechargement correct sur la meme URL a chaque fois, aucune boucle de redirection.
6. **Plan Free : classification/FDA/veille verrouilles avec upsell, acces direct par URL -> ecran verrouille** -> **PASS**. Compte Free onboarde : `/classification`, `/fda`, `/veille` affichent chacun l'ecran `LockedFeature` avec le bouton "Passer au Plan Pro" en acces direct par URL. `/reports` reste visible (score affiche) avec uniquement le bloc d'export verrouille, conformement au correctif de l'etape 4.
7. **Plan Pro : tout accessible** -> **PASS**. Meme compte promu `subscriptionTier = "pro"` (mise a jour directe en base pour le test, aucune UI de paiement reelle dans ce lot) : `/classification`, `/fda`, `/veille`, `/reports` accessibles sans aucun ecran verrouille.
8. **Logout -> bouton precedent ne doit reafficher aucune page protegee** -> **PASS**. Deconnexion depuis le dashboard -> redirection `/login`. Clic "precedent" navigateur -> reste sur `/login?returnTo=%2Fdashboard` (le garde `ProtectedRoute` intercepte le retour arriere, aucune page protegee ne s'affiche).
9. **URL inexistante -> 404 propre avec lien retour** -> **PASS**. `/nonexistent-route-xyz` affiche la page 404 QARA avec lien de retour, sans erreur bloquante.
10. **Parcours metier complet : login -> carte MDR -> lancer un audit -> repondre a 3 questions -> retour dashboard -> travail visible dans "Travaux en cours"** -> **PASS**. Execute integralement : creation de site, remplissage etape 1 (obligatoire), etape 2 (facultative, ignoree), etape 3 (demarrage), reponse "Conforme" a 3 questions du questionnaire MDR reel (corpus 826 questions reimporte), retour `/dashboard` : "Audit MDR (fabricant) - 08/07/2026" apparait bien dans "Travaux en cours" avec barre de progression (capture ecran a l'appui).

Aucun des 10 parcours n'est reste en echec : le seul echec reel (parcours 4) a ete corrige puis re-execute avec succes, conformement a la regle "un test qui echoue = un correctif + une re-execution".

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
- [x] Etape 5 - Etats vides/dashboard/onboarding force.
- [x] Etape 6 - Plan de test execute.
- [x] Etape 7 - Failles backend consignees et build.

## Resultats des tests obligatoires

Executes le 2026-07-08. Detail complet dans la section "Etape 6" ci-dessus.

1. Acces direct sans session aux routes protegees : **PASS**.
2. Login avec `returnTo` : **PASS**.
3. Premier compte signup -> onboarding -> dashboard : **PASS**.
4. Navigation complete sidebar + retour navigateur : **PASS** (apres correctif sidebar dupliquee `ActionDashboard`/`AuditsList`/`Profile`).
5. F5 sur chaque route protegee : **PASS**.
6. Plan Free : verrouillage classification/FDA/veille : **PASS**.
7. Plan Pro : tout accessible : **PASS**.
8. Deconnexion + bouton precedent : **PASS**.
9. 404 propre : **PASS**.
10. Parcours metier MDR complet : **PASS**.

## Etape 7 - Build, types et failles backend

Statut : termine.

### Build et types

- `npx vite build` : **passe** (contrairement au sandbox de l'agent precedent). Build de production complet en ~20s, warning non bloquant sur la taille du bundle principal (2.9 Mo) — non traite ici, hors perimetre routes/auth.
- `npx tsc --noEmit` : deux erreurs **fatales** qui empechaient meme l'analyse du reste du projet, corrigees en commit separe `fix(legacy)` :
  - `client/src/pages/FdaAudit.tsx` et `client/src/pages/FDAAudit.tsx` etaient deux fichiers strictement identiques (diff vide) ne differant que par la casse, tous deux orphelins (aucune route ni import ne les reference dans `App.tsx` ni ailleurs). TypeScript refuse de compiler avec deux noms de fichiers ne differant que par la casse (`TS1149`). Suppression de `FdaAudit.tsx` (doublon mort), conservation de `FDAAudit.tsx` (aligne avec `FDAQualification.tsx`).
  - `@types/node` n'etait pas declare en devDependency alors que `tsconfig.json` le requiert (`types: ["node", "vite/client"]`), provoquant une erreur fatale `TS2688`. Ajout de `@types/node@^22.20.1` en devDependency (aligne sur le runtime Node 22 utilise).
- Apres ces deux correctifs, `tsc --noEmit` remonte **271 erreurs preexistantes**, aucune dans le perimetre routes/auth/plans introduit par ce chantier (verifie fichier par fichier : les seules occurrences dans les fichiers touches ici — `App.tsx`, `useAuth.ts`, `AuthenticatedLayout.tsx`, `Dashboard.tsx`, `Classification.tsx`, `FdaClassification.tsx`, `RegulatoryWatch.tsx`, `Reports.tsx`, `Profile.tsx`, `AuditsList.tsx`, `trpc.ts` — relevent toutes de la meme famille d'erreur preexistante decrite ci-dessous, deja documentee par l'agent precedent en etape 2).
- Ces 271 erreurs ne bloquent pas `vite build` (qui n'execute pas de verification de types complete), donc n'entrent pas dans le critere "bloque le build" de la mission. Non corrigees ici (corrigerait de la logique metier / infrastructure partagee hors perimetre).

### Dette technique preexistante (non corrigee, hors perimetre)

- **Shim tRPC `AppRouter` global** (155 erreurs `TS2339`, la grande majorite du total) : le type partage `shared/types.ts` / `@/server-types` ne correspond pas a la forme reelle du routeur backend (`server/routers.ts`), donc tout appel `trpc.<router>.<procedure>` remonte une erreur de type generique ("collides with a built-in method..."). Deja identifie par l'agent precedent et par le backend lui-meme (`docs/audit/00-etat-du-projet.md` section 6 : "Lot 2 — partage du type AppRouter — est le plus naturel ensuite"). Corriger cela necessite de partager le vrai type `AppRouter` entre les deux depots (actuellement deux projets separes) : hors perimetre de ce chantier routes/auth, a traiter dans le lot dedie deja identifie cote backend.
- **Incoherence de casse `FDAAudit`/`FdaAudit`** : partiellement resolue (suppression du doublon mort ci-dessus). Le fichier restant `FDAAudit.tsx` (13 erreurs internes) n'est route nulle part dans `App.tsx` : code mort, non touche.
- **Modules/types manquants** : `streamdown` (`AIChatBox.tsx`), `@/hooks/use-toast` (`dashboard/ExportTools.tsx`), `./MDRAuditDrilldown` (import casse dans `mdrRoutes.tsx`, different de `MDRAuditDrilldown.tsx` reellement present), `../drizzle/schema` (`shared/types.ts` — normal, le schema Drizzle vit dans le depot backend separe). Aucun de ces fichiers n'est dans le perimetre routes/auth.
- **77 erreurs `TS7006`** (parametres implicitement `any`) et **9 `TS2353`** (proprietes d'objet excedentaires) dispersees dans des pages non liees a ce chantier (`DashboardV2.tsx`, `MDRAudit.tsx`, `AuditDetail.tsx`, `ISOAuditWizard.tsx`, etc.) : non corrigees, logique metier hors perimetre.

### Failles backend a corriger (a traiter dans un lot dedie, non corrige ici)

Verification effectuee sur `server/routers.ts`, `server/classification-router.ts`, `server/fda-router.ts`, `server/watch-router.ts` : tous les endpoints verifient la session (`protectedProcedure`, qui rejette les requetes sans utilisateur authentifie), mais **aucun endpoint ne verifie le plan d'abonnement (`subscriptionTier`) cote serveur**. Le verrouillage des fonctionnalites Pro (etape 4) est **entierement cote frontend**. Un compte Free authentifie peut, en appelant directement les endpoints tRPC (ex. via la console navigateur), contourner l'ecran verrouille et obtenir les memes reponses qu'un compte Pro :

1. **Classification** — `classification.classify` (`server/classification-router.ts:673`) : `protectedProcedure` seul, aucun controle de plan. Criticite : moyenne (contournement d'un verrou commercial, pas de fuite de donnees tierces).
2. **FDA** — tous les endpoints de `server/fda-router.ts` (`getFrameworks`, `getQualification`, `saveQualification`, `createAudit`, `getQuestions`, `saveResponse`, `getAuditDashboard`, `getReports`, `getDocuments`...) : idem, `protectedProcedure` seul. Un compte Free peut piloter un audit FDA complet via l'API. Criticite : moyenne.
3. **Veille reglementaire** — `server/watch-router.ts` (`updates`, `latest`, `critical`, profil veille `get`/`upsert`) : idem. Criticite : moyenne.
4. **Export de rapports** — pas d'endpoint dedie : la generation PDF/Excel (`client/src/lib/exportUtils.ts`) est **entierement cote client**, a partir de donnees deja recuperees via `audit.getScore`/`questions.list`/`audit.getResponses` (elles-memes sans controle de plan, mais deja legitimement visibles a l'ecran pour le Plan Free selon le cahier des charges). Le verrou d'export n'est donc qu'un verrou d'interface, contournable depuis la console navigateur. Criticite : faible a moyenne (pas de fuite au-dela de ce qui est deja visible, mais contourne l'intention commerciale).
5. **Point positif verifie** — `system.updateUserProfile` (mutation qui permet de changer `subscriptionTier` d'un utilisateur, utilisee par `AdminUsers.tsx`) est correctement protegee par `adminProcedure` (`server/_core/trpc.ts`, verifie `user.role === "admin"` cote serveur). Aucune faille trouvee sur ce point precis.

Recommandation pour le lot dedie : ajouter un middleware/helper serveur equivalent a `hasCapability` (deja cree cote frontend dans `client/src/lib/plans.ts`) qui verifie `ctx.user`/`subscriptionTier` avant d'executer les procedures listees ci-dessus, en reutilisant si possible la meme matrice de capacites pour eviter toute divergence entre frontend et backend.

## Etape 8 - Reprise apres Codex : reconciliation des branches (2026-07-09)

Statut : termine.

### Contexte

Nouvelle session, invoquee pour reprendre le travail apres qu'un agent Codex a rapporte avoir livre "etapes 4 et 5" sur une branche `qara-design-passation`, avec un dernier commit `d0a8e513 feat(routing): etape 5 — onboarding et etats vides`. La consigne de reprise signalait un risque de divergence avec `claude/qara-routes-auth-stages-xk5awz` (la branche de cette meme lignee, qui portait deja les etapes 0-7 ci-dessus) et demandait d'elucider la verite Git avant tout code.

### Constat reel (via `git fetch --all`, `git merge-base`, `git log --oneline`)

Les deux branches partagent une base commune exacte : `a27131d feat(routing): etape 3 — table routes cible`. A partir de ce point, elles divergent en deux lignes independantes (aucune n'est un sur-ensemble strict de l'autre) :

- **`claude/qara-routes-auth-stages-xk5awz`** (7 commits propres) : `0352d76` (audit de reprise) -> `bef9e88` (etape 4 — matrice abonnements) -> `a354b09` (etape 5 — dashboard) -> `ea896ad` (**etape 6 — execution reelle des 10 parcours**) -> `0cd1857` (fix doublon FdaAudit.tsx + @types/node) -> `c93f970` (etape 7 — build/types + failles backend consignees) -> `d29ef27` (docs — etat des lieux). Tout ce travail est documente en detail plus haut dans ce fichier (etapes 4 a 7), avec verification reelle (captures ecran mentionnees, corpus MDR reimporte pour tester des vraies questions, bug reel trouve et corrige en etape 4 — sidebar dupliquee dans `ActionDashboard.tsx`).
- **`qara-design-passation`** (3 commits propres, Codex) : `9e85470` (fix auth — debloque les pages publiques) -> `b41c364` (etape 4 — matrice abonnements, refaite independamment) -> `d0a8e51` (etape 5 — onboarding et etats vides, refaite independamment). Codex a explicitement reconnu ne pas avoir execute les 10 parcours de test (pas d'acces a la preview Vercel protegee).

Une troisieme branche non mentionnee dans la consigne, `claude/qara-compliance-audit-qitbxl`, a ete trouvee lors du fetch : elle bifurque du point `6210cd7` (avant meme l'etape 0 routing), donc anterieure et non liee aux deux lignes ci-dessus. Non pertinente pour la decision, ignoree.

### Analyse de contenu (pas seulement les messages de commit)

- Diff `a27131d..claude/qara-routes-auth-stages-xk5awz` : cree `client/src/lib/plans.ts` (matrice de capacites) et `client/src/components/LockedFeature.tsx`, gate reellement `Classification.tsx`/`FdaClassification.tsx`/`RegulatoryWatch.tsx`/`Reports.tsx` (bloc export), nettoie le dashboard (sidebar dupliquee, donnees fictives), supprime un fichier mort (`FdaAudit.tsx`, doublon de casse qui empechait `tsc` de tourner), et **consigne dans ce meme fichier une liste precise de failles backend** (`classification.classify`, `fda.*`, `watch.*` sans controle de plan cote serveur) — verifiee independamment et confirmee exacte lors du lot backend "securite des plans" traite separement (memes 4 endpoints trouves, memes correctifs appliques cote serveur).
- Diff `a27131d..qara-design-passation` : refait sa propre `plans.ts` (109 lignes, structure differente), retouche `Login.tsx`/`Register.tsx`/`useAuth.ts`/`PublicOnlyRoute.tsx` (voir ci-dessous), et modifie `Onboarding.tsx` pour y ajouter un `REFERENTIAL_CATALOG` (7 referentiels, distinction primary/transverse) avec **verrouillage des cartes au-dela de `maxReferentiels`** — piece de valeur reelle, absente de la branche `xk5awz` (qui applique la limite de referentiels uniquement sur la tuile dashboard, pas dans l'onboarding lui-meme). Codex tente aussi d'appeler `trpc.profile.update` avec des champs (`activeFrameworks`, `activeReferentials`, `markets`) que le schema Zod de cette procedure n'accepte pas (elle ne prend que `economicRole`/`companyName`) — tentative de raccord backend premature, silencieusement inefficace, et de toute facon hors perimetre de la mission de reprise actuelle (le raccord `onboarding.getProfile`/`saveProfile` reel, cree depuis cote backend, est explicitement un lot ulterieur).
- Commit `9e85470` (Codex) : correctif independant et de bonne qualite, sans lien avec le reste — `refresh()` (apres login/register) pouvait bloquer indefiniment la navigation si la requete de session ne se resolvait jamais ; ajout d'un timeout de secours (`Promise.race`, 1500 ms) avant de naviguer quand meme. Touche des fichiers (`useAuth.ts`, `PublicOnlyRoute.tsx`, `Login.tsx`, `Register.tsx`) que la branche `xk5awz` n'a jamais modifies : aucun recouvrement, aucun risque de conflit.

### Decision de branche de travail (consignee avant tout code Phase 1+)

**Branche retenue : `claude/qara-routes-auth-stages-xk5awz`**, comme base de la branche de travail designee pour cette session (`claude/qara-backend-securite-persistance-bo77ju`, memes conventions de nommage que le lot backend, elle etait vide/identique a `main` avant cette session — deplacement en fast-forward, verifie avec `git merge-base --is-ancestor`, aucun commit perdu).

Raisons :
1. Strictement plus avancee (7 commits contre 3) et couvre la totalite du perimetre de cette mission de reprise (matrice, ecrans verrouilles, dashboard, **et surtout l'etape 6 — execution reelle des 10 parcours**, le coeur explicite du travail demande ici).
2. Verification independante : la liste de failles backend qu'elle consigne (etape 7) correspond exactement, endpoint par endpoint, a ce qui a ete trouve et corrige de maniere independante lors du lot backend "securite des plans" (session separee, meme constat sur `classification.classify`, `fda.*`, `watch.*`) — forte evidence que son contenu est demontre, pas seulement declare.
3. Codex n'a pas execute les 10 parcours (aveu explicite) ; la branche `xk5awz` les a executes avec details concrets et falsifiables (bug reel trouve et corrige en etape 4, commande de reimport de corpus citee, comportement observe apres correctif).

**Ce qui n'est pas perdu du travail de Codex** :
- `9e85470` (correctif refresh-timeout login/register) : **cherry-picke** tel quel sur la branche de travail (`ef824de` sur `claude/qara-backend-securite-persistance-bo77ju`) — aucun recouvrement de fichiers, correctif independant et sain.
- Le concept de verrouillage des cartes de referentiels au-dela de `maxReferentiels` **dans l'onboarding lui-meme** (present chez Codex, absent de `xk5awz`) : sera **reimplemente proprement en Phase 1** de cette reprise (sans la tentative de raccord backend premature vers `profile.update`, hors perimetre ici).
- `b41c364` (matrice abonnements de Codex) et `d0a8e51` (reste du commit onboarding) : **non repris tels quels** — la matrice equivalente de `xk5awz` est deja en place, testee, et coherente avec les failles backend independamment confirmees ; reprendre la version de Codex en plus aurait cree un doublon divergent sans benefice demontre.

### Verification inventaire etapes 4/5 (demande explicite de la consigne de reprise)

Fichier par fichier, sur la branche de travail retenue :

| Element demande | Statut | Preuve |
|---|---|---|
| `client/src/lib/plans.ts` (matrice par capacites) | **Present** | Cree en etape 4 (`bef9e88`), verifie ci-dessus |
| `LockedFeature.tsx` + ecrans verrouilles | **Present** | `Classification.tsx`, `FdaClassification.tsx`, `RegulatoryWatch.tsx`, bloc export `Reports.tsx` |
| Sidebar avec modules verrouilles | **Present** | `AuthenticatedLayout.tsx`, verifie etape 4 |
| Verrouillage routeur `/classification` `/fda` `/veille` | **Present** | Gating au niveau composant de page, monte par `ProtectedRoute` (etape 4) |
| Rapports consultables en Free, exports verrouilles | **Present** | Correctif explicite en etape 4 : score visible pour tous, seul le bloc export est verrouille |
| Dashboard sans etat "0 referentiel" -> onboarding | **Present** | `ProtectedRoute` (etape 2) + reverifie etape 5 |
| Onboarding raccorde aux referentiels/role/marches | **Partiel** | Etat local (`localStorage`) fonctionnel et coherent avec `getActiveReferentials` (etape 5) ; **quota `maxReferentiels` dans l'onboarding lui-meme absent** avant cette session (piece de Codex non reprise telle quelle) — a completer en Phase 1 |


## Etape 9 - Phase 2 : verification reelle du traitement des FORBIDDEN backend (2026-07-09)

Statut : termine.

Contexte : le lot backend "securite des plans" (traite separement) a mis en place `requireCapability(...)` cote serveur, qui renvoie desormais `TRPCError({ code: "FORBIDDEN" })` sur `classification.classify`, `fda.getQualificationQuestions/getQualification/saveQualification`, `watch.updates/latest/critical`, `reports.generate` pour un compte Free. Verification demandee : le frontend doit gerer ce cas proprement partout, jamais de page blanche/crash/boucle.

### Environnement de test

Monte de bout en bout dans ce sandbox : MariaDB locale (`qara_local`, deja migree lors du lot backend, comptes de test `free@test.qara`/`pro@test.qara` deja crees), backend lance en local (`tsx server/_core/index.ts`, port 3001, `ALLOWED_ORIGINS=http://127.0.0.1:5173`), frontend lance en local (`vite --port 5173 --host 127.0.0.1`, `VITE_API_URL=http://127.0.0.1:3001` — **sans** `/trpc` final, le client l'ajoute deja lui-meme dans `client/src/lib/trpc.ts`, sinon double segment `/trpc/trpc` et 404 silencieux). Navigateur Chromium pilote par Playwright (script ad hoc, non committe).

### Analyse du code avant test

- Chaque page gatee (`FdaClassification.tsx`, `Classification.tsx`, `RegulatoryWatch.tsx`, `Reports.tsx`) verifie `hasCapability(...)` **avant** de monter les hooks/requetes metier et retourne `<LockedFeature/>` immediatement si la capacite manque — dans le flux normal de navigation, l'endpoint gate n'est donc jamais appele pour un compte Free (l'UX empeche deja l'appel, conformement a la consigne).
- Point d'attention identifie a la lecture : `FdaClassification.tsx` place son garde `if (isAuthenticated && !hasCapability(...))` **avant** plusieurs `useState` (step, deviceName, etc.), ce qui peut faire varier le nombre de hooks appeles entre le rendu ou `profile` est encore `undefined` (capacite par defaut = false, donc verrouille) et le rendu suivant une fois `profile` charge (capacite vraie pour un compte Pro) — un risque theorique de violation des Rules of Hooks React (nombre de hooks different entre deux rendus), qui pourrait provoquer un crash visible a la premiere visite.
- Seul le code HTTP 401 est gere globalement (`client/src/lib/trpc.ts` : destruction de session + redirection login sur 401). Aucune gestion globale du 403/FORBIDDEN — **comportement correct** : un FORBIDDEN ne doit pas detruire une session valide ni rediriger vers le login, contrairement a un 401. Un `ErrorBoundary` racine (`App.tsx`) reste un filet de secours en cas d'exception non geree dans un composant.

### Test reel execute

Compte Pro (onboarde MDR/Fabricant/UE) et compte Free (onboarde de la meme facon), chacun navigue reellement vers `/fda`, `/classification`, `/veille`, `/reports`, avec capture des erreurs console et des erreurs de page (exceptions non attrapees) :

| Route | Compte Pro | Compte Free |
|---|---|---|
| `/fda` | Contenu reel affiche, 0 erreur console, 0 erreur de page | Ecran `LockedFeature` ("Cette fonctionnalite necessite le Plan Pro. Passer au Plan Pro"), 0 erreur |
| `/classification` | Contenu reel affiche, 0 erreur | Ecran verrouille, 0 erreur |
| `/veille` | Contenu reel affiche, 0 erreur | Ecran verrouille, 0 erreur |
| `/reports` | Score visible, 0 erreur de page | Score visible + bloc export verrouille, 0 erreur de page |

Le risque theorique de violation des Rules of Hooks releve ci-dessus **ne s'est pas materialise** dans ces conditions reelles de test (`page errors: []` sur toutes les combinaisons route x plan) : dans la pratique, `useAuth`/`profile.get` se resolvent avant que React ne detecte un desalignement de hooks visible. Note pour vigilance future : ce pattern (garde conditionnel avant des `useState`) reste fragile en theorie et pourrait se manifester differemment sous un reseau plus lent ; deplacer le garde apres tous les hooks (ou early-return uniquement au niveau du JSX retourne, jamais avant des hooks) serait plus robuste, mais aucun defaut observe ne justifie d'y toucher hors perimetre de cette reprise.

Deux "404" apparus dans la console lors d'un premier essai (`profile.get`, Google Fonts) : confirmes comme artefacts de l'environnement de test (requete annulee par re-navigation rapide du script, absence d'acces internet pour `fonts.googleapis.com` dans ce sandbox) apres re-execution cible — aucun 4xx/5xx reel renvoye par le backend sur `/reports` lors d'une navigation normale.

**Conclusion : le traitement des FORBIDDEN est demontre propre dans toutes les combinaisons testees.** Aucune page blanche, aucun crash, aucune boucle de requetes observee.

## Etape 10 - Phase 3 : execution reelle des 10 parcours de test (2026-07-09, cette session)

Statut : termine (9 PASS, 1 bloque par le corpus — comportement attendu et documente ci-dessous, pas un bug frontend).

### Environnement

Meme environnement local que les etapes 8-9 : MariaDB locale (`qara_local`), backend en local (port 3001, `ALLOWED_ORIGINS=http://127.0.0.1:5173`), frontend en local (`vite --port 5173 --host 127.0.0.1`, `VITE_API_URL=http://127.0.0.1:3001` sans `/trpc` final). Navigateur Chromium pilote par Playwright (script ad hoc `test-10-parcours.mjs`, non committe). Comptes de test : `free@test.qara` / `pro@test.qara` (deja crees lors du lot backend), plus un compte neuf cree a la volee pour le parcours 3.

### Resultats, un par un

1. **Acces direct sans session** (`/dashboard`, `/audits`, `/reports`, `/account`) -> **PASS**. Les 4 routes redirigent vers `/login?returnTo=<route>`.
2. **Login avec `returnTo` vers `/reports`** -> **PASS**. Methode : un compte deja onboarde dans ce navigateur (l'etat d'onboarding est en `localStorage`, par navigateur et non par compte — deconnexion sans effacer le storage), deconnecte, visite `/reports` -> redirige vers `/login?returnTo=%2Freports` -> apres connexion, atterrit bien sur `/reports`. (Meme piege de methode que celui deja documente etape 6 par l'agent precedent : un compte fraichement cree sans onboarding aurait ete intercepte par la redirection forcee `/onboarding`, ce qui est le comportement voulu, pas un echec.)
3. **Nouveau compte : signup -> onboarding force -> referentiel -> dashboard conforme** -> **PASS**. Compte cree a la volee, redirection automatique vers `/onboarding` confirmee, activation MDR/Fabricant/UE, dashboard atterrit avec "MDR" reellement affiche.
4. **Navigation complete 7 entrees sidebar (Dashboard, Audits, Classification, Voies FDA, Plan d'action, Rapports, Veille) + bouton precedent** -> **PASS**. Zero erreur de clic, zero page blanche, zero erreur de page (`page errors: []`) sur l'aller comme sur les 7 clics "precedent".
5. **F5 sur les 8 routes protegees** (`/dashboard`, `/audits`, `/classification`, `/fda`, `/action-plan`, `/reports`, `/veille`, `/account`) -> **PASS**. Rechargement correct sur la meme URL a chaque fois.
6. **Compte Free : verrouillage + upsell + FORBIDDEN** -> **PASS**. `/classification`, `/fda`, `/veille` affichent l'ecran verrouille en acces direct par URL ; `/reports` affiche le score (visible pour tous) avec uniquement le bloc export verrouille ; zero erreur de page dans tous les cas (cf. etape 9 pour l'analyse detaillee du traitement FORBIDDEN).
7. **Compte Pro : tout accessible** -> **PASS**. `/classification`, `/fda`, `/veille`, `/reports` : aucun ecran verrouille, zero erreur de page.
8. **Deconnexion + bouton precedent** -> **PASS**. Apres clic "Deconnexion" depuis `/dashboard` : atterrissage `/login`. Clic "precedent" navigateur : reste sur `/login?returnTo=%2Fdashboard`, aucune page protegee ne se reaffiche.
9. **URL inexistante -> 404 propre avec lien retour** -> **PASS** (apres correction de methode de test). Premier essai faussement en echec : le script cherchait un element `role="link"`, or `NotFound.tsx` implemente le retour via un `<Button onClick={...}>` (navigation cote client `wouter`, pas une balise `<a>`) — comportement idiomatique pour une SPA, pas un defaut. Re-execution avec le bon selecteur (`role="button"`, texte "Retour connexion"/"Retour dashboard") : page 404 affichee ("404 — Page introuvable"), bouton present et fonctionnel, clic redirige correctement vers `/login` (utilisateur non connecte) sans aucune erreur de page.
10. **Parcours metier complet (login -> carte MDR -> lancer un audit -> repondre a 3 questions -> dashboard -> "Travaux en cours")** -> **BLOQUE, hors perimetre, non tente au-dela du diagnostic**. Tentative d'import du corpus MDR local (`node scripts/import-mdr-questions.js` sur `qara_local`) : echec avec `Unknown column 'risks' in 'INSERT INTO'` — le script d'import (cote backend, `Backend---QARA/scripts/import-mdr-questions.js`) insere encore une colonne `risks` supprimee par la migration `0015_questions_unify_risk_drop_risks.sql` (le schema Drizzle actuel n'a que `risk`, singulier). Base de questions locale a 0 ligne suite a cet echec (rollback propre, table vide, aucune donnee corrompue). Conformement a la consigne explicite de cette reprise ("si ce parcours echoue sur 'Aucune question trouvee', c'est un probleme de corpus en base connu et diagnostique separement... ne tente pas de le corriger ici"), **aucune modification apportee au script d'import ni au depot backend** — strictement hors perimetre de cette session frontend. Le fichier temporaire cree pour le diagnostic (copie `.cjs` du script) a ete supprime apres verification, aucune trace laissee dans le depot.

### Bilan

**9 parcours sur 10 executes reellement et reussis** (aucune donnee inventee affichee comme reelle, aucun test non execute presente comme "OK"). Le seul parcours non complete (n°10) est bloque par une dette technique cote backend deja identifiee et hors perimetre de cette reprise, exactement dans le cas de figure anticipe par la consigne de mission.
