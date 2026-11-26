// Animations et interactions du portfolio (sans dépendance).
// Principe : la page est complète et lisible sans JavaScript ; ce script
// ne fait qu'ajouter des effets. Tout est coupé si le visiteur a demandé
// à réduire les animations (réglage du système).
//
// Performance : tout ce qui suit le défilement passe par UNE seule boucle,
// une fois par image affichée. Elle fait d'abord toutes les lectures
// (positions), puis toutes les écritures (styles) : le navigateur ne
// recalcule jamais la mise en page au milieu d'une image.

const defilement = (() => {
  const lectures = [];
  const ecritures = [];
  let prevu = false;
  const image = () => {
    prevu = false;
    lectures.forEach((f) => f());
    ecritures.forEach((f) => f());
  };
  const demander = () => { if (!prevu) { prevu = true; requestAnimationFrame(image); } };
  window.addEventListener('scroll', demander, { passive: true });
  window.addEventListener('resize', demander);
  return {
    ajouter(lire, ecrire) { if (lire) lectures.push(lire); if (ecrire) ecritures.push(ecrire); demander(); },
    demander,
  };
})();

const REDUIT = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const POINTEUR_FIN = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
document.documentElement.classList.add('js');

/* ---------- 1. Terminal animé en tête ---------- */
(function () {
  const titre = document.querySelector('.hero-id');
  const commande = document.querySelector('.hero-cmd');
  if (!titre || !commande || REDUIT) return;
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
        // Le curseur s'efface une fois la réponse affichée (pas de clignotement sans fin).
        const curseur = document.querySelector('.caret');
        if (curseur) setTimeout(() => curseur.classList.add('fini'), 900);
        if (sous) setTimeout(() => { sous.classList.remove('cache'); sous.classList.add('apparait'); }, 250);
      }, 280);
    }
  };
  setTimeout(taper, 350);
})();

