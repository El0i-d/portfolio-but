// Animations et interactions du portfolio (sans dépendance).
// Principe : la page est complète et lisible sans JavaScript ; ce script
// ne fait qu'ajouter des effets. Tout est coupé si le visiteur a demandé
// à réduire les animations (réglage du système).
(function () {
  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointeurFin = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.documentElement.classList.add('js');

  /* ---------- 1. Terminal animé en tête ---------- */
  const titre = document.querySelector('.hero-id');
  const commande = document.querySelector('.hero-cmd');
  if (titre && commande && !reduit) {
    const texte = commande.textContent;
    const sous = document.querySelector('.hero-sub');
    commande.textContent = '';
    titre.classList.add('cache');
    if (sous) sous.classList.add('cache');
    let i = 0;
    const taper = () => {
      commande.textContent = texte.slice(0, ++i);
      if (i < texte.length) {
        setTimeout(taper, 70 + Math.random() * 60);
      } else {
        // La commande est tapée : la « réponse » du terminal s'affiche.
        setTimeout(() => {
          titre.classList.remove('cache');
          titre.classList.add('apparait');
          if (sous) setTimeout(() => { sous.classList.remove('cache'); sous.classList.add('apparait'); }, 250);
        }, 280);
      }
    };
    setTimeout(taper, 350);
  }

  /* ---------- 2. Grille qui réagit à la souris ---------- */
  if (pointeurFin && !reduit) {
    const lueur = document.createElement('div');
    lueur.className = 'grid-glow';
    lueur.setAttribute('aria-hidden', 'true');
    document.body.prepend(lueur);
    let x = 0, y = 0, prevu = false;
    window.addEventListener('pointermove', (e) => {
      x = e.clientX; y = e.clientY;
      if (!prevu) {
        prevu = true;
        // Une seule mise à jour par image affichée, pour rester fluide.
        requestAnimationFrame(() => {
          lueur.style.setProperty('--x', x + 'px');
          lueur.style.setProperty('--y', y + 'px');
          lueur.classList.add('actif');
          prevu = false;
        });
      }
    }, { passive: true });
    document.addEventListener('pointerleave', () => lueur.classList.remove('actif'));
  }

  /* ---------- 3. Progression de lecture + section active ---------- */
  const barre = document.createElement('div');
  barre.className = 'progress';
  barre.setAttribute('aria-hidden', 'true');
  const entete = document.querySelector('.site-header');
  if (entete) entete.append(barre);
  let calcul = false;
  const majBarre = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    barre.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
    calcul = false;
  };
  window.addEventListener('scroll', () => { if (!calcul) { calcul = true; requestAnimationFrame(majBarre); } }, { passive: true });
  majBarre();

  // Allume l'entrée du menu qui correspond à la section à l'écran.
  const liens = [...document.querySelectorAll('.nav a[href^="#"]')];
  const sections = liens.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if (sections.length && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entrees) => {
      entrees.forEach((e) => {
        if (!e.isIntersecting) return;
        liens.forEach((a) => a.classList.toggle('actif', a.getAttribute('href') === '#' + e.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => obs.observe(s));
  }

  /* ---------- 4. Filtres de projets ---------- */
  const filtres = document.querySelector('.filters');
  if (filtres) {
    const projets = [...document.querySelectorAll('[data-tech]')];
    const etat = document.querySelector('.filters-status');
    filtres.hidden = false;
    filtres.addEventListener('click', (e) => {
      const bouton = e.target.closest('button[data-filtre]');
      if (!bouton) return;
      const f = bouton.dataset.filtre;
      filtres.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === bouton)));
      let n = 0;
      projets.forEach((p) => {
        const ok = f === 'tout' || p.dataset.tech.split(' ').includes(f);
        p.classList.toggle('estompe', !ok);
        if (ok) n++;
      });
      if (etat) etat.textContent = f === 'tout' ? '' : `${n} projet${n > 1 ? 's' : ''} avec ${bouton.textContent}`;
    });
  }
})();

