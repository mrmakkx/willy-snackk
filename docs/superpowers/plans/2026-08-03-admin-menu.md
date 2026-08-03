# Admin client (gestion de la carte) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Exception d'exécution : la Task 1 doit être faite en session inline avec l'utilisateur**, pas déléguée à un subagent en arrière-plan — elle nécessite d'ouvrir un lien d'autorisation OAuth Supabase dans un navigateur et d'attendre que l'utilisateur l'approuve. Les Tasks 2 à 10 peuvent être déléguées normalement une fois les identifiants Supabase (URL, clé anon, email admin) connus.

**Goal:** Remplacer le fichier de données statique `data/menu.js` par une base Supabase, et ajouter une page `admin.html` protégée permettant au client de gérer lui-même les plats de la carte (ajout, édition, suppression, réordonnancement, photo) depuis son téléphone.

**Architecture:** Nouveau projet Supabase (table `menu_items` + bucket Storage `plats`), consommé en JS vanilla via le SDK `@supabase/supabase-js` chargé en CDN (zéro build tool). Le site public (`menu.html`) lit la table en lecture seule (RLS `anon` autorisé en SELECT). `admin.html` ajoute une couche d'authentification (Supabase Auth, compte unique) et les écritures (RLS réservées à `authenticated`).

**Tech Stack:** HTML5, CSS3 (tokens existants de `css/style.css`), JavaScript vanilla, SDK `@supabase/supabase-js@2` (CDN jsDelivr), Supabase (Postgres + Auth + Storage), SQL brut (pas de CLI/migrations Supabase dans ce projet).

## Global Constraints

- HTML/CSS/JS vanilla, zéro framework, zéro build tool (cohérent avec tout le reste du projet, voir spec `docs/superpowers/specs/2026-08-03-admin-menu-design.md`)
- Seul `menu.html`/la carte devient dynamique/éditable ; tout le reste du site (accueil, contact, mentions légales, horaires, coordonnées) reste statique, non touché par ce plan
- `admin.html` n'est jamais lié dans la navigation publique du site (accessible uniquement par son URL directe), avec `<meta name="robots" content="noindex, nofollow">`
- L'URL du projet Supabase et la clé publique `anon` sont des valeurs publiques par design (protégées par les RLS, pas des secrets) — elles sont commises telles quelles dans `js/supabaseClient.js`, comme le reste du code de ce projet
- Sécurité réelle assurée uniquement par les règles RLS Postgres/Storage (lecture publique, écriture réservée à `authenticated`) — jamais par une vérification côté JS navigateur
- **Ne pousser (`git push`) qu'à la toute dernière tâche (Task 10)** : chaque push redéploie automatiquement le site live sur Vercel — pousser un état intermédiaire (ex. `menu.html` déjà branché sur Supabase mais `admin.html` incomplet) exposerait un site cassé ou une page admin à moitié fonctionnelle. Tasks 1 à 9 committent en local seulement (sauf Task 1 qui n'a pas de commit, voir plus bas)
- Compression photo obligatoire côté client (canvas, largeur max ~1200px, JPEG qualité ~0.8) avant tout upload vers le bucket `plats`, pour rester dans les quotas gratuits Supabase
- Le SDK Supabase chargé en CDN est épinglé à une version exacte (`@2.112.0`, pas `@2`) avec un attribut `integrity` (SRI) et `crossorigin="anonymous"` sur chaque balise `<script>` qui le charge — protège contre une compromission du CDN. Si la version doit être mise à jour plus tard, il faut regénérer le hash (`curl <url> | openssl dgst -sha384 -binary | openssl base64 -A`) en même temps que le numéro de version

---

## Décisions de nommage (valables pour toutes les tâches)

**Table Supabase** : `menu_items` (colonnes : `id` uuid, `categorie` text, `nom` text, `prix` text, `description` text, `photo_url` text, `ordre` int, `created_at` timestamptz).

**Bucket Storage** : `plats` (public en lecture, écriture réservée `authenticated`).

**Variable globale JS** : `supabaseClient` (le client SDK initialisé) — volontairement différent de `supabase` (nom du global exposé par le SDK CDN lui-même) pour éviter toute confusion/écrasement.

**Compte admin Auth** : email technique fixe `admin@willysnack.internal` (jamais affiché au client, codé en dur dans `js/admin.js`), mot de passe choisi lors de la création (Task 1), seul ce mot de passe est saisi dans `admin.html`.

**Classes CSS ajoutées** : `.admin-body`, `.admin-login`, `.admin-login__form`, `.admin-login__error`, `.admin-panel`, `.admin-panel__header`, `.admin-panel__add`, `.admin-dish-list`, `.admin-dish-list__category`, `.admin-dish-row`, `.admin-dish-row__thumb`, `.admin-dish-row__info`, `.admin-dish-row__name`, `.admin-dish-row__price`, `.admin-dish-row__actions`, `.admin-form__error`.

---

### Task 1 : Provisionner le projet Supabase (schéma, RLS, bucket, compte admin, seed)

**Exécution inline obligatoire** (OAuth + dashboard, voir note en tête de plan).

