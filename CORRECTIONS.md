# CORRECTIONS — Correction des bugs par cause racine

Journal de la phase "correction par cause racine" (démarrée 2026-07-17), faisant suite à `INVENTAIRE-BUGS.md`. Couvre les deux dépôts :
- `Backend---QARA`, branche `claude/qara-backend-test-inventaire` (issue de `qitbxl`)
- `Frontend---QARA`, branche `claude/qara-frontend-test-inventaire` (issue de `bo77ju`)

Aucun merge, aucun déploiement, aucune écriture en production n'a été effectué — tout est préparé et testé localement, en attente du feu vert de l'utilisateur.

---

## LOT 1 — Résolution des référentiels par `code` (cause racine) — ✅ TERMINÉ

### Objectif
Éliminer toute dépendance à un ID de référentiel codé en dur, dans les deux dépôts, au profit d'une résolution systématique par `code` (`referentiels.code` : `MDR`, `IVDR`, `FDA_QMSR`, `MDSAP`, `ISO13485`, `ISO14971`, `ISO9001`).

### Point de résolution unique
Déjà en place, non modifié : `trpc.referentials.list` (public, `server/routers.ts:347-355`) expose `SELECT * FROM referentiels` (id + code + name + type) au frontend, et `trpc.iso.getStandards` (modifié dans ce lot) fait de même côté serveur pour le wizard ISO.

### État constaté par référentiel (audit du code, avant correction)

