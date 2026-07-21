# RECONCILIATION — Journal frontend (bo77ju ↔ backend qitbxl)

*Branche : `claude/qara-frontend-assainissement-bo77ju` (issue de `claude/qara-backend-securite-persistance-bo77ju`, jamais poussée sur `bo77ju` directement — Vercel auto-déploie depuis cette dernière). Voir `RECONCILIATION.md` côté `Backend---QARA` pour l'Étape 2.*

## Étape 3 — Frontend : correction de l'ID référentiel + vérification des endpoints

### Ce qui a changé, et pourquoi si peu

Le scan complet des IDs de référentiel codés en dur (`grep -rn "referentialId(s)\s*[:=]\s*\[?[0-9]"` sur tout `client/src`) ne trouve **que 3 occurrences, toutes dans `MDRAudit.tsx`** (`referentialIds: [1]`, lignes 262/294/334 avant correction). Aucune autre page (ISO, FDA, IVDR, MDSAP) n'a d'ID codé en dur — `ISOAudit.tsx` et `Audit.tsx` résolvent déjà dynamiquement via une variable/prop.

Grâce à l'Étape 2 (endpoints backend alignés sur les noms ET les signatures exactes déjà utilisées par le frontend, y compris les alias `list`/`listAudits` et le `getScore` sans `auditId`), **8 des 9 pages initialement identifiées comme cassées n'ont besoin d'aucune modification frontend** : `AuditDetail.tsx`, `AuditHistory.tsx`, `AuditResults.tsx` (hors PDF), `Reports.tsx`, `AuditSelector.tsx`, `AuditsList.tsx`, `DashboardV2.tsx` appellent des noms/signatures qui existent désormais tels quels côté qitbxl. Seul `MDRAudit.tsx` avait un vrai bug frontend à corriger.

**`FDAAudit.tsx`** (qui appelait `audit.saveResponse`/`getResponse`, jamais implémentés côté backend) — vérifié : **absent de `App.tsx`, aucune route ne le monte**. Code mort, inatteignable par un utilisateur réel. Aucune action nécessaire.

**`AuditResults.tsx` — bouton PDF (`audit.generatePDF`)** : non traité ce tour-ci — le backend (`reports.generate`/`generateAuditReport`) plante indépendamment (voir `RECONCILIATION.md` backend, Étape 2). Le bouton appellera un endpoint qui n'existe pas ; comportement dégradé mais pas pire qu'avant. Signalé, pas corrigé — hors périmètre déclaré de cette étape.

### Correction appliquée : `client/src/pages/MDRAudit.tsx`

- Ajout d'une requête `trpc.referentials.list.useQuery()` (endpoint public, déjà existant côté qitbxl) et résolution de l'ID MDR par `code` (`r.code.toUpperCase() === "MDR"`), jamais par ID en dur.
- Remplacement des 3 occurrences `referentialIds: [1]` par `referentialIds: mdrReferentialId ? [mdrReferentialId] : []`.
- Ajout de `mdrReferentialId` à `isStep1Valid()` : le bouton "Continuer vers l'étape 2" reste désactivé tant que l'ID n'a pas été résolu, pour ne jamais soumettre un audit avec un `referentialIds` vide.

### Preuve — test réel en navigateur (Playwright, pas juste lecture de code)

Backend qitbxl local (même base que l'Étape 2, MDR résolu à l'id **6** localement — pas 3, l'offset est propre à chaque environnement, exactement pourquoi la résolution par code est nécessaire) + frontend servi par `vite` en local, CORS ouvert pour `localhost:5173` le temps du test.

Scénario exécuté par un vrai navigateur Chromium : connexion (`test-reconciliation@example.com`), onboarding (sélection MDR/Fabricant/UE), navigation vers `/mdr/audit`, remplissage complet du formulaire étape 1 (site, périmètre, dates, contacts), soumission.

**Requête réseau réellement envoyée par le navigateur** (capturée via l'API Playwright `page.on("request")`, pas simulée) :
```json
POST /trpc/mdr.createOrUpdateAuditDraft
{"siteId":1,"name":"Audit MDR (fabricant) - 15/07/2026","auditType":"internal",
 "type":"internal","status":"draft","referentialIds":[6], ...}
```
**Réponse serveur** : `{"auditId":3,"audit":{...,"referentialIds":[6],...}}`.

`referentialIds:[6]` — l'ID réellement résolu par code sur cette base, jamais `[1]`. Capture d'écran du formulaire rempli disponible en local (non versionnée) si besoin de la revoir.

### Vérification TypeScript

`npx tsc --noEmit` : 434 erreurs pré-existantes sur cette branche avant toute modification (confirmé par `git stash`/comparaison), 436 après — les 2 erreurs supplémentaires proviennent de la même cause pré-existante et documentée ailleurs (`AppRouter` local au frontend, non partagé avec le vrai routeur backend — dette déjà connue, hors périmètre). Aucune nouvelle catégorie d'erreur introduite, la ligne `trpc.referentials.list` échoue au typage exactement comme `trpc.mdr.*`/`trpc.organizations.*` le faisaient déjà sur les lignes voisines avant mon changement.

### Ce qui est prêt à livrer

Commit à venir sur `claude/qara-frontend-assainissement-bo77ju` : `client/src/pages/MDRAudit.tsx` (résolution dynamique de l'ID MDR). **Non mergé, non déployé.**