**Files:**
- Create: `supabase/schema.sql` (documentation du schéma réellement exécuté — ce projet n'a pas de CLI/migrations Supabase, ce fichier sert de référence versionnée)

**Interfaces:**
- Consumes: rien
- Produces: un projet Supabase actif avec table `menu_items` (peuplée des 9 plats existants), bucket `plats`, RLS en place, un compte Auth admin ; 3 valeurs à noter pour la Task 2 : `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ADMIN_EMAIL` (= `admin@willysnack.internal`)

- [ ] **Étape 1 : Authentification OAuth au serveur MCP Supabase**

Appeler l'outil `mcp__plugin_supabase_supabase__authenticate`. Il renvoie une URL d'autorisation : la partager avec l'utilisateur et attendre qu'il l'ouvre et valide dans son navigateur. Une fois autorisé, le navigateur redirige vers une URL `http://localhost:<port>/callback?code=...&state=...` — récupérer cette URL complète (même si la page elle-même échoue à charger) et la passer à `mcp__plugin_supabase_supabase__complete_authentication` via le paramètre `callback_url`.

- [ ] **Étape 2 : Découvrir les outils Supabase réels disponibles**

Une fois authentifié, de nouveaux outils MCP Supabase apparaissent. Lancer `ToolSearch` avec la requête `"supabase project"` puis `"supabase sql"` pour lister leurs noms exacts (les noms typiques du serveur MCP officiel Supabase sont `list_organizations`, `list_projects`, `create_project`, `execute_sql`, `apply_migration`, `get_project_url`, `get_anon_key` — à confirmer via ToolSearch avant utilisation, ils peuvent différer).

- [ ] **Étape 3 : Créer le projet**

Utiliser l'outil de création de projet trouvé à l'étape 2 : nom `willy-snack`, région la plus proche de la France (ex. `eu-west-1`/Paris ou Francfort selon les options disponibles), organisation à choisir avec l'utilisateur si plusieurs existent. Noter l'identifiant de projet retourné.

- [ ] **Étape 4 : Exécuter le schéma SQL**

Via l'outil d'exécution SQL trouvé à l'étape 2, exécuter :

```sql
-- Table des plats
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  categorie text not null,
  nom text not null,
  prix text not null,
  description text not null default '',
  photo_url text not null default '',
  ordre integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.menu_items enable row level security;

create policy "menu_items_public_read"
  on public.menu_items for select
  to anon, authenticated
  using (true);

create policy "menu_items_auth_insert"
  on public.menu_items for insert
  to authenticated
  with check (true);

create policy "menu_items_auth_update"
  on public.menu_items for update
  to authenticated
  using (true)
  with check (true);

create policy "menu_items_auth_delete"
  on public.menu_items for delete
  to authenticated
  using (true);

-- Bucket de stockage des photos de plats
insert into storage.buckets (id, name, public)
values ('plats', 'plats', true)
on conflict (id) do nothing;

create policy "plats_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'plats');

create policy "plats_auth_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'plats');

create policy "plats_auth_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'plats');

create policy "plats_auth_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'plats');

-- Seed : les 9 plats deja presents dans data/menu.js
insert into public.menu_items (categorie, nom, prix, description, ordre) values
  ('Burgers', 'Classic Snack', '6,50 €', 'Steak haché, cheddar, salade, tomate, oignon, sauce burger', 1),
  ('Burgers', 'Willy Double', '8,90 €', 'Double steak, double cheddar, bacon, sauce barbecue', 2),
  ('Kebabs / Tacos', 'Kebab poulet', '6,00 €', 'Viande de poulet, crudités, sauce blanche ou algérienne', 1),
  ('Kebabs / Tacos', 'Tacos M', '7,50 €', '1 viande au choix, frites, fromage fondu, sauce au choix', 2),
  ('Sandwichs / Paninis', 'Panini poulet curry', '5,50 €', 'Poulet, sauce curry, emmental, crudités', 1),
  ('Accompagnements', 'Frites', '3,00 €', '', 1),
  ('Accompagnements', 'Nuggets (6 pièces)', '4,00 €', '', 2),
  ('Boissons', 'Canette 33cl', '1,80 €', '', 1),
  ('Desserts', 'Tiramisu maison', '3,50 €', '', 1);
```

- [ ] **Étape 5 : Créer le compte admin (Supabase Auth)**

Dans le dashboard Supabase du projet créé : **Authentication → Users → Add user**. Email : `admin@willysnack.internal`. Mot de passe : à choisir avec l'utilisateur (pas dans ce plan — un secret ne se met pas dans un fichier commis). Cocher "Auto Confirm User" pour éviter d'avoir à valider un email qui n'existe pas réellement.

- [ ] **Étape 6 : Récupérer l'URL du projet et la clé publique `anon`**

Dashboard → **Project Settings → API** (ou via l'outil MCP équivalent trouvé à l'étape 2). Noter `SUPABASE_URL` (ex. `https://xxxxx.supabase.co`) et `SUPABASE_ANON_KEY` (chaîne commençant par `eyJ...`). Ces deux valeurs sont nécessaires telles quelles à la Task 2.

- [ ] **Étape 7 : Vérifier le seed**

Via l'outil SQL, exécuter `select count(*) from public.menu_items;` → attendu : `9`.

- [ ] **Étape 8 : Documenter le schéma dans le repo**

Créer `supabase/schema.sql` avec exactement le contenu SQL de l'étape 4 (sans les valeurs de mot de passe évidemment, qui n'y figurent pas).

- [ ] **Étape 9 : Commit**

```bash
git add supabase/schema.sql
git commit -m "chore: documente le schema Supabase (menu_items, RLS, bucket plats)"
```

---

### Task 2 : Client Supabase partagé (`js/supabaseClient.js`)

**Files:**
- Create: `js/supabaseClient.js`

**Interfaces:**
- Consumes: `SUPABASE_URL` et `SUPABASE_ANON_KEY` (obtenues Task 1), SDK global `window.supabase` (chargé via CDN dans `menu.html`/`admin.html`, Tasks 3 et 4)
- Produces: variable globale `supabaseClient` (client SDK initialisé), consommée par `js/menu-page.js` (Task 3) et `js/admin.js` (Tasks 5-9)

- [ ] **Étape 1 : Créer `js/supabaseClient.js`**

```js
const SUPABASE_URL = 'REMPLACER_PAR_URL_PROJET_TASK_1';
const SUPABASE_ANON_KEY = 'REMPLACER_PAR_CLE_ANON_TASK_1';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

Remplacer les deux valeurs par celles notées à la Task 1 (Étape 6) avant de continuer — ce ne sont pas des secrets (protégées par les RLS), elles peuvent être commises telles quelles.

**Explication :** le SDK Supabase chargé en CDN (`<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.0/dist/umd/supabase.min.js" integrity="sha384-De+l/Df7qym5QBDVocD3+gW1S7IjR3epf+6KbRDjB3FCCzM/LqVTwqckT6FhFar8" crossorigin="anonymous">`) expose un objet global `supabase` avec une méthode `createClient(url, key)`. La version est épinglée précisément (`@2.112.0`, pas juste `@2`) et accompagnée d'un hash d'intégrité (SRI) : le navigateur refuse d'exécuter le fichier si son contenu ne correspond pas exactement à ce hash — une protection contre une compromission du CDN. On appelle cette méthode une seule fois ici et on stocke le résultat dans `supabaseClient`, réutilisé partout ailleurs — comme ça, `menu-page.js` et `admin.js` n'ont pas chacun à connaître l'URL/la clé.

