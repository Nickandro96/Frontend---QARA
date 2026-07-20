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

### Point de vigilance MDR (demandé explicitement) — ✅ vérifié, pas de masquage

Recherche spécifique d'un filtre équivalent au bug ISO (LOT 1) qui masquerait les audits MDR (ou tout autre référentiel) dans les listes :
- `audit.list`/`audit.listAudits` (générique, alimente `/audits` et `/audit-history`) : filtre par `referentialId` **uniquement si le frontend le passe explicitement** — ni `AuditsList.tsx` ni `AuditHistory.tsx` ne le font. Confirmé par lecture de code ET par test réel : `audit.listAudits` (curl authentifié) renvoie les 8 audits de test (3 MDR + 5 ISO confondus) sans aucun filtrage.
- `mdr.listAudits` (spécifique MDR, alimente l'historique de `MDRAuditReview.tsx`) : ne filtre que par `userId`, aucun filtre de référentiel — vérifié dans `server/mdr-router.ts:905-923`.
- `listAuditsByUserId` (helper partagé, `server/db.ts:533`) : ne filtre que par `userId`.
- **Test réel (Playwright, navigateur réel)** : `/audits` affiche bien "Test MDR LOT1" ET "Audit MDR (fabricant)" ET les audits ISO, 8 lignes au total (correspond exactement au compte réel en base) ; `/audit-history` affiche les mêmes audits MDR.

**Conclusion** : aucun bug de masquage MDR actif dans le code actuel de `qitbxl`/`bo77ju`. L'hypothèse la plus cohérente reste que votre symptôme original ("les audits ne s'affichent pas") était dû à l'ancien schéma d'ID en dur pour MDR — déjà corrigé lors d'une session de réconciliation antérieure (`MDRAudit.tsx` résout par code depuis, voir commentaire ligne 108-116 référençant `DIAGNOSTIC-topologie-branches.md`) — et que le bug ISO corrigé au LOT 1 est la même famille de cause racine, simplement pas encore corrigée pour ISO à ce moment-là. Si vous observez encore le symptôme en production après déploiement des LOT 1-3, ce sera un signal fort qu'il reste un troisième mécanisme non identifié ici — à investiguer immédiatement avec un accès aux logs/données de production.

### Test réel de reprise avec continuité des réponses — ✅ prouvé

Parcours réel (Playwright, clics réels, aucune simulation) sur un audit MDR créé pour ce test ("Test MDR LOT1", id=6, brouillon vide) :
1. Ouverture de `/mdr/audit/6` (questionnaire réel, 62 questions réelles du corpus).
2. Clic sur "Conforme" pour la question 1, puis "Enregistrer et continuer".
3. Confirmé persisté côté serveur : `mdr.getResponses({auditId: 6})` renvoie une ligne réelle (`Q-MDR-MSM-6162`, `responseValue: "compliant"`, horodatée).
4. Navigation complète vers `/dashboard` (quitte entièrement la page d'audit).
5. Retour via `/audit-history` ("Mes audits"), clic sur le bouton "Reprendre" de la carte "Test MDR LOT1" (sélecteur scopé à la bonne carte, pas un clic au hasard).
6. Atterrit bien sur `/mdr/audit/6` (pas de redémarrage à zéro), question 1/62 affichée avec le bouton "Conforme" toujours actif (classe `bg-emerald-600`, vert = sélectionné), barre de progression à 2% (1/62) — la réponse est bien préservée, pas réinitialisée.

Aucune anomalie constatée : le mécanisme de reprise + persistance fonctionne correctement pour MDR. Comme aucun bug de masquage MDR n'a été trouvé (voir section ci-dessus), et que la reprise avec continuité est prouvée, **LOT 2 est considéré terminé** — rien à corriger, seulement à confirmer par ces preuves.

### Trouvaille annexe : barre de recherche "Mes audits" non fonctionnelle

En vérifiant `audit.listAudits`, trouvé que `AuditsList.tsx` envoie un champ `search` depuis toujours, jamais déclaré dans le schéma zod du routeur — zod (non strict) le supprimait silencieusement, la recherche ne filtrait donc jamais rien (confirmé : `filteredAudits = audits || []`, aucun filtre local non plus). Corrigé (`Backend---QARA` commit `8ae5db21`) : champ ajouté au schéma + filtre en mémoire sur le nom de l'audit. Testé en direct (curl) : `search=MDR` → 3 résultats MDR uniquement, `search=ISO9001` → 2 résultats ISO9001 uniquement.

**Statut LOT 2 : ✅ TERMINÉ** — point de vigilance MDR vérifié négatif (pas de masquage), continuité de reprise prouvée, et un bug annexe (recherche non fonctionnelle) trouvé et corrigé au passage.

---

## LOT 3 — Navigation et 404 — ✅ TERMINÉ

### Méthode
Recensement exhaustif de toutes les cibles de navigation internes du frontend : `setLocation("...")`/`setLocation(\`...\`)`, `<Link href="...">` (littéraux et dynamiques), `<Redirect to="...">`, comparées à la table réelle des routes de `App.tsx` (`<Route path="...">`, y compris le catch-all final `<Route component={NotFound} />` qui matérialise un "404" applicatif — texte distinctif "Page introuvable").

### Lien mort trouvé et corrigé

**`/iso/qualification`** — `ISOAuditWizard.tsx` (ligne ~262) navigue vers cette URL quand la qualification ISO n'est pas complétée ("Compléter la qualification"), mais **aucune route ne l'enregistrait** dans `App.tsx` — un clic dessus atterrissait sur le catch-all `NotFound`. Le composant `ISOQualification.tsx` existe déjà (utilise les vraies procédures `iso.getQualification`/`iso.saveQualification`) mais n'était routé nulle part. Corrigé (`Frontend---QARA`) : route `/iso/qualification` ajoutée dans `App.tsx`, montée sur `ISOQualification`.

*Note : cette condition est rarement atteinte en pratique — `iso.getQualification` renvoie toujours un objet par défaut (jamais `null`), donc la garde `if (!isoQualification)` ne se déclenche quasiment jamais. Corrigé quand même par exhaustivité (LOT 3 demande de corriger "chaque" lien mort), et pour la robustesse si ce comportement backend change un jour.*

### Autres candidats examinés, non corrigés (code mort, cohérent avec la politique déjà appliquée en LOT précédent)
- `client/src/pages/ComponentShowcase.tsx` : lien vers `/components` (route inexistante), mais page elle-même non routée dans `App.tsx` — inatteignable.
- `client/src/components/ProfessionalLayout.tsx` : `<Link href="/>">` — typo évidente (devrait être `"/"`), mais ce composant (et son `ProfessionalSidebar`) n'est importé nulle part — inatteignable.
- `client/src/pages/ModernHome.tsx`/`ModernSidebar.tsx`, `Home.tsx`, `Audit.tsx`, `FDAAudit.tsx` : liens internes non vérifiés un par un car ces pages sont déjà cataloguées comme non routées dans `INVENTAIRE-BUGS.md` #13.

### Tests réels effectués (Playwright, clics réels — pas de simulation)

1. **Parcours complet du menu latéral réel** (`AuthenticatedLayout.tsx`) : Dashboard → Audits → Classification → Voies FDA → Plan d'action → Rapports → Veille → Compte, dans cet ordre, par clics réels. Chaque clic atterrit sur la bonne URL, contenu réel affiché, **zéro "Page introuvable"**, **zéro erreur JS console** sur tout le parcours.
2. **Bouton "précédent"/"suivant" du navigateur** : navigation par clics (Audits → Rapports), puis `goBack()`/`goForward()` réels (API navigateur, pas une nouvelle requête) → retombe correctement sur `/audits` puis `/reports`, contenu réel, aucun 404 dans les deux sens.
3. **F5 (reload) sur une route profonde à paramètre dynamique** (`/mdr/audit/6`) : rechargement complet de la page → contenu réel réaffiché (audit "Test MDR LOT1"), aucun 404.
4. **Lien précédemment cassé, /iso/qualification** : non re-testé par clic direct dans cette passe (condition de déclenchement quasi inatteignable en pratique, voir note ci-dessus) mais route confirmée présente et montée correctement par lecture de `App.tsx` après correction.

### Remarque méthodologique (transparence)
Plusieurs tentatives de `page.goto()` répétés (navigation "dure", rechargement complet à chaque fois) dans le même script Playwright ont provoqué des fermetures intempestives du navigateur Chromium dans cet environnement sandboxé (aucune erreur JS applicative capturée, le processus navigateur se ferme brutalement) — instabilité de l'outillage de test dans ce conteneur, pas un bug de l'application. Contournée en testant la navigation via de vrais clics in-app (`.click()`) et l'API navigateur réelle (`goBack()`/`goForward()`/`reload()`), qui elles se sont montrées parfaitement stables sur l'ensemble du parcours — cohérent avec le fait qu'une vraie navigation utilisateur en SPA (wouter) ne déclenche pas de rechargement complet à chaque clic.

**Statut LOT 3 : ✅ TERMINÉ** — un lien mort trouvé et corrigé (`/iso/qualification`), zéro 404 constaté sur l'ensemble du parcours réel testé (menu, retour/avance navigateur, F5 sur route profonde).

---

## Récapitulatif avant déploiement groupé (LOT 1 + 2 + 3)

Comme convenu, LOT 1, LOT 2 et LOT 3 seront déployés ensemble pour un test en conditions réelles avant d'attaquer le LOT 4 (rapports Excel/PDF, le plus volumineux).

**Commits `Backend---QARA` (branche `claude/qara-backend-test-inventaire`, issue de `qitbxl`)** :
- LOT 1 : `0b1ddc5e` (résolution ISO par code + fix critique `iso.listAudits`)
- LOT 2 : `8ae5db21` (recherche "Mes audits")
- (+ commits antérieurs de la session précédente : `findings`/`actions`/`contact`/`documents` routers, export Excel/PDF, `auditType`/`conformityRate`, persistance onboarding — voir historique complet du fichier `INVENTAIRE-BUGS.md`)

**Commits `Frontend---QARA` (branche `claude/qara-frontend-test-inventaire`, issue de `bo77ju`)** :
- LOT 1 : `4e4c5c9` (résolution ISO par code, wizard + rapport)
- LOT 3 : route `/iso/qualification` ajoutée (commit à suivre)

Rien n'a été mergé ni déployé — en attente de votre feu vert.
