# Site vitrine Willy Snackk — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire un site vitrine statique à 3 pages (Accueil, Carte, Contact) pour le snack Willy Snackk (Vinça, 66320), publié en ligne, en expliquant chaque concept HTML/CSS/JS au fur et à mesure.

**Architecture:** 3 fichiers HTML autonomes (`index.html`, `menu.html`, `contact.html`) partageant un header/nav et un footer dupliqués, une seule feuille de style (`css/style.css`) et un seul script (`js/menu.js`) pour le menu mobile. Aucun outil de build, aucun framework.

**Tech Stack:** HTML5, CSS3 (variables CSS, Flexbox), JavaScript vanilla (DOM, événements), Google Fonts (Poppins) via CDN, Git/GitHub, Vercel.

## Global Constraints

- Aucun framework JS, aucun outil de build (spec : "HTML5 + CSS3 + JavaScript vanilla, aucun framework ni outil de build")
- Exactement 3 pages : `index.html`, `menu.html`, `contact.html` — pas de page supplémentaire dans ce périmètre
- Pas de réservation en ligne, pas de commande/paiement en ligne, pas de back-office (spec : non-objectifs)
- Pas d'achat de nom de domaine dans ce plan — l'URL gratuite Vercel suffit
- Contenu en français (établissement français, public local)
- Contenu provisoire réaliste pour la carte et les coordonnées, à remplacer plus tard par le porteur du projet
- Palette imposée par le design validé : rouge/jaune/orange, style "fast-food coloré et énergique"
- Le site étant statique et sans logique métier, il n'y a pas de suite de tests automatisés (spec : "Tests / vérification" = inspection visuelle et fonctionnelle dans le navigateur). **Chaque tâche remplace donc le cycle TDD classique par : écrire le code → vérifier manuellement dans le navigateur → committer.**

---

## Décisions de nommage (valables pour toutes les tâches)

**Palette de couleurs (variables CSS définies en Task 1) :**
- `--color-primary: #E63946` (rouge)
- `--color-secondary: #FFC300` (jaune)
- `--color-accent: #F77F00` (orange)
- `--color-dark: #241C15` (texte foncé)
- `--color-light: #FFF8F0` (fond crème)
- `--color-white: #FFFFFF`

**Police :** Google Fonts "Poppins" (poids 400, 600, 800), chargée via `<link>` dans le `<head>` de chaque page.

**Convention de classes CSS :** style BEM simplifié (`bloc__element`, `bloc--modificateur`), ex : `.nav__link`, `.nav__list--open`.

---

### Task 1 : Squelette du projet + fondations CSS

**Files:**
- Create: `css/style.css`
- Create: `index.html`

**Interfaces:**
- Consumes: rien (première tâche)
- Produces: variables CSS (`--color-primary`, `--color-secondary`, `--color-accent`, `--color-dark`, `--color-light`, `--color-white`, `--font-heading`, `--font-body`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`, `--spacing-xl`), reset CSS de base, `index.html` avec structure HTML5 valide chargeant `css/style.css`

- [ ] **Étape 1 : Créer `css/style.css` avec le reset et les variables**

```css
/* css/style.css */

/* ---------- Variables (palette Willy Snackk) ---------- */
:root {
  --color-primary: #E63946;   /* rouge vif */
  --color-secondary: #FFC300; /* jaune vif */
  --color-accent: #F77F00;    /* orange */
  --color-dark: #241C15;      /* texte fonce */
  --color-light: #FFF8F0;     /* fond creme */
  --color-white: #FFFFFF;

  --font-heading: 'Poppins', Arial, sans-serif;
  --font-body: 'Poppins', Arial, sans-serif;

  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 2rem;
  --spacing-xl: 4rem;
}

/* ---------- Reset ---------- */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-body);
  color: var(--color-dark);
  background-color: var(--color-light);
  line-height: 1.5;
}

img {
  max-width: 100%;
  display: block;
}

a {
  text-decoration: none;
  color: inherit;
}

ul {
  list-style: none;
}