/* ---------- 2. Défilement en cartes qui s'empilent ---------- */
(function () {
  const cartes = [...document.querySelectorAll('.stack-card')];
  if (cartes.length < 2) return;
  const racine = document.documentElement;
  const entete = document.querySelector('.site-header');
  racine.classList.add('stack-on');

  // Un voile par carte : on assombrit en changeant son opacité seulement.
  const voiles = cartes.map((c) => {
    const v = document.createElement('div');
    v.className = 'carte-voile';
    v.setAttribute('aria-hidden', 'true');
    c.append(v);
    return v;
  });

  let D = [];   // position de chaque carte dans la page (sans collage)
  let T = [];   // position de collage (top) de chaque carte
  let vh = window.innerHeight;
  let y = 0;
  const dernier = cartes.map(() => ({ s: -1, o: -1, w: false }));

  // Mesure, seulement au chargement et quand une taille change.
  // Accueil : chaque carte occupe au moins l'écran (comme une diapositive).
  // Fiches projets : cartes à leur hauteur naturelle.
  const pleineHauteur = cartes.map((c) => !c.classList.contains('case-hero') && !c.classList.contains('case-section'));

  const mesurer = () => {
    vh = window.innerHeight;
    const hEntete = entete ? entete.offsetHeight : 0;
    const pas = window.innerWidth >= 768 ? 14 : 8;
    // Pause : une fois entièrement affichée, la carte reste immobile pendant
    // une partie du défilement avant que la suivante n'arrive (le temps de
    // lire). La carte de la frise a une pause plus longue : la frise se
    // remplit pendant ce temps.
    cartes.forEach((c, i) => {
      c.style.minHeight = pleineHauteur[i] ? (vh - (hEntete + 12 + i * pas)) + 'px' : '';
      const fraction = i === cartes.length - 1 ? 0 : c.querySelector('.timeline') ? 0.9 : pleineHauteur[i] ? 0.35 : 0.25;
      c.style.marginBottom = fraction ? Math.round(fraction * vh) + 'px' : '';
    });
    racine.classList.add('stack-mesure');
    const sy = window.scrollY;
    D = cartes.map((c) => c.getBoundingClientRect().top + sy);
    const H = cartes.map((c) => c.offsetHeight);
    racine.classList.remove('stack-mesure');
    const h = entete ? entete.offsetHeight : 0;
    const ecart = window.innerWidth >= 768 ? 14 : 8;
    // Sous l'en-tête, décalée de quelques pixels par carte (on voit la pile).
    // Une carte plus haute que l'écran ne se colle qu'une fois son bas
    // atteint : rien n'est caché.
    T = H.map((hc, i) => Math.min(h + 12 + i * ecart, vh - hc));
    cartes.forEach((c, i) => { c.style.top = T[i] + 'px'; });
    defilement.demander();
    // Prévient la frise, qui cale son remplissage sur la pause de sa carte.
    document.dispatchEvent(new Event('cartes-mesurees'));
  };

  // Position à l'écran du haut d'une carte, calculée sans rien mesurer.
  const hautEcran = (i) => Math.max(D[i] - y, T[i]);

  defilement.ajouter(
    () => { y = window.scrollY; },
    () => {
      if (!D.length) return;
      for (let i = 0; i < cartes.length - 1; i++) {
        const base = Math.max(T[i], 0);
        const p = Math.min(Math.max(1 - (hautEcran(i + 1) - base) / (vh - base), 0), 1);
        // Enfouie sous deux cartes : voile presque opaque, on ne devine plus le texte.
        const enfouie = i + 2 < cartes.length && hautEcran(i + 2) < vh * 0.55;
        const s = REDUIT ? 1 : +(1 - 0.045 * p).toFixed(4);
        const o = enfouie ? 0.94 : +(0.5 * p).toFixed(3);
        // On n'écrit que ce qui a changé.
        if (s !== dernier[i].s) { cartes[i].style.transform = s < 1 ? `scale(${s})` : ''; dernier[i].s = s; }
        // Pendant qu'elle rétrécit, la carte devient un calque à part : le
        // navigateur la réduit telle quelle au lieu de la repeindre à chaque
        // image (peinture divisée par 6 à 8, mesuré). Seulement pendant la
        // transition : sur toutes les cartes à la fois, la mémoire graphique
        // déborderait et le défilement ralentirait.
        const w = !REDUIT && p > 0 && p < 1;
        if (w !== dernier[i].w) { cartes[i].style.willChange = w ? 'transform' : ''; dernier[i].w = w; }
        if (o !== dernier[i].o) { voiles[i].style.opacity = o; dernier[i].o = o; }
      }
    }
  );

  // Sur iPhone, la barre d'adresse qui se replie change un peu la hauteur de
  // l'écran pendant le défilement : on ne recalcule que si la largeur change
  // ou si la hauteur change nettement, pour éviter les sursauts.
  let largeurPrec = window.innerWidth, hauteurPrec = window.innerHeight;
  window.addEventListener('resize', () => {
    if (window.innerWidth !== largeurPrec || Math.abs(window.innerHeight - hauteurPrec) > 150) {
      largeurPrec = window.innerWidth; hauteurPrec = window.innerHeight;
      mesurer();
    }
  });
  // Les images chargées en différé changent la hauteur des cartes.
  if ('ResizeObserver' in window) {
    let attente = 0;
    const ro = new ResizeObserver(() => { cancelAnimationFrame(attente); attente = requestAnimationFrame(mesurer); });
    cartes.forEach((c) => ro.observe(c));
  }
  mesurer();
})();

