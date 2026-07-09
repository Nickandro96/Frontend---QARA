# Progression architecture routes/auth QARA

Document de reprise pour la mission routes, authentification, abonnements et parcours utilisateur.

## Etat Git et alignement

Branche cible : `qara-design-passation` sur `Nickandro96/Frontend---QARA`.

Procedure imposee executee le 2026-07-08 :

- Modifications locales mises de cote avant realignement.
- Recuperation distante effectuee. Premier essai Git local bloque par credential/certificat ; fetch ensuite reussi en mode ponctuel avec Git systeme.
- Divergences trouvees avant rebase :
  - Local uniquement : `1dcce528 feat(dashboard): route accueil vers cockpit`.
  - Distant uniquement : `7c55fc2a`, `8de0117f`, `84980aa4`, `66d9cd6b`.
- Rebase effectue sur `origin/qara-design-passation`.
- Le commit local `1dcce528` a ete ignore par Git car son changement etait deja couvert par le distant.
- Stash reapplique sans conflit.
- Aucun force-push. Aucun commit distant ecrase.

Reference deployee fournie le 2026-07-08 :

- Zip inspecte : `Frontend---QARA-qara-design-passation (1).zip`.
- Les fichiers critiques routes/auth du zip correspondent a l'etat de depart inspecte.

## Cartographie existant -> cible

- `/` : landing publique minimale, pas `ModernHome` car cette page est un ancien hub applicatif. Elle est remplacee par une page publique avec `TODO(design): landing definitive a venir`.
- `/login`, `/signup`, `/forgot-password` : pages publiques, redirection vers `/dashboard` si session confirmee.
- `/onboarding` : wizard protege en 4 etapes, force si aucun referentiel actif.
- `/dashboard` : dashboard d'accueil protege, sans sidebar interne.
- `/audits`, `/audits/:id` : liste et questionnaire.
- `/classification`, `/classification/:id` : outil classification avec verrouillage par plan.
- `/fda`, `/fda/:id` : point d'entree unique determination voie FDA 510(k)/De Novo/PMA.
- `/action-plan` : plan d'action CAPA.
- `/reports`, `/reports/:id` : rapports, exports selon plan.
- `/veille` : veille reglementaire, verrouillage par plan.
- `/account` : profil, abonnement, deconnexion.
- `*` : 404 propre avec lien retour adapte.

Routes historiques deroutees/depreciees sans suppression :

- `/register` -> `/signup`.
- `/profile`, `/subscription*` -> `/account`.
- `/regulatory-watch`, `/watch-dashboard`, `/fda-regulatory-watch`, `/us/fda-watch` -> `/veille`.
- `/action-dashboard` -> `/action-plan`.
- `/dashboard-v2`, `/dashboard-executive`, `/home-old` -> `/dashboard`.
- Anciennes routes FDA qualification/classification/dashboard -> `/fda`.
- Anciennes routes FDA audit -> `/audits`.

## Etapes realisees

### Etape 0 - Realignement Git

Statut : termine.

Resultat : branche locale realignee sur le distant avant codage, divergences documentees ci-dessus, aucun force-push.

### Etape 1 - Inventaire routes/pages

Statut : termine.

Resultat :

- Inventaire des routes existantes realise dans `client/src/App.tsx`.
- Doublons identifies : `Home`, `ModernHome`, `DashboardV2`, `DashboardExecutive`, plusieurs anciens dashboards/pages FDA.
- Aucun vrai wizard onboarding 4 etapes n'existait. Des fragments reutilisables existaient (`MDRQualification`, `ISOQualification`, `CompanyProfilePanel`, `Profile`), mais pas la page cible.
- Fallback SPA deja present dans `vercel.json`, a verifier en test reel.

### Etape 2 - Layout authentifie et gardes auth

Statut : termine.

Resultat :

- Ajout de `ProtectedRoute` avec verification session, etat de chargement, `returnTo`, et redirection forcee vers `/onboarding` si 0 referentiel actif.
- Ajout de `PublicOnlyRoute` pour eviter de bloquer login/signup pendant la verification de session.
- Ajout de `AuthenticatedLayout` unique avec sidebar cible.
- Nettoyage du `navigate` fantome dans `useAuth.ts`.
- Gestion client des `401` API : destruction session locale + retour login depuis les zones protegees.

Correctif urgent inclus :

- Le blocage signale sur login/signup etait cause par `PublicOnlyRoute` qui affichait l'ecran de verification tant que le profil chargeait.
- Correction poussee : les pages publiques restent visibles pendant le chargement, et la redirection vers dashboard ne se fait que si la session est confirmee.
- Commit en ligne : `9e854706 fix(auth): debloque les pages publiques`.

### Etape 3 - Table routes cible

Statut : termine.

Resultat :

