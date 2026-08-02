# Site vitrine — Willy Snackk

**Date** : 2026-08-02
**Statut** : Approuvé, prêt pour planification

## Contexte

Willy Snackk est un snack (restauration rapide) situé à Vinça (66320, Pyrénées-Orientales). L'objectif est de créer un site vitrine simple présentant l'établissement, sa carte et ses coordonnées.

Le porteur du projet est débutant complet en développement web. L'objectif du projet est double :
1. Apprendre les fondamentaux du développement web (HTML, CSS, JavaScript) en construisant un vrai site
2. Obtenir un site vitrine fonctionnel, publié en ligne

Le contenu réel (textes définitifs, photos, logo) n'est pas encore disponible : le site sera construit avec du contenu provisoire réaliste, destiné à être remplacé par le porteur du projet une fois prêt.

## Objectifs

- Site vitrine à 3 pages présentant Willy Snackk : Accueil, Carte (menu), Contact
- Contenu pédagogique : chaque étape de construction est expliquée (concepts HTML/CSS/JS)
- Site responsive (utilisable sur mobile et desktop)
- Site publié en ligne à l'issue du projet, avec une URL accessible publiquement

## Non-objectifs (hors périmètre)

- Pas de système de réservation en ligne
- Pas de paiement en ligne / commande en ligne
- Pas de back-office ou de gestion de contenu dynamique (le contenu est en dur dans le HTML)
- Pas de nom de domaine personnalisé à l'achat (l'URL gratuite fournie par l'hébergeur suffit pour ce projet ; un domaine personnalisé pourra être ajouté plus tard)

## Approche technique

**Stack** : HTML5 + CSS3 + JavaScript vanilla (aucun framework, aucun outil de build).

Justification : le site est statique (3 pages, pas de compte utilisateur, pas de données dynamiques), ce qui ne justifie pas la complexité d'un framework (React, etc.). Cette stack permet en outre d'apprendre les fondations du web sans couche d'abstraction supplémentaire, conformément à l'objectif pédagogique du projet.

## Architecture des pages

Un header et un footer communs sont dupliqués sur les 3 pages HTML (choix délibéré : en HTML pur sans outil de templating, c'est l'approche standard pour un débutant).

- **Header commun** : logo "Willy Snackk", navigation (Accueil / Carte / Contact), menu "hamburger" sur mobile
- **Footer commun** : liens réseaux sociaux (placeholders), mentions légales minimales

### `index.html` — Accueil
- Section héro : image d'ambiance/produit phare (placeholder), nom "Willy Snackk", slogan accrocheur
- Aperçu rapide : spécialités mises en avant, horaires d'ouverture résumés
- Boutons d'appel à l'action : "Voir la carte" (→ menu.html), "Nous trouver" (→ contact.html)

### `menu.html` — La carte
Carte organisée par catégories, avec pour chaque plat un nom, une courte description et un prix :
- Burgers
- Kebabs / Tacos
- Sandwichs / Paninis
- Accompagnements (frites, etc.)
- Boissons
- Desserts

Contenu provisoire réaliste (noms de plats et prix plausibles pour un snack), à remplacer par la vraie carte plus tard.

### `contact.html` — Contact
- Adresse : Vinça, 66320
- Horaires d'ouverture
- Numéro de téléphone (placeholder)
- Carte Google Maps intégrée (iframe embed), centrée sur Vinça

## Direction visuelle

Style "fast-food coloré et énergique" :
- Palette vive : rouge / jaune / orange, sur fond clair ou contrasté
- Typographie bold et impactante pour les titres, lisible et sobre pour le texte courant
- Mise en page moderne, orientée appétit ("food-friendly"), grands espaces réservés aux photos (placeholders en attendant les vraies photos)

## Interactivité JavaScript

Un seul comportement interactif pour ce premier projet : le **menu mobile** ("hamburger menu") — une icône qui ouvre/ferme la navigation sur petit écran.

Concepts JS couverts : sélection d'éléments du DOM, écoute d'événements (`click`), modification de classes CSS via JavaScript pour afficher/masquer un élément.

## Responsive design

Le site doit être utilisable et lisible sur mobile, tablette et desktop. Approche : CSS avec Flexbox/Grid et media queries. Le menu de navigation passe en menu "hamburger" sous un seuil de largeur d'écran défini pendant l'implémentation.

## Déploiement

- **Versioning** : Git, dépôt local initialisé dans ce projet, hébergé sur GitHub
- **Hébergement** : Vercel (offre gratuite), déploiement en une commande depuis le dépôt Git
- Résultat attendu : une URL publique fonctionnelle à l'issue du projet

## Approche pédagogique

Pour chaque fichier créé ou modifié, les concepts sous-jacents sont expliqués au moment où ils apparaissent dans le code (plutôt qu'en cours théorique préalable) :
- HTML : structure sémantique (`header`, `nav`, `main`, `section`, `footer`, etc.)
- CSS : modèle de boîte, Flexbox, Grid, media queries, variables CSS pour la palette de couleurs
- JavaScript : sélection DOM, événements, manipulation de classes

Un court récapitulatif est fourni après chaque étape significative.

## Tests / vérification

Le site étant statique et sans logique métier complexe, la vérification se fait par inspection visuelle et fonctionnelle dans le navigateur :
- Affichage correct sur mobile et desktop (redimensionnement de fenêtre / outils dev du navigateur)
- Navigation fonctionnelle entre les 3 pages
- Menu mobile qui s'ouvre et se ferme correctement
- Site accessible publiquement une fois déployé (vérification de l'URL live)
