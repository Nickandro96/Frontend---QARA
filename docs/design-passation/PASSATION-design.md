# QARA - Passation design

Date de mise a jour : 2026-07-07
Branche cible : `qara-design-passation`

## Objectif

Conserver les decisions de design validees pour la refonte premium de QARA et les transmettre proprement a l'implementation frontend.

QARA doit rester une plateforme SaaS de conformite claire, rassurante et premium, avec un langage visuel proche des meilleures interfaces SaaS : structure nette, densite maitrisee, contenu lisible a 100 %, et parcours simple.

## Langage visuel valide

- Structure cockpit : sidebar large a gauche, contenu clair a droite.
- Sidebar bleu nuit `#0e1c3d`, largeur autour de 194px.
- Accent primaire : `#3b6fe0`.
- Item actif sidebar : fond `#1e335f`.
- Contenu centre, largeur maitrisee autour de `1200-1280px`.
- Pas d'interface etiree qui oblige l'utilisateur a zoomer.
- Grilles responsive, cartes sobres, bordures fines, hierarchie visuelle calme.

## Ecrans deja figes

1. Dashboard d'accueil
   - Sidebar cockpit.
   - Indicateurs principaux : conformite globale, ecarts ouverts, dispositifs classes, alertes de veille.
   - Section `Vos referentiels actifs`.
   - Section `Travaux en cours`.
   - Section `Veille reglementaire`.

2. Questionnaire
   - Reponses Oui / Partiel / Non / NA.
   - Panneau IA lateral avec source verifiee et garde-fous.
   - Echelle de maturite 0-5 avec ton decomplexant.
   - Colonne de progression par processus.

## Decision figee : referentiels et normes transverses

La decision ISO 14971 / ISO 9001 est tranchee : utiliser l'option `Normes transverses`.

Dans le dashboard :

- `MDR 2017/745`, `IVDR 2017/746`, `FDA QMSR` et `ISO 13485` restent en cartes principales dans `Vos referentiels actifs`.
- `ISO 14971` et `ISO 9001` ne sont pas des cartes equivalentes aux referentiels marche : elles apparaissent dans un bloc separe `Normes transverses`.
- Texte valide du bloc : `Gestion des risques et qualite - soutiennent tous vos marches`.
- `ISO 14971` : `Gestion des risques`.
- `ISO 9001` : `SMQ generaliste`.
- Garder une carte pointillee `Activer un referentiel`, avec exemple `MDSAP`.

La maquette HTML validee est disponible ici :

`docs/design-passation/section_referentiels_version_figee.html`

## Couleurs par referentiel

- MDR : fond `#e8eefb`, texte `#2563eb`.
- IVDR : fond `#fdeef0`, texte `#be123c`.
- FDA QMSR : fond `#eaf3ec`, texte `#16794c`.
- ISO 13485 : fond `#f0edfa`, texte `#6d28d9`.
- ISO 14971 : fond `#fef1e0`, texte `#b45309`.
- ISO 9001 : fond `#eef1f5`, texte `#475569`.

## Scores

- Vert `#16a34a` pour les scores eleves.
- Orange `#eab308` pour les scores intermediaires.
- Rouge `#dc2626` pour les scores faibles.

## Regle d'implementation

Ne pas reconstruire le produit de zero. La logique metier existante doit etre conservee : audit, scoring, plan d'action, rapport, onboarding, IA reglementaire, i18n et composants existants. La refonte porte sur le design, les parcours, la consolidation des doublons et la coherence visuelle.
