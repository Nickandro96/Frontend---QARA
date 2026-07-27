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

---

# PHASE 2 — LOT 5 (bugs constatés en production) + LOT 4 (rapports)

Nouvelle phase (démarrée 2026-07-21), faisant suite au déploiement réel des LOT 1-3 (mergés via PR sur `main`/`claude/qara-compliance-audit-qitbxl`, confirmé). Topologie de production confirmée pour cette phase : frontend → branche `main` (Vercel `frontend-qara.vercel.app`), backend → branche `claude/qara-compliance-audit-qitbxl` (Railway `backend-qara-new-claude`).

**Branches de travail** (issues des branches de production, comme demandé) :
- `Backend---QARA` : `claude/qara-backend-lot5-bugs-production` (issue de `claude/qara-compliance-audit-qitbxl`)
- `Frontend---QARA` : `claude/qara-frontend-lot5-bugs-production` (issue de `main`)

## LOT 5 — Bugs constatés en production — ✅ TERMINÉ

### BUG 1 + BUG 2 — Page détail d'audit (`/audits/:id`)

**Cause racine commune** : `audit.getById` (backend) renvoyait la ligne brute de la table `audits` — aucune jointure. Trois champs lus par `AuditDetail.tsx` (`siteName`, `referentialNames`, `auditors`) n'existaient donc jamais dans la réponse, d'où "Non spécifié" systématique (BUG 2) — ce n'était ni un défaut de saisie, ni un résidu de l'ancien schéma d'ID, mais une page qui attendait des champs jamais fournis.

**BUG 1** : en plus de l'absence de ces champs, `AuditDetail.tsx` comparait `audit.status === 'Completed'` (PascalCase) alors que la vraie valeur backend est `completed` (minuscule, voir l'enum `draft/planned/in_progress/completed/closed/cancelled` de `drizzle/schema.ts`) — le bouton "Générer Rapport" ne s'affichait donc **jamais**, même sur un audit réellement terminé. Aucun bouton de reprise n'existait par ailleurs sur cette page.

**Corrections** :
- Backend (`audit-router.ts`, commit `bed6d656`) : `getById` enrichi avec `siteName` (jointure `sites`), `referentialNames` (résolu par `code`, jamais par ID), `auditors` (alias de `auditorName`).
- Frontend (`AuditDetail.tsx`, commit `e8b3042`) : bouton "Reprendre l'audit" ajouté (même résolution par code que `AuditHistory.tsx`), toutes les comparaisons de statut corrigées vers les vraies valeurs de l'enum.
- Trouvé au passage (même fichier) : `finding.criticality` comparé à des libellés français (`Critique`/`Majeure`/...) jamais mappés depuis les vraies valeurs anglaises (`critical`/`high`/...) — compteurs "NC Critiques"/"NC Majeures" toujours à 0. Corrigé dans `findings-router.ts` (`CRITICALITY_MAP`). Le statut "Overdue" des actions n'existe pas non plus en base (enum réel : `open`/`in_progress`/`closed`) — dérivé désormais de `dueDate` côté frontend plutôt que comparé à une valeur qui n'arrive jamais.

**Preuves (Playwright, chemin réel sidebar → Audits → clic "Voir")** :
- Audit marqué `completed` (test) : "Terminé" affiché, bouton "Générer Rapport" visible, Auditeur(s)/Site/Référentiel(s) affichent les vraies valeurs ("Testeur QA" / "Site Test" / "Règlement (UE) 2017/745 (MDR)").
- Audit ISO `in_progress` : bouton "Reprendre l'audit" visible, clic navigue réellement vers `/iso/audit/:id`.

**Harmonisation** (demandée) : `AuditsList.tsx` (`/audits`, table filtrable, action "Voir" → détail) et `AuditHistory.tsx` (`/audit-history`, cartes avec actions rapides "Reprendre"/"Supprimer" inline) servent des usages différents et non redondants — la première pour parcourir/filtrer, la seconde pour agir vite sur un audit connu. Pas de fusion recommandée ; les deux pointent maintenant vers des actions toutes fonctionnelles.

### BUG 3 (GRAVE) — Fausse page "Plan d'action" — ✅ CORRIGÉ

`ActionDashboard.tsx` (monté sur `/action-plan`) était en réalité une ancienne page d'accueil résiduelle : clés i18n jamais définies (`home.welcome`, `home.getStarted.title`, etc. — un `home.*` existe bien dans `locales/fr.json` mais avec d'autres sous-clés, pour la Landing page) affichées littéralement car `t(cléAbsente) || "fallback"` ne fonctionne jamais avec i18next (une clé manquante renvoie la clé elle-même, une chaîne non-vide) ; données entièrement inventées présentées comme réelles (72%, "3 écarts critiques", "il y a 2 jours", activités fictives) — violation directe de la règle "aucune donnée inventée", que le code lui-même admettait en commentaire ("Données de démonstration - à remplacer par des données réelles via tRPC").

