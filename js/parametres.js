// Reglages du site, charges depuis la base et appliques aux pages publiques.
//
// Le HTML garde des valeurs ecrites en dur : elles servent de repli si la base
// est injoignable ou si le script echoue. Le visiteur voit alors les dernieres
// valeurs connues plutot qu'une page trouee.

function appliquerTelephone(r) {
  document.querySelectorAll('[data-tel-lien]').forEach((el) => {
    el.setAttribute('href', 'tel:' + r.telephone_lien);
  });
  document.querySelectorAll('[data-tel-texte]').forEach((el) => {
    el.textContent = '☎ ' + r.telephone;
  });
}

function appliquerTextes(r) {
  document.querySelectorAll('[data-nom]').forEach((el) => { el.textContent = r.nom; });
  document.querySelectorAll('[data-ville]').forEach((el) => { el.textContent = r.ville; });
  document.querySelectorAll('[data-code-postal]').forEach((el) => {
    el.textContent = r.code_postal + ' ' + r.ville;
  });
  document.querySelectorAll('[data-itineraire]').forEach((el) => {
    el.setAttribute('href', 'https://www.google.com/maps/dir/?api=1&destination='
      + encodeURIComponent(r.code_postal + ' ' + r.ville));
  });
}

// Fermeture exceptionnelle : le message doit etre impossible a manquer, sinon
// un client se deplace pour rien. C'est la raison d'etre de tout ce fichier.
function appliquerBandeauFermeture(r) {
  const zone = document.getElementById('bandeau-fermeture');
  if (!zone || !r.fermeture_active) return;

  const texte = document.createElement('p');
  texte.className = 'bandeau-fermeture__texte';
  texte.textContent = r.fermeture_message && r.fermeture_message.trim()
    ? r.fermeture_message.trim()
    : 'Fermeture exceptionnelle.';
  zone.appendChild(texte);

  if (r.fermeture_retour) {
    const retour = document.createElement('p');
    retour.className = 'bandeau-fermeture__retour';
    const d = new Date(r.fermeture_retour + 'T12:00:00');
    retour.textContent = 'Réouverture le ' + new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long'
    }).format(d) + '.';
    zone.appendChild(retour);
  }

  zone.hidden = false;
}

// Le balisage Schema.org est ecrit en dur pour les robots qui n'executent pas
// de JavaScript ; on le reecrit ici pour qu'il suive les horaires reels.
function majBalisageHoraires(r) {
  const balise = document.querySelector('script[type="application/ld+json"]');
  if (!balise) return;

  let donnees;
  try {
    donnees = JSON.parse(balise.textContent);
  } catch {
    return;
  }

  const EN = {
    lundi: 'Monday', mardi: 'Tuesday', mercredi: 'Wednesday', jeudi: 'Thursday',
    vendredi: 'Friday', samedi: 'Saturday', dimanche: 'Sunday'
  };

  const specs = [];
  Object.entries(r.horaires || {}).forEach(([jour, creneaux]) => {
    (creneaux || []).forEach(([debut, fin]) => {
      specs.push({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [EN[jour]],
        opens: debut,
        closes: fin
      });
    });
  });

  donnees.openingHoursSpecification = specs;
  donnees.name = r.nom;
  donnees.telephone = r.telephone_lien;
  if (donnees.address) {
    donnees.address.addressLocality = r.ville;
    donnees.address.postalCode = r.code_postal;
  }
  balise.textContent = JSON.stringify(donnees, null, 2);
}

// Expose la promesse : statut.js et contact attendent les reglages avant de
// s'afficher, pour ne jamais annoncer un horaire perime.
window.reglagesCharges = (async () => {
  let reglages = null;
  try {
    const { data, error } = await supabaseClient
      .from('parametres')
      .select('*')
      .eq('id', 1)
      .single();
    if (!error) reglages = data;
  } catch {
    reglages = null;
  }
  if (!reglages) return null;

  appliquerTelephone(reglages);
  appliquerTextes(reglages);
  appliquerBandeauFermeture(reglages);
  majBalisageHoraires(reglages);
  return reglages;
})();
