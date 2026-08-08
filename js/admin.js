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

  // Empeche la double soumission pendant l'aller-retour reseau.
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password
    });

    if (error) {
      // textContent reassigne a chaque fois : sans ca, le message generique
      // du catch restait affiche lors des tentatives suivantes.
      loginError.textContent = 'Mot de passe incorrect.';
      loginError.hidden = false;
      return;
    }

    showPanel();
  } catch (err) {
    loginError.textContent = 'Une erreur est survenue, réessaie.';
    loginError.hidden = false;
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});

logoutBtn.addEventListener('click', async () => {
  try {
    await supabaseClient.auth.signOut();
  } catch (err) {
    // Ignore: being logged out locally is safe even if the server-side
    // session wasn't cleanly invalidated.
  } finally {
    showLogin();
  }
});

async function checkSession() {
  try {
    const { data } = await supabaseClient.auth.getSession();
    if (data.session) {
      showPanel();
    } else {
      showLogin();
    }
  } catch (err) {
    showLogin();
  }
}

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

  // La ligne d'abord, la photo ensuite : dans l'ordre inverse, un echec du
  // delete laissait une ligne pointant vers une photo supprimee, donc une
  // image cassee sur la carte publique.
  const { error } = await supabaseClient.from('menu_items').delete().eq('id', id);
  if (error) {
    window.alert('La suppression a échoué, réessaie.');
    return;
  }

  if (dish.photo_url) {
    const path = dish.photo_url.split('/plats/')[1];
    if (path) {
      const { error: storageError } = await supabaseClient.storage
        .from('plats')
        .remove([path]);
      if (storageError) {
        console.warn('Photo orpheline laissee dans le bucket :', path, storageError);
      }
    }
  }

  loadDishes();
}

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
  if (!dish) return;
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
    loadDishes();
    return;
  }

  loadDishes();
});

checkSession();