**Corrigé** : nouvelle procédure `actions.listMine` (commit backend `4e298dfc`) agrégeant les actions de TOUS les audits de l'utilisateur (contrairement à `actions.list`, scopé à un seul audit). `ActionDashboard.tsx` entièrement réécrit (commit frontend `f6bc927`) : statistiques réelles (total/terminées/en retard), liste des actions réelles avec lien vers l'audit d'origine, état vide honnête ("Aucune action pour le moment — les actions issues de vos audits apparaîtront ici" + bouton vers `/audits`). Pas de réintroduction d'i18n cassé — cohérent avec le reste du dépôt (`AuditDetail.tsx`, `AuditHistory.tsx`, `AuditsList.tsx` n'utilisent pas non plus i18n pour leur contenu).

**Preuves (Playwright, sidebar → "Plan d'action")** :
- État vide (aucune action) : message honnête, zéro chiffre inventé, zéro clé i18n visible.
- État peuplé (action de test insérée, échéance passée) : "Total des actions: 1", "En retard: 1" (calculé réellement depuis `dueDate`), badge "En retard", audit d'origine affiché, clic "Voir l'audit" navigue vers `/audits/1`.

### Trouvaille annexe — `siteName` manquant sur `/audits` (liste)

Même famille de cause que BUG 2, trouvée en testant `AuditsList.tsx` : `audit.list`/`listAudits` ne renvoyaient pas non plus `siteName` — "Non spécifié" pour des audits ayant un vrai site. Corrigé (commit `d65ccca7`) par une jointure batch (pas de N+1) dans `enrichWithDisplayFields`, partagée par `list` et `listAudits`.

### Balayage systématique — tableau récapitulatif

| Page | Anomalie | Gravité | Cause | Fichier(s) | Statut |
|---|---|---|---|---|---|
| `/audits/:id` | Pas de bouton reprise ; rapport jamais affiché même terminé | Bloquant | Comparaison de statut PascalCase vs vraie valeur minuscule | `AuditDetail.tsx`, `audit-router.ts` | ✅ Corrigé |
| `/audits/:id` | "Non spécifié" (site/référentiel/auditeur) | Majeur | Champs jamais renvoyés par `getById` | `audit-router.ts` | ✅ Corrigé |
| `/audits/:id` | Compteurs NC Critiques/Majeures toujours à 0 | Mineur | `criticality` anglais vs comparaison française jamais mappée | `findings-router.ts` | ✅ Corrigé |
| `/audits/:id` | Badge "En retard" jamais affiché sur une action | Mineur | Statut "Overdue" inexistant en base | `AuditDetail.tsx` | ✅ Corrigé |
| `/action-plan` | Page legacy Home avec données 100% inventées + clés i18n visibles | **Grave** | Mauvais composant monté sur la route, jamais remplacé | `ActionDashboard.tsx`, nouveau `actions.listMine` | ✅ Corrigé |
| `/audits` (liste) | "Site : Non spécifié" | Mineur | Même cause que BUG 2, endpoint différent | `audit-router.ts` | ✅ Corrigé |
| `/audits`, `/audit-history` | Actions différentes entre les deux pages | Dette (signalée) | Deux pages avec des usages différents (liste filtrable vs actions rapides) | — | Signalé, pas de fusion recommandée |
| Ensemble du frontend | Recherche exhaustive d'autres clés i18n non résolues (`t(x) \|\| fallback`) | — | Recherche menée sur tous les fichiers | — | Aucune autre occurrence trouvée sur du code réellement routé (seules `ProfessionalSidebar.tsx`/`ProfessionalLayout.tsx`/`ModernSidebar.tsx`, déjà connus morts, en contiennent) |
| `Dashboard.tsx`, autres pages sidebar (Classification, Voies FDA, Rapports, Veille, Compte) | Recherche de données inventées | — | Vérifié en direct (Playwright, contenu réel affiché) | — | Aucune donnée inventée trouvée ; `Dashboard.tsx` utilise déjà correctement `// TODO(data)` pour les 3 indicateurs non encore branchés (préexistant, conforme à la règle) |

**Statut LOT 5 : ✅ TERMINÉ.**

---

## LOT 4 — Rapports Excel/PDF

### D.0 — État des lieux (fait avant tout code, voir réponse dédiée à l'utilisateur)

Deux systèmes non unifiés trouvés : `reports.generate` (backend, PDFKit + S3 + persistance DB) et `Reports.tsx`/`exportUtils.ts` (frontend, export 100% navigateur, aucune persistance). Décision validée par l'utilisateur : unifier sur le système backend, `exceljs` (déjà installé, inutilisé côté serveur) pour l'export Excel serveur, garder `Reports.tsx`/`exportUtils.ts` en repli tant que le nouveau système n'est pas déployé et validé.

### Correction préalable obligatoire (demandée avant toute construction) — ✅ TERMINÉE

`fetchAuditData()`/`calculateReportMetadata()` (`report-generator.ts`) contenaient une chaîne de **9 bugs empilés**, chacun masquant le suivant, qui vidait le contenu réel des rapports sans jamais faire planter la génération (d'où le faux sentiment de succès lors d'un test antérieur — 8 pages produites, jamais vérifiées). Détail complet, testé et prouvé par extraction du texte réel du PDF après chaque correctif (`pdftotext`) : voir commit `Backend---QARA` `7e2a0369`. Résumé :

1. Jointure réponses↔questions sur `questionId` (jamais renseigné pour MDR/ISO) → corrigé sur `questionKey` (universel, 473/473 questions).
2. Filtre par `userId` seul (pas `auditId`) → mélangeait les réponses de tous les audits d'un utilisateur → corrigé.
3. `evidenceFiles.questionId` (colonne inexistante) → SQL invalide, crash → corrigé sur `questionKey`.
4. `action.title`/`responsibleName`/`priority` (colonnes inexistantes) → crash → alias posés, priorité dérivée de la sévérité réelle du constat.
5. `finding.findingType`/`findingCode`/`clause`/`criticality` (colonnes inexistantes) → "Criticité : undefined" littéral → alias posés.
6. `r.response.status` (colonne inexistante, vraie colonne `responseValue`) comparé à des valeurs françaises jamais réelles → "Taux de conformité global : 0.0%" systématique → corrigé.
7. Écart de score entre le rapport (75.8%, recalcul local) et le dashboard (80.6%, `computeGenericAuditStats`) pour le même audit → unifié sur la fonction du dashboard, plus de divergence.
8. "Marché cible"/"Rôle(s) réglementaire(s)" en dur pour tous les audits (violation de la règle "aucune donnée inventée") → lus depuis `audit.economicRole(s)`/`markets` réels.
9. `audit.auditType` (colonne inexistante, vraie colonne `type`) → "Type d'audit : N/A" partout → corrigé.

**Preuve par le contenu, sur l'audit réel #1** (62 réponses réelles) : section "Résultats détaillés" affiche les vraies questions MDR, vrais processus, vraie criticité (high/medium/low), statut "✓ OK" sur les réponses réellement "compliant" — plus aucun "N/A". Score : "80.6%", identique au dashboard. Testé sur `reportType="complete"` et `"executive"`.

### Prochaines étapes (D.1-D.5, construction après validation de ce correctif)
- Logo QARA (en-tête) + logo client (profil organisation) en placeholders configurables, dégradation propre si absents.
- i18n réel fr/en (actuellement tout en dur en français, `language` accepté mais jamais utilisé).
- Export Excel serveur (`exceljs`, déjà installé).
- Restructuration des sections PDF pour coller exactement à D.2 (page de garde, synthèse, résultats par processus avec visuel, registre des écarts, plan CAPA, conclusion, annexes).
- Points d'entrée cohérents (page détail audit, liste des audits, page Rapports) + gating plan déjà en place à réutiliser.

---

# PHASE 3 — Audit colonnes fantômes (Tâche C) + Rapport niveau organisme notifié (D) + CAPA (E)

Nouvelle phase (démarrée 2026-07-23), poursuivie sur les mêmes branches `claude/qara-backend-lot4-rapports` / `claude/qara-frontend-lot4-rapports` (continuité directe avec la correction des 9 bugs du générateur de rapport).

## Tâche C — Audit systématique des colonnes/valeurs fantômes — ✅ AUDIT TERMINÉ, correctifs sûrs appliqués

### Méthode
1. Extraction programmatique de toutes les tables Drizzle (`drizzle/schema.ts`) et de leurs colonnes réelles (28 tables).
2. Cross-référencement automatique de tout `variableDeTable.propriété` dans `server/**/*.ts` contre la liste réelle de colonnes par table (alias résolus : `auditResponses`→`audit_responses`, `evidenceFiles`→`mdr_evidence_files`, `referentials`→`referentiels`, etc.).
3. Recherche des comparaisons de valeurs (`.status === "X"`, `.severity === "Y"`...) contre les vraies valeurs d'enum définies dans le schéma (`mysqlEnum`) et les valeurs réellement présentes en base (`INFORMATION_SCHEMA`/`SELECT DISTINCT`).
4. Vérification systématique, pour chaque bug trouvé, si le chemin de code est réellement atteignable par un utilisateur (routé côté frontend) ou mort.

### Tableau des colonnes/valeurs fantômes trouvées

| Fichier | Ligne | Colonne/valeur fantôme | Colonne/valeur réelle | Impact utilisateur | Gravité | Statut |
|---|---|---|---|---|---|---|
| `server/routers.ts` (`reports.generate`) | ~1041 | `auditReports.reportType`/`reportTitle`/`reportVersion`/`fileKey`/`fileFormat`/`generatedBy`/`metadata` (n'existent pas) | Table réelle : `id`/`userId`/`auditId`/`reportUrl`/`createdAt` uniquement | **Réel et vérifié** : `reportUrl` (l'URL du fichier) jamais enregistré — historique des rapports irrécupérable, confirmé sur 6 rapports réels générés (`reportUrl=NULL` systématique) | **Majeur** | ✅ Corrigé (commit `968b0d3a`) |
| `server/routers.ts` (`reports.list`) | ~1091 | `auditReports.generatedAt` (n'existe pas) | `createdAt` | Tri de l'historique cassé (aurait probablement levé une erreur SQL dès qu'un utilisateur aurait consulté `/reports/history` avec des rapports en base) | Majeur | ✅ Corrigé |
| `server/db-dashboard-v2.ts` (`getDashboardDrilldown`) | 714, 717, 723, 799 | `findings.processId`, `findings.criticality` (réel: `severity`), `findings.findingType`, `actions.priority` — aucune n'existe | `findings`: title/description/severity/status/auditId/userId/id ; `actions`: actionCode/description/responsible/dueDate/status/findingId/id | **Aucun** — confirmé mort : `DashboardV2.tsx` (le seul appelant) n'est routé nulle part dans `App.tsx` (`/dashboard-v2` redirige vers `/dashboard`, un composant différent) | Mineur (dette, code mort) | Signalé, non corrigé (voir décision à prendre ci-dessous) |
| `server/db-dashboard-v2.ts` (`getDashboardSummary`) | 208-222 | `actions.status === "verified"/"completed"/"cancelled"` (vraies valeurs : `open`/`in_progress`/`closed` uniquement, voir `mysqlEnum` du schéma) | — | **Aucun** — même chemin mort que ci-dessus | Mineur (dette, code mort) | Signalé, non corrigé |
| `drizzle/schema.ts` / `server/capa/*` | — | Aucune colonne fantôme — module `capa_actions`/`capa_action_history` et `capaRouter` (`generateFromAudit`/`list`/`update`/`updateStatus`/`history`) **entièrement corrects et fonctionnels**, monté dans `appRouter` (`capa: capaRouter`) | — | **Majeur, à l'envers** : recherche exhaustive confirme **zéro appel `trpc.capa.*` dans tout le frontend** — module backend sophistiqué (root cause analysis, vérification d'efficacité, historique de traçabilité, gradation par gravité) jamais relié à aucune interface. C'est la cause du symptôme "les onglets CAPA n'affichent rien" (Tâche E) | **Majeur** | Diagnostic terminé (voir Tâche E) |
| `server/mdr-router.ts`, `server/iso-router.ts`, `server/fda-router.ts`, `server/watch-router.ts`, `server/classification-router.ts`, `server/onboarding/onboardingRouter.ts`, `server/scoring/*.ts` | — | Recherche exhaustive (même méthode) | — | Aucune colonne/valeur fantôme trouvée | — | ✅ Modules propres (déjà assainis lors des lots précédents de cette phase) |

### Décision utilisateur (tranchée) + correction supplémentaire découverte en l'appliquant
Décision : supprimer le code mort (`DashboardV2.tsx`, `DashboardExecutive.tsx`, `DrilldownModal.tsx`, `FilterPanel.tsx`) plutôt que le corriger-et-garder.

En l'appliquant, un **second bug à impact réel** est apparu : `dashboard.getKPIs` et `dashboard.getRecentFindings` — les procédures réellement appelées par le vrai `Dashboard.tsx` (routé sur `/dashboard`) via une « compatibility layer » — passent en fait par les mêmes fonctions `db-dashboard-v2.ts` que `DashboardV2.tsx`. Elles contenaient les mêmes colonnes fantômes (`finding.criticality` réel : `severity` ; `finding.findingType` inexistant ; `finding.processId` inexistant ; `action.status === "completed"/"verified"/"cancelled"` alors que l'enum réel n'a que `open`/`in_progress`/`closed` ; `action.completedAt` inexistant). **Conséquence réelle vérifiée** : le compteur « Écarts ouverts » du tableau de bord de production affichait toujours 0, quel que soit le nombre réel de non-conformités.

Corrections apportées (`server/db-dashboard-v2.ts`, commit `f6934a8b`) :
- `finding.severity` (colonne réelle) remplace `finding.criticality`.
- Mapping severity→type extrait dans `audit-scoring.ts` (`mapSeverityToFindingType`/`FINDING_TYPE_BY_SEVERITY`, exporté) et réutilisé à la fois par `db-dashboard-v2.ts` et `report-generator.ts` (qui avait le même mapping dupliqué en local) — une seule source de vérité, comme pour le score.
- `action.status` comparé contre l'enum réel (`open`/`in_progress`/`closed`).
- `averageClosureTime` approximé via `updatedAt` sur les actions closes (seule donnée réelle disponible — `completedAt` n'existe pas — jamais de valeur inventée).
- `getDashboardDrilldown` réduit à sa seule branche `"findings"` réellement utilisée par `getRecentFindings` (les branches `"actions"`/`"audits"` n'étaient atteignables que par la procédure directe `getDrilldown`, supprimée avec `DrilldownModal.tsx`).
- Procédures tRPC supprimées (dead, uniquement appelées par les composants supprimés) : `getStats` (directe), `getTimeseries`, `getRadar` (directe), `getDrilldown` (directe), `getScoring`, `getSuggestions`, `getScoreTrend`, `getProcessProgress`, `getSummary`, `getFunnel`, `getHeatmap`. Conservées : `getKPIs`, `getRecentFindings` (les deux réellement utilisées par `Dashboard.tsx`).

**Preuve (contenu vérifié, audit réel id=1, finding réel `severity="high"`, `status="open"`)** : test Playwright réel (connexion → `/dashboard`) — avant le fix, « Écarts ouverts » affichait 0 ; après, affiche **1**. Le widget « Constats récents » affiche désormais la vraie criticité (« high ») au lieu d'un champ vide.

**Statut Tâche C : ✅ TERMINÉE (avec un correctif live supplémentaire trouvé en cours de nettoyage).** Deux bugs à impact réel trouvés et corrigés : `audit_reports` (reportUrl jamais persisté) et `db-dashboard-v2.ts` (compteur d'écarts toujours à 0 sur le dashboard réel). Le reste du périmètre demandé (veille, classification, FDA, CAPA, onboarding) est propre.

## Tâche E — Module CAPA (« les onglets CAPA n'affichent rien ») — ✅ FRONTEND CONSTRUIT ET TESTÉ

### Diagnostic
Le backend CAPA (`server/capa/capaRouter.ts` + `capaEngine.ts` + tables `capa_actions`/`capa_action_history`) est complet, correct et déjà monté (`capa: capaRouter` dans `appRouter`) — cycle de vie ISO 13485 §8.5.2 respecté (statuts `ouverte→en_cours→a_verifier→cloturee_efficace/inefficace/sans_suite`, cause racine obligatoire avant passage en cours pour un écart majeur, preuve de réalisation obligatoire avant vérification, preuve d'efficacité obligatoire avant clôture). **Aucune page frontend n'appelait `trpc.capa.*` nulle part** (recherche exhaustive `grep -rln "trpc\.capa\." client/src` → vide). C'est la cause exacte du symptôme signalé : le module n'a jamais été construit côté interface, ce n'est ni un manque de données ni des colonnes fantômes.

### Construction
- `client/src/pages/CapaPlan.tsx` (nouveau) : page `/audits/:id/capa`. Liste les actions CAPA réelles (`trpc.capa.list`), bouton « Générer depuis les écarts » (`trpc.capa.generateFromAudit`), fiches éditables (cause racine, action retenue, responsable, échéance, preuve de réalisation, preuve d'efficacité) via `trpc.capa.update`, boutons de transition de statut (`trpc.capa.updateStatus`) avec pré-validation côté client miroir des règles serveur. État vide honnête (« Aucune action pour le moment... »), aucune donnée de démonstration. Cartes de stats (Total/Clôturées/En retard) affichées seulement si la liste n'est pas vide.
- `client/src/App.tsx` : route `/audits/:id/capa` enregistrée avant `/audits/:id` (spécificité wouter).
- `client/src/pages/AuditDetail.tsx` : bouton « Plan d'action CAPA complet » ajouté dans l'en-tête de la carte « Plan d'Actions », lien vers `/audits/{id}/capa`.

### Preuve (contenu vérifié, pas seulement génération)
Test Playwright réel (navigation in-app, pas de rechargement complet) sur l'audit MDR réel id=1 :
1. Navigation sidebar → Audits → « Voir » → AuditDetail → « Plan d'action CAPA complet » → page CAPA : état vide correct au départ.
2. Clic « Générer depuis les écarts » → **4 actions CAPA réelles créées**, avec données réelles issues du moteur de scoring : gravité « Mineure », référentiel « MDR », processus « Documentation technique », statut « Ouverte », énoncé d'écart citant la vraie réponse `non_compliant` et le texte réel du corpus, action recommandée pré-remplie dérivée de `auditVerifies`/`expectedEvidence`. Zéro erreur JS.
3. Saisie d'une analyse de cause racine réelle (« 5 pourquoi : absence de revue périodique... ») puis clic sur la transition « → En cours » → statut « En cours » confirmé affiché après la mutation. Zéro erreur JS.

**Statut Tâche E (frontend) : ✅ CONSTRUIT ET PROUVÉ.** Reste à faire (voir tâche D) : rebrancher la Section 6 du rapport (Plan d'action/CAPA) sur la vraie table `capa_actions` au lieu des tables `findings`/`actions` simplifiées, pour la cohérence totale exigée entre module CAPA et rapport.

## Tâche D.7 — Champs manquants du wizard — ✅ VALIDÉ ET IMPLÉMENTÉ

Liste proposée le 2026-07-23, validée intégralement par l'utilisateur, sans retour champ par champ. Décisions de collecte confirmées : section éditable post-création sur `AuditDetail` (pas dans le wizard de création), bloc « Profil réglementaire » sur la page Profil existante (pas de nouvelle page), migration additive (backend, commit `dc8dfb1a`, `drizzle/migrations/0027_report_spec_fields.sql`).

### Implémenté
- **Organisation** (`organisations` + nouvelle table `organisation_certificates`) : `srn`, `logoUrl`, `prrcName`, `prrcQualification`, `notifiedBodyName`, `notifiedBodyNumber`, certificats (référentiel/numéro/dates). UI : bloc « Profil réglementaire » sur `/account` (`Profile.tsx`), création d'organisation si aucune n'existe, édition + gestion des certificats.
- **Audit** (`audits`) : `auditNature`, `auditTeam`, `auditeesRepresentatives`, `scopeExclusions`. UI : carte « Informations d'audit » sur `AuditDetail.tsx`, éditable à tout moment, endpoint dédié `audit.updateReportFields` (n'écrit que les champs fournis).
- **CAPA** (`capa_actions`) : `rootCauseMethod` (5 pourquoi/Ishikawa/autre), `mdsapGrade` + `mdsapEscalation` (affichés uniquement quand `referentialCode === "MDSAP"`, conformément à la spec). UI : champs ajoutés dans `CapaPlan.tsx` (`ActionCard`).
- **Rapport** (`audit_reports`) : `reference`, `version`, `status` (draft/final), `distributionList`, `language` — colonnes prêtes, alimentées au moment de la génération de rapport (voir Tâche D, restructuration à venir).
- **Non implémenté dans cette passe** : `plannedAgenda`/`actualAgenda` (colonnes créées en base, aucune UI construite pour l'instant — pas de données fabriquées en attendant, le rapport affichera "Non renseigné").

### Trouvaille annexe (signalée, non corrigée)
En construisant `audit.updateReportFields`, la mutation existante `audits.update` (routeur `audits` au pluriel, distinct du routeur `audit` singulier utilisé par `AuditDetail.tsx`) s'est révélée accepter 11 champs qui ne correspondent à aucune colonne réelle de la table `audits` (`auditObjective`, `auditScope`, `auditCriteria`, `auditProgramRef`, `auditMethod`, `auditLanguage`, `auditeeContactName/Email/Phone`, `auditors`, `observers`, `auditType`) — `db.updateAudit()` utilise `.set(patch as any)`, qui filtre silencieusement les clés inconnues du schéma Drizzle, sans erreur. Non corrigé (périmètre plus large que la liste validée, impliquerait de revoir le wizard qui appelle cette mutation) — à traiter séparément si souhaité.

### Preuve (contenu vérifié, tests Playwright réels)
- `AuditDetail.tsx` (audit réel id=1) : sélection « Revue de conformité », saisie d'une exclusion de périmètre réelle, ajout d'un membre d'équipe (« Marie Dupont ») → enregistrement → **rechargement complet de la page** → les trois valeurs sont bien affichées après reload. Zéro erreur JS.
- `Profile.tsx` : création d'une organisation réelle, saisie PRRC (nom + qualification réels), ajout d'un certificat réel (référentiel + numéro) → **rechargement complet** → PRRC et certificat (nouveau + existant) tous persistés. Zéro erreur JS.
- `CapaPlan.tsx` : champ « Méthode de cause racine » visible et fonctionnel ; champs MDSAP (`mdsapGrade`/`mdsapEscalation`) correctement **absents** pour une action au référentiel MDR (comportement conditionnel vérifié) ; valeur précédemment enregistrée via l'API (`rootCauseMethod: "5_pourquoi"`) correctement pré-affichée dans le select au chargement de la page.

**Statut Tâche D.7 : ✅ TERMINÉE.**

## Incident déploiement — migration 0027 bloquée par 0026 non baselinée (2026-07-23)

### Symptôme
En tentant d'appliquer la migration 0027 en production, `scripts/apply-sql-migrations.ts` a échoué sur 0026_mandatory_documents.sql : `ER_FK_DUP_NAME` (errno 1826) — `Duplicate foreign key constraint name 'user_document_status_userId_users_id_fk'`. Les tables/contraintes de 0026 existaient déjà en base (créées par un mécanisme distinct — le pipeline de déploiement Railway), mais son hash n'était pas enregistré dans `_drizzle_migrations` (le journal du script). 0023/0024/0025 étaient passées, 0027 n'avait pas tourné.

### Cause racine
**Deux mécanismes de migration concurrents, avec deux journaux distincts** :
1. `scripts/apply-sql-migrations.ts` (`npm run release`) — rejoue les fichiers `drizzle/migrations/*.sql` un par un, suivi par une table maison `_drizzle_migrations` (hash SHA-256 du contenu du fichier).
2. Le pipeline Railway — a créé les mêmes tables/contraintes par un autre chemin (probablement `drizzle-kit push`, exécuté manuellement ou via une étape de build/release configurée dans Railway, invisible depuis ce dépôt), sans jamais écrire dans `_drizzle_migrations`.

Résultat : la base de production peut être en avance sur ce que `_drizzle_migrations` sait, et `apply-sql-migrations.ts` retente alors des `CREATE TABLE`/`ADD CONSTRAINT` déjà faits — échec si le code d'erreur retourné n'est pas dans la liste tolérée.

### Corrections appliquées
1. **`scripts/apply-sql-migrations.ts`** : `isIgnorableMigrationError` tolère désormais `ER_FK_DUP_NAME` (1826), en plus de `ER_DUP_FIELDNAME` (1060) et `ER_DUP_KEYNAME` (1061) déjà couverts — vérifiés par code symbolique ET par errno numérique (défense en profondeur si un driver ne renseigne que l'un des deux).
2. **`drizzle/migrations/0026_mandatory_documents.sql`** rendu réellement idempotent : les 4 `ALTER TABLE ... ADD CONSTRAINT` sont désormais gardés par une vérification `information_schema.TABLE_CONSTRAINTS` (via `PREPARE`/`EXECUTE` dynamique) avant exécution — testé : MariaDB 10.11 ne supporte **pas** `ADD CONSTRAINT IF NOT EXISTS ... FOREIGN KEY` (erreur de syntaxe 1064, vérifié en local), d'où le recours au SQL dynamique plutôt qu'une syntaxe native.

### Preuve (incident reproduit et résolu en local)
1. Repro de l'incident : hash de l'ancien 0026 supprimé de `_drizzle_migrations` local (où les 4 contraintes existaient déjà, comme en prod) → confirmé que l'ancien script + l'ancien 0026 auraient échoué sur ce même type de conflit.
2. Avec les deux corrections : `npm run release` (variante locale sans SSL, MariaDB local n'en a pas besoin) → **`✅ Applied: 0026_mandatory_documents.sql`**, puis 0027 correctement baselinée (déjà appliquée dans cette session). 30 lignes dans `_drizzle_migrations` après (28 avant + 0026 + 0027).

### Proposition d'unification des deux mécanismes (à valider par l'utilisateur — configuration Railway hors de ce dépôt)
Recommandation : **une seule source de vérité, `apply-sql-migrations.ts` + `_drizzle_migrations`**, pour les raisons suivantes : historique déjà établi (30 migrations tracées), rejoue des fichiers SQL explicites et lisibles (contrairement à `drizzle-kit push` qui diffuse un diff de schéma silencieux, sans fichier ni relecture possible), et déjà le mécanisme documenté dans le code (`docs/audit/02-audit-technique.md`).

Actions concrètes proposées :
1. **Identifier la source du second mécanisme** : vérifier dans le dashboard Railway (Service Backend → Settings → Deploy) s'il existe une « Release Command », un « Custom Build Command » ou une étape post-déploiement qui invoque `drizzle-kit push`/`drizzle-kit migrate` — je n'ai pas de visibilité sur cette configuration depuis le dépôt.
2. **Si trouvé, le retirer** et s'assurer que le déploiement Railway déclenche `npm run release` (déjà le script combiné migrations + import corpus) — idéalement via le champ « Release Command » natif de Railway (s'exécute une fois par déploiement, avant que les nouvelles instances ne reçoivent du trafic), plutôt qu'un lancement manuel ponctuel qui peut être oublié.
3. **`db:push` (`drizzle-kit push --force`)** : dangereux par nature (diff silencieux, `--force` sans confirmation, aucune trace dans un fichier de migration) — recommandation de le réserver strictement à un usage local de développement (jamais contre la base de production), avec un commentaire explicite dans `package.json` ou sa suppression pure si inutilisé.
4. `drizzle/meta/` (dossier de snapshots natif de `drizzle-kit generate`/`migrate`) n'existe pas dans ce dépôt — confirme que le mécanisme natif de drizzle-kit n'a jamais été utilisé de façon journalisée ici ; pas de réconciliation de journal nécessaire de ce côté, juste s'assurer qu'aucune commande `drizzle-kit push`/`migrate` n'est déclenchée en dehors de ce dépôt sans passer par `_drizzle_migrations`.

**Statut : ✅ Correctifs testés et committés localement (backend, branche `claude/qara-backend-lot4-rapports`). En attente de votre confirmation sur la sauvegarde production + la piste d'unification avant tout merge/déploiement.**

**Mise à jour : migration 0027 confirmée appliquée sur new-claude (turntable), secret DATABASE_URL corrigé, backend et frontend mergés et déployés en production (backend vérifié live avant le frontend). Feu vert donné pour enchaîner sur la Tâche D.**

---

# Tâche D — Rapport d'audit PDF/Word/Excel bilingue (D.1-D.6)

Nouveau pipeline de rapport (backend, branche `claude/qara-backend-lot4-rapports`), **séparé de l'ancien** (`server/report-generator.ts`, conservé en repli tant que le nouveau n'est pas validé) — même logique de dépréciation progressive que Reports.tsx/exportUtils.ts (D.0).

### Architecture
Un seul assembleur de données langue/format-agnostique (`server/report/reportData.ts`), consommé par trois renderers indépendants (`pdfRenderer.ts` / `wordRenderer.ts` / `excelRenderer.ts`) — garantit des **chiffres strictement identiques entre les trois formats**, condition explicitement exigée. `reportData.ts` réutilise :
- le moteur de scoring existant (`buildScoringResult`, déjà source unique de vérité du score, partagée avec le dashboard) ;
- le module CAPA (`capa_actions`) — le registre des écarts (section 5) et le plan CAPA (section 6) sont assemblés en **joignant chaque écart à sa fiche `capa_actions` par `questionKey`**, ce qui garantit la cohérence CAPA ↔ rapport exigée par la Tâche E ("ce qui est saisi dans CAPA alimente le rapport") ;
- le profil organisation (SRN/PRRC/organisme notifié/certificats, migration 0027) et les champs d'audit D.7 (nature d'audit/équipe/personnes rencontrées/exclusions de périmètre) ;
- une comparaison automatique avec l'audit précédent (même utilisateur, référentiels qui se recoupent) quand disponible.

### Structure couverte (D.2)
Page de garde (logos en emplacement configurable, référentiels, périmètre, dates, équipe, personnes rencontrées, référence/version/statut/date d'émission, emplacement signature) · Section 1 (objectifs/méthodologie/critères/déclaration d'échantillonnage ISO 19011/clause de confidentialité/exclusions) · Section 2 (rôle économique/marchés/PRRC/organisme notifié/certificats) · Section 3 (score global + méthode de calcul explicitée/répartition des réponses/écarts par criticité/verdict/comparaison audit précédent) · Section 4 (résultats par processus, tableau) · Section 5 (registre des écarts, fiche en 3 temps : Exigence/Preuve objective/Énoncé d'écart, référence unique `NC-{année}-{séquence}`, jamais scindée entre deux pages) · Section 6 (Plan CAPA lié à chaque écart : cause racine + méthode, action corrective, responsable, échéance, vérification d'efficacité, statut) · Section 7 (conclusion) · Section 8 (annexes : détail Q/R complet, index des preuves, personnes rencontrées, glossaire, historique des versions).

### Forme (D.3-D.4)
En-tête/pied de page sur chaque page (référence, version, confidentialité, "Page X sur Y") · dates ISO 8601 · métadonnées PDF (titre/auteur/date) · palette QARA (bleu nuit `#0e1c3d`, accent `#3b6fe0`, vert/orange/rouge pour la criticité) · tableaux avec en-têtes contrastés et alternance de lignes · sections vides toujours explicitement mentionnées ("Aucun écart...", jamais un blanc).

### Formats et langues (D.5-D.6)
PDF (PDFKit, document de référence) · Word (.docx, styles natifs, table des matières automatique, en-têtes/pieds de page avec pagination réelle) · Excel (.xlsx, 5 onglets : Synthèse/Détail Q-R/Registre écarts/Plan CAPA/Index des preuves, en-têtes figés, filtres automatiques, mise en forme conditionnelle sur la criticité). Dictionnaire complet fr/en (`server/report/i18n.ts`) — aucune chaîne de rapport en dur ailleurs ; les intitulés réglementaires (MDR, ISO 13485...) restent dans leur langue d'usage.

Nouvel endpoint : `reports.generateV2(auditId, format, language)` — upload S3 + persistance `audit_reports` (référence/version/statut/langue). L'ancien `reports.generate` reste disponible en repli.

### Bugs trouvés et corrigés en vérifiant le contenu réel (jamais la seule génération)
- Caractère `→` invisible/corrompu en PDF (police Helvetica par défaut de PDFKit, encodage WinAnsi sans ce glyphe, testé et confirmé) — remplacé par `->`.
- `auditNature` (valeur brute d'enum, ex. `"revue_conformite"`) affichée telle quelle même en version anglaise au lieu d'être traduite — ajout de `translateAuditNature` (i18n.ts), corrigé dans les trois formats.
- Placeholders `"?"` incohérents avec la règle "Non renseigné" sur les dates de certificats et la comparaison avec l'audit précédent (PDF et Word) — uniformisés.
- Titre de question dupliqué avec sa référence d'annexe/article quand le corpus les inclut déjà tous deux (ex. "Annexe II — Annexe II — documentation..." — le corpus stocke parfois la référence en préfixe du titre) — dédupliqué à l'affichage uniquement (`dedupeRequirementTitle`), aucune donnée supprimée ni inventée.
- **Erreur de branche de ma part** : le développement de la Tâche D a été fait par erreur directement sur `claude/qara-compliance-audit-qitbxl` (branche de production) au lieu de `claude/qara-backend-lot4-rapports`. Repéré avant tout push — commit déplacé sur la bonne branche (fast-forward), production réinitialisée sur son état réellement déployé (`git reset --hard origin/...`), aucune conséquence réelle.

### Preuve exigée (D.8) — contenu vérifié, pas seulement génération
6 fichiers générés sur l'audit MDR réel id=1 (3 formats × fr/en) via `reports.generateV2`, puis **extraits et lus** (`pdftotext` pour le PDF, dézippage + parsing XML pour le Word, `openpyxl` pour l'Excel) :
- **Mêmes chiffres dans les trois formats** : score global 68.0 %, répartition 47 conforme / 0 partiel / 15 non conforme / 0 N/A, écarts 0 majeure / 4 mineure / 0 observation.
- **4 écarts réels** (NC-2026-0001 à 0004) avec exigence réelle (article/annexe + intitulé du corpus), énoncé d'écart réel (dérivé des NC typiques du corpus), processus/site réels, statut réel.
- **Plan CAPA réellement lié** : les 4 actions CAPA apparaissent sous leur référence d'écart correspondante, avec la vraie action corrective du corpus ; l'action NC-2026-0001 affiche `rootCauseMethod = "5_pourquoi"`, valeur saisie précédemment via le module CAPA (Tâche E) — preuve directe de la cohérence CAPA ↔ rapport.
- **PRRC, organisme notifié, certificats réels** (Dr. Claire Martin, BSI Group n°2797, ISO13485/CERT-2025-9981) apparaissent correctement sur la page de garde/section 2, absents jusqu'à cette tâche.
- Champs non renseignés (marchés visés, containment, responsable CAPA, échéances) affichent honnêtement "Non renseigné"/"Not provided" dans les deux langues — jamais de valeur par défaut inventée.

### Limites connues de cette version (transparence, non bloquant)
- `plannedAgenda`/`actualAgenda` (D.7) : colonnes créées en base, aucune interface de saisie construite dans cette passe — la section annexe correspondante affiche honnêtement "Non renseigné".
- Section 6 : les champs "correction immédiate (containment)" et "critère de vérification" (distinct de la preuve elle-même) n'ont pas de colonne dédiée sur `capa_actions` — affichés "Non renseigné"/approximés par `preuveEfficacite` plutôt que fabriqués ; évolution possible du module CAPA si souhaité.
- Estimation de hauteur (plutôt que mesure exacte) pour éviter de scinder une fiche d'écart entre deux pages PDF — fiable dans les cas testés, pourrait théoriquement être pris en défaut par un écart au texte exceptionnellement long.
- Gradation MDSAP : champ et logique conditionnelle en place, non testés sur un audit utilisant réellement le référentiel MDSAP (aucun dans les données de test disponibles).

**Statut Tâche D : ✅ Livrable de preuve fourni (6 fichiers, contenu vérifié). Non mergé vers la branche de production — en attente de votre revue.**

---

# Tâche 1 — Corpus, rôles économiques, wizard d'audit générique (étapes A→D)

**Dernière mise à jour de cette section : 2026-07-27.** Une simple reprise "continue" sur une session neuve doit pouvoir repartir de ce seul état, sans autre contexte.

**Rappel IDs référentiels en production (new-claude), à ne jamais réinférer :** MDR 3, IVDR 4, FDA_QMSR 5, MDSAP 6, ISO13485 7, ISO14971 8, ISO9001 9. Jamais 1-7 (ça, c'est la numérotation du miroir local).

## Contexte et déclencheur

Test utilisateur en production : lancer un audit ISO 13485 depuis le dashboard retournait 0 question ; le wizard ISO n'offrait que 9001/13485 (pas ISO14971) ; les cartes IVDR/MDSAP menaient à une impasse (`/audits`, aucun wizard) ; le bouton générique "+ Nouvel audit" était câblé en dur vers `/mdr/audit`. Diagnostic complet demandé avant toute correction, puis architecture cible validée avant tout code, puis exécution étape par étape avec preuve à chaque palier — voir l'historique complet de la conversation pour le détail des échanges de validation.

## État exact au 2026-07-25

### Code (étapes A→D) — ✅ mergé sur les branches de production, déploiement non confirmé

| Étape | Contenu | SHA backend | SHA frontend |
|---|---|---|---|
| A | Extrait `resolveProcessDbIds` (résolution slug canonique → `processus.id` réel) de `mdr-router.ts` vers `server/shared/processResolution.ts`, module partagé. ISO le consomme désormais au lieu de `buildProcessCandidates`/`JSON_CONTAINS(applicableProcesses)` — colonne qui stocke des rôles économiques, jamais des noms de processus. Corrige le "0 question" ISO13485/9001/14971. | `f72b6f2a` | — |
| B | Supprime le code mort : `buildProcessCandidates`/`PROCESS_SLUG_TO_ISO_LABELS` (ISO), le repli JSON en cascade de `mdr-router.ts::getQuestionsForAudit` (fichiers JSON statiques introuvables sur disque, de toute façon), `loadQuestionsFromJson`/`loadQuestionsFromDb` devenues mortes. Côté frontend : supprime les deux wizards jamais routés `FDAAudit.tsx`/`ISOAudit.tsx`. | `f72b6f2a` (combiné à A) | `5b51f54` |
| — | Normalisation `economicRole` : migration additive `economicRoleSource` (0028) + script `scripts/normalize-economic-roles.mjs`, table de correspondance validée ligne par ligne par l'utilisateur (12 valeurs brutes → 4 rôles canoniques ou NULL/universel + tags `situationTags`). `server/onboarding/scopeEngine.ts` aligné sur cette même table. | `e959aecf` | — |
| C | Routeur d'audit générique : `audit.getQuestionsForAudit`/`audit.saveResponse` ajoutés à `audit-router.ts` (référentiel-agnostiques, réutilisent `getAuditContextInternal`/`fetchAuditScopedQuestions`/`computeGenericAuditStats`, déjà génériques). Donne à IVDR/MDSAP un backend d'audit complet pour la première fois. | `ab28433a` | — |
| D | `audit.create` accepte les slugs canoniques (pas seulement des ids numériques) pour `processIds`. Nouveau `GenericAuditWizard.tsx` (référentiel résolu par `?ref=<code>` via `trpc.referentials.list`, jamais d'ID en dur ; rôle économique toujours requis). Cartes dashboard IVDR/MDSAP pointent vers `/audit/generic?ref=IVDR`/`?ref=MDSAP` au lieu de `/audits`. | `cdd30f34` | `91d226f` |
| D (correctif post-test) | Retrait du repli "retry sans rôle si 0 résultat" dans `fetchAuditScopedQuestions` (et sa copie dans `mdr.getQuestionsForAudit`) : masquait un vrai 0 (rôle légitime sans contenu dans un référentiel mono-rôle) en servant tout le référentiel à n'importe quel rôle — sur-service découvert en testant IVDR/distributeur en conditions réelles. | `f7b13fb2` | — |

**Backend** : toutes ces commits sont mergées dans `claude/qara-compliance-audit-qitbxl`, HEAD `dd5d9f94` (vérifié par `git merge-base --is-ancestor`, pas supposé).
**Frontend** : mergées dans `main`, HEAD `deb1fed` (même vérification).

**✅ Déploiement Railway/Vercel : CONFIRMÉ DÉPLOYÉ EN PRODUCTION le 2026-07-27.** Statut mis à jour : non déployé au 2026-07-25 (voir historique ci-dessus, conservé pour traçabilité), puis confirmé déployé par l'utilisateur le 2026-07-27 — le code A→D (routeur d'audit générique, IVDR/MDSAP fonctionnels de bout en bout, module partagé `resolveProcessDbIds`) tourne réellement en production, pas seulement en local. Ceci couvre également le correctif de l'incident import-corpus (section dédiée ci-dessous), confirmé auto-réparé par le redéploiement lui-même. **Ce qui reste non déployé à ce stade est exclusivement le chantier "point d'entrée unique" décrit plus bas (branches poussées, pas mergées, en attente du feu vert utilisateur).**

### Migration de données (économique role) — ✅ exécutée et vérifiée en production new-claude

Exécutée par l'utilisateur directement dans l'éditeur SQL Railway (6 blocs fournis, un par un, COUNT vérifié après chacun) :
- `economicRoleSource` peuplée 473/473 (valeur brute préservée avant toute normalisation — réversible ligne par ligne sans restaurer la sauvegarde complète).
- `economicRole` normalisé : fabricant 330, mandataire 1, importateur 3, distributeur 2, NULL/universel 137.
- `situationTags` posés : `["assemblage"]` sur 12 lignes (ex-"assembleur", Art. 22(3) MDR), `["acces_marche_us"]` sur 2 lignes (ex-"U.S. agent", 21 CFR 807.40).
- Sauvegarde préalable prise par l'utilisateur : `qara_prod_avant_normalisation_roles_2026-07-25_111034.sql` (1,89 Mo).

Cette migration de données est indépendante du déploiement du code — elle est en base new-claude quel que soit l'état du déploiement Railway/Vercel du code A→D.

### Vérifications post-C effectuées

- Sur new-claude (par l'utilisateur, dans l'app réelle) : audit ISO en rôle distributeur → 137 questions servies ; audit MDR en rôle fabricant → 74 questions.
- Sur mon miroir local (`qara_qitbxl_local`, avant/après comparaison au niveau du code, git à l'appui) : socle historique de 62 questions MDR/fabricant préservé à l'identique (0 perte), score recalculé identique avant/après (80.6 %) sur l'audit MDR test réel.
- Étape D, testée en conditions réelles (Playwright, backend+frontend locaux, pas de simulation) : création d'un audit IVDR, 72 questions réelles affichées, réponse enregistrée, score 0 %→100 % recalculé en direct, persistance après rafraîchissement de page (correctif : l'auditId vit dans l'URL `?auditId=`, pas seulement en state React — sans ça, aucune route de reprise après un rafraîchissement).
- Filtre de rôle confirmé uniforme sur les 7 référentiels après le correctif du repli : IVDR/fabricant 72, IVDR/{distributeur,mandataire,importateur} 0 ; MDSAP/fabricant 74, MDSAP/{distributeur,mandataire,importateur} 0 ; MDR inchangé (74/2/1/3) sur ses 4 rôles.

## Incident — le pipeline de déploiement écrasait la normalisation des rôles (2026-07-25/26) — ✅ CLOS le 2026-07-26

**Cause :** `package.json` (`"release"`) exécute `import-corpus.mjs` à chaque déploiement Railway (convention release-phase). Ce script écrivait `economicRole` depuis la valeur brute du corpus (`row.economicRole || null`), écrasant silencieusement la normalisation en production à chaque redéploiement. Le bloc MDR faisait en plus un DELETE+INSERT inconditionnel à chaque run (pas seulement au premier import comme le commentaire l'affirmait), ce qui aurait remis `economicRoleSource`/`situationTags` à NULL (absents du payload d'INSERT).

**Correctif :** module partagé `scripts/economic-role-mapping.mjs` (table de correspondance validée + `resolveEconomicRole()`), consommé à la fois par `import-corpus.mjs` (écrit désormais `economicRole`/`economicRoleSource`/`situationTags` calculés à chaque import) et par `normalize-economic-roles.mjs` (refactoré pour importer la même table). Suppression du bloc DELETE+INSERT MDR (upsert par `questionKey` uniforme sur les 7 référentiels, comme les 6 autres). Retrait de `questionId` du payload d'écriture de `iso-router.ts`/`fda-router.ts::saveResponse` (jamais fiable après ré-import, `questionKey` est la seule clé stable).

**Preuve :** idempotence prouvée par 2 runs consécutifs identiques (état cible 330/137/3/2/1, `economicRoleSource` 473/473, tags 12+2) ; table `id↔questionKey` des 80 questions MDR comparée par `diff` sur deux runs post-correctif — 0 ligne de différence. Production confirmée par l'utilisateur après déploiement : redéploiement backend a lui-même re-normalisé la base à l'identique de la cible (330/137/3/2/1, IDs référentiels 3-9 conformes), sans intervention SQL manuelle supplémentaire.

**SHA (backend, mergés dans `qitbxl`) :** `88e8dfba` (mapping partagé), `17e078c2` (merge, + retrait `questionId`), `e456b665` (suppression DELETE+INSERT MDR), `13a16d8e` (retrait `questionId` iso/fda), `111c64ee` (merge final).

**Sauvegardes prises par l'utilisateur :** `qara_prod_avant_normalisation_roles_2026-07-25_111034.sql` (avant), `qara_prod_etat_sain_post_fix_import_2026-07-26.sql` (après, état sain confirmé).

**Comptage par référentiel en production (état sain, 473 questions) :** MDR 80, IVDR 72, FDA_QMSR 43, MDSAP 74, ISO13485 93, ISO14971 67, ISO9001 44.

**Dette explicitement différée (non bloquante, actée par l'utilisateur) :** conditionnement de l'import par hash du corpus (éviter de ré-écrire à chaque déploiement si le fichier corpus n'a pas changé) — pattern déjà utilisé pour `_drizzle_migrations`, non implémenté à ce jour.

## Point d'entrée unique "+ Nouvel audit" piloté par `referentiels` (2026-07-27)

**Déclencheur :** test visuel en production par l'utilisateur après le correctif ci-dessus — le backend sert les 7 référentiels mais l'UI n'en exposait que 3 (MDR direct, ISO9001/13485 via le wizard ISO) ; IVDR/MDSAP/FDA_QMSR/ISO14971 n'apparaissaient nulle part malgré un backend fonctionnel. Cause : `iso-router.ts` (`ISO_STANDARDS` ligne ~36 + `getStandards` ligne ~196) hardcodait la liste à `["ISO9001","ISO13485"]`, doublement — pas piloté par la table `referentiels`.

**Feu vert utilisateur** avec 3 précisions : migration `referentiels.enabled` explicitement signalée avant merge (ci-dessous), cartes de l'étape 0 groupées par `type`/triées par `id`/nom complet affiché, cartes mortes ISO14971 et FDA_QMSR repointées vers le générique sans toucher aux wizards dédiés MDR/ISO/FDA (plan E/F/H inchangé).

### ⚠️ Migration en attente de merge — à signaler avant tout merge de `claude/qara-backend-referentiels-enabled`

`drizzle/migrations/0029_referentiels_enabled.sql` : `ALTER TABLE referentiels ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT true;` — additive, `DEFAULT true` donc aucun référentiel existant n'est masqué. **Elle s'appliquera en production au prochain déploiement une fois cette branche mergée**, via le pipeline standard (`apply-sql-migrations.ts`, même mécanisme que les migrations précédentes). `referentials.list` sans argument garde son comportement actuel (non cassant) ; le filtre `enabled=true` ne s'applique qu'à l'appel `{ enabledOnly: true }` utilisé par l'étape 0 du wizard générique. Commit backend : `bc659177`, branche `claude/qara-backend-referentiels-enabled` (poussée, **pas mergée** — en attente du feu vert).

### Implémenté (frontend)

- `GenericAuditWizard.tsx` : étape 0 ajoutée — affichée uniquement quand l'URL n'a pas de `?ref=`. Interroge `referentials.list({ enabledOnly: true })` (nouvel appel, distinct de l'appel non filtré déjà utilisé pour résoudre le référentiel par code — celui-ci reste non filtré pour qu'un lien `?ref=` direct continue de fonctionner même sur un référentiel désactivé du sélecteur). Cartes groupées par `type` (Règlements/Programmes/Normes, dans cet ordre), triées par `id` au sein de chaque groupe, nom complet de la table affiché (pas seulement le code). Clic sur une carte → `/audit/generic?ref=<code>`.
- `Dashboard.tsx` : bouton "+ Nouvel audit" (header) et bouton "Lancer votre premier audit" → `/audit/generic` (au lieu de `/mdr/audit`). Carte FDA_QMSR → `/audit/generic?ref=FDA_QMSR` (au lieu de `/fda`, qui ne menait à aucun flux de création). Carte ISO14971 → `/audit/generic?ref=ISO14971` (au lieu de `/iso/audit`, qui ne supporte pas ce référentiel). Cartes MDR, ISO13485, ISO9001 inchangées (plan E/F/H).
- `AuditsList.tsx` : bouton "+ Nouvel Audit" (les 2 occurrences, liste pleine et état vide) → `/audit/generic`.
- `App.tsx` : redirections `/audit/new` et `/audit/create` → `/audit/generic` (au lieu de `/mdr/audit`).

Commit : `d1cb309` sur `claude/qara-frontend-generic-entrypoint` (issue de `main`, poussée, **pas mergée** — en attente du feu vert).

### Preuve (Playwright, backend+frontend+MariaDB locaux, aucune simulation)

Inscription d'un utilisateur de test + onboarding complet (MDR/fabricant/UE) → dashboard. Puis :
1. **Entrée sans `?ref=`** : clic sur "+ Nouvel audit" (header) → `/audit/generic` → étape 0 affichée avec 3 groupes (Règlements : MDR/IVDR/FDA_QMSR ; Programmes : MDSAP ; Normes : ISO13485/14971/9001), noms complets visibles, triés par id. Clic sur "Règlement (UE) 2017/746 (IVDR)" → `/audit/generic?ref=IVDR` → formulaire de création → audit créé → **72 questions réelles affichées** (conforme au comptage attendu fabricant/IVDR). Réponse "Conforme" enregistrée sur la 1ère question → score recalculé en direct (0 %→100 %, 1 seule question répondue).
2. **Entrée directe `?ref=MDSAP`** (simulant la carte dashboard) : formulaire → audit créé → **74 questions réelles affichées**.
3. **Entrée directe `?ref=ISO14971`** (ancienne impasse dashboard) : formulaire → audit créé → **67 questions réelles affichées** — confirme que l'ancienne carte morte mène désormais à un flux d'audit complet et fonctionnel.

### Fonctionnement exact — réponses précises pour la reprise (2026-07-27)

**Q1 — Le bouton propose-t-il bien les 7 référentiels activés, piloté par `referentiels` ?**
Oui, avec une précision sur la forme exacte du parcours (ce n'est pas un enchaînement séquentiel référentiel → rôle → processus → métadonnées en 4 écrans distincts, mais 2 écrans) :
- **Écran 1 (étape 0, nouveau)** : sélection du référentiel — cartes générées dynamiquement depuis `referentials.list({ enabledOnly: true })`, groupées par `type` (Règlements/Programmes/Normes), triées par `id`, nom complet de la table affiché. Aujourd'hui les 7 référentiels ont `enabled=true` (valeur par défaut de la migration), donc les 7 apparaissent. Si un référentiel est désactivé un jour (`enabled=false`), il disparaît de cet écran sans qu'aucun code ne soit à retoucher.
- **Écran 2 (formulaire de création, préexistant depuis l'étape D, inchangé par ce chantier)** : un seul formulaire réunissant nom de l'audit, site audité, **rôle économique (obligatoire)**, et processus (tous / sélection manuelle) — pas des écrans séparés. Bouton "Créer l'audit" envoie tout en un seul appel `audit.create`.
- Donc : référentiel piloté par table ✅, mais rôle+processus+métadonnées sont un seul écran, pas 3 étapes distinctes. Si une segmentation en étapes successives est voulue (façon onboarding), c'est un chantier de plus, non fait ici — dis-le si c'est ce que tu attendais.

**✅ Décision utilisateur (2026-07-27) : l'écran unique (référentiel, puis site+rôle+processus+nom en un seul écran) convient par défaut, on part là-dessus.** La segmentation écran par écran n'est pas demandée à ce stade — l'utilisateur confirmera en début de session suivante si elle en veut une malgré tout, mais l'hypothèse de travail par défaut est : **pas de segmentation à construire.**

**Q2 — Le rôle économique est-il bien transmis au filtre, sans réintroduire le défaut de l'ancien wizard ISO ?**
Oui, vérifié à deux niveaux, pas seulement supposé :
- **Frontend** : `GenericAuditWizard.tsx` bloque la création tant que `economicRole` n'est pas sélectionné (`isFormValid` inclut `!!economicRole` ; `handleCreate` revérifie et affiche une erreur explicite "Rôle économique requis" si vide) — contrairement à l'ancien `ISOAuditWizard.tsx` qui ne transmettait jamais `economicRole` du tout (`economicRoleSource` hardcodé à `null` côté `iso-router.ts`, defaut d'origine documenté dans la Tâche 1).
- **Backend + preuve empirique** : `economicRole` est envoyé tel quel à `audit.create`, stocké sur l'audit, puis utilisé par `getQuestionsForAudit`/`fetchAuditScopedQuestions` pour filtrer. Preuve déjà produite cette session (étape D + ce chantier) : IVDR/fabricant → 72 questions, IVDR/{distributeur, mandataire, importateur} → 0 ; MDSAP/fabricant → 74, autres rôles → 0. Si le rôle n'était pas transmis, ces audits recevraient tous le même total (comme le faisait l'ancien wizard ISO) — ce n'est pas le cas.

**Q3 — Ordre de déploiement backend/frontend, et vérifications post-merge.**
Testé empiriquement (pas supposé) : j'ai fait tourner temporairement le backend actuellement en production (commit `111c64ee`, celui qui n'a **pas** le paramètre `enabledOnly`) et je lui ai envoyé un appel `referentials.list` avec `{ enabledOnly: true }` — la procédure `referentials.list` de cette version n'a aucun schéma `.input()` défini, donc tRPC ignore silencieusement le paramètre inconnu et renvoie la liste complète, sans erreur (HTTP 200, 7 référentiels non filtrés). **Conclusion : l'ordre de déploiement n'est pas bloquant dans un sens comme dans l'autre** :
- Si le **frontend** (`generic-entrypoint`) est déployé avant le **backend** (`referentiels-enabled`) : l'étape 0 s'affiche quand même, simplement non filtrée (tous les référentiels visibles, y compris un éventuel désactivé — sans impact aujourd'hui puisqu'aucun n'est désactivé) — dégradation silencieuse et sans erreur, pas une panne.
- Si le **backend** est déployé avant le **frontend** : `referentials.list` accepte le nouveau paramètre mais personne ne l'envoie encore (l'ancien bouton "+ Nouvel audit" pointe toujours vers `/mdr/audit`) — aucun effet visible, comportement 100 % inchangé jusqu'au déploiement frontend.
- **Ordre recommandé malgré tout, par cohérence de calendrier (pas par nécessité technique) : backend `referentiels-enabled` d'abord, puis frontend `generic-entrypoint`.**

**Vérifications post-merge à faire (dans l'ordre) :**
1. `curl https://<backend-prod>/trpc/referentials.list` (sans argument) → doit renvoyer les 7 référentiels avec les IDs de production (MDR=3…ISO9001=9) et un champ `enabled:true` sur chacun (colonne absente = migration non appliquée, à vérifier avant de continuer).
2. `curl "https://<backend-prod>/trpc/referentials.list?input=%7B%22enabledOnly%22%3Atrue%7D"` → doit renvoyer les mêmes 7 (aucun désactivé actuellement).
3. Test visuel frontend : bouton "+ Nouvel audit" (header dashboard) → doit ouvrir `/audit/generic` avec l'étape 0 (3 groupes visibles), pas le wizard MDR.
4. Cliquer IVDR depuis l'étape 0 (référentiel jamais atteint par ce bouton avant ce chantier) → créer un audit fabricant → confirmer que des questions réelles s'affichent (72 attendues) et que le score se met à jour après une réponse.
5. Vérifier les cartes ISO14971 et FDA_QMSR du dashboard → doivent ouvrir un formulaire de création, plus une impasse.

## Reste à faire, par priorité (ordre donné par l'utilisateur le 2026-07-27)

**Contexte de cette liste :** le code A→D est confirmé déployé en production (backend + frontend), pas seulement mergé sur GitHub — voir section "État exact" ci-dessus. Les trois points ci-dessous sont ce qui reste, dans l'ordre exact demandé par l'utilisateur pour reprendre le travail sur une session neuve.

### 1. (PRIORITAIRE) Point d'entrée wizard générique — construit et testé, en attente de merge/déploiement

**Statut réel, pour éviter toute ambiguïté à la reprise :** ce chantier a été **entièrement construit et testé** en session (voir section "Point d'entrée unique..." ci-dessus pour le détail complet), mais **n'est pas encore mergé ni déployé** — c'est donc lui qui reste concrètement à faire pour que le bouton "+ Nouvel audit" cesse d'être câblé en dur vers MDR en production.

- Branche backend `claude/qara-backend-referentiels-enabled` (commit `bc659177`) : migration additive `referentiels.enabled` + filtre optionnel `referentials.list({ enabledOnly: true })`. **Poussée, pas mergée.**
- Branche frontend `claude/qara-frontend-generic-entrypoint` (commits `d1cb309` + `493844f`) : étape 0 du `GenericAuditWizard.tsx` (sélecteur de référentiel groupé par type/trié par id/nom complet), bouton "+ Nouvel audit" (header + AuditsList + redirections `/audit/new`/`/audit/create`) repointé vers `/audit/generic`, cartes mortes ISO14971/FDA_QMSR corrigées. **Poussée, pas mergée.**
- Testé en local par Playwright (backend+frontend+MariaDB locaux, pas de simulation) : entrée sans `?ref=` → étape 0 → IVDR choisi → 72 questions réelles ; `?ref=MDSAP` direct → 74 questions ; `?ref=ISO14971` direct (ancienne impasse) → 67 questions ; réponse enregistrée + score recalculé en direct.
- **Reste à faire concrètement :** feu vert utilisateur pour merger les deux branches dans `qitbxl`/`main`, puis redéploiement Railway/Vercel, puis test visuel en production (même grille que le test du 2026-07-27 mais sur `frontend-qara.vercel.app`).
- Sans ce merge, IVDR/MDSAP/FDA_QMSR/ISO14971 restent **fonctionnels côté backend mais inatteignables d'un clic** pour un utilisateur réel — seuls les 7 URLs directes `?ref=<CODE>` marchent déjà en production aujourd'hui.

### 2. Étape H — bascule de MDR sur le routeur générique (parité à prouver)

Dernière étape de la migration validée par l'utilisateur (E/F/G restent avant elle dans l'architecture cible, voir liste ci-dessous, mais H est la priorité 2 explicitement demandée car c'est le seul parcours qui porte des audits réels existants) : basculer `MDRAudit.tsx`/`mdr-router.ts` sur `audit-router.ts` générique, avec vérification de parité rigoureuse sur les audits réels existants (mêmes questions servies, même score recalculé) avant toute suppression de la logique MDR dupliquée. Non commencée à ce stade.

### 3. Warning React (cosmétique)

Signalé par l'utilisateur, nature exacte non encore diagnostiquée par l'assistant à ce stade — probablement un warning de console observé pendant son propre test visuel en production (pas reproduit ni investigué en session). **Premier réflexe à la reprise : demander à l'utilisateur le message exact du warning (texte de la console + page/action qui le déclenche) avant toute tentative de correction**, pour éviter de corriger le mauvais warning ou d'en introduire un autre par erreur.

### Étapes E/F/G restantes, hors des 3 priorités ci-dessus mais toujours dans l'architecture cible validée

- **E** — brancher ISO13485/ISO9001/ISO14971 sur le routeur générique, retirer `ISOAuditWizard.tsx` dédié (aujourd'hui encore actif et fonctionnel — ne pas casser avant qu'E ne soit prête).
- **F** — brancher FDA_QMSR sur le routeur générique ; `fda-router.ts::createAudit` existe déjà côté backend mais n'est appelé par aucune page frontend (le composant `FDAAudit.tsx` qui l'utilisait a été supprimé à l'étape B car jamais routé) — à réutiliser ou remplacer par le générique.
- **G** — étapes conditionnelles par référentiel dans le wizard générique (classe DM MDR/IVDR, voie 510(k)/PMA FDA, gradation MDSAP), pilotées par la table `referentiels`.

### Autres restes-à-faire, non priorisés par l'utilisateur (voir historique de conversation pour le détail)

**(d) Les 141 groupes de questions divergentes** (Tâche 1 originale, classification en 3 types — reformulation fusionnable / angles d'audit réellement distincts / incohérence de criticité à corriger — analyse déjà livrée en conversation, traitement encore à exécuter) **et, en lien direct, un correctif du moteur de score pour éviter un double comptage par `questionKey`** si des groupes venaient à être consolidés (point signalé par l'utilisateur, à traiter ensemble — le mécanisme précis reste à concevoir).

**(e) Rapport d'audit niveau ISO 19011** — hors du périmètre de la Tâche D déjà livrée (qui couvre PDF/Word/Excel bilingue) ; nature exacte de ce qui resterait à ajouter non précisée à ce stade, à clarifier avec l'utilisateur.

**(f) Module de veille réglementaire (Tâche 2 du prompt-maître)** — non commencé. Règle fondatrice rappelée : **"L'IA n'est jamais une source"** — jamais de contenu réglementaire généré, uniquement résumé/classé à partir de documents réellement récupérés de sources officielles (EUR-Lex, Federal Register, MDCG, ANSM, FDA/CDRH, IMDRF, etc.), traçabilité obligatoire (source/ID officiel/date/lien direct), message explicite de mode dégradé si une source est indisponible. Premier livrable attendu : inventaire des sources (disponibilité API/RSS/scraping) avant tout connecteur.

**(g) Échantillonnage intelligent** — mentionné par l'utilisateur comme reste à faire, nature exacte non détaillée à ce stade.

**(h) Rangement final des branches/bases obsolètes** — inclut au minimum : la branche `claude/qara-compliance-audit-qitbxl` du dépôt frontend (vestige de l'époque qitbxl, confondue une fois avec `main` par erreur cette session — voir incident du 2026-07-24), l'environnement Railway "production" abandonné (`metro.proxy.rlwy.net:17616`, à ne jamais utiliser, distinct de new-claude), les deux wizards frontend orphelins déjà supprimés à l'étape B.

## Invariants à ne jamais réinférer — toujours relire ici avant toute requête/script

- **IDs référentiels en production (new-claude) : MDR 3, IVDR 4, FDA_QMSR 5, MDSAP 6, ISO13485 7, ISO14971 8, ISO9001 9.** Jamais 1-7 — cette plage correspond aux IDs du miroir local (`qara_qitbxl_local`), qui diffèrent de la production (auto-increment indépendant). Tout script ou requête ciblant new-claude doit utiliser la numérotation de production, jamais celle du miroir local.
- **Base de production : new-claude** (service MySQL-vr64, `turntable.proxy.rlwy.net:32678`). **`metro.proxy.rlwy.net:17616` ("production" Railway) est un environnement abandonné, à ignorer, ne jamais y écrire ni y lire pour du diagnostic.**
- **Migrations additives uniquement** (`ADD COLUMN`/`CREATE TABLE`) — jamais d'`ALTER`/`DROP` destructif.
- **Aucune écriture de données en production sans sauvegarde préalable ET feu vert explicite de l'utilisateur.**
- **Dans l'éditeur SQL Railway : une seule instruction à la fois**, résultat vérifié avant la suivante — jamais un script multi-instructions collé en une fois.
- **Aucun merge, aucun push sur `qitbxl`/`main`, aucun redéploiement, aucune écriture en base sans instruction explicite de l'utilisateur pour CETTE action précise.**

## Procédure de secours — redéploiement manuel (à utiliser SEULEMENT si la vérification Railway/Vercel de l'utilisateur montre que le déploiement n'a pas suivi le push)

**Backend d'abord, toujours.**

**Railway (service backend, projet new-claude) :**
1. Dashboard Railway → projet contenant le service backend → sélectionner le service backend (pas le service MySQL-vr64).
2. Onglet **Deployments**.
3. Vérifier que la branche source configurée (Settings → Source → Branch) est bien `claude/qara-compliance-audit-qitbxl`.
4. Si le déploiement le plus récent dans la liste ne correspond pas au commit `dd5d9f94` (Railway affiche le SHA court sur chaque entrée) : menu **⋮** sur le déploiement le plus récent (ou bouton **Deploy** si disponible en haut de l'onglet) → **Redeploy**. Si Railway propose de choisir un commit précis, sélectionner `dd5d9f94`.
5. Attendre la fin du build (logs visibles dans l'onglet Deployments → cliquer sur le déploiement en cours) — statut doit passer à **Success**.

**Vérification backend :** requête publique (aucune authentification requise, procédure `referentials.list`) :
```
curl https://<url-du-service-backend>/trpc/referentials.list
```
Doit renvoyer les 7 référentiels avec les IDs de production (MDR=3 … ISO9001=9). Si erreur ou liste vide : le déploiement a échoué ou la base n'est pas jointe — ne pas passer au frontend.

**Vercel (projet frontend-qara), seulement après le backend confirmé :**
1. Dashboard Vercel → projet frontend-qara → onglet **Deployments**.
2. Vérifier que le déploiement **Production** le plus récent correspond au commit `deb1fed` (affiché sous chaque déploiement).
3. Si non : menu **⋮** sur le déploiement le plus récent → **Redeploy** (cocher "Use existing Build Cache" décoché si le build précédent a échoué, pour forcer un build propre).
4. Attendre **Ready**.

**Vérification frontend :** ouvrir l'app en production, se connecter, cliquer sur la carte IVDR ou MDSAP — doit ouvrir le wizard générique (formulaire nom/site/rôle/processus), pas rediriger vers `/audits`.

---
