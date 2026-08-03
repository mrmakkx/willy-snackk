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

      if (dish.photo_url) {
        const img = document.createElement('img');
        img.src = dish.photo_url;
        img.alt = dish.nom;
        img.className = 'admin-dish-row__thumb';
        row.appendChild(img);
      } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'admin-dish-row__thumb photo-placeholder';
        placeholder.textContent = 'PHOTO';
        row.appendChild(placeholder);
      }

      const info = document.createElement('div');
      info.className = 'admin-dish-row__info';
      const name = document.createElement('div');
      name.className = 'admin-dish-row__name';
      name.textContent = dish.nom;
      const price = document.createElement('div');
      price.className = 'admin-dish-row__price';
      price.textContent = dish.prix;
      info.appendChild(name);
      info.appendChild(price);
      row.appendChild(info);

      const actions = document.createElement('div');
      actions.className = 'admin-dish-row__actions';
      [
        { action: 'up', label: '↑' },
        { action: 'down', label: '↓' },
        { action: 'edit', label: 'Modifier' },
        { action: 'delete', label: 'Supprimer' }
      ].forEach(({ action, label }) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.action = action;
        btn.dataset.id = dish.id;
        btn.textContent = label;
        actions.appendChild(btn);
      });
      row.appendChild(actions);

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
