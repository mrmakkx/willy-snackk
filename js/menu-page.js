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
  try {
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
  } catch {
    menuError.hidden = false;
  }
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

    if (dish.photo) {
      const img = document.createElement('img');
      img.src = dish.photo;
      img.alt = dish.nom;
      img.className = 'dish-row__thumb';
      img.loading = 'lazy';
      row.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'dish-row__thumb photo-placeholder';
      placeholder.textContent = 'PHOTO';
      row.appendChild(placeholder);
    }

    const info = document.createElement('div');
    info.className = 'dish-row__info';

    const top = document.createElement('div');
    top.className = 'dish-row__top';
    const name = document.createElement('span');
    name.className = 'dish-row__name';
    name.textContent = dish.nom;
    const price = document.createElement('span');
    price.className = 'dish-row__price';
    price.textContent = dish.prix;
    top.appendChild(name);
    top.appendChild(price);
    info.appendChild(top);

    if (dish.desc) {
      const desc = document.createElement('p');
      desc.className = 'dish-row__desc';
      desc.textContent = dish.desc;
      info.appendChild(desc);
    }

    row.appendChild(info);
    row.addEventListener('click', () => openModal(dish));
    dishList.appendChild(row);
  });
}

function openModal(dish) {
  modalPhoto.innerHTML = '';
  if (dish.photo) {
    modalPhoto.classList.remove('photo-placeholder');
    const img = document.createElement('img');
    img.src = dish.photo;
    img.alt = dish.nom;
    img.className = 'modal__photo-img';
    modalPhoto.appendChild(img);
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
