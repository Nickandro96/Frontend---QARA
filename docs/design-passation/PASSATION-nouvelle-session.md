# QARA — PASSATION POUR NOUVELLE SESSION (refonte design premium)
*À coller comme premier message dans la nouvelle conversation. Rédigé le 2026-07-07.*

---

## COMMENT UTILISER CE DOCUMENT
Colle ce texte entier au début de la nouvelle conversation. Il contient tout le contexte pour reprendre la **refonte design premium de QARA** sans rien reperdre. Joins aussi, si tu les as, les specs déjà produites (`SPEC-dashboard-accueil.md`, `SPEC-questionnaire.md`) et le dossier consolidé (`DOSSIER-CONSOLIDE-QARA.md`).

---

## 1. OBJECTIF GLOBAL
QARA est une plateforme SaaS d'auto-évaluation et de préparation aux audits de conformité pour dispositifs médicaux. Le produit fonctionne déjà de bout en bout (audit → scoring → plan d'action → rapport), mais son interface n'est pas au niveau voulu. **Objectif actuel : une refonte design PREMIUM (niveau des meilleures plateformes SaaS mondiales — Linear, Stripe, Notion), épurée, cohérente, simple d'usage, rassurante.** On conçoit les écrans visuellement (maquettes), on les valide, puis on les transmet à Claude Code pour l'implémentation.

## 2. MÉTHODE DE TRAVAIL (importante)
- **Claude (assistant) conçoit les écrans visuellement** via des maquettes interactives montrées dans le chat, itère avec l'utilisateur jusqu'à validation, puis rédige une **spec** par écran validé.
- **Claude Code (autre outil, tient le code)** implémente ensuite ces specs dans le vrai frontend (React/Vite/Tailwind/shadcn). Il a accès au dépôt et à l'app ; l'assistant non.
- **Circuit de transmission** : assistant → utilisateur (téléchargement) → dépôt Git ou copier-coller → Claude Code. L'assistant ne déploie pas et ne parle pas à Claude Code directement.
- **On fige un écran à la fois**, on ne le remet plus en question une fois validé.

## 3. IDENTITÉ VISUELLE VALIDÉE (le langage commun de tous les écrans)
- **Structure cockpit** : sidebar large à gauche (bleu nuit) + zone de contenu claire à droite.
- **Sidebar** : fond bleu nuit `#0e1c3d`, largeur ~194px, logo QARA (bouclier bleu `#3b6fe0`), navigation en **libellés pleins** (pas d'icônes seules) : Tableau de bord · Audits · Classification · Voies FDA · Plan d'action · Rapports · Veille. Item actif fond `#1e335f`. Carte compte en bas (« N3-Conseil · Plan Pro »).
- **Couleur d'identité** : bleu profond / bleu nuit `#0e1c3d` + accent primaire `#3b6fe0`.
- **Couleurs par référentiel** (à réutiliser partout) : MDR `#e8eefb`/`#2563eb` · IVDR `#fdeef0`/`#be123c` · FDA QMSR `#eaf3ec`/`#16794c` · ISO 13485 `#f0edfa`/`#6d28d9` · ISO 14971 `#fef1e0`/`#b45309` · ISO 9001 `#eef1f5`/`#475569`.
- **Scores** : vert `#16a34a` (≥80), orange `#eab308` (50-79), rouge `#dc2626` (<50).
- **RÈGLE D'AFFICHAGE CRITIQUE** : largeur de contenu maîtrisée (`max-width` ~1200-1280px, centré) + grille responsive. Objectif : l'app à 100 % sur tout écran doit ressembler aux maquettes SANS que l'utilisateur ait à zoomer (problème observé : à 100 % le contenu s'étirait, il fallait zoomer à 125-150 %).

## 4. DÉCISIONS PRODUIT PRISES
- **QARA est une SUITE D'OUTILS par référentiel**, pas seulement de l'audit. Chaque référentiel actif affiche ses outils : MDR → Audit · Classe DM · Rapport ; IVDR → Audit · Classe A/B/C/D · Rapport ; FDA QMSR → Audit · Voie 510(k)/PMA · Rapport ; ISO → Audit · Rapport.
- **Le dashboard affiche uniquement les référentiels ACTIVÉS** par l'utilisateur + une carte « Activer un référentiel » pour ajouter les autres (7 au total : MDR, IVDR, FDA/QMSR, MDSAP, ISO 13485, ISO 14971, ISO 9001).
- **Veille réglementaire** = module à part entière (indicateur + panneau listant les évolutions par référentiel). Validée.
- **4 rôles économiques** dans l'onboarding : Fabricant, Mandataire, Importateur, Distributeur.
- **EN SUSPENS à trancher** : comment afficher ISO 14971 et ISO 9001 — option 1 (cartes égales aux autres) ou option 2 (« normes de système transverses » présentées séparément des référentiels produit/marché MDR/IVDR/FDA/MDSAP). Les deux options ont été maquettées, l'utilisateur n'a pas encore choisi.

