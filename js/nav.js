const navToggle = document.getElementById('nav-toggle');
const navList = document.getElementById('nav-list');

function setMenu(ouvert) {
  navList.classList.toggle('nav__list--open', ouvert);
  navToggle.setAttribute('aria-expanded', String(ouvert));
  // sans cela un lecteur d'ecran annonce "Ouvrir le menu" alors qu'il est ouvert
  navToggle.setAttribute('aria-label', ouvert ? 'Fermer le menu' : 'Ouvrir le menu');
}

navToggle.addEventListener('click', () => {
  setMenu(!navList.classList.contains('nav__list--open'));
});

// Le panneau recouvre le contenu : sans ces deux sorties, le seul moyen de le
// refermer est de retrouver le bouton qui l'a ouvert.
document.addEventListener('click', (event) => {
  if (!navList.classList.contains('nav__list--open')) return;
  if (navToggle.contains(event.target) || navList.contains(event.target)) return;
  setMenu(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (!navList.classList.contains('nav__list--open')) return;
  setMenu(false);
  navToggle.focus();
});