- Table de routes cible montee dans `client/src/App.tsx`.
- Landing publique minimale ajoutee.
- `ForgotPassword`, `Onboarding`, `NotFound` ajoutes.
- Login et signup prennent en charge `returnTo` et les destinations ciblees.
- Routes historiques redirigees/depreciees.

### Etape 4 - Matrice abonnements

Statut : termine.

Resultat :

- Creation de `client/src/lib/plans.ts`, source de verite front pour les capacites.
- Free : 1 referentiel, audits + score, rapport consultable, pas export, pas classification, pas FDA, pas veille, pas IA.
- Pro : multi-referentiels, exports, classification, FDA, veille. IA volontairement desactivee tant que la cle serveur n'est pas branchee.
- Fonctionnalites verrouillees visibles avec cadenas, plan requis et bouton vers `/account`.
- Dashboard reste accessible en Free.
- Commit en ligne : `b41c364 feat(routing): etape 4 - matrice abonnements`.

### Etape 5 - Etats vides, dashboard et onboarding force

Statut : termine cote code, publication GitHub en cours.

Resultat :

- Centralisation du catalogue referentiels dans `client/src/lib/onboarding.ts` : MDR, IVDR, FDA QMSR, MDSAP, ISO 13485, ISO 14971, ISO 9001.
- Detection stricte des referentiels actifs : cles connues uniquement, deduplication, fallback local temporaire.
- `/dashboard` ne fabrique plus de referentiels ou donnees fictives.
- `/dashboard` redirige vers `/onboarding` si aucun referentiel actif.
- Suppression de la sidebar interne du dashboard ; le layout authentifie unique reste la seule navigation.
- KPI/scores/travaux/veille ne prennent plus de valeurs de demonstration par defaut.
- Etats vides actifs :
  - Travaux en cours : invitation a lancer un premier audit.
  - Veille : invitation a ouvrir la veille.
  - Aucun referentiel : invitation a revenir a l'onboarding, sans dashboard mort.
- Header dashboard base sur le vrai nom d'organisation/utilisateur et le vrai plan.
- `/onboarding` reutilise le catalogue centralise, applique le quota de plan, pre-remplit depuis le profil ou le stockage local, et tente de sauvegarder `activeFrameworks`, `activeReferentials`, `economicRole`, `markets`.

Validation locale et limites :

- `git diff --check` OK, seuls avertissements Windows LF -> CRLF.
- Recherche des anciens elements dashboard : plus de `navItems`, sidebar interne, ni KPI fictifs par defaut.
- Verification TypeScript cible tentee, mais l'installation locale `node_modules` est incomplete apres blocages reseau/certificat npm. Impossible d'obtenir une validation TS fiable tant que les dependances locales ne sont pas reconstruites.

Point backend a confirmer :

- `profile.update` accepte deja `economicRole` et `companyName`, mais il faut verifier que `activeFrameworks`, `activeReferentials` et `markets` sont bien persistables cote serveur. Le front garde un fallback local pour ne pas bloquer le parcours.

## Exigences confirmees dans le perimetre

- Gestion des `401` API : destruction de session + redirection `/login`.
- Fallback SPA : F5 sur chaque route protegee a valider via deploiement/Vercel.
- Execution reelle des 10 parcours obligatoires : non terminee, a faire en etape 6 et a documenter ci-dessous.
- Verification backend des droits/session : toute faille constatee sera listee sans correction silencieuse.

## Resultats tests obligatoires

1. Acces direct sans session `/dashboard`, `/audits`, `/reports`, `/account` : non execute.
2. Login avec `returnTo` vers `/reports` : non execute.
3. Premier compte : signup -> onboarding force -> activation referentiels -> dashboard : non execute.
4. Navigation complete sidebar + bouton precedent : non execute.
5. F5 sur chaque route protegee : non execute.
6. Plan Free : classification/FDA/veille verrouillees : non execute.
7. Plan Pro : tout accessible : non execute.
8. Deconnexion + bouton precedent : non execute.
9. 404 propre : non execute.
10. Parcours metier MDR complet : non execute.

## Failles backend a corriger / verifier

- Verifier le controle serveur de session sur les endpoints utilises par classification, FDA, veille, exports et rapports.
- Verifier le controle serveur du plan sur les endpoints classification, FDA, veille, exports et rapports.
- Verifier la persistance serveur des referentiels actifs (`activeFrameworks` / `activeReferentials`) et des marches a la fin de l'onboarding.

## Prochaines actions

- Finaliser la publication GitHub de l'etape 5.
- Executer le plan de test reel des 10 parcours.
- Completer cette page avec les resultats exacts, puis commit d'etape 6.
- Relancer build/tests des que les dependances Node sont reconstruites dans un environnement non bloque par le certificat npm.
