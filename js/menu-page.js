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
