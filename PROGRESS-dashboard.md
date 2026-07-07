# Progression dashboard QARA

## Composant cible identifie

- Route utilisateur : `/dashboard`
- Fichier routeur : `client/src/App.tsx`
- Composant réellement affiche : `client/src/pages/Dashboard.tsx`
- Doublons repérés mais non routés pour `/dashboard` : `Home`, `ModernHome`, `DashboardV2`, `DashboardExecutive`

## Sources disponibles

- Mission utilisateur du 2026-07-07.
- `docs/design-passation/PASSATION-design.md`.
- Maquette validée de la section référentiels fournie dans la session.

Note : `docs/design-passation/SPEC-dashboard-accueil-v2.md` et la maquette HTML complète annoncées par la mission ne sont pas présentes dans la branche au démarrage. L'implémentation suit donc la mission, la passation existante et la maquette référentiels validée.

## Étapes

- [x] Étape 0 - Préparation : créer ce fichier, identifier la route et le composant dashboard réel.
- [x] Étape 1 - Layout général + sidebar.
- [x] Étape 2 - En-tête + bandeau 4 indicateurs.
- [x] Étape 3 - Section référentiels avec amendement A1.
- [x] Étape 4 - Colonnes basses : travaux en cours + veille réglementaire.
- [x] Étape 5 - Branchement des données et TODO data.
- [ ] Étape 6 - Nettoyage minimal, routage et build.

## Mapping données restant

- `profile.activeFrameworks` : source backend pressentie pour les référentiels et normes activés par l'utilisateur ou l'organisation.
- `dashboard.getKPIs.frameworkScores` : source backend pressentie pour les scores par référentiel (`MDR`, `IVDR`, `FDA QMSR`, `MDSAP`, `ISO 13485`, `ISO 14971`, `ISO 9001`).
- `dashboard.getKPIs.classifiedDevices` : source backend pressentie pour le compteur `Dispositifs classés`.
- `dashboard.getKPIs.watchAlerts` : source backend pressentie pour le compteur `Alertes de veille`.
- File mixte `Travaux en cours` : source backend pressentie combinant audits, classifications et voies FDA.
- `RegulatoryWatch` : source backend pressentie pour les alertes de veille avec référentiel, criticité et date.
