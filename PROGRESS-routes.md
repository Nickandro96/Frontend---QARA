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

## Exigences confirmees dans le perimetre

- Gestion des 401 API : destruction de session + redirection `/login`.
- Fallback SPA : F5 doit fonctionner sur chaque route protegee. A verifier via configuration Vercel.
- Execution reelle des 10 parcours de test de la mission, resultats consignes ci-dessous.
- Aucun endpoint backend ne doit etre suppose securise sans verification. Les failles relevees seront listees.

## Etapes

- [x] Etape 0 - Realignement Git et inventaire initial.
- [ ] Etape 1 - Inventaire routes/pages approfondi + onboarding existant.
- [ ] Etape 2 - Layout authentifie + gardes auth.
- [ ] Etape 3 - Table des routes cible + aliases/deprecations.
- [ ] Etape 4 - Matrice abonnements centralisee.
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
