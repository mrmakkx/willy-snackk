const navToggle = document.getElementById('nav-toggle');
const navList = document.getElementById('nav-list');

navToggle.addEventListener('click', () => {
  const isOpen = navList.classList.toggle('nav__list--open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});
