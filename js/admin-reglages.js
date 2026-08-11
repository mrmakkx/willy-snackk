// Onglet "Reglages" : ce que l'exploitant devait jusqu'ici demander au
// developpeur — horaires, coordonnees, et surtout fermeture exceptionnelle.

(function () {
  const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

  const form = document.getElementById('reglages-form');
  const zoneJours = document.getElementById('horaires-jours');
  const erreur = document.getElementById('reglages-error');
  const ok = document.getElementById('reglages-ok');
  if (!form) return;

  // --- onglets ---
  document.querySelectorAll('.admin-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const cible = tab.dataset.onglet;
      document.querySelectorAll('.admin-tab').forEach((t) => {
        const actif = t === tab;
        t.classList.toggle('admin-tab--active', actif);
        t.setAttribute('aria-selected', String(actif));
      });
      document.querySelectorAll('.admin-onglet').forEach((p) => {
        p.hidden = p.dataset.panneau !== cible;
      });
      if (cible === 'frequentation' && typeof window.chargerStats === 'function') {
        window.chargerStats();
      }
    });
  });

  function construireJours() {
    zoneJours.innerHTML = '';
    JOURS.forEach((jour) => {
      const ligne = document.createElement('div');
      ligne.className = 'admin-jour';

      const titre = document.createElement('div');
      titre.className = 'admin-jour__nom';
      titre.textContent = jour.charAt(0).toUpperCase() + jour.slice(1);
      ligne.appendChild(titre);

      const ferme = document.createElement('label');
      ferme.className = 'admin-case admin-case--compacte';
      const caseFerme = document.createElement('input');
      caseFerme.type = 'checkbox';
      caseFerme.dataset.ferme = jour;
      const texteFerme = document.createElement('span');
      texteFerme.textContent = 'Fermé';
      ferme.appendChild(caseFerme);
      ferme.appendChild(texteFerme);
      ligne.appendChild(ferme);

      const creneaux = document.createElement('div');
      creneaux.className = 'admin-jour__creneaux';
      [1, 2].forEach((n) => {
        const paire = document.createElement('div');
        paire.className = 'admin-creneau';
        ['debut', 'fin'].forEach((bout) => {
          const champ = document.createElement('input');
          champ.type = 'time';
          champ.dataset.jour = jour;
          champ.dataset.creneau = n;
          champ.dataset.bout = bout;
          champ.setAttribute('aria-label',
            `${jour} — service ${n} ${bout === 'debut' ? 'ouverture' : 'fermeture'}`);
          paire.appendChild(champ);
        });
        creneaux.appendChild(paire);
      });
      ligne.appendChild(creneaux);

      caseFerme.addEventListener('change', () => {
        creneaux.querySelectorAll('input').forEach((i) => {
          i.disabled = caseFerme.checked;
          if (caseFerme.checked) i.value = '';
        });
      });

      zoneJours.appendChild(ligne);
    });
  }

  function remplirHoraires(horaires) {
    JOURS.forEach((jour) => {
      const creneaux = (horaires || {})[jour] || [];
      const caseFerme = zoneJours.querySelector(`[data-ferme="${jour}"]`);
      caseFerme.checked = creneaux.length === 0;
      [1, 2].forEach((n) => {
        const paire = creneaux[n - 1];
        const debut = zoneJours.querySelector(`[data-jour="${jour}"][data-creneau="${n}"][data-bout="debut"]`);
        const fin = zoneJours.querySelector(`[data-jour="${jour}"][data-creneau="${n}"][data-bout="fin"]`);
        debut.value = paire ? paire[0] : '';
        fin.value = paire ? paire[1] : '';
        debut.disabled = caseFerme.checked;
        fin.disabled = caseFerme.checked;
      });
    });
  }

  function lireHoraires() {
    const horaires = {};
    JOURS.forEach((jour) => {
      const caseFerme = zoneJours.querySelector(`[data-ferme="${jour}"]`);
      if (caseFerme.checked) {
        horaires[jour] = [];
        return;
      }
      const creneaux = [];
      [1, 2].forEach((n) => {
        const debut = zoneJours.querySelector(`[data-jour="${jour}"][data-creneau="${n}"][data-bout="debut"]`).value;
        const fin = zoneJours.querySelector(`[data-jour="${jour}"][data-creneau="${n}"][data-bout="fin"]`).value;
        if (debut && fin) creneaux.push([debut, fin]);
      });
      horaires[jour] = creneaux;
    });
    return horaires;
  }

  // Un creneau qui se termine avant de commencer ferait mentir le badge du site.
  function verifierHoraires(horaires) {
    for (const jour of JOURS) {
      for (const [debut, fin] of horaires[jour]) {
        if (fin <= debut) {
          return `${jour} : l'heure de fermeture (${fin}) doit être après l'ouverture (${debut}).`;
        }
      }
    }
    return null;
  }

  async function charger() {
    construireJours();
    const { data, error } = await supabaseClient
      .from('parametres').select('*').eq('id', 1).single();
    if (error || !data) {
      erreur.textContent = "Les réglages n'ont pas pu être chargés.";
      erreur.hidden = false;
      return;
    }
    document.getElementById('reg-nom').value = data.nom;
    document.getElementById('reg-telephone').value = data.telephone;
    document.getElementById('reg-telephone-lien').value = data.telephone_lien;
    document.getElementById('reg-ville').value = data.ville;
    document.getElementById('reg-code-postal').value = data.code_postal;
    document.getElementById('fermeture-active').checked = data.fermeture_active;
    document.getElementById('fermeture-message').value = data.fermeture_message || '';
    document.getElementById('fermeture-retour').value = data.fermeture_retour || '';
    remplirHoraires(data.horaires);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    erreur.hidden = true;
    ok.hidden = true;

    const horaires = lireHoraires();
    const probleme = verifierHoraires(horaires);
    if (probleme) {
      erreur.textContent = probleme;
      erreur.hidden = false;
      return;
    }

    const retour = document.getElementById('fermeture-retour').value;
    const { error } = await supabaseClient
      .from('parametres')
      .update({
        nom: document.getElementById('reg-nom').value.trim(),
        telephone: document.getElementById('reg-telephone').value.trim(),
        telephone_lien: document.getElementById('reg-telephone-lien').value.trim(),
        ville: document.getElementById('reg-ville').value.trim(),
        code_postal: document.getElementById('reg-code-postal').value.trim(),
        horaires,
        fermeture_active: document.getElementById('fermeture-active').checked,
        fermeture_message: document.getElementById('fermeture-message').value.trim(),
        fermeture_retour: retour || null,
        maj: new Date().toISOString()
      })
      .eq('id', 1);

    if (error) {
      erreur.textContent = "L'enregistrement a échoué. Réessayez.";
      erreur.hidden = false;
      return;
    }
    ok.hidden = false;
    setTimeout(() => { ok.hidden = true; }, 4000);
  });

  window.chargerReglages = charger;
}());