- [ ] **Étape 2 : Vérifier dans le navigateur (console)**

Ajouter temporairement dans `menu.html`, juste avant `</body>` :
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.0/dist/umd/supabase.min.js" integrity="sha384-De+l/Df7qym5QBDVocD3+gW1S7IjR3epf+6KbRDjB3FCCzM/LqVTwqckT6FhFar8" crossorigin="anonymous"></script>
<script src="js/supabaseClient.js"></script>
```
Recharger la page, ouvrir la console (F12), taper `await supabaseClient.from('menu_items').select('count')` → doit retourner un résultat sans erreur (confirme que l'URL/clé sont correctes et que la lecture publique fonctionne). Retirer ensuite ces deux balises temporaires (elles seront rajoutées proprement à la Task 3).

- [ ] **Étape 3 : Commit**

```bash
git add js/supabaseClient.js
git commit -m "feat(admin): client Supabase partage"
```

---

### Task 3 : Site public dynamique (`menu.html` lit Supabase)

**Files:**
- Modify: `menu.html` (scripts CDN + supabaseClient, conteneur d'erreur)
- Modify: `js/menu-page.js` (remplace la lecture de `MENU_DATA` statique par un appel Supabase)
- Modify: `css/style.css` (rendu `<img>` pour vignette de plat et photo de modale, en plus du placeholder existant)

**Interfaces:**
- Consumes: `supabaseClient` (Task 2), table `menu_items` peuplée (Task 1)
- Produces: `menu.html` fonctionnellement identique à avant côté visiteur, mais alimenté par Supabase ; conserve tous les ids déjà utilisés (`#filter-bar`, `#dish-list`, `#modal-overlay`, etc.)

- [ ] **Étape 1 : Modifier les balises `<script>` de `menu.html`**

Remplacer :
```html
  <script src="js/nav.js" defer></script>
  <script src="data/menu.js" defer></script>
  <script src="js/menu-page.js" defer></script>
```
par :
```html
  <script src="js/nav.js" defer></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.0/dist/umd/supabase.min.js" integrity="sha384-De+l/Df7qym5QBDVocD3+gW1S7IjR3epf+6KbRDjB3FCCzM/LqVTwqckT6FhFar8" crossorigin="anonymous" defer></script>
  <script src="js/supabaseClient.js" defer></script>
  <script src="js/menu-page.js" defer></script>
```

- [ ] **Étape 2 : Ajouter un conteneur d'erreur dans `menu.html`**

Remplacer :
```html
      <div class="filter-bar" id="filter-bar"></div>
      <div class="dish-list" id="dish-list"></div>
```
par :
```html
      <div class="filter-bar" id="filter-bar"></div>
      <p class="admin-form__error" id="menu-error" hidden>La carte n'a pas pu être chargée, réessaie dans un instant.</p>
      <div class="dish-list" id="dish-list"></div>
```

**Explication :** la classe `.admin-form__error` (rouge, taille de texte lisible) sera définie à la Task 4 en même temps que le reste du CSS admin ; elle est réutilisée ici pour ne pas dupliquer un style de message d'erreur.

- [ ] **Étape 3 : Réécrire entièrement `js/menu-page.js`**

```js
const filterBar = document.getElementById('filter-bar');
const dishList = document.getElementById('dish-list');
const menuError = document.getElementById('menu-error');
const modalOverlay = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');
const modalPhoto = document.getElementById('modal-photo');
const modalTitle = document.getElementById('modal-title');
const modalPrice = document.getElementById('modal-price');
const modalDesc = document.getElementById('modal-desc');

let MENU_DATA = [];
let categories = ['Tout'];
let activeCategory = 'Tout';

async function loadMenu() {
  const { data, error } = await supabaseClient
    .from('menu_items')
    .select('*')
    .order('categorie', { ascending: true })
    .order('ordre', { ascending: true });

  if (error) {
    menuError.hidden = false;
    return;
  }

  MENU_DATA = data.map((row) => ({
    id: row.id,
    cat: row.categorie,
    nom: row.nom,
    prix: row.prix,
    desc: row.description,
    photo: row.photo_url
  }));

  categories = ['Tout', ...new Set(MENU_DATA.map((dish) => dish.cat))];

  const params = new URLSearchParams(window.location.search);
  activeCategory = params.get('cat') || 'Tout';
  if (!categories.includes(activeCategory)) {
    activeCategory = 'Tout';
  }

  renderChips();
  renderDishes();
}

function renderChips() {
  filterBar.innerHTML = '';
  categories.forEach((cat) => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (cat === activeCategory ? ' chip--active' : '');
    chip.textContent = cat;
    chip.addEventListener('click', () => {
      activeCategory = cat;
      renderChips();
      renderDishes();
    });
    filterBar.appendChild(chip);
  });
}

function renderDishes() {
  dishList.innerHTML = '';
  const dishes = activeCategory === 'Tout'
    ? MENU_DATA
    : MENU_DATA.filter((dish) => dish.cat === activeCategory);

  dishes.forEach((dish) => {
    const row = document.createElement('button');
    row.className = 'dish-row';
    const thumb = dish.photo
      ? `<img src="${dish.photo}" alt="${dish.nom}" class="dish-row__thumb" loading="lazy">`
      : `<div class="dish-row__thumb photo-placeholder">PHOTO</div>`;
    row.innerHTML = `
      ${thumb}
      <div class="dish-row__info">
        <div class="dish-row__top">
          <span class="dish-row__name">${dish.nom}</span>
          <span class="dish-row__price">${dish.prix}</span>
        </div>
        ${dish.desc ? `<p class="dish-row__desc">${dish.desc}</p>` : ''}
      </div>
    `;
    row.addEventListener('click', () => openModal(dish));
    dishList.appendChild(row);
  });
}

function openModal(dish) {
  if (dish.photo) {
    modalPhoto.classList.remove('photo-placeholder');
    modalPhoto.innerHTML = `<img src="${dish.photo}" alt="${dish.nom}" class="modal__photo-img">`;
  } else {
    modalPhoto.classList.add('photo-placeholder');
    modalPhoto.textContent = `PHOTO — ${dish.nom}`;
  }
  modalTitle.textContent = dish.nom;
  modalPrice.textContent = dish.prix;
  modalDesc.textContent = dish.desc;
  modalDesc.style.display = dish.desc ? '' : 'none';
  modalOverlay.classList.add('modal-overlay--open');
  document.body.style.overflow = 'hidden';
  modalClose.focus();
}

function closeModal() {
  modalOverlay.classList.remove('modal-overlay--open');
  document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);

modalOverlay.addEventListener('click', (event) => {
  if (event.target === modalOverlay) {
    closeModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modalOverlay.classList.contains('modal-overlay--open')) {
    closeModal();
  }
});

loadMenu();
```

