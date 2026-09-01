# Audit cookies et localStorage — 2026-09-01

## Conclusion

Aucun traceur analytique ou publicitaire n'a été identifié. Une bannière de
consentement n'est donc pas nécessaire dans l'état actuel du code.

## Cookies

- Cookie de session JWT : strictement nécessaire, émis par le backend avec
  l'option `httpOnly`.
- Cookie `sidebar_state` : préférence d'interface strictement fonctionnelle.

## localStorage

Les valeurs restantes sont des préférences non sensibles : langue, thème,
marché réglementaire, rôle réglementaire, état d'onboarding et largeur de la
barre latérale.

Le cache `manus-runtime-user-info`, qui dupliquait des données d'identité, n'est
plus alimenté. La session est lue depuis le cookie httpOnly et l'utilisateur
courant reste en mémoire React. La clé historique est supprimée à la prochaine
authentification ou déconnexion.

Tout ajout futur d'un outil analytique, publicitaire ou d'un cookie tiers devra
faire l'objet d'une nouvelle analyse et, le cas échéant, d'un recueil du
consentement avant dépôt.
