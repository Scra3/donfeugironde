# Où apporter vos dons — Incendies Gironde

Page statique : pour chaque mairie, ce qu'il faut apporter et ce qu'il ne faut plus apporter.

**Tout le monde peut modifier les informations**, sans compte et sans validation. Elles vivent
dans un Google Sheet partagé ; la page le lit à chaque chargement.

Pas de base de données, pas de connexion, pas de modération à assurer.

## Mise en route

1. Créer un Google Sheet.
2. **Fichier → Importer → Importer un fichier** : `a-importer-dans-le-tableur.csv`
   (les intitulés de colonnes, plus une ligne d'exemple à remplacer par la première vraie commune).
3. **Partager → Tous les utilisateurs disposant du lien → Éditeur.**
   C'est ça, le « ça marche par confiance ».
4. Dans `index.html`, mettre l'identifiant du document dans la constante `FEUILLE` :
   c'est la longue suite de caractères entre `/d/` et `/edit` dans l'URL du Sheet.

Inutile de passer par « Publier sur le Web » : l'export CSV d'un document partagé par lien
est déjà lisible par le site, et il reflète les modifications immédiatement.

Ensuite, plus jamais besoin de toucher au code : toute modification de la feuille est visible
sur le site au rechargement suivant.

## Les colonnes de la feuille

| Colonne | Contenu |
|---|---|
| `Commune` | Obligatoire. Sans elle, la ligne est ignorée. |
| `Lieu` | Adresse précise du point de collecte. |
| `Horaires` | Texte libre : « Samedi 9h-13h ». |
| `Besoins` | Ce qu'il faut apporter, **séparé par des points-virgules**. |
| `Ne plus apporter` | Ce dont ils croulent ou qu'ils refusent, séparé par des points-virgules. |
| `Téléphone` | Devient un bouton d'appel. |
| `Email` | Devient un lien de contact. |
| `Vérifié le` | Date : `26/07`, `26/07/2026` ou `2026-07-26`. |
| `Qui` | Prénom ou service. Affiché sous la fiche. |

Les colonnes sont reconnues par leur **intitulé**, pas par leur position : on peut en déplacer
ou en ajouter d'autres sans rien casser, et une ligne de consigne au-dessus des en-têtes est
sans effet. Une ligne sans `Besoins` ni `Ne plus apporter` n'est pas affichée.

En revanche, si les colonnes `Commune` ou `Besoins` sont renommées ou supprimées, la page ne
publie plus rien et renvoie vers le numéro vert. C'est délibéré : une fiche amputée de ses
besoins laisserait croire que la mairie ne manque de rien.

**`Vérifié le` est la colonne la plus importante.** À partir de 2 jours, la fiche affiche
automatiquement un bandeau orange « peut ne plus être à jour ». Une date absente,
illisible ou située dans le futur déclenche le même avertissement : post-dater une ligne ne la
rend pas fraîche, ça la marque comme douteuse.

## En cas de bêtise ou de vandalisme

Dans le Sheet : **Fichier → Historique des versions → Restaurer.** Rien à coder, rien à installer.

Protéger la ligne d'en-têtes (clic droit sur la ligne 1 → Afficher plus d'actions → Protéger la plage)
évite l'accident le plus courant : quelqu'un renomme une colonne et la page ne la reconnaît plus.

Aucune commune n'est inscrite en dur dans le code : la feuille est la seule source. Tant qu'aucune
mairie n'a rempli sa ligne, la page l'annonce et invite à en ajouter une. Si la feuille devient
injoignable, la page le dit et renvoie vers les mairies plutôt que d'afficher une liste périmée.

## Développement

```sh
node test.mjs                                    # analyse CSV, dates, nettoyage tel/email
python3 -m http.server 8000                      # puis http://localhost:8000
```

Un serveur est nécessaire : la page charge ses données en `fetch`, ce qui ne marche pas en `file://`.

Le contenu de la feuille est du texte fourni par des inconnus : il est échappé avant affichage,
les téléphones sont réduits aux chiffres et les emails validés, pour qu'aucun lien piégé ne
puisse être injecté depuis le tableur.

## Mettre en ligne

GitHub Pages : pousser le dépôt, puis Settings → Pages → Branch `main` / dossier `/root`.

## Ce que cette page ne fait pas

Volontairement :

- pas de formulaire ni de compte → le tableur fait le travail, avec historique et restauration
- pas de carte des feux → [aideetfeu.com](https://aideetfeu.com/)
- pas d'hébergement d'évacués → [entraide-hebergement.vercel.app](https://entraide-hebergement.vercel.app/)
- pas de qualité de l'air → [Atmo Nouvelle-Aquitaine](https://www.atmo-nouvelleaquitaine.org/)