**Explication :** `dish.photo` vient de `photo_url` en base — vide (`''`) pour les 9 plats seedés, donc `dish.photo ? ... : ...` retombe sur le même placeholder hachuré qu'avant tant qu'aucune photo n'est ajoutée depuis l'admin (Task 8).

- [ ] **Étape 4 : Ajouter le rendu `<img>` dans `css/style.css`**

Ajouter à la suite de la règle `.dish-row__thumb` existante :

```css
img.dish-row__thumb {
  object-fit: cover;
  display: block;
}

.modal__photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 18px;
  display: block;
}
```

- [ ] **Étape 5 : Vérifier dans le navigateur**

Ouvrir `menu.html`. Attendu : les 9 plats s'affichent exactement comme avant (placeholder hachuré, filtres par catégorie, `?cat=Burgers` fonctionne, modale s'ouvre/ferme) — mais les données viennent maintenant de Supabase (vérifier dans l'onglet Réseau du navigateur qu'une requête part vers `supabase.co`).

- [ ] **Étape 6 : Vérifier le cas d'erreur**

Modifier temporairement `.from('menu_items')` en `.from('menu_items_typo')` dans `js/menu-page.js`, recharger `menu.html` → le message "La carte n'a pas pu être chargée..." doit s'afficher à la place de la liste. Remettre `menu_items` (nom correct) une fois vérifié.

- [ ] **Étape 7 : Commit**

```bash
git add menu.html js/menu-page.js css/style.css
git commit -m "feat(admin): menu.html lit la carte depuis Supabase"
```

---

### Task 4 : Squelette `admin.html` + `css/admin.css`

**Files:**
- Create: `admin.html`
- Create: `css/admin.css`

**Interfaces:**
- Consumes: variables CSS de `css/style.css` (`--color-*`, `--font-*`, `--radius-*`, `--spacing-*`, `--container-*`), classes `.btn`/`.btn--primary`/`.btn--outline`, `.modal-overlay`/`.modal-overlay--open`/`.modal`/`.modal__close`, `.photo-placeholder`
- Produces: ids `#admin-login`, `#login-form`, `#login-password`, `#login-error`, `#admin-panel`, `#logout-btn`, `#add-dish-btn`, `#admin-dish-list`, `#form-overlay`, `#form-modal`, `#form-close`, `#dish-form`, `#dish-id`, `#dish-categorie`, `#dish-categorie-new`, `#dish-nom`, `#dish-prix`, `#dish-description`, `#dish-photo`, `#form-error`, `#form-save-btn`, `#form-title` — consommés par `js/admin.js` (Tasks 5-9)

- [ ] **Étape 1 : Créer `admin.html`**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin — Willy Snack</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Karla:wght@400;600;700&family=Azeret+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
  <link rel="stylesheet" href="css/admin.css">
</head>
<body class="admin-body">
  <section class="admin-login" id="admin-login">
    <form class="admin-login__form" id="login-form">
      <h1>Willy Snack — Admin</h1>
      <label for="login-password">Mot de passe</label>
      <input type="password" id="login-password" required autocomplete="current-password">
      <button type="submit" class="btn btn--primary">Se connecter</button>
      <p class="admin-login__error" id="login-error" hidden>Mot de passe incorrect.</p>
    </form>
  </section>

  <section class="admin-panel" id="admin-panel" hidden>
    <header class="admin-panel__header">
      <h1>Gérer la carte</h1>
      <button class="btn btn--outline" id="logout-btn">Se déconnecter</button>
    </header>
    <button class="btn btn--primary admin-panel__add" id="add-dish-btn">+ Ajouter un plat</button>
    <div class="admin-dish-list" id="admin-dish-list"></div>
  </section>

  <div class="modal-overlay" id="form-overlay">
    <div class="modal" id="form-modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
      <button class="modal__close" id="form-close" aria-label="Fermer">✕</button>
      <h3 id="form-title">Ajouter un plat</h3>
      <form id="dish-form">
        <input type="hidden" id="dish-id">
        <label for="dish-categorie">Catégorie</label>
        <select id="dish-categorie"></select>
        <input type="text" id="dish-categorie-new" placeholder="Nouvelle catégorie" hidden>
        <label for="dish-nom">Nom du plat</label>
        <input type="text" id="dish-nom" required>
        <label for="dish-prix">Prix</label>
        <input type="text" id="dish-prix" required placeholder="6,50 €">
        <label for="dish-description">Description (optionnelle)</label>
        <textarea id="dish-description"></textarea>
        <label for="dish-photo">Photo (optionnelle)</label>
        <input type="file" id="dish-photo" accept="image/*" capture="environment">
        <p class="admin-form__error" id="form-error" hidden></p>
        <button type="submit" class="btn btn--primary" id="form-save-btn">Enregistrer</button>
      </form>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.0/dist/umd/supabase.min.js" integrity="sha384-De+l/Df7qym5QBDVocD3+gW1S7IjR3epf+6KbRDjB3FCCzM/LqVTwqckT6FhFar8" crossorigin="anonymous" defer></script>
  <script src="js/supabaseClient.js" defer></script>
  <script src="js/admin.js" defer></script>
