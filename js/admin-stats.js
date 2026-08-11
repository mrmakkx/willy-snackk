// Onglet "Frequentation" : de quoi repondre a "est-ce que ce site me sert ?".
//
// Les compteurs sont anonymes (voir js/mesure.js) : on ne peut donc pas parler
// de "visiteurs uniques", seulement de pages consultees. Les libelles disent
// exactement cela, pour ne rien promettre que la mesure ne sache tenir.

(function () {
  const zone = document.getElementById('stats-contenu');
  if (!zone) return;

  const NOMS_PAGES = {
    accueil: 'Accueil',
    carte: 'La carte',
    contact: 'Contact',
    legal: 'Pages légales'
  };

  function ilYAJours(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  function bloc(parent, classe) {
    const el = document.createElement('div');
    el.className = classe;
    parent.appendChild(el);
    return el;
  }

  function chiffreCle(parent, valeur, libelle, precision) {
    const carte = bloc(parent, 'stat-carte');
    const v = document.createElement('div');
    v.className = 'stat-carte__valeur';
    v.textContent = String(valeur);
    const l = document.createElement('div');
    l.className = 'stat-carte__libelle';
    l.textContent = libelle;
    carte.appendChild(v);
    carte.appendChild(l);
    if (precision) {
      const p = document.createElement('div');
      p.className = 'stat-carte__precision';
      p.textContent = precision;
      carte.appendChild(p);
    }
  }

  function titre(parent, texte) {
    const h = document.createElement('h2');
    h.className = 'stat-titre';
    h.textContent = texte;
    parent.appendChild(h);
  }

  function listeClassee(parent, entrees, vide) {
    if (!entrees.length) {
      const p = document.createElement('p');
      p.className = 'stat-vide';
      p.textContent = vide;
      parent.appendChild(p);
      return;
    }
    const max = entrees[0][1];
    const liste = document.createElement('ol');
    liste.className = 'stat-liste';
    entrees.forEach(([nom, valeur]) => {
      const item = document.createElement('li');
      const etiquette = document.createElement('span');
      etiquette.className = 'stat-liste__nom';
      etiquette.textContent = nom;
      const barre = document.createElement('span');
      barre.className = 'stat-liste__barre';
      barre.style.width = Math.round((valeur / max) * 100) + '%';
      const nombre = document.createElement('span');
      nombre.className = 'stat-liste__valeur';
      nombre.textContent = String(valeur);
      item.appendChild(etiquette);
      item.appendChild(barre);
      item.appendChild(nombre);
      liste.appendChild(item);
    });
    parent.appendChild(liste);
  }

  function histogramme(parent, parJour) {
    const jours = Object.keys(parJour).sort();
    const max = Math.max(1, ...jours.map((j) => parJour[j]));
    const graphe = document.createElement('div');
    graphe.className = 'stat-graphe';
    jours.forEach((jour) => {
      const colonne = document.createElement('div');
      colonne.className = 'stat-graphe__colonne';
      colonne.title = `${jour} : ${parJour[jour]} page(s) vue(s)`;
      const barre = document.createElement('div');
      barre.className = 'stat-graphe__barre';
      barre.style.height = Math.max(2, Math.round((parJour[jour] / max) * 100)) + '%';
      const etiquette = document.createElement('div');
      etiquette.className = 'stat-graphe__jour';
      etiquette.textContent = jour.slice(8) + '/' + jour.slice(5, 7);
      colonne.appendChild(barre);
      colonne.appendChild(etiquette);
      graphe.appendChild(colonne);
    });
    parent.appendChild(graphe);
  }

  async function charger() {
    zone.textContent = 'Chargement…';

    const { data, error } = await supabaseClient
      .from('visites')
      .select('jour, page, evenement, detail')
      .gte('jour', ilYAJours(29));

    zone.textContent = '';

    if (error) {
      const p = document.createElement('p');
      p.className = 'admin-form__error';
      p.textContent = "Les statistiques n'ont pas pu être chargées.";
      zone.appendChild(p);
      return;
    }

    const lignes = data || [];
    const depuis7 = ilYAJours(6);
    const vues = lignes.filter((l) => l.evenement === 'vue');
    const vues7 = vues.filter((l) => l.jour >= depuis7);
    const appels = lignes.filter((l) => l.evenement === 'appel');
    const appels7 = appels.filter((l) => l.jour >= depuis7);
    const itineraires = lignes.filter((l) => l.evenement === 'itineraire');

    const cles = bloc(zone, 'stat-cles');
    chiffreCle(cles, vues7.length, 'pages vues', '7 derniers jours');
    chiffreCle(cles, vues.length, 'pages vues', '30 derniers jours');
    chiffreCle(cles, appels.length, 'clics sur « Appeler »', `dont ${appels7.length} cette semaine`);
    chiffreCle(cles, itineraires.length, "demandes d'itinéraire", '30 derniers jours');

    titre(zone, 'Ces 14 derniers jours');
    const parJour = {};
    for (let i = 13; i >= 0; i -= 1) parJour[ilYAJours(i)] = 0;
    vues.forEach((l) => { if (l.jour in parJour) parJour[l.jour] += 1; });
    histogramme(zone, parJour);

    titre(zone, 'Pages les plus consultées');
    const parPage = {};
    vues.forEach((l) => { parPage[l.page] = (parPage[l.page] || 0) + 1; });
    listeClassee(
      zone,
      Object.entries(parPage).sort((a, b) => b[1] - a[1]).map(([p, n]) => [NOMS_PAGES[p] || p, n]),
      "Aucune visite enregistrée pour l'instant."
    );

    titre(zone, 'Plats les plus regardés');
    const parPlat = {};
    lignes.filter((l) => l.evenement === 'plat' && l.detail)
      .forEach((l) => { parPlat[l.detail] = (parPlat[l.detail] || 0) + 1; });
    listeClassee(
      zone,
      Object.entries(parPlat).sort((a, b) => b[1] - a[1]).slice(0, 8),
      "Personne n'a encore ouvert la fiche d'un plat."
    );

    const note = document.createElement('p');
    note.className = 'stat-note';
    note.textContent = 'Comptage anonyme : ni adresse IP, ni cookie, ni identifiant de visiteur. '
      + 'Ces chiffres comptent des pages vues, pas des personnes.';
    zone.appendChild(note);
  }

  window.chargerStats = charger;
}());