/* ---------- 3. Grille qui réagit à la souris ---------- */
(function () {
  if (!POINTEUR_FIN || REDUIT) return;
  let x = 0, y = 0, prevu = false;
  const cartes = document.querySelectorAll('.stack-card');

  if (cartes.length > 1) {
    // Pages en cartes : un petit carré lumineux dans la carte survolée,
    // déplacé par transform (aucune carte n'est repeinte).
    const lueurs = new Map();
    cartes.forEach((c) => {
      const l = document.createElement('div');
      l.className = 'carte-lueur';
      l.setAttribute('aria-hidden', 'true');
      c.prepend(l);
      lueurs.set(c, l);
    });
    let active = null;
    const R = 220; // demi-côté du carré
    window.addEventListener('pointermove', (e) => {
      x = e.clientX; y = e.clientY;
      if (prevu) return;
      prevu = true;
      requestAnimationFrame(() => {
        prevu = false;
        const sous = document.elementFromPoint(x, y);
        const carte = sous && sous.closest('.stack-card');
        const l = carte && lueurs.get(carte);
        if (active && active !== l) active.classList.remove('on');
        if (l) {
          const r = carte.getBoundingClientRect();
          const gx = x - r.left, gy = y - r.top;
          l.style.transform = `translate3d(${gx - R}px, ${gy - R}px, 0)`;
          // Décale la grille du carré pour qu'elle tombe sur celle de la carte.
          l.style.backgroundPosition = `${R - gx}px ${R - gy}px`;
          l.classList.add('on');
        }
        active = l;
      });
    }, { passive: true });
    document.addEventListener('pointerleave', () => { if (active) active.classList.remove('on'); });
    return;
  }

  const lueur = document.createElement('div');
  lueur.className = 'grid-glow';
  lueur.setAttribute('aria-hidden', 'true');
  document.body.prepend(lueur);
  window.addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    if (prevu) return;
    prevu = true;
    requestAnimationFrame(() => {
      lueur.style.setProperty('--x', x + 'px');
      lueur.style.setProperty('--y', y + 'px');
      lueur.classList.add('actif');
      prevu = false;
    });
  }, { passive: true });
  document.addEventListener('pointerleave', () => lueur.classList.remove('actif'));
})();

/* ---------- 4. Progression de lecture + section active ---------- */
(function () {
  const entete = document.querySelector('.site-header');
  if (!entete) return;
  const barre = document.createElement('div');
  barre.className = 'progress';
  barre.setAttribute('aria-hidden', 'true');
  entete.append(barre);

  // La hauteur de la page n'est relue que lorsqu'elle change.
  let max = 1, y = 0, derniere = -1;
  const mesurer = () => { max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1); defilement.demander(); };
  window.addEventListener('resize', mesurer);
  if ('ResizeObserver' in window) new ResizeObserver(mesurer).observe(document.body);
  mesurer();
  defilement.ajouter(
    () => { y = window.scrollY; },
    () => {
      const v = +Math.min(y / max, 1).toFixed(4);
      if (v !== derniere) { barre.style.transform = `scaleX(${v})`; derniere = v; }
    }
  );

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
})();

/* ---------- 5. Filtres de projets ---------- */
(function () {
  const filtres = document.querySelector('.filters');
  if (!filtres) return;
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
})();

/* ---------- 6. Barres de niveau qui se remplissent ---------- */
(function () {
  const listeBut = document.querySelector('.but');
  if (!listeBut) return;
  if (REDUIT || !('IntersectionObserver' in window)) { listeBut.classList.add('rempli'); return; }
  const obs = new IntersectionObserver((entrees) => {
    if (entrees.some((e) => e.isIntersecting)) { listeBut.classList.add('rempli'); obs.disconnect(); }
  }, { threshold: 0.2 });
  obs.observe(listeBut);
})();

