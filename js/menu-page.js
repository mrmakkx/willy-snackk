const filterBar = document.getElementById('filter-bar');
const filterScroll = document.getElementById('filter-scroll');
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
let lastFocused = null;

function showLoading() {
  menuError.hidden = true;
  dishList.innerHTML = '';
  for (let i = 0; i < 4; i += 1) {
    const skeleton = document.createElement('div');
    skeleton.className = 'dish-row dish-row--skeleton';
    skeleton.setAttribute('aria-hidden', 'true');
    dishList.appendChild(skeleton);
  }
  dishList.setAttribute('aria-busy', 'true');
}

function showError() {
  dishList.innerHTML = '';
  dishList.removeAttribute('aria-busy');
  menuError.hidden = false;
  if (!document.getElementById('menu-retry')) {
    const retry = document.createElement('button');
    retry.id = 'menu-retry';
    retry.type = 'button';
    retry.className = 'btn btn--outline';
    retry.textContent = 'Réessayer';
    retry.addEventListener('click', loadMenu);
    menuError.insertAdjacentElement('afterend', retry);
  }
}

function clearError() {
  menuError.hidden = true;
  const retry = document.getElementById('menu-retry');
  if (retry) retry.remove();
}

async function loadMenu() {
  clearError();
  showLoading();

  try {
    const { data, error } = await supabaseClient
      .from('menu_items')
      .select('*')
      .order('categorie', { ascending: true })
      .order('ordre', { ascending: true });

    if (error) {
      showError();
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

    dishList.removeAttribute('aria-busy');
    renderChips();
    renderDishes();
  } catch {
    showError();
  }
}

// Signale qu'il reste des categories a droite : sur telephone, 3 des 7 sont
// hors ecran et la barre de defilement systeme y est invisible.
function majIndicateurFiltres() {
  const reste = filterBar.scrollWidth - filterBar.clientWidth - filterBar.scrollLeft;
  filterScroll.classList.toggle('filter-scroll--suite', reste > 4);
}

filterBar.addEventListener('scroll', majIndicateurFiltres);
window.addEventListener('resize', majIndicateurFiltres);

function renderChips() {
  filterBar.innerHTML = '';
  categories.forEach((cat) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (cat === activeCategory ? ' chip--active' : '');
    chip.textContent = cat;
    chip.setAttribute('aria-pressed', String(cat === activeCategory));
    chip.addEventListener('click', () => {
      activeCategory = cat;
      renderChips();
      renderDishes();
    });
    filterBar.appendChild(chip);
  });
  majIndicateurFiltres();
}

function renderDishes() {
  dishList.innerHTML = '';
  const dishes = activeCategory === 'Tout'
    ? MENU_DATA
    : MENU_DATA.filter((dish) => dish.cat === activeCategory);

  dishes.forEach((dish) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'dish-row';

    if (dish.photo) {
      const img = document.createElement('img');
      img.src = dish.photo;
      img.alt = dish.nom;
      img.className = 'dish-row__thumb';
      img.loading = 'lazy';
      row.appendChild(img);
    } else {
      const placeholder = document.createElement('span');
      placeholder.className = 'dish-row__thumb photo-placeholder';
      placeholder.textContent = 'PHOTO';
      row.appendChild(placeholder);
    }

    const info = document.createElement('span');
    info.className = 'dish-row__info';

    const top = document.createElement('span');
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
      // <span>, pas <p> : un <button> n'accepte que du contenu de phrase.
      const desc = document.createElement('span');
      desc.className = 'dish-row__desc';
      desc.textContent = dish.desc;
      info.appendChild(desc);
    }

    row.appendChild(info);
    row.addEventListener('click', () => openModal(dish, row));
    dishList.appendChild(row);
  });
}

function openModal(dish, trigger) {
  lastFocused = trigger || document.activeElement;

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
  if (lastFocused && document.contains(lastFocused)) {
    lastFocused.focus();
  }
  lastFocused = null;
}

function isModalOpen() {
  return modalOverlay.classList.contains('modal-overlay--open');
}

modalClose.addEventListener('click', closeModal);

modalOverlay.addEventListener('click', (event) => {
  if (event.target === modalOverlay) {
    closeModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (!isModalOpen()) return;

  if (event.key === 'Escape') {
    closeModal();
    return;
  }

  // Piege le focus dans la modale : sans ca, Tab navigue derriere elle.
  if (event.key === 'Tab') {
    const focusables = modalOverlay.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

loadMenu();
