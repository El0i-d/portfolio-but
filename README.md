# portfolio-but

Portfolio d'Eloi Dupasquier (BUT Informatique), publié sur
**portfolio.edupasquier.me** via GitHub Pages.

- Site **statique** HTML / CSS (+ un petit script pour le formulaire), sans
  dépendance ni étape de build.
- Indexé par les moteurs de recherche (`robots.txt`, `sitemap.xml`, titres et
  descriptions travaillés).
- Direction artistique « blueprint » : tous les réglages visuels sont dans
  `:root`, en haut de `assets/style.css`.
- Rubriques suivant le cours « Portfolio de présentation – book » : À propos,
  Projets (stage + 3 projets phares + autres projets), Compétences, Parcours,
  Veille, Contact (formulaire), CV en PDF.

## Structure

```
index.html                  accueil : toutes les rubriques
projets/*.html              une fiche par projet
cv/index.html               CV (page web)
cv/eloi-dupasquier-cv.pdf   CV exporté depuis cv/index.html
assets/style.css            styles (écran + impression du CV)
assets/contact.js           envoi du formulaire sans quitter la page
assets/img/*.webp           captures (WebP, redimensionnées)
robots.txt, sitemap.xml     référencement
CNAME                       domaine personnalisé
.nojekyll                   publie les fichiers tels quels (sans Jekyll)
```

## Formulaire de contact

Envoyé par **Web3Forms** (aucun serveur). La clé d'accès se trouve dans
`index.html` (`name="access_key"`). Elle est publique par nature : elle ne
permet que d'envoyer un message vers l'adresse choisie à sa création.

## Mettre à jour le CV

Modifier `cv/index.html`, puis régénérer le PDF : ouvrir la page dans
Chrome → Imprimer → « Enregistrer au format PDF », format A4, marges
« Aucune », « Graphiques d'arrière-plan » coché. Le fichier doit tenir sur
une page.

## Polices

Inter et JetBrains Mono (licence SIL OFL) sont hébergées dans
`assets/polices/` : aucune requête vers Google Fonts. Les fichiers sont
allégés (51 Ko pour les deux) : graisses 400 à 600 seulement, caractères du
français et typographie courante (– — ’ … « » € → ≥…). Un caractère absent
s'affiche dans la police du système.

Pour ajouter un caractère (ex. `✓`, U+2713) : récupérer les polices
complètes sur Google Fonts, puis, avec `pip install fonttools brotli` :

```bash
fonttools varLib.instancer Inter.woff2 wght=400:600 -o inter.ttf
pyftsubset inter.ttf --unicodes="U+0020-007E,U+00A0-00FF,U+0152-0153,U+2013-2014,U+2018-201E,U+2022,U+2026,U+202F,U+20AC,U+2122,U+2190-2193,U+2197,U+2265,U+2713" --layout-features="kern,liga,calt,ccmp,locl,mark,mkmk" --no-hinting --desubroutinize --flavor=woff2 --output-file=assets/polices/inter.woff2
```

(même chose pour JetBrains Mono avec `wght=400:500`), puis ajouter le
caractère aux `unicode-range` en haut de `assets/style.css`.

## Lancer en local

```bash
python -m http.server 8000
```

## Mise en ligne

Pousser sur `main` : GitHub Pages republie en une minute environ.
