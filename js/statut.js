// Badge "ouvert / ferme" calcule en direct.
//
// Les horaires ne sont pas ecrits ici : ils sont lus dans le balisage
// Schema.org de la page (openingHoursSpecification), qui sert aussi a Google.
// Une seule source de verite, donc pas de risque que le badge et le tableau
// des horaires finissent par se contredire.

const JOURS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const JOURS_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

function enMinutes(heure) {
  const [h, m] = String(heure).split(':');
  return Number(h) * 60 + Number(m || 0);
}

function lireCreneaux() {
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

  // index par jour de la semaine (0 = dimanche), chaque jour = liste de creneaux
  const parJour = JOURS.map(() => []);
  specs.forEach((spec) => {
    const jours = Array.isArray(spec.dayOfWeek) ? spec.dayOfWeek : [spec.dayOfWeek];
    jours.forEach((nom) => {
      const i = JOURS.indexOf(nom);
      if (i === -1) return;
      parJour[i].push({ debut: enMinutes(spec.opens), fin: enMinutes(spec.closes) });
    });
  });
  parJour.forEach((creneaux) => creneaux.sort((a, b) => a.debut - b.debut));
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
    jour: JOURS.indexOf(get('weekday')),
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
  return null;
}

function afficher() {
  const cibles = document.querySelectorAll('[data-statut]');
  if (!cibles.length) return;

  const parJour = lireCreneaux();
  if (!parJour) return;

  const statut = calculerStatut(parJour, maintenantSurPlace());
  if (!statut) return;

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

afficher();
// une page laissee ouverte doit basculer d'elle-meme a l'heure de fermeture
setInterval(afficher, 60000);
