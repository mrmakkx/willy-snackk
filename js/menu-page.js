const filterBar = document.getElementById('filter-bar');
const dishList = document.getElementById('dish-list');

const categories = ['Tout', ...new Set(MENU_DATA.map((dish) => dish.cat))];

const params = new URLSearchParams(window.location.search);
let activeCategory = params.get('cat') || 'Tout';
if (!categories.includes(activeCategory)) {
  activeCategory = 'Tout';
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
    row.innerHTML = `
      <div class="dish-row__thumb photo-placeholder">PHOTO</div>
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
  // Complete a la Task 10
}

renderChips();
renderDishes();
