// Badge "ouvert / ferme" calcule en direct.
//
// Les horaires viennent des reglages modifiables depuis l'admin. Si la base est
// injoignable, on retombe sur le balisage Schema.org ecrit en dur dans la page :
// mieux vaut un horaire theorique qu'aucune information.
//
// Une fermeture exceptionnelle l'emporte toujours sur l'horaire habituel : sans
// cela le badge annoncerait "Ouvert" pendant les conges, et un client se
// deplacerait pour rien.

const JOURS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const JOURS_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

function enMinutes(heure) {
  const [h, m] = String(heure).split(':');
  return Number(h) * 60 + Number(m || 0);
}

// depuis les reglages : { "lundi": [["11:00","14:00"], ...], "mardi": [] }
function creneauxDepuisReglages(horaires) {
  const parJour = JOURS_FR.map(() => []);
  Object.entries(horaires || {}).forEach(([jour, creneaux]) => {
    const i = JOURS_FR.indexOf(jour);
    if (i === -1) return;
    (creneaux || []).forEach(([debut, fin]) => {
      parJour[i].push({ debut: enMinutes(debut), fin: enMinutes(fin) });
    });
  });
  parJour.forEach((c) => c.sort((a, b) => a.debut - b.debut));
  return parJour;
}

// repli : balisage Schema.org de la page
function creneauxDepuisBalisage() {
  const balise = document.querySelector('script[type="application/ld+json"]');
  if (!balise) return null;

  let donnees;
  try {
    donnees = JSON.parse(balise.textContent);
  } catch {
    return null;
  }

  const specs = donnees.openingHoursSpecification;
  if (!Array.isArray(specs)) return null;

  const parJour = JOURS_EN.map(() => []);
  specs.forEach((spec) => {
    const jours = Array.isArray(spec.dayOfWeek) ? spec.dayOfWeek : [spec.dayOfWeek];
    jours.forEach((nom) => {
      const i = JOURS_EN.indexOf(nom);
      if (i === -1) return;
      parJour[i].push({ debut: enMinutes(spec.opens), fin: enMinutes(spec.closes) });
    });
  });
  parJour.forEach((c) => c.sort((a, b) => a.debut - b.debut));
  return parJour;
}

// L'heure du telephone du visiteur peut etre celle d'un autre fuseau : on
// raisonne sur l'heure de l'etablissement, pas sur celle de l'appareil.
function maintenantSurPlace() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date());

  const get = (type) => parts.find((p) => p.type === type).value;
  return {
    jour: JOURS_EN.indexOf(get('weekday')),
    minutes: Number(get('hour')) * 60 + Number(get('minute'))
  };
}

function formaterHeure(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

function calculerStatut(parJour, instant) {
  const { jour, minutes } = instant;

  const ouvert = (parJour[jour] || []).find((c) => minutes >= c.debut && minutes < c.fin);
  if (ouvert) {
    return { ouvert: true, texte: `Ouvert · ferme à ${formaterHeure(ouvert.fin)}` };
  }

  const plusTard = (parJour[jour] || []).find((c) => c.debut > minutes);
  if (plusTard) {
    return { ouvert: false, texte: `Fermé · ouvre à ${formaterHeure(plusTard.debut)}` };
  }

  for (let ecart = 1; ecart <= 7; ecart += 1) {
    const j = (jour + ecart) % 7;
    const creneaux = parJour[j];
    if (creneaux && creneaux.length) {
      const quand = ecart === 1 ? 'demain' : JOURS_FR[j];
      return { ouvert: false, texte: `Fermé · ouvre ${quand} à ${formaterHeure(creneaux[0].debut)}` };
    }
  }
  return { ouvert: false, texte: 'Horaires à venir' };
}

function statutFermetureExceptionnelle(reglages) {
  if (!reglages || !reglages.fermeture_active) return null;
  if (!reglages.fermeture_retour) {
    return { ouvert: false, texte: 'Fermé exceptionnellement' };
  }
  const d = new Date(reglages.fermeture_retour + 'T12:00:00');
  const quand = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(d);
  return { ouvert: false, texte: `Fermé · retour le ${quand}` };
}

let reglagesCourants = null;

function afficher() {
  const cibles = document.querySelectorAll('[data-statut]');
  if (!cibles.length) return;

  const parJour = reglagesCourants
    ? creneauxDepuisReglages(reglagesCourants.horaires)
    : creneauxDepuisBalisage();
  if (!parJour) return;

  const statut = statutFermetureExceptionnelle(reglagesCourants)
    || calculerStatut(parJour, maintenantSurPlace());

  cibles.forEach((cible) => {
    cible.classList.toggle('status--ouvert', statut.ouvert);
    cible.classList.toggle('status--ferme', !statut.ouvert);
    const texte = cible.querySelector('.status__text');
    if (texte) texte.textContent = statut.texte;
    // masque tant que le statut n'est pas calcule : mieux vaut rien afficher
    // qu'un "ouvert" par defaut qui serait faux
    cible.hidden = false;
  });
}

(async () => {
  if (window.reglagesCharges) {
    reglagesCourants = await window.reglagesCharges;
  }
  afficher();
  // une page laissee ouverte doit basculer d'elle-meme a l'heure de fermeture
  setInterval(afficher, 60000);
})();
