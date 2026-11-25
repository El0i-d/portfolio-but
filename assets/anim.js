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
