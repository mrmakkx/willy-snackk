# Refonte V2 — Willy Snack

**Date** : 2026-08-03
**Statut** : Approuvé, prêt pour planification

## Contexte

Le site vitrine de Willy Snack (snack à Vinça, 66320) existe déjà en ligne (V1, livrée le 2026-08-02, HTML/CSS/JS vanilla, 3 pages, contenu majoritairement provisoire). Le porteur du projet a obtenu un document de handoff design externe très abouti (`Willy Snackk design direction/design_handoff_willy_snack/`) proposant une refonte complète : nouvelle direction visuelle, nouvelles sections, et du vrai contenu métier (téléphone, adresse, avis Google, réseaux sociaux, horaires réels).

Cette refonte remplace entièrement le contenu et le style visuel de la V1, tout en conservant l'approche pédagogique et technique du projet (le porteur reste débutant, apprend en construisant).

## Objectifs

- Reproduire fidèlement la direction visuelle du handoff (couleurs, typographies, rayons, espacements — tokens définitifs, non négociables)
- Intégrer le vrai contenu métier disponible : téléphone, adresse, horaires, avis Google, Instagram, Facebook
- Ajouter les nouvelles fonctionnalités : bandeau défilant, section À propos, section avis, CTA horaires, carte filtrable par catégorie, fiche plat en modale
- Conserver 3 vraies pages/URLs (`index.html`, `menu.html`, `contact.html`) — pas de SPA à état client pour la navigation, contrairement à la maquette de référence
- Rester en HTML/CSS/JS vanilla, zéro framework, zéro build tool (confirmé par le porteur face à l'alternative Next.js+Tailwind proposée dans le document)
- Externaliser les données de la carte dans un fichier JS séparé (`data/menu.js`) pour faciliter les futures modifications de plats/prix sans toucher au HTML/CSS

## Non-objectifs (hors périmètre)

- Pas de vraies photos : toutes les images restent en placeholder hachuré avec libellé (motif + texte décrivant la photo attendue), à remplacer plus tard par le porteur
- Pas de carte complète : les 9 plats provisoires de la V1 sont conservés pour cette refonte ; la vraie carte plus large (salades, crêpes, tacos L/XL) sera fournie et intégrée dans une session future
- Pas de logo retravaillé : le fichier logo reste le même JPG à fond blanc (pas de version transparente disponible) ; affiché en cercle via `border-radius:50%`
- Pas de CMS ni de back-office : le menu reste un fichier de données statique édité manuellement
- Pas de JSON-LD / SEO avancé dans cette passe (mentionné dans le document comme travail futur "production", non prioritaire pour cette refonte)

## Contenu réel confirmé

- **Téléphone** : 06 95 79 01 08 (liens `tel:+33695790108`)
- **Adresse** : Willy Snack, Cami de Counillac, 66320 Vinça
- **Horaires réels** (confirmés par le porteur, remplacent les horaires inventés de la V1) : **Mercredi → Lundi, 11h00–14h et 18h00–21h, fermé le mardi**
- **Instagram** : `https://www.instagram.com/willy__snack/` (compte confirmé existant)
- **Facebook** : `https://www.facebook.com/profile.php?id=100085368753485` (déjà en place depuis la V1)
- **Avis Google** : note 4,8/5, plus de 100 avis. 3 avis réels (août 2025) :
  - Aliya E. — « Très belle surprise ce petit snack de bon rapport qualité prix. Très copieux. Accueil et service très sympathique. »
  - Virginie E. — « Une découverte merveilleuse : frites maison, produits frais, des jeunes motivés. Je recommande absolument ! »
  - Aurélie U. — « Je n'ai jamais mangé un hamburger (la biquette) aussi excellent ! Endroit convivial, aux petits soins pour leurs clients. »
  - Lien avis Google : `https://www.google.com/maps/search/?api=1&query=Willy+snack+Cami+de+Counillac+66320+Vin%C3%A7a`
- **Nom de marque** : "Willy Snack" (un seul k) partout dans le contenu affiché

## Design Tokens (définitifs, tirés du document de handoff)

### Couleurs
| Rôle | Valeur |
|---|---|
| Fond principal | `#14110F` |
| Fond surface / cartes | `#1D1917` |
| Fond alternatif (bandes, section avis) | `#1A1512` |
| Fond footer | `#100E0C` |
| Texte principal | `#F5EDE4` |
| Texte secondaire | `rgba(245,237,228,.65)` |
| Texte tertiaire / légendes | `rgba(245,237,228,.45)` |
| Accent (orange) | `#E8925A` |
| Accent hover | `#F2B183` |
| Bordures | `rgba(245,237,228,.10)` — hover `rgba(232,146,90,.6)` |
| Hachures placeholder photo | `repeating-linear-gradient(135deg,#251E19 0 12px,#1D1714 12px 24px)` |

### Typographie (Google Fonts)
- **Titres** : `Anton`, 400, `text-transform:uppercase`, `line-height:.9–1.02`
- **Corps** : `Karla`, 400/600/700
- **Labels / légendes** : `Azeret Mono`, 400/500, `font-size:11–12px`, `letter-spacing:.14–.22em`, uppercase

Échelle : H1 `clamp(52px,13vw,116px)` (hero) et `clamp(42px,11vw,84px)` (pages internes) · H2 `clamp(28px,6.5vw,48px)` · H3 24px (cartes) / 17px (ligne de carte) · corps 15–21px · légendes 11–14px.

### Rayons
`999px` (boutons, chips, pastilles) · `26px` (bloc CTA, modale) · `24px` (image à propos) · `20px` (cartes) · `18px` (lignes de carte, avis) · `14px` (vignette plat) · `50%` (logo, bouton fermer).

### Espacements
Container `max-width:1100px`, padding latéral `18px`. Sections : `padding:60–64px 18px`. Grilles : `gap:12–16px` (cartes), `gap:28px` (bloc à propos).

### Animations (discrètes, désactivées si `prefers-reduced-motion`)
- `wsUp` : `opacity 0→1` + `translateY(18px→0)`, `.7s ease` — hero.
- `wsIn` : fondu `.35–.4s ease` — changement de page, overlay modale.
- `wsPop` : `opacity` + `translateY(24px) scale(.98)→none`, `.3s cubic-bezier(.2,.7,.3,1)` — panneau modale.
- `wsMarquee` : `translateX(0→-50%)`, `26s linear infinite` — bandeau défilant (contenu dupliqué 2×).
- Hover cartes : `translateY(-4px)` + bordure orange, `transition .25s ease`.

## Architecture des pages

Header et footer communs, dupliqués sur les 3 pages (même approche que la V1).

### Header (partagé)
Sticky `top:0`, fond `rgba(20,17,15,.92)` + `backdrop-filter:blur(10px)`, bordure basse 1px. Logo 46×46 en cercle + « WILLY SNACK » (Anton, uppercase). Navigation Accueil/La carte/Contact + bouton téléphone plein orange, pill, `href="tel:+33695790108"`.

### `index.html` — Accueil
1. **Hero** — pastille "SNACK À VINÇA · 66320", H1 3 lignes ("Grillé / à la / **commande.**", 3e ligne orange), sous-titre, 2 CTA (Voir la carte / Appeler pour commander), placeholder photo en haut à droite
2. **Bandeau défilant** — spécialités en boucle infinie, texte mono uppercase
3. **Nos spécialités** — 3 cartes cliquables (Burgers, Kebabs & Tacos, Et le reste) → chacune navigue vers `menu.html` avec la catégorie pré-filtrée
4. **À propos** — image placeholder + texte tutoiement chaleureux + 2 chiffres clés : "6j/7" (légende mise à jour : "fermé le mardi" plutôt que le texte du document source) et "100%"
5. **Avis Google** — note + 3 avis réels + boutons vers la fiche Google
6. **CTA horaires** — bloc orange plein, horaires réels, bouton téléphone + bouton "Nous trouver"

### `menu.html` — La carte
- Titre + sous-titre
- Barre de filtres sticky (chips scrollables horizontalement) : Tout + catégories dans l'ordre de la carte
- Liste de plats (vignette placeholder + nom + prix + description), cliquable → ouvre la fiche plat en modale
- Support d'un paramètre d'URL `?cat=` pour arriver avec une catégorie pré-filtrée (utilisé par les cartes "spécialités" de l'accueil)
- Mention basse sur les prix

### Fiche plat (modale, partagée avec `menu.html`)
Overlay + panneau ancré en bas, photo placeholder, nom + prix, description, bouton "Commander par téléphone". Fermeture : clic overlay, clic ✕, touche Échap. `aria-modal="true"`, verrouillage du scroll body pendant l'ouverture.

### `contact.html` — Contact
2 colonnes : bouton d'appel + bloc adresse + bloc horaires (jour fermé visuellement atténué) / iframe Google Maps (filtre `grayscale(.35) contrast(1.05)`, coins arrondis)

### Footer (partagé)
Logo en cercle + nom + horaires, liens Facebook et Instagram (vraies URLs), ligne de copyright.

## Interactions & comportement

- Navigation : 3 vraies pages (pas de state client comme dans la maquette). Retour en haut de page à chaque changement (comportement natif du navigateur, rien à coder).
- Filtre de carte : JS client, filtre par catégorie sur `menu.html`, "Tout" par défaut, synchronisé avec le paramètre d'URL `?cat=`.
- Modale plat : ouverture au clic sur une ligne de la carte, fermeture overlay/✕/Échap, focus géré, scroll body verrouillé.
- Boutons téléphone : `tel:+33695790108`, visibles sur mobile et desktop.
- Responsive : mobile-first, grilles en `auto-fit/minmax`, pas de media queries nécessaires pour la mise en page (le CSS Grid/Flexbox s'adapte seul) — cibles tactiles ≥ 44px.
- `prefers-reduced-motion` : désactive le bandeau défilant et les animations d'entrée.

## Données de la carte

Le menu est extrait dans `data/menu.js` sous forme d'un tableau JS exposé globalement (`window.MENU_DATA` ou export simple, à trancher en plan) : `{ cat, nom, prix, desc }` par plat, réutilisant les 9 plats déjà présents dans la V1 (traduits dans le nouveau format). `menu.html` charge ce fichier puis génère dynamiquement les chips de filtre et les lignes de carte en JS.

## Tests / vérification

Toujours pas de suite de tests automatisés (site statique). Vérification manuelle par inspection navigateur à chaque étape, en particulier :
- Rendu conforme aux tokens (couleurs, typographies, rayons) sur mobile et desktop
- Filtre de carte fonctionnel (clic chip → filtrage correct, "Tout" par défaut)
- Navigation accueil → carte avec catégorie pré-filtrée fonctionnelle
- Modale plat : ouverture, fermeture (overlay/✕/Échap), contenu correct par plat
- Tous les liens réels fonctionnels (tel:, Facebook, Instagram, avis Google, Maps)
- Site déployé et vérifié sur l'URL live après chaque commit poussé (Vercel auto-déploie)
