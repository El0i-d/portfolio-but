// Envoi du formulaire de contact sans quitter la page.
// Sans JavaScript, le formulaire s'envoie quand même normalement
// (Web3Forms affiche alors sa propre page de confirmation).
(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const statut = document.getElementById('form-status');
  const bouton = form.querySelector('button[type="submit"]');
  const cle = form.querySelector('input[name="access_key"]').value;

  const afficher = (texte, classe) => {
    statut.textContent = texte;
    statut.className = 'form-status ' + classe;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clé pas encore renseignée : on évite un envoi voué à l'échec.
    if (cle.includes('A_RENSEIGNER')) {
      afficher('Le formulaire n’est pas encore activé. Écrivez-moi directement à eloi.dupasquier@edu.univ-fcomte.fr.', 'err');
      return;
    }

    bouton.disabled = true;
    afficher('Envoi en cours…', '');
    try {
      const reponse = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      const donnees = await reponse.json();
      if (reponse.ok && donnees.success) {
        form.reset();
        afficher('Merci, votre message est bien parti. Je vous réponds rapidement.', 'ok');
      } else {
        throw new Error(donnees.message || 'Erreur');
      }
    } catch {
      afficher('L’envoi a échoué. Réessayez, ou écrivez-moi à eloi.dupasquier@edu.univ-fcomte.fr.', 'err');
    } finally {
      bouton.disabled = false;
    }
  });
})();