/* ---------- 7. Frise du parcours qui se dessine ---------- */
(function () {
  const frise = document.querySelector('.timeline');
  if (!frise) return;
  const etapes = [...frise.querySelectorAll('li')];
  if (REDUIT) { frise.style.setProperty('--trace', '1'); etapes.forEach((li) => li.classList.add('atteint')); return; }

  // Position de la frise dans la page (comme si sa carte n'était pas collée)
  // et de chaque étape : relues seulement si une taille change. Ainsi le trait
  // continue d'avancer avec le défilement, même quand la carte est collée.
  // Le trait se remplit entre deux positions de défilement : quand le haut
  // de la frise arrive aux trois quarts de l'écran, et juste avant que la
  // carte suivante n'apparaisse. Ainsi la carte suivante n'arrive qu'une
  // fois la frise pleine. Positions relues seulement si une taille change.
  const racine = document.documentElement;
  let decalages = [], hauteur = 1, debut = 0, fin = 1, y = 0, visible = false;
  const mesurer = () => {
    const vh = window.innerHeight;
    racine.classList.add('stack-mesure');
    const sy = window.scrollY;
    const hautPage = frise.getBoundingClientRect().top + sy;
    decalages = etapes.map((li) => li.offsetTop);
    hauteur = frise.offsetHeight || 1;
    const carte = frise.closest('.stack-card');
    let suivante = carte && carte.nextElementSibling;
    while (suivante && !suivante.classList.contains('stack-card')) suivante = suivante.nextElementSibling;
    debut = hautPage - vh * 0.75;
    fin = suivante && racine.classList.contains('stack-on')
      ? suivante.getBoundingClientRect().top + sy - vh * 1.1
      : hautPage + hauteur - vh * 0.6;
    racine.classList.remove('stack-mesure');
    if (fin < debut + 80) fin = debut + 80;
    defilement.demander();
  };
  if ('ResizeObserver' in window) new ResizeObserver(mesurer).observe(frise);
  document.addEventListener('cartes-mesurees', mesurer);
  window.addEventListener('load', mesurer);
  mesurer();
  // On ne suit la frise que lorsqu'elle est proche de l'écran.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; defilement.demander(); }, { rootMargin: '400px 0px' }).observe(frise);
  } else { visible = true; }

  let derniere = -1;
  const atteintes = etapes.map(() => false);
  defilement.ajouter(
    () => { if (visible) y = window.scrollY; },
    () => {
      if (!visible) return;
      const avance = +Math.max(0, Math.min(1, (y - debut) / (fin - debut))).toFixed(3);
      if (avance !== derniere) { frise.style.setProperty('--trace', avance); derniere = avance; }
      // Une étape s'allume quand le trait l'atteint.
      etapes.forEach((li, i) => {
        const ok = avance > 0 && avance >= decalages[i] / hauteur;
        if (ok !== atteintes[i]) { li.classList.toggle('atteint', ok); atteintes[i] = ok; }
      });
    }
  );
})();

/* ---------- 8. Schémas explorables ---------- */
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

/* ---------- 9. Captures agrandissables ---------- */
(function () {
  const images = document.querySelectorAll('.figure img');
  if (!images.length || typeof HTMLDialogElement !== 'function') return;
  const boite = document.createElement('dialog');
  boite.className = 'lightbox';
  boite.setAttribute('aria-label', 'Capture agrandie');
  boite.innerHTML = '<button type="button" class="lightbox-close" aria-label="Fermer" data-tip="Fermer (Échap)">×</button><figure class="lightbox-inner"><figcaption></figcaption></figure>';
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
})();

/* ---------- 10. Menu replié sur téléphone ---------- */
(function () {
  const bouton = document.querySelector('.nav-toggle');
  const menu = document.getElementById('nav-principale');
  if (!bouton || !menu) return;
  const texte = bouton.querySelector('.nav-toggle-texte');
  const basculer = (ouvrir) => {
    menu.classList.toggle('ouvert', ouvrir);
    bouton.setAttribute('aria-expanded', String(ouvrir));
    if (texte) texte.textContent = ouvrir ? 'Fermer le menu' : 'Ouvrir le menu';
  };
  bouton.addEventListener('click', () => basculer(bouton.getAttribute('aria-expanded') !== 'true'));
  // Un lien choisi ferme le menu ; Échap le ferme et rend le focus au bouton.
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) basculer(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && bouton.getAttribute('aria-expanded') === 'true') { basculer(false); bouton.focus(); }
  });
  // Un clic ailleurs ferme le menu.
  document.addEventListener('click', (e) => {
    if (bouton.getAttribute('aria-expanded') === 'true' && !e.target.closest('.nav-toggle, #nav-principale')) basculer(false);
  });
})();

/* ---------- 11. Point de données : un passage quand le schéma arrive à l'écran ---------- */
(function () {
  const schemas = document.querySelectorAll('.archi');
  if (!schemas.length || REDUIT || !('IntersectionObserver' in window)) return;
  const obs = new IntersectionObserver((entrees) => {
    entrees.forEach((e) => {
      // On retire puis remet la classe pour rejouer l'animation à chaque arrivée.
      if (e.isIntersecting) { e.target.classList.remove('vu'); void e.target.offsetWidth; e.target.classList.add('vu'); }
    });
  }, { threshold: 0.6 });
  schemas.forEach((s) => obs.observe(s));
})();