</body>
</html>
```

**Explication :** `<meta name="robots" content="noindex, nofollow">` demande aux moteurs de recherche de ne pas indexer cette page — combiné au fait qu'elle n'est liée nulle part dans la navigation publique, ça évite qu'elle apparaisse dans une recherche Google. Ce n'est pas une protection de sécurité (n'importe qui connaissant l'URL peut l'ouvrir), juste de la discrétion — la vraie protection vient des RLS Supabase (Task 1).

- [ ] **Étape 2 : Créer `css/admin.css`**

```css
/* ---------- Admin: layout general ---------- */
.admin-body {
  min-height: 100vh;
}

.admin-login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--container-pad);
}

.admin-login__form {
  width: min(360px, 100%);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: var(--spacing-lg);
}

.admin-login__form label,
#dish-form label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.admin-login__form input,
#dish-form input,
#dish-form select,
#dish-form textarea {
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 10px 12px;
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 15px;
}

.admin-login__error,
.admin-form__error {
  color: #E45B5B;
  font-size: 14px;
}

.admin-panel {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: var(--spacing-lg) var(--container-pad);
}

.admin-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.admin-panel__add {
  margin-bottom: var(--spacing-md);
}

.admin-dish-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-dish-list__category {
  font-family: var(--font-heading);
  font-size: 18px;
  color: var(--color-text-tertiary);
  margin-top: var(--spacing-md);
}

.admin-dish-row {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-row);
  padding: 10px 12px;
}

.admin-dish-row__thumb {
  flex: 0 0 56px;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-thumb);
  font-size: 7px;
  object-fit: cover;
  display: block;
}

.admin-dish-row__info {
  flex: 1;
  min-width: 0;
}

.admin-dish-row__name {
  font-weight: 700;
}

.admin-dish-row__price {
  color: var(--color-accent);
  font-size: 14px;
}

.admin-dish-row__actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.admin-dish-row__actions button {
  border: 1px solid var(--color-border);
  background: none;
  color: var(--color-text);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 13px;
  cursor: pointer;
}

#dish-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: var(--spacing-sm);
}
```

- [ ] **Étape 3 : Vérifier dans le navigateur**

Ouvrir `admin.html`. Attendu : écran de connexion centré (mot de passe + bouton), fond sombre cohérent avec le reste du site. Erreur console `admin.js` en 404 (normal, arrive à la Task 5). Le panneau `#admin-panel` doit rester invisible (`hidden`).

- [ ] **Étape 4 : Commit**

```bash
git add admin.html css/admin.css
git commit -m "feat(admin): squelette page admin (connexion + panneau)"
```

---

### Task 5 : Authentification admin (`js/admin.js` — connexion/déconnexion/session)

**Files:**
- Create: `js/admin.js`

**Interfaces:**
- Consumes: `supabaseClient` (Task 2), éléments DOM de `admin.html` (Task 4)
- Produces: fonctions `showPanel()` et `showLogin()` (utilisées par les tâches suivantes), variable `ADMIN_EMAIL`

- [ ] **Étape 1 : Créer `js/admin.js`**

```js
const ADMIN_EMAIL = 'admin@willysnack.internal';

const loginSection = document.getElementById('admin-login');
const panelSection = document.getElementById('admin-panel');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

function showPanel() {
  loginSection.hidden = true;
  panelSection.hidden = false;
  loadDishes();
}

function showLogin() {
  loginSection.hidden = false;
  panelSection.hidden = true;
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.hidden = true;
  const password = document.getElementById('login-password').value;

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password
  });

  if (error) {
    loginError.hidden = false;
    return;
  }

  showPanel();
});

logoutBtn.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  showLogin();
});

async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    showPanel();
  } else {
    showLogin();
  }
}

checkSession();
```

