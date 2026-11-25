# portfolio-but

Portfolio d'Eloi Dupasquier (BUT Informatique), publié sur
**portfolio.edupasquier.me** via GitHub Pages.

- Site **statique** HTML / CSS, sans dépendance ni étape de build.
- Volontairement **isolé** du site edupasquier.me : aucun lien dans un sens
  ni dans l'autre, et `noindex` sur toutes les pages (accessible uniquement
  par lien).
- Direction artistique « blueprint » : tous les réglages visuels sont dans
  `:root`, en haut de `assets/style.css`.

## Structure

```
index.html                  accueil : présentation, stage, SAE, projets perso,
                            compétences BUT, contact
projets/*.html              une étude de cas par projet
assets/style.css            styles
assets/img/                 captures
CNAME                       domaine personnalisé
.nojekyll                   publie les fichiers tels quels (sans Jekyll)
```

## Lancer en local

```bash
python -m http.server 8000
```

## Mise en ligne

1. GitHub → Settings → Pages : source « Deploy from a branch », branche
   `main`, dossier `/ (root)`.
2. Namecheap → Advanced DNS : enregistrement `CNAME`, hôte `portfolio`,
   valeur `el0i-d.github.io`.
3. Une fois le DNS propagé, cocher « Enforce HTTPS » dans Settings → Pages.
