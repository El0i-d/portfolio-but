// Formulaire de contact : validation à la sortie du champ, brouillon
// conservé, envoi sans quitter la page.
// Sans JavaScript, le formulaire s'envoie quand même normalement
// (Web3Forms affiche alors sa propre page de confirmation).
(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const statut = document.getElementById('form-status');
  const brouillonInfo = document.getElementById('form-draft');
  const CLE_BROUILLON = 'portfolio-contact-brouillon';
  const CHAMPS = ['name', 'email', 'objet', 'message'];
  const ADRESSE = 'eloi.dupasquier@edu.univ-fcomte.fr';

  const afficher = (texte, classe) => {
    statut.textContent = texte;
    statut.className = 'form-status ' + (classe || '');
  };

  /* ---------- Validation : à la première sortie du champ, jamais pendant la saisie ---------- */
  const MESSAGES = {
    name: 'Indiquez un nom pour que je sache à qui répondre.',
    email: 'Indiquez une adresse e-mail du type nom@domaine.fr, pour recevoir ma réponse.',
    objet: 'Indiquez un objet en quelques mots.',
    message: 'Écrivez votre message avant de l’envoyer.',
    consentement: 'Cochez cette case pour que je puisse utiliser vos coordonnées pour vous répondre.',
  };
  const erreurDe = (champ) => document.getElementById('err-' + (champ.name === 'name' ? 'nom' : champ.name));
  const verifier = (champ) => {
    const ok = champ.type === 'checkbox' ? champ.checked : champ.value.trim() !== '' && champ.checkValidity();
    const zone = erreurDe(champ);
    champ.setAttribute('aria-invalid', String(!ok));
    if (zone) zone.textContent = ok ? '' : MESSAGES[champ.name];
    return ok;
  };
  const effacerErreur = (champ) => {
    if (champ.getAttribute('aria-invalid') !== 'true') return;
    champ.removeAttribute('aria-invalid');
    const zone = erreurDe(champ);
    if (zone) zone.textContent = '';
  };
  const aValider = [...form.querySelectorAll('input[required], textarea[required]')];
  aValider.forEach((champ) => {
    // Première vérification quand on quitte le champ.
    champ.addEventListener('blur', () => { if (champ.value !== '' || champ.dataset.touche) verifier(champ); champ.dataset.touche = '1'; });
    // L'erreur disparaît dès que l'on corrige.
    champ.addEventListener('input', () => effacerErreur(champ));
    champ.addEventListener('change', () => { if (champ.type === 'checkbox') effacerErreur(champ); });
  });

  /* ---------- Brouillon : rien n'est perdu en cas de rechargement ---------- */
  const lireBrouillon = () => { try { return JSON.parse(localStorage.getItem(CLE_BROUILLON) || 'null'); } catch { return null; } };
  const ecrireBrouillon = () => {
    const d = {};
    CHAMPS.forEach((n) => { d[n] = form.elements[n].value; });
    try {
      if (CHAMPS.some((n) => d[n].trim())) localStorage.setItem(CLE_BROUILLON, JSON.stringify(d));
      else localStorage.removeItem(CLE_BROUILLON);
    } catch { /* stockage indisponible : on continue sans brouillon */ }
  };
  const effacerBrouillon = () => { try { localStorage.removeItem(CLE_BROUILLON); } catch { /* rien */ } };
  const restaure = lireBrouillon();
  if (restaure && CHAMPS.some((n) => (restaure[n] || '').trim())) {
    CHAMPS.forEach((n) => { if (restaure[n]) form.elements[n].value = restaure[n]; });
    if (brouillonInfo) brouillonInfo.hidden = false;
  }
  let attente = 0;
  form.addEventListener('input', () => { clearTimeout(attente); attente = setTimeout(ecrireBrouillon, 300); });
  const boutonEffacer = document.getElementById('effacer-brouillon');
  if (boutonEffacer) boutonEffacer.addEventListener('click', () => {
    CHAMPS.forEach((n) => { form.elements[n].value = ''; effacerErreur(form.elements[n]); });
    effacerBrouillon();
    brouillonInfo.hidden = true;
    form.elements.name.focus();
  });

  /* ---------- Envoi ---------- */
  let envoiEnCours = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (envoiEnCours) return;

    // Le bouton reste cliquable : s'il manque quelque chose, on le montre.
    const invalides = aValider.filter((champ) => !verifier(champ));
    if (invalides.length) {
      invalides[0].focus();
      afficher('Il manque une information : le premier champ à compléter est sélectionné.', 'err');
      return;
    }

    envoiEnCours = true;
    form.setAttribute('aria-busy', 'true');
    // L'indication « Envoi en cours » n'apparaît qu'après 100 ms (pas de clignotement).
    const indicateur = setTimeout(() => afficher('Envoi en cours…'), 100);
    try {
      const reponse = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      const donnees = await reponse.json();
      if (reponse.ok && donnees.success) {
        form.reset();
        effacerBrouillon();
        if (brouillonInfo) brouillonInfo.hidden = true;
        afficher('Merci, votre message est bien parti. Je vous réponds rapidement.', 'ok');
      } else {
        throw new Error(donnees.message || 'Erreur');
      }
    } catch {
      afficher(`Le message n’est pas parti, votre texte est conservé. Réessayez, ou écrivez-moi à ${ADRESSE}.`, 'err');
    } finally {
      clearTimeout(indicateur);
      envoiEnCours = false;
      form.removeAttribute('aria-busy');
    }
  });
})();