**Explication :** `ADMIN_EMAIL` est un identifiant technique, jamais montré à l'utilisateur — le formulaire ne demande que le mot de passe, mais Supabase Auth exige toujours un couple email+mot de passe en interne. `checkSession()` s'exécute au chargement de la page : si une session existe déjà (le client s'est connecté récemment sur ce téléphone), on saute directement à l'écran de gestion.

- [ ] **Étape 2 : Vérifier dans le navigateur**

Ouvrir `admin.html`. Taper un mauvais mot de passe → message "Mot de passe incorrect" s'affiche. Taper le bon mot de passe (choisi à la Task 1, étape 5) → le panneau s'affiche. Une erreur console `loadDishes is not defined` est attendue à ce stade (résolue Task 6). Recharger la page → doit rester connecté (session persistée) et sauter directement au panneau. Cliquer "Se déconnecter" → retour à l'écran de connexion, recharger → redemande le mot de passe.

- [ ] **Étape 3 : Commit**

```bash
git add js/admin.js
git commit -m "feat(admin): authentification (connexion, deconnexion, session)"
```

---

### Task 6 : Liste des plats groupée par catégorie + suppression

**Files:**
- Modify: `js/admin.js` (ajouter à la suite du fichier)

**Interfaces:**
- Consumes: `supabaseClient`, `dishListEl` (nouveau), fonctions de Task 5
- Produces: variable `adminDishes` (tableau des plats chargés), fonctions `loadDishes()`, `renderAdminList()`, `handleDelete(id)` — consommées par les Tasks 7-9

- [ ] **Étape 1 : Ajouter à la fin de `js/admin.js`**

```js
const dishListEl = document.getElementById('admin-dish-list');
let adminDishes = [];

async function loadDishes() {
  const { data, error } = await supabaseClient
    .from('menu_items')
    .select('*')
    .order('categorie', { ascending: true })
    .order('ordre', { ascending: true });

  if (error) {
    dishListEl.innerHTML = '<p class="admin-form__error">Impossible de charger la carte.</p>';
    return;
  }

  adminDishes = data;
  renderAdminList();
}

function renderAdminList() {
  dishListEl.innerHTML = '';
  const categories = [...new Set(adminDishes.map((d) => d.categorie))];

  categories.forEach((cat) => {
    const heading = document.createElement('h3');
    heading.className = 'admin-dish-list__category';
    heading.textContent = cat;
    dishListEl.appendChild(heading);

    adminDishes.filter((d) => d.categorie === cat).forEach((dish) => {
      const row = document.createElement('div');
      row.className = 'admin-dish-row';
      const thumb = dish.photo_url
        ? `<img src="${dish.photo_url}" alt="${dish.nom}" class="admin-dish-row__thumb">`
        : `<div class="admin-dish-row__thumb photo-placeholder">PHOTO</div>`;
      row.innerHTML = `
        ${thumb}
        <div class="admin-dish-row__info">
          <div class="admin-dish-row__name">${dish.nom}</div>
          <div class="admin-dish-row__price">${dish.prix}</div>
        </div>
        <div class="admin-dish-row__actions">
          <button type="button" data-action="up" data-id="${dish.id}">↑</button>
          <button type="button" data-action="down" data-id="${dish.id}">↓</button>
          <button type="button" data-action="edit" data-id="${dish.id}">Modifier</button>
          <button type="button" data-action="delete" data-id="${dish.id}">Supprimer</button>
        </div>
      `;
      dishListEl.appendChild(row);
    });
  });
}

dishListEl.addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-action="delete"]');
  if (!btn) return;
  handleDelete(btn.dataset.id);
});

async function handleDelete(id) {
  const dish = adminDishes.find((d) => d.id === id);
  if (!dish) return;
  const confirmed = window.confirm(`Supprimer "${dish.nom}" ?`);
  if (!confirmed) return;

  if (dish.photo_url) {
    const path = dish.photo_url.split('/plats/')[1];
    if (path) {
      await supabaseClient.storage.from('plats').remove([path]);
    }
  }

  const { error } = await supabaseClient.from('menu_items').delete().eq('id', id);
  if (error) {
    window.alert('La suppression a échoué, réessaie.');
    return;
  }
  loadDishes();
}
```

**Explication :** `dish.photo_url.split('/plats/')[1]` extrait le nom de fichier à partir de l'URL publique complète (ex. `https://xxx.supabase.co/storage/v1/object/public/plats/abc123.jpg` → `abc123.jpg`), nécessaire pour demander sa suppression du bucket via `storage.from('plats').remove([...])`.

- [ ] **Étape 2 : Vérifier dans le navigateur**

Se connecter à `admin.html`. Attendu : les 9 plats seedés s'affichent, groupés sous un titre par catégorie (Burgers, Kebabs / Tacos, etc.), chacun avec son placeholder "PHOTO" (aucun n'a encore de vraie photo). Les boutons ↑/↓/Modifier ne font rien pour l'instant (Tasks 7 et 9). Cliquer "Supprimer" sur un plat, confirmer → il disparaît de la liste et n'apparaît plus non plus sur `menu.html` après rechargement. **Recréer ce plat immédiatement après** (répéter l'insert SQL correspondant de la Task 1 via l'outil SQL, ou l'ajouter manuellement une fois la Task 7 livrée) pour ne pas perdre un plat réel du menu pendant ce test.

- [ ] **Étape 3 : Commit**

```bash
git add js/admin.js
git commit -m "feat(admin): liste des plats groupee par categorie + suppression"
```

---

### Task 7 : Formulaire d'ajout / édition (sans photo)

**Files:**
- Modify: `js/admin.js` (ajouter à la suite du fichier)

**Interfaces:**
- Consumes: `adminDishes`, `loadDishes()` (Task 6), éléments DOM du formulaire (Task 4)
- Produces: fonctions `openForm(dish)`, `closeForm()`, `populateCategorieSelect(selected)` — `openForm` et le payload construit dans le gestionnaire `submit` seront réutilisés/étendus par la Task 8

- [ ] **Étape 1 : Ajouter à la fin de `js/admin.js`**

```js
const formOverlay = document.getElementById('form-overlay');
const formClose = document.getElementById('form-close');
const dishForm = document.getElementById('dish-form');
const formTitle = document.getElementById('form-title');
const formError = document.getElementById('form-error');
const formSaveBtn = document.getElementById('form-save-btn');
const categorieSelect = document.getElementById('dish-categorie');
const categorieNewInput = document.getElementById('dish-categorie-new');
const addDishBtn = document.getElementById('add-dish-btn');
const dishPhotoInput = document.getElementById('dish-photo');

function populateCategorieSelect(selected) {
  const categories = [...new Set(adminDishes.map((d) => d.categorie))];
  categorieSelect.innerHTML = '';
  categories.forEach((cat) => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categorieSelect.appendChild(option);
  });
  const newOption = document.createElement('option');
  newOption.value = '__new__';
  newOption.textContent = '+ Nouvelle catégorie…';
  categorieSelect.appendChild(newOption);

  if (selected && categories.includes(selected)) {
    categorieSelect.value = selected;
  }
  categorieNewInput.hidden = categorieSelect.value !== '__new__';
}

categorieSelect.addEventListener('change', () => {
  categorieNewInput.hidden = categorieSelect.value !== '__new__';
});

function openForm(dish) {
  dishForm.reset();
  document.getElementById('dish-id').value = dish ? dish.id : '';
  formTitle.textContent = dish ? 'Modifier le plat' : 'Ajouter un plat';
  populateCategorieSelect(dish ? dish.categorie : '');
  document.getElementById('dish-nom').value = dish ? dish.nom : '';
  document.getElementById('dish-prix').value = dish ? dish.prix : '';
  document.getElementById('dish-description').value = dish ? dish.description : '';
  formError.hidden = true;
  formOverlay.classList.add('modal-overlay--open');
}

function closeForm() {
  formOverlay.classList.remove('modal-overlay--open');
}

addDishBtn.addEventListener('click', () => openForm(null));
formClose.addEventListener('click', closeForm);
formOverlay.addEventListener('click', (event) => {
  if (event.target === formOverlay) closeForm();
});

dishListEl.addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-action="edit"]');
  if (!btn) return;
  const dish = adminDishes.find((d) => d.id === btn.dataset.id);
  openForm(dish);
});

dishForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  formError.hidden = true;
  formSaveBtn.disabled = true;

  const id = document.getElementById('dish-id').value;
  const categorie = categorieSelect.value === '__new__'
    ? categorieNewInput.value.trim()
    : categorieSelect.value;
  const nom = document.getElementById('dish-nom').value.trim();
  const prix = document.getElementById('dish-prix').value.trim();
  const description = document.getElementById('dish-description').value.trim();

  if (!categorie) {
    formError.textContent = 'La catégorie est obligatoire.';
    formError.hidden = false;
    formSaveBtn.disabled = false;
    return;
  }

  const payload = { categorie, nom, prix, description };

  let error;
  if (id) {
    ({ error } = await supabaseClient.from('menu_items').update(payload).eq('id', id));
  } else {
    const existingInCat = adminDishes.filter((d) => d.categorie === categorie).length;
    payload.ordre = existingInCat + 1;
    ({ error } = await supabaseClient.from('menu_items').insert(payload));
  }

  formSaveBtn.disabled = false;

  if (error) {
    formError.textContent = 'La sauvegarde a échoué, réessaie.';
    formError.hidden = false;
    return;
  }

  closeForm();
  loadDishes();
});
```

**Explication :** `dishPhotoInput` est déclaré ici (utilisé seulement à la Task 8) pour que la déclaration `const` soit centralisée avec les autres éléments du formulaire plutôt que dispersée entre deux tâches.

- [ ] **Étape 2 : Vérifier dans le navigateur**

Se connecter à `admin.html`. Cliquer "+ Ajouter un plat" → formulaire vide, choisir "+ Nouvelle catégorie…", taper "Test", nom "Plat test", prix "1,00 €" → Enregistrer. Vérifier qu'il apparaît dans la liste admin sous une catégorie "Test", et sur `menu.html` (recharger la page) dans le filtre "Test". Cliquer "Modifier" dessus, changer le nom → vérifier la mise à jour des deux côtés. Cliquer "Supprimer" (Task 6) pour nettoyer ce plat de test.

- [ ] **Étape 3 : Commit**

```bash
git add js/admin.js
git commit -m "feat(admin): formulaire ajout/edition d'un plat (sans photo)"
```

---

### Task 8 : Upload photo avec compression côté client

**Files:**
- Modify: `js/admin.js` (ajouter les fonctions de compression/upload, remplacer le gestionnaire `submit` de la Task 7)

**Interfaces:**
- Consumes: `dishPhotoInput`, `adminDishes` (Task 7), bucket Storage `plats` (Task 1)
- Produces: fonctions `compressImage(file, maxWidth, quality)`, `uploadDishPhoto(file)` ; le gestionnaire `submit` inclut désormais `photo_url` dans le payload

- [ ] **Étape 1 : Ajouter à la fin de `js/admin.js` les fonctions de compression et d'upload**

```js
function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (event) => {
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadDishPhoto(file) {
  const compressed = await compressImage(file);
  const fileName = `${crypto.randomUUID()}.jpg`;
  const { error: uploadError } = await supabaseClient.storage
    .from('plats')
    .upload(fileName, compressed, { contentType: 'image/jpeg' });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabaseClient.storage.from('plats').getPublicUrl(fileName);
  return data.publicUrl;
}
```

**Explication :** `FileReader` lit le fichier choisi et le convertit en une chaîne de données affichable dans une `<img>` en mémoire ; `<canvas>` redessine cette image à une taille réduite (`maxWidth` 1200px max) puis `toBlob(..., 'image/jpeg', 0.8)` la ré-encode en JPEG à 80% de qualité — une photo de téléphone de 3-8 Mo redescend typiquement sous 200-400 Ko après ce traitement, sans changement visible à l'écran.

- [ ] **Étape 2 : Remplacer le gestionnaire `submit` ajouté à la Task 7 par cette version complète**

```js
dishForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  formError.hidden = true;
  formSaveBtn.disabled = true;

  const id = document.getElementById('dish-id').value;
  const categorie = categorieSelect.value === '__new__'
    ? categorieNewInput.value.trim()
    : categorieSelect.value;
  const nom = document.getElementById('dish-nom').value.trim();
  const prix = document.getElementById('dish-prix').value.trim();
  const description = document.getElementById('dish-description').value.trim();
  const file = dishPhotoInput.files[0];

  if (!categorie) {
    formError.textContent = 'La catégorie est obligatoire.';
    formError.hidden = false;
    formSaveBtn.disabled = false;
    return;
  }

  const payload = { categorie, nom, prix, description };
  const existingDish = id ? adminDishes.find((d) => d.id === id) : null;

  if (file) {
    try {
      payload.photo_url = await uploadDishPhoto(file);
    } catch (uploadErr) {
      formError.textContent = "L'envoi de la photo a échoué, réessaie.";
      formError.hidden = false;
      formSaveBtn.disabled = false;
      return;
    }
  }

  let error;
  if (id) {
    ({ error } = await supabaseClient.from('menu_items').update(payload).eq('id', id));
  } else {
    const existingInCat = adminDishes.filter((d) => d.categorie === categorie).length;
    payload.ordre = existingInCat + 1;
    ({ error } = await supabaseClient.from('menu_items').insert(payload));
  }

  formSaveBtn.disabled = false;

  if (error) {
    formError.textContent = 'La sauvegarde a échoué, réessaie.';
    formError.hidden = false;
    return;
  }

  if (file && existingDish && existingDish.photo_url) {
    const oldPath = existingDish.photo_url.split('/plats/')[1];
    if (oldPath) {
      await supabaseClient.storage.from('plats').remove([oldPath]);
    }
  }

  closeForm();
  loadDishes();
});
```

**Explication :** en cas d'édition avec remplacement de photo, l'ancien fichier est supprimé du bucket *après* la réussite de la sauvegarde en base (jamais avant, pour ne pas perdre la photo si la sauvegarde échoue en cours de route).

- [ ] **Étape 3 : Vérifier dans le navigateur**

Ajouter un plat de test avec une photo (prendre une photo ou en choisir une petite). Vérifier : la vignette apparaît dans la liste admin et sur `menu.html` (liste + modale), sans déformation. Dans le dashboard Supabase (Storage → bucket `plats`), vérifier que le fichier uploadé fait quelques centaines de Ko maximum, pas plusieurs Mo. Modifier ce plat en changeant sa photo → vérifier que l'ancienne photo n'est plus dans le bucket après. Supprimer le plat de test pour nettoyer (Task 6).

- [ ] **Étape 4 : Commit**

```bash
git add js/admin.js
git commit -m "feat(admin): upload photo avec compression cote client"
```

---

### Task 9 : Réordonnancement des plats (boutons ↑ / ↓)

**Files:**
- Modify: `js/admin.js` (ajouter à la suite du fichier)

**Interfaces:**
- Consumes: `adminDishes`, `loadDishes()` (Task 6)
- Produces: comportement des boutons `data-action="up"`/`data-action="down"` déjà présents dans le markup rendu par `renderAdminList()` (Task 6)

- [ ] **Étape 1 : Ajouter à la fin de `js/admin.js`**

```js
dishListEl.addEventListener('click', async (event) => {
  const btn = event.target.closest('button[data-action="up"], button[data-action="down"]');
  if (!btn) return;

  const direction = btn.dataset.action;
  const dish = adminDishes.find((d) => d.id === btn.dataset.id);
  if (!dish) return;

  const sameCategory = adminDishes
    .filter((d) => d.categorie === dish.categorie)
    .sort((a, b) => a.ordre - b.ordre);
  const index = sameCategory.findIndex((d) => d.id === dish.id);
  const targetIndex = direction === 'up' ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= sameCategory.length) return;

  const target = sameCategory[targetIndex];
  const dishOrdre = dish.ordre;
  const targetOrdre = target.ordre;

  const [{ error: error1 }, { error: error2 }] = await Promise.all([
    supabaseClient.from('menu_items').update({ ordre: targetOrdre }).eq('id', dish.id),
    supabaseClient.from('menu_items').update({ ordre: dishOrdre }).eq('id', target.id)
  ]);

  if (error1 || error2) {
    window.alert('Le réordonnancement a échoué, réessaie.');
    return;
  }

  loadDishes();
});
```

**Explication :** ce gestionnaire de clic est ajouté en plus de ceux des Tasks 6 (`delete`) et 7 (`edit`) sur le même élément `dishListEl` — chaque gestionnaire filtre avec `.closest('button[data-action="..."]')` et ignore silencieusement les clics qui ne le concernent pas, donc les trois coexistent sans conflit.

- [ ] **Étape 2 : Vérifier dans le navigateur**

Dans la catégorie "Accompagnements" (Frites en position 1, Nuggets en position 2), cliquer "↓" sur Frites → Frites doit passer après Nuggets dans la liste admin, et pareil sur `menu.html` après rechargement. Cliquer "↑" sur Nuggets pour remettre l'ordre d'origine. Vérifier que cliquer "↑" sur le premier élément d'une catégorie (ou "↓" sur le dernier) ne fait rien (pas d'erreur).