| Référentiel | Résolution ID | État avant ce lot |
|---|---|---|
| MDR | Frontend : `MDRAudit.tsx` résout déjà par code via `trpc.referentials.list` (correctif d'une session précédente, voir commentaire ligne 108-116) | ✅ Déjà conforme |
| FDA | Backend : `fda-router.ts:222-225` (`getReferentialIdByCode`) résout déjà par `referentiels.code` | ✅ Déjà conforme |
| ISO 9001 / ISO 13485 | Backend : `iso-router.ts` — `ISO_STANDARDS` hardcodait `referentialId: 2/3`, `referentialIdFromStandard()` hardcodait `return 2`/`return 3`, `listAudits` filtrait `refs.includes(2) \|\| refs.includes(3)`. Frontend : `ISOAuditWizard.tsx` hardcodait `standardCode === "ISO9001" ? [2] : [3]`, `ISOAuditReview.tsx` hardcodait `referentialIds[0] === 3` (×2) | ❌ Non conforme — corrigé dans ce lot |
| IVDR | Aucune page de création d'audit dédiée dans le frontend actuel (confirmé : aucun import dans `App.tsx`) | Non testable en l'état — voir note plus bas |

### Corrections apportées

**Backend (`Backend---QARA`, commit `0b1ddc5e`) — `server/iso-router.ts` :**
1. `ISO_STANDARDS` : le champ `referentialId` en dur retiré du tableau statique.
2. `referentialIdFromStandard()` (hardcodait 2/3) remplacée par `resolveReferentialId(db, code)`, qui interroge `referentiels` par `code` à chaque appel.
3. `getStandards` (query publique) résout maintenant `referentialId` dynamiquement en base et l'ajoute à chaque entrée retournée au frontend.
4. Les 2 sites d'appel (`getQuestions`, `createOrUpdateAuditDraft`) utilisent `await resolveReferentialId(db, ...)`.
5. **Bug critique trouvé dans le même balayage** : `iso.listAudits` filtrait `refs.includes(2) || refs.includes(3)` en dur. Si les ID réels de production diffèrent de 2/3 (ce qui semble être le cas — voir écart constaté ci-dessous), ce filtre exclut **tous** les audits ISO réels de la liste, quel que soit leur statut (brouillon, en cours, terminé) — correspond exactement au symptôme "les audits ne s'affichent pas" / "masque les audits en cours" pour un utilisateur ISO. Corrigé pour résoudre les deux ID par code avant de filtrer.

**Frontend (`Frontend---QARA`, commit `4e4c5c9`) :**
1. `ISOAuditWizard.tsx` : `referentialIds` (envoyé au backend, ignoré côté serveur qui résout désormais lui-même — mais trompeur/faux à conserver) remplacé par lecture de `selectedStandard.referentialId`, renvoyé dynamiquement par `iso.getStandards`.
2. `ISOAuditReview.tsx` : les 2 occurrences de `referentialIds[0] === 3` (génération du rapport Word téléchargeable) remplacées par une résolution via `trpc.referentials.list` + correspondance sur le code (`ISO13485`/`ISO9001`), même pattern que `AuditHistory.tsx`/`MDRAudit.tsx`.

**Non modifié (code mort, signalé mais pas touché)** : `client/src/pages/ISOAudit.tsx` contient le même hardcode (`selectedStandard === "9001" ? 2 : 3`) mais n'est importé/routé nulle part dans `App.tsx` — cohérent avec le traitement déjà appliqué aux autres pages mortes de `INVENTAIRE-BUGS.md` (#13).

### ⚠️ Écart constaté sur les ID réels (transparence)
Le prompt de cadrage de ce lot indique pour la production : MDR=3, IVDR=4, FDA_QMSR=5, MDSAP=6, ISO13485=7, ISO14971=8, ISO9001=9.
La base locale de test (reconstituée via `scripts/apply-sql-migrations.ts` + `scripts/import-corpus.mjs`, la même séquence que la production) donne : ISO9001=2, ISO13485=3, MDR=6, IVDR=7, FDA_QMSR=8, MDSAP=9, ISO14971=10.
Ces deux jeux d'ID sont différents l'un de l'autre. **Ce n'est pas un problème pour la correction appliquée ici** — c'est précisément pourquoi on résout par `code`, jamais par ID — mais je le signale pour transparence : je n'ai pas pu vérifier moi-même les ID exacts de la vraie base de production (accès non disponible dans cet environnement), donc si les ID réels sont encore différents des deux jeux ci-dessus, la correction reste valide (elle ne dépend d'aucun des deux).

### Tests réels effectués (Playwright + curl, aucune écriture en production)
1. `iso.getStandards` (curl, authentifié) → renvoie `referentialId: 2` pour ISO9001, `referentialId: 3` pour ISO13485 (résolu dynamiquement, confirmé par requête SQL directe sur `referentiels`).
2. Création d'un audit ISO13485 **via le wizard réel** (`/iso/audit`, clics réels Playwright : sélection norme → site → date → étapes 1-3 → "Démarrer l'audit") → audit créé en base avec `referentialIds: [3]` (id réel).
3. Idem pour ISO9001 → `referentialIds: [2]`.
4. `iso.listAudits` (curl, après les créations ci-dessus) → les 5 audits de test ISO (9001 et 13485 confondus, statuts variés) apparaissent tous — confirme la correction du filtre hardcodé.
5. Téléchargement du rapport Word depuis `/iso/audit/8/review` (l'audit ISO13485 créé en étape 2) → le rapport généré affiche bien "ISO 13485:2016" (résolu par code, plus par comparaison d'ID).
6. Non-régression : `audit.getScore` revérifié après tous ces changements → toujours 80.6% (dashboard préservé, aucune régression).

### Migration de données en production
**Non préparée dans ce lot** : je n'ai pas eu accès à un export ou à une lecture de la base de production pour savoir si des audits existants y sont mal tagués avec des ID hérités de l'ancien schéma (au-delà du cas déjà connu pour `userId 2`, mentionné dans le prompt de cadrage). Dès que vous pourrez fournir un accès en lecture (ou un export) à la base de production, je peux écrire une requête de diagnostic (`SELECT` uniquement, aucune écriture) pour identifier les audits concernés, préparer un correctif `UPDATE` avec sauvegarde préalable, et vous le soumettre pour feu vert avant toute exécution.

---

## LOT 2 — Affichage et reprise des audits — en cours

À traiter : vérifier l'affichage de tous les statuts d'audits (en cours + terminés) sur les deux pages "Mes audits" (`AuditsList.tsx` à `/audits`, `AuditHistory.tsx` à `/audit-history`), et prouver par un parcours réel complet (créer → répondre → quitter → revenir → continuer) que la reprise préserve les réponses déjà saisies.

**Recherche du bug "condition `else if` mal placée" décrit dans le prompt de cadrage** : recherche exhaustive dans `AuditsList.tsx`, `AuditHistory.tsx`, `audit-router.ts` (`list`/`listAudits`), `mdr-router.ts` (`listAudits`) — aucun filtre de statut n'exclut les audits "en cours" dans le code actuel de ces deux dépôts (`statusFilter` par défaut = "all", aucun filtre appliqué côté serveur si absent). Le seul mécanisme trouvé qui **masque réellement des audits** (tous statuts confondus) est le bug ISO `listAudits` corrigé au LOT 1 ci-dessus — je ne peux pas exclure que le prompt de cadrage fasse référence à ce même bug sous une description légèrement différente, ou à une version antérieure du code non retrouvée dans l'état actuel de `qitbxl`/`bo77ju`. À confirmer avec vous si un autre cas précis est observé en production.

Suite : test réel du parcours complet de reprise (en cours).