h1, h2, h3 {
  font-family: var(--font-heading);
  font-weight: 800;
  line-height: 1.2;
}
```

**Explication (concepts couverts) :**
- Le *reset CSS* neutralise les marges/paddings par défaut du navigateur, pour partir d'une base prévisible.
- Les *variables CSS* (`--nom: valeur`, déclarées dans `:root`) permettent de réutiliser une même couleur partout via `var(--color-primary)` — si vous changez la valeur une fois, tout le site se met à jour.
- `box-sizing: border-box` fait que padding et bordure sont inclus dans la largeur/hauteur déclarée d'un élément, ce qui évite des calculs de mise en page surprenants.

- [ ] **Étape 2 : Créer `index.html` avec la structure de base**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Willy Snackk — Snack à Vinça</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <h1>Willy Snackk</h1>
</body>
</html>
```

**Explication :** `<meta name="viewport">` est indispensable pour que le site s'affiche correctement sur mobile (sans elle, les téléphones affichent une version "zoomée" pensée pour desktop). Le `<h1>` est temporaire, il sera remplacé par la vraie section d'accueil à la Task 7.

- [ ] **Étape 3 : Vérifier manuellement dans le navigateur**

Ouvrez `index.html` directement dans votre navigateur (double-clic sur le fichier, ou clic droit → Ouvrir avec → votre navigateur).

Attendu :
- Le titre "Willy Snackk" s'affiche en gras, dans une police arrondie (Poppins)
- Le fond de page est crème (pas blanc pur)
- Aucune erreur dans la console du navigateur (F12 → onglet Console)

- [ ] **Étape 4 : Commit**

```bash
git add css/style.css index.html
git commit -m "feat: fondations CSS et squelette de la page d'accueil"
```

---

### Task 2 : Header & navigation

**Files:**
- Modify: `index.html` (insérer le header juste après `<body>`)
- Modify: `css/style.css` (ajouter les styles du header)

**Interfaces:**
- Consumes: variables CSS de Task 1
- Produces: bloc HTML header réutilisable (à recopier tel quel dans `menu.html` et `contact.html` aux Tasks 5-6), classes CSS `.site-header`, `.site-header__inner`, `.logo`, `.logo__accent`, `.nav__list`, `.nav__link`, `.nav__toggle`, `.nav__toggle-bar`, `.nav__list--open`, ids `#nav-toggle` et `#nav-list` (utilisés par le JS en Task 3)

- [ ] **Étape 1 : Insérer le header dans `index.html`, juste après `<body>`**

```html
<header class="site-header">
  <div class="site-header__inner">
    <a href="index.html" class="logo">Willy <span class="logo__accent">Snackk</span></a>
    <button class="nav__toggle" id="nav-toggle" aria-label="Ouvrir le menu" aria-expanded="false">
      <span class="nav__toggle-bar"></span>
      <span class="nav__toggle-bar"></span>
      <span class="nav__toggle-bar"></span>
    </button>
    <nav class="nav">
      <ul class="nav__list" id="nav-list">
        <li><a href="index.html" class="nav__link">Accueil</a></li>
        <li><a href="menu.html" class="nav__link">La carte</a></li>
        <li><a href="contact.html" class="nav__link">Contact</a></li>
      </ul>
    </nav>
  </div>
</header>
```