// ---------- Deuxième série : compétences, frise, schémas, captures ----------
(function () {
  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 5. Barres de niveau qui se remplissent ---------- */
  const listeBut = document.querySelector('.but');
  if (listeBut) {
    if (reduit || !('IntersectionObserver' in window)) {
      listeBut.classList.add('rempli');
    } else {
      const obs = new IntersectionObserver((entrees) => {
        if (entrees.some((e) => e.isIntersecting)) { listeBut.classList.add('rempli'); obs.disconnect(); }
      }, { threshold: 0.2 });
      obs.observe(listeBut);
    }
  }

  /* ---------- 6. Frise du parcours qui se dessine ---------- */
  const frise = document.querySelector('.timeline');
  if (frise) {
    const etapes = [...frise.querySelectorAll('li')];
    let prevu = false;
    const majFrise = () => {
      const r = frise.getBoundingClientRect();
      // Le trait avance avec le milieu de l'écran.
      const avance = reduit ? 1 : Math.max(0, Math.min(1, (window.innerHeight * 0.6 - r.top) / r.height));
      frise.style.setProperty('--trace', avance.toFixed(3));
      etapes.forEach((li) => {
        li.classList.toggle('atteint', reduit || li.getBoundingClientRect().top < window.innerHeight * 0.6);
      });
      prevu = false;
    };
    window.addEventListener('scroll', () => { if (!prevu) { prevu = true; requestAnimationFrame(majFrise); } }, { passive: true });
    window.addEventListener('resize', majFrise);
    majFrise();
  }

  /* ---------- 7. Schémas explorables ---------- */
  document.querySelectorAll('.archi').forEach((schema) => {
    const boutons = [...schema.querySelectorAll('.archi-btn')];
    boutons.forEach((b) => b.addEventListener('click', () => {
      const ouvrir = b.getAttribute('aria-expanded') !== 'true';
      boutons.forEach((x) => {
        x.setAttribute('aria-expanded', 'false');
        const d = document.getElementById(x.getAttribute('aria-controls'));
        if (d) d.classList.remove('ouvert');
      });
      if (ouvrir) {
        b.setAttribute('aria-expanded', 'true');
        const d = document.getElementById(b.getAttribute('aria-controls'));
        if (d) d.classList.add('ouvert');
      }
    }));
  });

  /* ---------- 8. Captures agrandissables ---------- */
  const images = document.querySelectorAll('.figure img');
  if (images.length && typeof HTMLDialogElement === 'function') {
    const boite = document.createElement('dialog');
    boite.className = 'lightbox';
    boite.setAttribute('aria-label', 'Capture agrandie');
    boite.innerHTML = '<button type="button" class="lightbox-close" aria-label="Fermer">×</button><figure class="lightbox-inner"><figcaption></figcaption></figure>';
    document.body.append(boite);
    // L'image n'est créée qu'à la première ouverture (pas d'image vide dans la page).
    const img = document.createElement('img');
    const legende = boite.querySelector('figcaption');
    const fermer = () => boite.close();
    boite.querySelector('.lightbox-close').addEventListener('click', fermer);
    // Un clic à côté de la capture (sur le fond) ferme la fenêtre.
    boite.addEventListener('click', (e) => { if (e.target === boite) fermer(); });
    images.forEach((im) => {
      im.tabIndex = 0;
      im.setAttribute('role', 'button');
      im.setAttribute('aria-label', 'Agrandir : ' + im.alt);
      const ouvrir = () => {
        const fig = im.closest('.figure');
        if (!img.isConnected) boite.querySelector('figure').prepend(img);
        img.src = im.currentSrc || im.src;
        img.alt = im.alt;
        const cap = fig && fig.querySelector('figcaption');
        legende.innerHTML = cap ? cap.innerHTML : '';
        boite.classList.toggle('lightbox--phone', !!(fig && fig.classList.contains('figure--phone')));
        boite.showModal();
      };
      im.addEventListener('click', ouvrir);
      im.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ouvrir(); } });
    });
  }
})();
