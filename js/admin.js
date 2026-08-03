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
