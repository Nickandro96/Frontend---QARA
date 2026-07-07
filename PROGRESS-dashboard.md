# PROGRESS — Implémentation du nouveau dashboard QARA

*Fichier d'état pour reprise autonome. Si la session est coupée, lire ce
fichier en premier, reprendre à la première tâche non cochée.*

Sources de vérité : `docs/design-passation/SPEC-dashboard-accueil.md` +
amendement A1 (normes transverses ISO 14971/9001 en bandeau compact, décrit
dans le prompt de mission — pas de fichier "-v2" séparé fourni) +
`docs/design-passation/dashboard-reference.html` (maquette pixel).

## Composant cible identifié (Étape 0)

Après connexion, `redirectAfterAuth()` (`client/src/lib/onboardingGate.ts`)
navigue vers `/` une fois l'onboarding terminé. La route `/` (App.tsx)
rend `ModernHome` (`client/src/pages/ModernHome.tsx`) — une page hero
marketing statique (pas de vraies données), pas un dashboard. **C'est ce
composant qui est remplacé.**

`ModernHome` utilise actuellement `ModernSidebar` (blanc, 264px, sélecteur
de marché EU/US, 15 items) — structurellement trop différent de la
sidebar cible (bleu nuit, 194px, 7 items fixes) pour être adapté par
simple prop : nouvelle sidebar dédiée créée pour cet écran (voir Étape 1),
`ModernSidebar` non touchée (utilisée ailleurs, hors périmètre de ce lot).

## Checklist

- [x] Étape 0 — Préparation : ce fichier créé, composant cible identifié
      (`ModernHome.tsx` → remplacé, routé sur `/`).
- [ ] Étape 1 — Layout général + nouvelle sidebar (`CockpitSidebar.tsx`).
- [ ] Étape 2 — En-tête + bandeau 4 indicateurs.
- [ ] Étape 3 — Section référentiels (amendement A1 : ISO 13485 en carte,
      ISO 14971/9001 en bandeau transverse compact).
- [ ] Étape 4 — Colonnes basses (Travaux en cours + Veille réglementaire).
- [ ] Étape 5 — Branchement des données réelles (voir §Mapping ci-dessous).
- [ ] Étape 6 — Nettoyage minimal : route `/` pointe vers le nouveau
      composant, `ModernHome.tsx` marqué `@deprecated` (non supprimé, non
      routé).

## Mapping données — ce qui est réel vs démo

| Élément affiché | Source | Statut |
|---|---|---|
| Nom d'organisation / plan (sidebar) | `trpc.profile.get` | Réel si présent, sinon fallback nom utilisateur |
| Conformité globale (%) | `trpc.dashboard.getKPIs().scoreGlobal` | Réel |
| Écarts ouverts (total) | `trpc.dashboard.getKPIs().nonConformitiesCount` | Réel |
| Écarts ouverts (« X majeurs ») | — | `TODO(data)`: pas de comptage par criticité exposé par `getKPIs` ; nécessiterait `dashboard.getDrilldown({type:"findings", filters:{criticality:"critical"}})` — non branché dans ce lot |
| Dispositifs classés | — | `TODO(data)`: aucune procédure backend ne persiste/liste les classifications (`classification.classify` est une mutation à la volée, sans historique) — valeur de démonstration affichée |
| Alertes de veille (compteur + « nouvelles ») | `trpc.watch.updates({limit:5})` | Réel pour le total ; `TODO(data)` pour la distinction « nouvelles » (pas de champ lu/non-lu exposé) |
| Référentiels actifs (liste + outils) | `trpc.audit.getRecentAudits({limit:50})`, groupé par `auditType` | Réel pour la présence/l'absence d'un référentiel ; scores par référentiel non disponibles (aucune procédure n'agrège un score par référentiel) |
| Score par carte référentiel | — | `TODO(data)`: valeur de démonstration affichée, nécessiterait `dashboard.getScoring({referentialIds:[...]})` branché référentiel par référentiel (hors périmètre de ce lot) |
| Travaux en cours | `trpc.audit.getRecentAudits({limit:5})` | Réel |
| Veille réglementaire (liste) | `trpc.watch.updates({limit:3})` | Réel |

## Bug pré-existant noté au passage (non corrigé, hors périmètre)

`AuditsList.tsx` (route `/audits`) appelle `trpc.audit.listAudits`, qui
**n'existe pas** dans `audit-router.ts` (seuls `getRecentAudits` et
`create` y sont définis) — cet appel doit échouer en l'état. Pré-existant,
sans lien avec ce lot, signalé pour un futur correctif.

## PROCHAINE ÉTAPE

Lot terminé. Reste, hors périmètre de cette mission (voir §6 de
`PASSATION-nouvelle-session.md`) :
- Trancher/valider visuellement le rendu réel une fois déployé.
- Concevoir et implémenter les écrans suivants (onboarding, résultats/
  rapport, CAPA, outils classification/FDA) selon la même méthode.
- Dédupliquer les autres dashboards (`Dashboard.tsx`, `DashboardV2.tsx`,
  `DashboardExecutive`) — hors périmètre ici, `ModernHome` seul a été
  traité.
- Corriger `trpc.audit.listAudits` manquant (bug noté ci-dessus).
