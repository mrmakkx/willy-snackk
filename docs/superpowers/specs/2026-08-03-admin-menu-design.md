# Admin client — gestion de la carte (menu, prix, photos)

**Date** : 2026-08-03
**Statut** : Approuvé, prêt pour planification

## Contexte

Le site vitrine de Willy Snack est actuellement 100% statique (HTML/CSS/JS vanilla, zéro backend, zéro build tool), déployé sur Vercel via `git push` sur `master`. La carte (`data/menu.js`) est un fichier de données codé en dur, édité manuellement par le développeur — toute modification de plat/prix/photo nécessite une intervention technique.

Le porteur du projet veut rendre le client (l'exploitant de Willy Snack) autonome pour gérer sa carte (plats, prix, description, photo) sans dépendre d'une intervention à chaque changement, tout en gardant le reste du site (accueil, contact, mentions légales, horaires, coordonnées) verrouillé et non modifiable par le client.

## Objectifs

- Le client peut, depuis son téléphone, se connecter à une page d'administration dédiée et gérer sa carte : ajouter, modifier, supprimer un plat (catégorie, nom, prix, description, photo), et réordonner les plats.
- Les modifications sont immédiatement visibles sur le site public (`menu.html`), sans intervention du développeur.
- Le reste du site (pages, contenu, coordonnées, horaires) reste statique et non éditable par le client.
- Rester fidèle à la philosophie du projet : HTML/CSS/JS vanilla, zéro framework, zéro build tool. Le seul ajout est un backend externe (Supabase, gratuit) consommé via son SDK JS en CDN.
- Sécurité réelle : les écritures sont protégées côté serveur (RLS Supabase), pas seulement par une vérification côté navigateur.

## Non-objectifs (hors périmètre)

- Pas d'édition des photos/contenu de la page d'accueil (`index.html`) : les 3 photos ajoutées cette session (spécialités Burgers/Tacos, "Willy au comptoir") et tout le reste de l'accueil restent modifiés à la main par le développeur.
- Pas de gestion multi-utilisateurs : un seul compte admin, pas de rôles, pas d'invitation d'autres utilisateurs.
- Pas de flux "mot de passe oublié" dans l'interface admin — un changement de mot de passe se fait via le dashboard Supabase (Auth → Users) si besoin.
- Pas de système de brouillon/publication différée : toute modification enregistrée dans l'admin est immédiatement visible sur le site public.
- Pas de drag-and-drop pour réordonner les plats — de simples boutons "monter / descendre" suffisent.
- Pas de suite de tests automatisés (cohérent avec le reste du projet, statique) — vérification manuelle par navigateur à chaque étape clé.
- Pas de calcul/format monétaire structuré sur le prix : reste un champ texte libre (ex. "6,50 €"), comme aujourd'hui.

## Architecture

- **Nouveau projet Supabase** (plan gratuit) dédié à ce site, avec :
  - une table `menu_items` (remplace `data/menu.js`)
  - un bucket Storage `plats` pour les photos de plats
- **Site public** (`menu.html` + `js/menu-page.js`) : au chargement, récupère les plats via le SDK Supabase (`supabase.from('menu_items').select().order('ordre')`) au lieu de lire `MENU_DATA` depuis `data/menu.js`. Le filtre par catégorie et le paramètre d'URL `?cat=` fonctionnent identiquement à aujourd'hui. Le fichier `data/menu.js` est supprimé une fois la migration faite.
- **Nouvelle page `admin.html` + `js/admin.js`** : écran de connexion (mot de passe) puis interface de gestion des plats. Chargée via le même SDK Supabase en CDN, zéro build tool. Non liée dans la navigation publique du site (accessible uniquement par son URL directe).
- **Sécurité** : Supabase Auth avec un compte unique pré-créé (email technique fixe, caché du client, qui ne saisit que le mot de passe) + règles RLS sur `menu_items` et le bucket `plats` :
  - lecture (`SELECT` / téléchargement) : publique (rôle `anon`)
  - écriture (`INSERT` / `UPDATE` / `DELETE` / upload) : réservée au rôle `authenticated`
- **Déploiement** : inchangé — `git push` sur `master` redéploie le site statique sur Vercel. Les identifiants Supabase (URL projet + clé publique `anon`) sont des valeurs publiques par design (protégées par les RLS, pas des secrets) et peuvent être commises dans le code JS comme le reste du projet.

## Modèle de données

Table `menu_items` :

| Colonne | Type | Détail |
|---|---|---|
| `id` | uuid (auto) | clé primaire |
| `categorie` | text | ex. "Burgers", "Kebabs / Tacos" — choisie parmi les catégories existantes ou nouvelle catégorie tapée librement |
| `nom` | text | nom du plat |
| `prix` | text | ex. "6,50 €", texte libre |
| `description` | text | optionnelle |
| `photo_url` | text | optionnelle — URL publique du fichier dans le bucket `plats` ; si vide, le site affiche le placeholder hachuré "PHOTO" déjà existant (`.photo-placeholder`) |
| `ordre` | int | position d'affichage au sein de sa catégorie ; ajustable via les boutons monter/descendre |
| `created_at` | timestamptz (auto) | horodatage de création |

**Migration initiale** : les 9 plats actuellement dans `data/menu.js` sont importés tels quels comme lignes de départ dans `menu_items` (`photo_url` vide pour chacun), pour ne rien perdre au passage au nouveau système.

## Authentification

- Un compte Supabase Auth unique, pré-créé manuellement (ex. email `admin@willysnack.internal`, jamais affiché au client).
- `admin.html` ne présente qu'un champ mot de passe. La connexion appelle `supabase.auth.signInWithPassword({ email: <fixe, codé en dur dans admin.js>, password: <saisi> })`.
- Échec de connexion → message "Mot de passe incorrect".
- La session est gérée automatiquement par le SDK Supabase (persistée localement) : le client reste connecté d'une visite à l'autre sur son téléphone.
- Bouton "Se déconnecter" visible une fois connecté.
- Toute tentative d'écriture (insert/update/delete/upload) sans session valide est rejetée par les règles RLS, indépendamment de ce que fait l'interface — la protection ne repose pas sur le JS côté navigateur.

## Interface admin (mobile-first)

- **Écran de connexion** : un champ mot de passe, un bouton "Se connecter".
- **Écran principal** : liste des plats groupée par catégorie, chaque ligne affiche miniature (ou placeholder si pas de photo), nom, prix, et boutons "Modifier" / "Supprimer" / "↑" / "↓". Bouton "Ajouter un plat" en haut de la liste.
- **Formulaire plat** (ajout et édition, même composant) :
  - Catégorie : liste déroulante des catégories existantes + option pour en saisir une nouvelle
  - Nom, prix (texte), description (texte, optionnelle)
  - Photo (optionnelle) : `<input type="file" accept="image/*" capture="environment">` — propose directement l'appareil photo sur mobile
- **Compression avant upload** : la photo choisie est redimensionnée/recompressée côté client via `<canvas>` (largeur max ~1200px, JPEG qualité ~0.8) avant l'envoi au bucket Storage, pour limiter la consommation d'espace/bande passante gratuits et garder le site public rapide.
- **Suppression** : demande de confirmation avant de supprimer un plat ; supprime aussi son fichier photo associé dans le Storage si présent.
- **Retours utilisateur** : messages clairs en cas d'échec (upload, sauvegarde, mot de passe incorrect) ; bouton de sauvegarde désactivé pendant l'envoi pour éviter les doubles clics.

## Gestion des erreurs

- **Site public** : si l'appel Supabase échoue (coupure réseau, etc.), afficher un message "La carte n'a pas pu être chargée, réessaie dans un instant" plutôt qu'une page vide ou cassée.
- **Admin** : messages d'erreur explicites pour chaque échec possible (connexion, sauvegarde, upload) ; jamais d'échec silencieux.

## Tests / vérification

Pas de suite automatisée (cohérent avec le reste du projet). Vérification manuelle par navigateur à chaque étape clé :
- Connexion admin avec le bon mot de passe, puis avec un mauvais mot de passe
- Ajout d'un plat avec photo → vérifier son affichage correct sur `menu.html` (miniature, modale, filtre par catégorie)
- Modification d'un plat existant → vérifier la mise à jour côté public
- Suppression d'un plat → vérifier sa disparition côté public et de sa photo dans le Storage
- Réordonnancement (boutons monter/descendre) → vérifier l'ordre affiché sur `menu.html`
- Tentative d'écriture directe (ex. requête `insert` via la console navigateur) sans être connecté → doit être rejetée par les RLS
- Site déployé et re-vérifié sur l'URL live après le push final (Vercel auto-déploie)
