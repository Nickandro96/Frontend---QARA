# SPEC — Dashboard d'accueil QARA (RÉFÉRENCE VALIDÉE)
*Écran figé et validé le 2026-07-07. C'est la référence visuelle unique du tableau de bord d'accueil. Claude Code doit le reproduire fidèlement dans le code React/Tailwind existant.*

---

## STATUT
**Validé et figé.** Ne pas remettre en question la structure ni l'organisation. Cette maquette est la cible ; le travail de Claude Code est de la reproduire à l'identique en React, puis de la brancher aux vraies données.

## RÈGLE D'AFFICHAGE CRITIQUE (à respecter impérativement)
Le problème observé : sur un grand écran à 100 %, le contenu s'étirait sur toute la largeur → cartes trop larges, vides à droite, lecture inconfortable. Il fallait zoomer à 125-150 % pour retrouver la bonne proportion.

**La solution N'EST PAS de demander à l'utilisateur de zoomer.** L'interface doit être conçue pour que, **à 100 % sur tout écran**, elle ait exactement la proportion agréable vue à 125-150 %. Deux moyens obligatoires :

1. **Largeur maximale du contenu** (`max-width`) : la zone de contenu (à droite de la sidebar) ne s'étire pas à l'infini. Fixer un `max-width` (indicativement ~1200-1280 px pour la zone de contenu) et centrer au-delà, avec des marges. Le contenu reste calibré et lisible quelle que soit la taille de l'écran.
2. **Grille responsive** : les cartes gardent une largeur cible confortable (`minmax`) et se réorganisent selon la place, au lieu de s'étirer. Ne jamais laisser une carte s'élargir démesurément.

→ Objectif vérifiable : l'app à 100 % doit ressembler à la maquette, sans intervention de zoom.

## STRUCTURE GÉNÉRALE
Deux zones : **sidebar fixe à gauche** (bleu nuit) + **zone de contenu à droite** (fond clair, largeur maîtrisée).

### Sidebar (gauche) — bleu nuit `#0e1c3d`
- Largeur ~194 px, hauteur pleine.
- En haut : logo (carré arrondi bleu `#3b6fe0` avec icône bouclier + « QARA » blanc, 18px).
- Navigation (libellés en toutes lettres, pas juste des icônes) :
  Tableau de bord (actif) · Audits · Classification · Voies FDA · Plan d'action · Rapports · Veille
  - Item actif : fond `#1e335f`, texte blanc.
  - Items inactifs : texte `#8a99ba`, icône à gauche.
- En bas (collé) : carte compte — pastille initiales `#3b6fe0`, « N3-Conseil » blanc + « Plan Pro » gris, sur fond `#152a52`.

### Zone de contenu (droite) — fond `#f4f6f9`, largeur maîtrisée (voir règle ci-dessus)

**En-tête :**
- Titre « Bonjour, ravi de vous revoir » (19px, semi-bold, `#0e1c3d`) + sous-titre « N3-Conseil · 4 référentiels actifs » (12px, `#6b7688`).
- À droite : bouton secondaire « Gérer mes référentiels » (blanc, bordure) + bouton primaire « + Nouvel audit » (bleu `#3b6fe0`, texte blanc).

**Bandeau de 4 indicateurs** (grille 4 colonnes, cartes blanches bordure `#dfe4ea`, radius 11px) :
1. Conformité globale — 76% + mini barre de progression verte.
2. Écarts ouverts — 14 + « 3 majeurs » en rouge.
3. Dispositifs classés — 12 + « 3 en attente ».
4. Alertes de veille — 5 + « 2 nouvelles » en orange.

**Section « Vos référentiels actifs »** (grille 2 colonnes, cartes blanches radius 13px) :
Chaque carte : pastille référentiel colorée + nom + sous-titre + score coloré (vert/orange/rouge selon niveau), puis pastilles d'outils.
- **MDR 2017/745** (pastille bleu `#e8eefb`/`#2563eb`), 82% : Audit · Classe DM · Rapport.
- **IVDR 2017/746** (pastille framboise `#fdeef0`/`#be123c`), 58% : Audit · Classe A/B/C/D · Rapport.
- **FDA QMSR** (pastille vert `#eaf3ec`/`#16794c`), 64% : Audit · Voie 510(k)/PMA · Rapport.
- **ISO 13485** (pastille violet `#f0edfa`/`#6d28d9`), 88% : Audit · Rapport.

**Deux colonnes en bas** (grille 1.25fr / 1fr) :
- **Travaux en cours** (gauche) : liste mixte — Audit MDR+ISO 13485 (59/62, « Reprendre »), Classification IVDR Test Y (« Ouvrir »), Voie FDA Moniteur Z (« Ouvrir »). Chaque ligne : icône colorée + titre + sous-titre + lien d'action bleu.
- **Veille réglementaire** (droite) : badge « 2 nouvelles » orange, puis 3 alertes avec pastille référentiel + titre + fraîcheur (« il y a 3 jours »).

## PALETTE (couleurs par référentiel — à réutiliser partout)
| Référentiel | Fond pastille | Texte pastille |
|---|---|---|
| MDR | #e8eefb | #2563eb |
| IVDR | #fdeef0 | #be123c |
| FDA QMSR | #eaf3ec | #16794c |
| ISO 13485 | #f0edfa | #6d28d9 |
| ISO 14971 | #fef1e0 | #b45309 |
| ISO 9001 | #eef1f5 | #475569 |
| Bleu nuit (sidebar/titres) | #0e1c3d | — |
| Accent primaire (boutons/liens) | #3b6fe0 | — |

Scores : vert `#16a34a` (≥80), orange `#eab308` (50-79), rouge `#dc2626` (<50).

## NOTES POUR LA SUITE
- Les référentiels affichés = **ceux que l'utilisateur a activés** (ici 4). ISO 14971, ISO 9001, MDSAP s'ajoutent quand activés. Une carte « Activer un référentiel » (pointillés) apparaît pour en ajouter. *(L'organisation des transverses ISO 14971/9001 sera tranchée séparément.)*
- Toutes les données de la maquette sont des **exemples**. La connexion aux vraies données fera l'objet d'une spec de mapping séparée (chaque chiffre → sa source backend).
- Le code HTML de référence est fourni avec cette spec (`dashboard-reference.html`) pour reproduire fidèlement les proportions, couleurs et espacements.