**Explication :** `<nav>` est une balise sémantique HTML5 qui indique explicitement "ceci est une navigation" — utile pour l'accessibilité (lecteurs d'écran) et le référencement. Le bouton `#nav-toggle` (l'icône "hamburger") n'a pas encore de comportement : on l'ajoute en CSS ici, le clic sera géré en JS à la Task 3. `aria-expanded="false"` indique aux technologies d'assistance que le menu est fermé par défaut.

- [ ] **Étape 2 : Ajouter les styles du header dans `css/style.css`**

```css
/* ---------- Header ---------- */
.site-header {
  background-color: var(--color-primary);
  padding: var(--spacing-md) var(--spacing-lg);
}

.site-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1100px;
  margin: 0 auto;
  position: relative;
}

.logo {
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: 1.5rem;
  color: var(--color-white);
}

.logo__accent {
  color: var(--color-secondary);
}

.nav__list {
  display: flex;
  gap: var(--spacing-lg);
}

.nav__link {
  color: var(--color-white);
  font-weight: 600;
  transition: color 0.2s ease;
}

.nav__link:hover {
  color: var(--color-secondary);
}

.nav__toggle {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--spacing-sm);
}

.nav__toggle-bar {
  width: 26px;
  height: 3px;
  background-color: var(--color-white);
  border-radius: 2px;
}

/* Responsive : passage en menu mobile sous 768px */
@media (max-width: 768px) {
  .nav__toggle {
    display: flex;
  }

  .nav__list {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    background-color: var(--color-primary);
    padding: var(--spacing-md) var(--spacing-lg);
    gap: var(--spacing-md);
    display: none;
  }

  .nav__list--open {
    display: flex;
  }
}
```

**Explication :** `display: flex` + `justify-content: space-between` alignent le logo à gauche et la navigation à droite sur une seule ligne — c'est Flexbox, l'outil principal de mise en page en CSS moderne. La `@media (max-width: 768px)` est une "media query" : les règles à l'intérieur ne s'appliquent que si la largeur de l'écran est inférieure à 768 pixels (seuil classique mobile/desktop). En dessous de ce seuil, le bouton hamburger apparaît et le menu se cache par défaut.

- [ ] **Étape 3 : Vérifier manuellement dans le navigateur**

Rechargez `index.html`.

Attendu :
- Sur grand écran : bandeau rouge en haut, logo "Willy Snackk" à gauche (Snackk en jaune), 3 liens de navigation à droite, alignés horizontalement
- Réduisez la largeur de la fenêtre (ou ouvrez les outils de développement F12 → mode responsive) en dessous de ~768px : les 3 liens disparaissent, une icône "hamburger" (3 barres blanches) apparaît à droite — cliquer dessus ne fait encore rien, c'est normal, le comportement arrive à la tâche suivante

- [ ] **Étape 4 : Commit**

```bash
git add index.html css/style.css
git commit -m "feat: header et navigation"
```

---

### Task 3 : Menu mobile (JavaScript)

**Files:**
- Create: `js/menu.js`
- Modify: `index.html` (ajouter la balise `<script>` avant `</body>`)

**Interfaces:**
- Consumes: `#nav-toggle`, `#nav-list` et la classe `.nav__list--open` produits par Task 2
- Produces: `js/menu.js`, référencé via `<script src="js/menu.js" defer></script>` (même script réutilisé tel quel dans `menu.html` et `contact.html` aux Tasks 5-6)

- [ ] **Étape 1 : Créer `js/menu.js`**

```js
const navToggle = document.getElementById('nav-toggle');
const navList = document.getElementById('nav-list');

navToggle.addEventListener('click', () => {
  const isOpen = navList.classList.toggle('nav__list--open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});
```

**Explication (concepts couverts) :**
- `document.getElementById('nav-toggle')` récupère l'élément HTML dont l'attribut `id="nav-toggle"` — c'est la sélection DOM (Document Object Model), la représentation de la page que JavaScript peut manipuler.
- `addEventListener('click', ...)` dit au navigateur : "quand cet élément est cliqué, exécute cette fonction". C'est le mécanisme de base de toute interactivité web.
- `classList.toggle('nav__list--open')` ajoute la classe si elle est absente, la retire si elle est présente — et retourne `true`/`false` selon le résultat. C'est ce qui fait apparaître/disparaître le menu, en s'appuyant sur la règle CSS `.nav__list--open { display: flex; }` définie à la Task 2.
- On met aussi à jour `aria-expanded` pour que les lecteurs d'écran sachent si le menu est ouvert ou fermé.

- [ ] **Étape 2 : Ajouter le script dans `index.html`, juste avant `</body>`**

```html
  <script src="js/menu.js" defer></script>
</body>
</html>
```

**Explication :** l'attribut `defer` dit au navigateur d'exécuter le script seulement après avoir fini de lire le HTML — indispensable ici, sinon `document.getElementById('nav-toggle')` s'exécuterait avant que le bouton n'existe dans la page, et retournerait `null`.

- [ ] **Étape 3 : Vérifier manuellement dans le navigateur**

Rechargez `index.html`, passez en largeur mobile (< 768px, via les outils de développement F12).

Attendu :
- Cliquer sur l'icône hamburger fait apparaître le menu (Accueil / La carte / Contact) sous le header
- Cliquer à nouveau referme le menu
- Dans les outils de développement (onglet Elements), l'attribut `aria-expanded` du bouton passe de `false` à `true` puis inversement à chaque clic
- Aucune erreur dans la console (F12 → Console)

- [ ] **Étape 4 : Commit**

```bash
git add js/menu.js index.html
git commit -m "feat: menu mobile interactif (hamburger)"
```

---

### Task 4 : Footer

**Files:**
- Modify: `index.html` (insérer le footer juste avant `</body>`, après le script ou avant — voir étape 1)
- Modify: `css/style.css` (ajouter les styles du footer)

**Interfaces:**
- Consumes: variables CSS de Task 1
- Produces: bloc HTML footer réutilisable (à recopier tel quel dans `menu.html` et `contact.html` aux Tasks 5-6), classes CSS `.site-footer`, `.site-footer__inner`, `.site-footer__brand`, `.site-footer__social`, `.site-footer__link`, `.site-footer__legal`

- [ ] **Étape 1 : Insérer le footer dans `index.html`, avant la balise `<script>`**

```html
  <footer class="site-footer">
    <div class="site-footer__inner">
      <p class="site-footer__brand">Willy Snackk — Vinça (66320)</p>
      <ul class="site-footer__social">
        <li><a href="#" class="site-footer__link">Facebook</a></li>
        <li><a href="#" class="site-footer__link">Instagram</a></li>
      </ul>
      <p class="site-footer__legal">&copy; 2026 Willy Snackk. Tous droits réservés.</p>
    </div>
  </footer>

  <script src="js/menu.js" defer></script>
</body>
</html>
```

**Explication :** les liens Facebook/Instagram pointent vers `#` (placeholder) — à remplacer par les vraies URLs une fois les réseaux sociaux créés. `&copy;` est une "entité HTML", la façon d'écrire le symbole © sans risquer de problème d'encodage.

- [ ] **Étape 2 : Ajouter les styles du footer dans `css/style.css`**

```css
/* ---------- Footer ---------- */
.site-footer {
  background-color: var(--color-dark);
  color: var(--color-white);
  padding: var(--spacing-lg);
  margin-top: var(--spacing-xl);
}

.site-footer__inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  text-align: center;
}

.site-footer__social {
  display: flex;
  gap: var(--spacing-md);
}

.site-footer__link {
  color: var(--color-secondary);
  font-weight: 600;
}

.site-footer__legal {
  font-size: 0.85rem;
  opacity: 0.8;
}
```

- [ ] **Étape 3 : Vérifier manuellement dans le navigateur**

Rechargez `index.html`.

Attendu :
- Un bandeau sombre en bas de page avec le nom de l'établissement, deux liens (Facebook/Instagram en jaune) et une ligne de mentions légales
- Le footer reste bien en bas de la page, pas superposé au contenu

- [ ] **Étape 4 : Commit**

```bash
git add index.html css/style.css
git commit -m "feat: footer du site"
```

---

### Task 5 : Page "La carte" (`menu.html`)

**Files:**
- Create: `menu.html`
- Modify: `css/style.css` (ajouter les styles de la page carte)

**Interfaces:**
- Consumes: header (Task 2), footer (Task 4), `js/menu.js` (Task 3) — recopiés à l'identique
- Produces: `menu.html`, classes CSS `.menu-page`, `.section__title`, `.menu-category`, `.menu-category__title`, `.menu-list`, `.menu-item`, `.menu-item__info`, `.menu-item__name`, `.menu-item__desc`, `.menu-item__price`

- [ ] **Étape 1 : Créer `menu.html`**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>La carte — Willy Snackk</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <header class="site-header">
    <div class="site-header__inner">
      <a href="index.html" class="logo">Willy <span class="logo__accent">Snackk</span></a>
      <button class="nav__toggle" id="nav-toggle" aria-label="Ouvrir le menu" aria-expanded="false">
        <span class="nav__toggle-bar"></span>
        <span class="nav__toggle-bar"></span>
        <span class="nav__toggle-bar"></span>
      </button>
      <nav class="nav">
        <ul class="nav__list" id="nav-list">
          <li><a href="index.html" class="nav__link">Accueil</a></li>
          <li><a href="menu.html" class="nav__link">La carte</a></li>
          <li><a href="contact.html" class="nav__link">Contact</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main>
    <section class="section menu-page">
      <h1 class="section__title">La carte</h1>

      <div class="menu-category">
        <h2 class="menu-category__title">Burgers</h2>
        <ul class="menu-list">
          <li class="menu-item">
            <div class="menu-item__info">
              <span class="menu-item__name">Classic Snackk</span>
              <p class="menu-item__desc">Steak haché, cheddar, salade, tomate, oignon, sauce burger</p>
            </div>
            <span class="menu-item__price">6,50 €</span>
          </li>
          <li class="menu-item">
            <div class="menu-item__info">
              <span class="menu-item__name">Willy Double</span>
              <p class="menu-item__desc">Double steak, double cheddar, bacon, sauce barbecue</p>
            </div>
            <span class="menu-item__price">8,90 €</span>
          </li>
        </ul>
      </div>

      <div class="menu-category">
        <h2 class="menu-category__title">Kebabs / Tacos</h2>
        <ul class="menu-list">
          <li class="menu-item">
            <div class="menu-item__info">
              <span class="menu-item__name">Kebab poulet</span>
              <p class="menu-item__desc">Viande de poulet, crudités, sauce blanche ou algérienne</p>
            </div>
            <span class="menu-item__price">6,00 €</span>
          </li>
          <li class="menu-item">
            <div class="menu-item__info">
              <span class="menu-item__name">Tacos M</span>
              <p class="menu-item__desc">1 viande au choix, frites, fromage fondu, sauce au choix</p>
            </div>
            <span class="menu-item__price">7,50 €</span>
          </li>
        </ul>
      </div>

      <div class="menu-category">
        <h2 class="menu-category__title">Sandwichs / Paninis</h2>
        <ul class="menu-list">
          <li class="menu-item">
            <div class="menu-item__info">
              <span class="menu-item__name">Panini poulet curry</span>
              <p class="menu-item__desc">Poulet, sauce curry, emmental, crudités</p>
            </div>
            <span class="menu-item__price">5,50 €</span>
          </li>
        </ul>
      </div>

      <div class="menu-category">
        <h2 class="menu-category__title">Accompagnements</h2>
        <ul class="menu-list">
          <li class="menu-item">
            <div class="menu-item__info">
              <span class="menu-item__name">Frites</span>
            </div>
            <span class="menu-item__price">3,00 €</span>
          </li>
          <li class="menu-item">
            <div class="menu-item__info">
              <span class="menu-item__name">Nuggets (6 pièces)</span>
            </div>
            <span class="menu-item__price">4,00 €</span>
          </li>
        </ul>
      </div>

      <div class="menu-category">
        <h2 class="menu-category__title">Boissons</h2>
        <ul class="menu-list">
          <li class="menu-item">
            <div class="menu-item__info">
              <span class="menu-item__name">Canette 33cl</span>
            </div>
            <span class="menu-item__price">1,80 €</span>
          </li>
        </ul>
      </div>

      <div class="menu-category">
        <h2 class="menu-category__title">Desserts</h2>
        <ul class="menu-list">
          <li class="menu-item">
            <div class="menu-item__info">
              <span class="menu-item__name">Tiramisu maison</span>
            </div>
            <span class="menu-item__price">3,50 €</span>
          </li>
        </ul>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="site-footer__inner">
      <p class="site-footer__brand">Willy Snackk — Vinça (66320)</p>
      <ul class="site-footer__social">
        <li><a href="#" class="site-footer__link">Facebook</a></li>
        <li><a href="#" class="site-footer__link">Instagram</a></li>
      </ul>
      <p class="site-footer__legal">&copy; 2026 Willy Snackk. Tous droits réservés.</p>
    </div>
  </footer>

  <script src="js/menu.js" defer></script>
</body>
</html>
```

**Explication :** ce fichier reprend exactement le header/footer/script déjà construits sur `index.html` — c'est la duplication annoncée dans la spec. Vous remarquerez que si vous deviez corriger une faute dans le logo, il faudrait le faire dans les 3 fichiers HTML : c'est la limite du HTML pur sans outil de templating, et c'est ce qui motive l'existence des frameworks/générateurs de site plus tard dans votre apprentissage.

- [ ] **Étape 2 : Ajouter les styles de la page carte dans `css/style.css`**

```css
/* ---------- Page Carte ---------- */
.section__title {
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: var(--spacing-lg);
  text-align: center;
}

.menu-page {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-lg);
}