## 5. ÉTAT D'AVANCEMENT — ÉCRANS
**FIGÉS (validés, specs rédigées) :**
1. **Dashboard d'accueil** — sidebar + 4 indicateurs (conformité globale, écarts ouverts, dispositifs classés, alertes de veille) + section « Vos référentiels actifs » (cartes avec score + outils) + « Travaux en cours » (mixe audit/classification/voie FDA) + « Veille réglementaire ». Spec : `SPEC-dashboard-accueil.md`.
2. **Questionnaire** (chantier phare, écran le plus utilisé) — 3 états validés : (a) réponse Oui/Partiel/Non/NA, (b) panneau IA d'aide qui glisse à droite (avec couverture croisée + source vérifiée + garde-fous), (c) échelle de maturité 0-5 (jauge + 6 niveaux nommés, ton déculpabilisant). Colonne de gauche = fil des processus (terminé/en cours/à venir) + progression + sauvegarde auto. Spec : `SPEC-questionnaire.md`.

**RESTE À CONCEVOIR (prochains écrans) :**
- Wizard d'onboarding (4 étapes : Référentiels → Rôle → Marchés → Aperçu chiffré) — logique déjà spécifiée dans des docs antérieurs, reste à habiller au nouveau style.
- Écran de résultats / rapport d'audit (score, radar par processus, registre des écarts).
- Plan d'action CAPA (fiches, priorités, échéances, statuts).
- Les outils : classification DM (MDR + IVDR A/B/C/D), détermination de voie FDA (510(k)/De Novo/PMA).
- Landing publique, connexion/inscription, veille, profil/abonnement.

## 6. PROCHAINES ÉTAPES (dans l'ordre suggéré)
1. Trancher l'affichage ISO 14971 / 9001 (option 1 ou 2).
2. Concevoir le prochain écran (recommandé : onboarding, ou résultats/rapport).
3. Continuer à figer les écrans un par un, chacun avec sa spec.
4. Quand assez d'écrans sont figés : préparer le KIT COMPLET pour Claude Code (toutes les specs + maquettes HTML + un prompt d'implémentation avec protocole de reprise), et une **spec de mapping visuel → données** (quel élément affiché vient de quelle donnée backend).
5. Plus tard (hors design) : déploiement propre (merge de la branche `claude/qara-compliance-audit-qitbxl` vers `main` + migration + redéploiement) — prérequis de toute démo.

## 7. CONTRAINTES ET RÈGLES
- **Ne pas repartir de zéro sur le code** : garder la logique métier (déjà construite et testée : sécurité, import corpus 473 questions, scoring, CAPA, rapport, onboarding, IA réglementaire), le design system, les 54 composants shadcn, l'i18n. La refonte = design + parcours + consolidation des doublons (51 pages avec redondances : Home+ModernHome, 3 dossiers dashboard, variantes MDR/ISO/FDA à dédupliquer ; extraire un Stepper générique ; nettoyer le `navigate` fantôme de `useAuth.ts`).
- **Toutes les données des maquettes sont des exemples** (76%, N3-Conseil, etc.). Claude Code devra les brancher aux vraies données.
- **Rien n'est en production** : la version en ligne est l'ancienne (vulnérable) mais isolée (lien privé, 0 vrai utilisateur). **Le lien reste strictement privé jusqu'au déploiement des correctifs.**
- **L'IA réglementaire** : construite, testée, mais nécessite une clé API Anthropic (paiement à l'usage) branchée en variable d'environnement serveur — jamais collée dans un chat. Sera réservée à certains plans (pricing à définir).
- **Secrets** : jamais dans le chat ; toujours en variable d'environnement, saisie par l'utilisateur.
- **Protocole de reprise Claude Code** : chaque prompt d'implémentation doit inclure un fichier PROGRESS + commit après chaque sous-tâche, pour qu'un simple « continue » suffise après une coupure de crédits.

## 8. INSTRUCTION POUR CLAUDE DANS LA NOUVELLE SESSION
« Voici la passation du projet QARA (refonte design premium). On conçoit les écrans visuellement via des maquettes que tu me montres dans le chat, on itère, on valide, puis tu rédiges une spec par écran. Deux écrans sont déjà figés (dashboard d'accueil + questionnaire) — respecte leur langage visuel (décrit en section 3). Reprends à la section 6 : d'abord me faire trancher l'affichage ISO 14971/9001, puis concevoir le prochain écran. Montre-moi des maquettes visuelles, ne pars pas dans du code. »
