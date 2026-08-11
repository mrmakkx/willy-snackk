// Comptage de frequentation, pour que l'exploitant sache si son site sert.
//
// Volontairement minimal : on n'enregistre ni adresse IP, ni navigateur, ni
// identifiant de visiteur, et aucun cookie n'est depose. Uniquement "telle page
// a ete vue tel jour". Rien ici ne permet de reconnaitre ou de suivre quelqu'un,
// ce qui evite d'avoir a demander un consentement.

(function () {
  const PAGES = {
    'index.html': 'accueil',
    '': 'accueil',
    'menu.html': 'carte',
    'contact.html': 'contact',
    'mentions-legales.html': 'legal',
    'confidentialite.html': 'legal'
  };

  const fichier = window.location.pathname.split('/').pop();
  const page = PAGES[fichier];
  if (!page) return;

  function enregistrer(evenement, detail) {
    if (typeof supabaseClient === 'undefined') return;
    // insertion en arriere-plan : un echec de comptage ne doit jamais gener
    // le visiteur ni retarder l'affichage
    supabaseClient
      .from('visites')
      .insert({ page, evenement, detail: detail ? String(detail).slice(0, 80) : null })
      .then(() => {}, () => {});
  }

  window.mesurer = enregistrer;

  enregistrer('vue');

  document.addEventListener('click', (event) => {
    const lien = event.target.closest('a');
    if (!lien) return;
    const href = lien.getAttribute('href') || '';
    if (href.startsWith('tel:')) enregistrer('appel');
    else if (lien.hasAttribute('data-itineraire')) enregistrer('itineraire');
  });
}());