.menu-category {
  margin-bottom: var(--spacing-lg);
}

.menu-category__title {
  font-size: 1.3rem;
  color: var(--color-accent);
  border-bottom: 3px solid var(--color-secondary);
  padding-bottom: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--spacing-md);
}

.menu-item__name {
  font-weight: 600;
}

.menu-item__desc {
  font-size: 0.85rem;
  opacity: 0.75;
  margin-top: 2px;
}

.menu-item__price {
  font-weight: 800;
  color: var(--color-primary);
  white-space: nowrap;
}

@media (max-width: 600px) {
  .menu-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
```

- [ ] **Étape 3 : Vérifier manuellement dans le navigateur**

Ouvrez `menu.html`.

Attendu :
- Header et footer identiques à `index.html`
- 6 catégories affichées (Burgers, Kebabs/Tacos, Sandwichs/Paninis, Accompagnements, Boissons, Desserts), chaque plat avec nom, description (si présente) et prix aligné à droite
- Cliquer sur "Accueil" dans la nav ramène vers `index.html`
- En largeur mobile (< 600px), chaque plat passe en affichage vertical (nom au-dessus du prix) plutôt que sur une ligne
- Le menu hamburger fonctionne comme sur `index.html`

- [ ] **Étape 4 : Commit**

```bash
git add menu.html css/style.css
git commit -m "feat: page La carte avec le menu complet"
```

---

### Task 6 : Page "Contact" (`contact.html`)

**Files:**
- Create: `contact.html`
- Modify: `css/style.css` (ajouter les styles de la page contact)

**Interfaces:**
- Consumes: header (Task 2), footer (Task 4), `js/menu.js` (Task 3) — recopiés à l'identique ; `.section__title` (Task 5)
- Produces: `contact.html`, classes CSS `.contact-page`, `.contact-info`, `.contact-info__item`, `.map-embed`

- [ ] **Étape 1 : Créer `contact.html`**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact — Willy Snackk</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <header class="site-header">
    <div class="site-header__inner">
      <a href="index.html" class="logo">Willy <span class="logo__accent">Snackk</span></a>
      <button class="nav__toggle" id="nav-toggle" aria-label="Ouvrir le menu" aria-expanded="false">
        <span class="nav__toggle-bar"></span>
        <span class="nav__toggle-bar"></span>
        <span class="nav__toggle-bar"></span>
      </button>
      <nav class="nav">
        <ul class="nav__list" id="nav-list">
          <li><a href="index.html" class="nav__link">Accueil</a></li>
          <li><a href="menu.html" class="nav__link">La carte</a></li>
          <li><a href="contact.html" class="nav__link">Contact</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main>
    <section class="section contact-page">
      <h1 class="section__title">Nous trouver</h1>

      <div class="contact-info">
        <p class="contact-info__item"><strong>Adresse :</strong> Willy Snackk, 66320 Vinça</p>
        <p class="contact-info__item"><strong>Téléphone :</strong> 04 68 00 00 00</p>
        <p class="contact-info__item"><strong>Horaires :</strong> Du mardi au dimanche, 11h30 – 14h et 18h30 – 22h</p>
      </div>

      <div class="map-embed">
        <iframe
          src="https://www.google.com/maps?q=Vin%C3%A7a,66320&output=embed"
          width="100%"
          height="400"
          style="border:0;"
          allowfullscreen=""
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          title="Localisation de Willy Snackk à Vinça">
        </iframe>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="site-footer__inner">
      <p class="site-footer__brand">Willy Snackk — Vinça (66320)</p>
      <ul class="site-footer__social">
        <li><a href="#" class="site-footer__link">Facebook</a></li>
        <li><a href="#" class="site-footer__link">Instagram</a></li>
      </ul>
      <p class="site-footer__legal">&copy; 2026 Willy Snackk. Tous droits réservés.</p>
    </div>
  </footer>

  <script src="js/menu.js" defer></script>
</body>
</html>
```

**Explication :** l'`<iframe>` intègre une page Google Maps directement dans votre site — c'est une "fenêtre" vers un autre site web, une technique courante pour ce genre de besoin sans avoir à gérer soi-même une carte interactive. Le téléphone (04 68 00 00 00) et les horaires sont des valeurs provisoires à remplacer par les vraies coordonnées du snack.

- [ ] **Étape 2 : Ajouter les styles de la page contact dans `css/style.css`**

```css
/* ---------- Page Contact ---------- */
.contact-page {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-lg);
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
  font-size: 1.05rem;
}

.map-embed iframe {
  width: 100%;
  border-radius: 8px;
}
```

- [ ] **Étape 3 : Vérifier manuellement dans le navigateur**

Ouvrez `contact.html`.

Attendu :
- Header et footer identiques aux deux autres pages
- Adresse, téléphone et horaires affichés clairement
- La carte Google Maps s'affiche, centrée sur Vinça (nécessite une connexion internet)
- Navigation et menu mobile fonctionnels comme sur les autres pages

- [ ] **Étape 4 : Commit**

```bash
git add contact.html css/style.css
git commit -m "feat: page Contact avec carte Google Maps"
```

---

### Task 7 : Section héro et aperçu (page Accueil)

**Files:**
- Modify: `index.html` (remplacer le `<h1>Willy Snackk</h1>` temporaire par le contenu `<main>`)
- Modify: `css/style.css` (ajouter les styles hero + highlights)

**Interfaces:**
- Consumes: header (Task 2), footer (Task 4) déjà en place ; `menu.html` et `contact.html` (Tasks 5-6) désormais existants, donc les liens du hero peuvent pointer vers de vraies pages
- Produces: classes CSS `.hero`, `.hero__inner`, `.hero__title`, `.hero__title-accent`, `.hero__subtitle`, `.hero__cta`, `.btn`, `.btn--primary`, `.btn--secondary`, `.highlights`, `.highlights__inner`, `.highlight`, `.highlight__title`

- [ ] **Étape 1 : Remplacer `<h1>Willy Snackk</h1>` par le contenu de la page d'accueil dans `index.html`**

Remplacez cette ligne :
```html
  <h1>Willy Snackk</h1>
```

Par :
```html
  <main>
    <section class="hero">
      <div class="hero__inner">
        <h1 class="hero__title">Willy <span class="hero__title-accent">Snackk</span></h1>
        <p class="hero__subtitle">Burgers, kebabs, tacos & plus encore — à Vinça, préparés avec envie.</p>
        <div class="hero__cta">
          <a href="menu.html" class="btn btn--primary">Voir la carte</a>
          <a href="contact.html" class="btn btn--secondary">Nous trouver</a>
        </div>
      </div>
    </section>

    <section class="highlights">
      <div class="highlights__inner">
        <div class="highlight">
          <h2 class="highlight__title">Nos spécialités</h2>
          <p>Burgers maison, kebabs et tacos généreux, préparés à la commande.</p>
        </div>
        <div class="highlight">
          <h2 class="highlight__title">Horaires</h2>
          <p>Du mardi au dimanche, 11h30 – 14h et 18h30 – 22h</p>
        </div>
      </div>
    </section>
  </main>
```

**Explication :** `<main>` est la balise sémantique qui délimite le contenu principal unique de la page (par opposition au header/footer répétés partout) — un seul `<main>` par page. Les boutons "Voir la carte" et "Nous trouver" sont de simples liens `<a>` stylés comme des boutons via CSS (`.btn`) : en HTML, un bouton de navigation est presque toujours un lien, pas un `<button>` (réservé aux actions qui ne changent pas de page, comme notre menu mobile).

- [ ] **Étape 2 : Ajouter les styles hero + highlights dans `css/style.css`**

```css
/* ---------- Hero (Accueil) ---------- */
.hero {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  color: var(--color-white);
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-lg);
}

.hero__title {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
}

.hero__title-accent {
  color: var(--color-secondary);
}

.hero__subtitle {
  font-size: 1.2rem;
  margin-bottom: var(--spacing-lg);
}

.hero__cta {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.btn {
  display: inline-block;
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: 999px;
  font-weight: 700;
  transition: transform 0.15s ease;
}

.btn:hover {
  transform: translateY(-2px);
}

.btn--primary {
  background-color: var(--color-secondary);
  color: var(--color-dark);
}

.btn--secondary {
  background-color: transparent;
  color: var(--color-white);
  border: 2px solid var(--color-white);
}

/* ---------- Highlights ---------- */
.highlights {
  padding: var(--spacing-xl) var(--spacing-lg);
}

.highlights__inner {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
  justify-content: center;
}

.highlight {
  flex: 1 1 300px;
  background-color: var(--color-white);
  border: 2px solid var(--color-secondary);
  border-radius: 12px;
  padding: var(--spacing-lg);
  text-align: center;
}

.highlight__title {
  color: var(--color-primary);
  margin-bottom: var(--spacing-sm);
}

@media (max-width: 600px) {
  .hero__title {
    font-size: 2rem;
  }
}
```

- [ ] **Étape 3 : Vérifier manuellement dans le navigateur**

Rechargez `index.html`.

Attendu :
- Grand bandeau dégradé rouge→orange avec "Willy Snackk" (Snackk en jaune), un sous-titre, et deux boutons ("Voir la carte" en jaune plein, "Nous trouver" en contour blanc)
- Cliquer sur "Voir la carte" ouvre bien `menu.html`, "Nous trouver" ouvre bien `contact.html`
- En dessous, deux encadrés "Nos spécialités" et "Horaires"
- En largeur mobile, le titre du hero est plus petit et tout reste lisible/centré

- [ ] **Étape 4 : Commit**

```bash
git add index.html css/style.css
git commit -m "feat: section hero et aperçu de la page d'accueil"
```

---

### Task 8 : Déploiement (GitHub + Vercel)

**Files:** aucun nouveau fichier — utilise le dépôt Git déjà initialisé et commité (`Documents/willy-snackk`)

**Interfaces:**
- Consumes: l'ensemble des fichiers commités des Tasks 1-7
- Produces: une URL publique fonctionnelle

- [ ] **Étape 1 : Vérifier que tout est commité**

```bash
git status
```

Attendu : `nothing to commit, working tree clean`. Si des fichiers apparaissent en attente, les committer avant de continuer.

- [ ] **Étape 2 : Créer le dépôt GitHub**

Si la commande `gh` (GitHub CLI) est disponible et authentifiée :
```bash
gh repo create willy-snackk --public --source=. --remote=origin
```

Sinon, créer le dépôt manuellement sur github.com (bouton "New repository", nom `willy-snackk`, ne pas cocher "Initialize with README"), puis :
```bash
git remote add origin https://github.com/<votre-utilisateur>/willy-snackk.git
```

- [ ] **Étape 3 : Pousser le code vers GitHub**

```bash
git push -u origin master
```

Attendu : le code est visible sur `https://github.com/<votre-utilisateur>/willy-snackk`

- [ ] **Étape 4 : Déployer sur Vercel**

```bash
npx vercel --prod
```

Suivre les invites (connexion/création de compte Vercel si besoin, confirmer le dossier du projet). Vercel détecte automatiquement un site statique (pas de configuration nécessaire, il n'y a pas de framework).

Attendu : une URL de production est retournée dans le terminal, du type `https://willy-snackk.vercel.app`

- [ ] **Étape 5 : Vérifier le site en ligne**

Ouvrir l'URL fournie par Vercel dans un navigateur.

Attendu :
- La page d'accueil s'affiche correctement (hero, highlights, header, footer)
- La navigation vers "La carte" et "Contact" fonctionne (les URLs deviennent `.../menu.html` et `.../contact.html`)
- Le menu mobile fonctionne (tester en réduisant la fenêtre ou depuis un vrai téléphone)
- La carte Google Maps s'affiche sur la page Contact

---

## Suite possible (hors périmètre de ce plan)

- Remplacer le contenu provisoire (carte, téléphone, horaires, réseaux sociaux) par les vraies informations
- Ajouter de vraies photos (plats, façade du snack) à la place des sections actuelles
- Ajouter un nom de domaine personnalisé sur Vercel