- [ ] **Étape 3 : Commit**

```bash
git add js/admin.js
git commit -m "feat(admin): reordonnancement des plats (haut/bas)"
```

---

### Task 10 : Nettoyage final, vérification bout-en-bout, déploiement

**Files:**
- Delete: `data/menu.js`

**Interfaces:**
- Consumes: tout ce qui précède
- Produces: état final déployé, plus aucune référence au fichier de données statique

- [ ] **Étape 1 : Vérifier qu'aucun fichier ne référence plus `data/menu.js`**

```bash
grep -rn "data/menu.js" --include="*.html" .
```
Attendu : aucun résultat (la Task 3 a déjà retiré la balise `<script>` correspondante de `menu.html`, et aucune autre page ne le chargeait).

- [ ] **Étape 2 : Supprimer le fichier**

```bash
git rm data/menu.js
```

- [ ] **Étape 3 : Vérification bout-en-bout complète (liste de contrôle)**

Sur `admin.html` (local) :
- Connexion avec un mauvais mot de passe → message d'erreur
- Connexion avec le bon mot de passe → panneau visible, 9 plats groupés par catégorie
- Ajout d'un plat avec photo → visible admin + `menu.html`
- Édition de ce plat (nom, prix, remplacement de la photo) → mise à jour visible des deux côtés
- Réordonnancement (↑/↓) → ordre mis à jour des deux côtés
- Suppression de ce plat de test → disparaît des deux côtés, photo retirée du bucket
- Déconnexion → retour à l'écran de connexion

Sur `menu.html` (local, sans être connecté à l'admin) : ouvrir la console et exécuter
```js
await supabaseClient.from('menu_items').insert({ categorie: 'Test', nom: 'Hack', prix: '0€' })
```
Attendu : la réponse contient un `error` (violation RLS) — confirme qu'une écriture anonyme est bien rejetée.

- [ ] **Étape 4 : Commit final et push**

```bash
git add -A
git commit -m "feat(admin): supprime data/menu.js, migration Supabase complete"
git push
```

- [ ] **Étape 5 : Vérifier le site live**

Attendre le redéploiement Vercel, puis répéter la liste de contrôle de l'Étape 3 sur `https://willy-snackk.vercel.app/admin.html` et `https://willy-snackk.vercel.app/menu.html` (URLs live, pas locales).
