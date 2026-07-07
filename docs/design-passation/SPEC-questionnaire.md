# SPEC — Écran Questionnaire QARA (RÉFÉRENCE VALIDÉE)
*Écran figé le 2026-07-07. Chantier phare : l'écran le plus utilisé du produit. Claude Code doit le reproduire fidèlement puis le brancher aux données. Cohérent avec la SPEC dashboard (même langage visuel).*

---

## STATUT
**Validé et figé.** Trois états conçus et validés : (1) réponse Oui/Partiel/Non/NA, (2) aide IA ouverte, (3) échelle de maturité 0-5. Ne pas remettre en question la structure.

## PRINCIPE DIRECTEUR
Une **question à la fois**, épurée, qui respire. Toute la richesse du corpus est disponible **en couches** (accessible d'un geste), jamais affichée d'un bloc. Objectif produit : rendre un parcours de 60-200 questions fluide, motivant, **jamais décourageant** — « l'audit ne doit plus être une source de stress ».

## RÈGLE D'AFFICHAGE (comme le dashboard)
Contenu central en **largeur maîtrisée** (`max-width` ~680-720px, centré), pas d'étirement plein écran. À 100 % sur tout écran, l'écran doit avoir la proportion des maquettes validées, sans recours au zoom.

## STRUCTURE (3 zones)

### 1. Colonne de gauche — le fil du parcours (~230px, fond blanc)
- Lien « Quitter l'audit » (flèche retour) en haut.
- Titre de l'audit (« Audit MDR + ISO 13485 ») + barre de progression globale avec % (ex. 76%, couleur accent `#3b6fe0`).
- Liste des **processus** (label « PROCESSUS ») avec 3 états visuels :
  - **Terminé** : icône `circle-check-filled` verte `#16a34a`, texte gris.
  - **En cours** : icône `circle-dot` bleue `#3b6fe0`, fond surligné `#eef3fd`, texte foncé semi-bold.
  - **À venir** : icône `circle` grise `#c4ccd6`, texte gris clair.
- En bas (collé) : indicateur de **sauvegarde automatique** — icône `cloud-check` verte + « Enregistré ». Rassure sur les sessions longues.

### 2. Zone centrale — la question
**En-tête de zone** (barre haute, fond blanc, bordure basse) :
- Gauche : pastille du **processus courant** (couleur du référentiel) + « Question X / N ».
- Droite : **badge de type/criticité** — « Critique » (rouge `#fdeef0`/`#dc2626`) pour une question bloquante, ou « Évaluation de maturité » (orange `#fef1e0`/`#b45309`) pour une question maturité.

**Corps** (centré, largeur maîtrisée) :
- Ligne de **référence officielle** (icône livre) : ex. « ISO 13485 §7.4.1 · MDR Art. 10(9) ».
- **Question d'audit** en grand (18-20px, semi-bold, `#0e1c3d`, interligne aéré) — formulée en « montrez-moi sur un cas… ».
- Ligne de contexte (13px, gris) : ce que l'auditeur cherche.

**Zone de réponse — DEUX TYPES :**

**Type A — Oui / Partiel / Non / NA** (type_reponse `oui_non_partiel_na`) :
- 4 options en cartes empilées, chacune avec un radio + libellé + courte explication de ce que l'option signifie :
  - Oui, pleinement — « Processus défini, appliqué et tracé »
  - Partiellement — « Processus existe mais incomplet ou non systématique »
  - Non — « Pas de processus formalisé »
  - Non applicable (plus compacte)
- Option sélectionnée : bordure + fond teintés selon la réponse (vert pour Oui, orange pour Partiel, etc.).

**Type B — Échelle de maturité 0-5** (type_reponse `maturite_0_5`) :
- **Jauge visuelle** en haut : 6 segments qui se remplissent en vert `#16a34a` jusqu'au niveau choisi.
- 6 niveaux en lignes, chacun : badge chiffre (0-5) + nom + définition :
  - 0 Inexistant · 1 Initial · 2 Défini · 3 Géré · 4 Maîtrisé · 5 Optimisé (vocabulaire des modèles de maturité reconnus).
- Niveau sélectionné : bordure/fond verts, badge chiffre plein, mention « Votre sélection ».
- Ton déculpabilisant explicite : « Évaluez honnêtement où vous en êtes. Il n'y a pas de mauvaise réponse. »

**Boutons d'aide en couches** (sous la réponse, discrets) :
- « Expliquer simplement » (icône ampoule) → affiche `explanationSimple` + `concreteExample`.
- « Preuves à préparer » (icône loupe) → affiche `expectedEvidence`.
- « Aide-moi à répondre » / « Aide-moi à m'évaluer » (bleu, icône sparkles) → ouvre le panneau IA (état 3).

**Pied de zone** (barre basse, fond blanc) : « Précédent » (gauche) · « Passer » + bouton primaire « Suivant → » (droite, `#3b6fe0`). On peut sauter une question et y revenir.

### 3. Panneau IA (état ouvert, ~340px, glisse à droite)
- **En-tête** : identité assistant (icône sparkles sur dégradé bleu→violet `#3b6fe0→#6d28d9`) + « Assistant réglementaire » + bouton fermer (X).
- **Contenu** (s'appuie EXCLUSIVEMENT sur le corpus vérifié — garde-fous de la spec IA) :
  - Bulle de réponse : explication de ce qu'attend l'auditeur + **preuves à préparer** (liste à puces cochées).
  - Encadré **Couverture croisée** (bleu) : « Votre réponse compte aussi pour MDR Art. 10(9) et FDA QMSR 820.50 » — le différenciateur.
  - Encadré **Source vérifiée** (vert) : référence + lien « consulter le texte ».
- **Pied** : champ de saisie « Poser une question… » + envoi. Mention honnête : « L'assistant s'appuie sur le corpus vérifié · ne remplace pas votre jugement ».
- La question reste **visible et lisible à gauche** quand le panneau est ouvert (il vient en appui, ne remplace pas).

## COMPORTEMENTS
- **Sauvegarde auto** à chaque réponse (jamais de perte sur session longue).
- **Navigation souple** : précédent, passer, revenir ; reprise à la bonne question après interruption.
- **Raccourcis clavier** souhaités (1/2/3/4 pour les options, flèches pour naviguer).
- **Jalon de fin de processus** : à la dernière question d'un processus, un court message d'encouragement (« Processus Achats terminé ✓ ») avant de passer au suivant — entretient la motivation. *(À affiner à l'implémentation.)*
- Transitions douces entre questions (framer-motion, déjà présent).

## PALETTE (cohérente avec le dashboard)
Bleu nuit titres `#0e1c3d` · accent primaire `#3b6fe0` · vert `#16a34a` · orange `#eab308`/`#b45309` · rouge `#dc2626`. Couleurs par référentiel identiques à la spec dashboard. Fonds : zone `#f4f6f9`, cartes blanc, bordures `#e0e5ec`/`#e9edf2`.

## DONNÉES (rappel)
Chaque élément affiché correspond à un champ du corpus (déjà en base) : question (`questionText`), référence (`reference`), contexte (`auditVerifies`), explication (`explanationSimple`), exemple (`concreteExample`), preuves (`expectedEvidence`), source (`officialSource`/`referenceStatus`), couverture croisée (`mappings`), type de réponse (`questionType`), criticité (`criticality`). Le mapping précis visuel → données fera l'objet d'une spec séparée.

## CODE DE RÉFÉRENCE
Les 3 maquettes HTML validées (état Oui/Non, état IA ouverte, état maturité) accompagnent cette spec pour reproduire fidèlement proportions, couleurs et espacements.
