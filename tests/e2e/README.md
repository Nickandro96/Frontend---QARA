# Tests E2E — inventaire des bugs (2026-07-16)

Tests Playwright réutilisables produits lors du diagnostic systématique du parcours utilisateur. Rejouer après correction pour vérifier la non-régression.

## Prérequis

- Backend qitbxl lancé en local sur `http://localhost:3001`, `ALLOWED_ORIGINS` incluant `http://localhost:5173`, base MySQL/MariaDB locale peuplée (migrations + `scripts/import-corpus.mjs`).
- Frontend servi en local sur `http://localhost:5173` (`npx vite --port 5173` depuis ce dépôt).
- Playwright installé (`npm install playwright` — utilise Chromium pré-installé de l'environnement, voir `executablePath` dans les scripts).

## Scripts

- **`parcours-utilisateur.mjs`** — inscription → onboarding → dashboard → création d'audit MDR → "Mes Audits" → historique/reprise → rapports → navigation (`/mdr` bare, F5) → pages Classification/FDA/Veille (vérifie le verrouillage plan Free). Compte neuf à chaque exécution.
- **`audits-existants.mjs`** — se connecte à un compte existant ayant déjà des audits en base (contourne l'onboarding client-only si nécessaire), vérifie "Mes Audits", teste le vrai bouton "Reprendre" d'`AuditHistory.tsx`, et reproduit la navigation `/mdr/audit?auditId=N` telle que le code l'utilise réellement.

## Exécution

```bash
node parcours-utilisateur.mjs
node audits-existants.mjs
```

Chaque script écrit des captures d'écran et un `results*.json` dans `./results/` (non versionné) et logue `[PASS]`/`[FAIL]`/`[INFO]` par étape sur stdout.

## Limites connues

- L'onboarding est un état **client-only** (`localStorage`, voir `client/src/pages/Onboarding.tsx`) — un nouveau contexte navigateur (nouvelle session Playwright) n'a jamais cet état, même pour un compte backend déjà onboardé. Les deux scripts refont l'onboarding si redirigés — ce n'est pas un bug applicatif, juste une conséquence de ce choix d'architecture (déjà signalé comme `TODO(data)` dans le code).
- La création de site via la modale (`+ Créer un nouveau site`) n'est pas robustement automatisée dans `parcours-utilisateur.mjs` — utiliser un compte qui a déjà un site (comme `audits-existants.mjs` le fait) pour tester au-delà de l'étape 1 du wizard MDR.
