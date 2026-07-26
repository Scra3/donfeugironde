import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  norm, correspond, joursDepuis, dateFr, echappe,
  parseCSV, parseDate, enListe, telPropre, emailPropre, lignesVersCommunes,
} from './app.js';

const bruges = { nom: 'Bruges', lieu: 'Hôtel de Ville', besoins: ['Couches, lingettes'], satures: [] };

assert.equal(norm('Saint-Aubin-de-Médoc'), 'saint aubin de medoc');
assert.ok(correspond(bruges, 'bruges'));
assert.ok(correspond(bruges, ''), 'requête vide = tout afficher');
assert.ok(correspond(bruges, 'couches'), 'recherche par type de don');
assert.ok(!correspond(bruges, 'eysines'));
assert.ok(correspond({ ...bruges, nom: 'Le Taillan-Médoc' }, 'taillan medoc'));

assert.equal(joursDepuis('2026-07-26', '2026-07-26'), 0);
assert.equal(joursDepuis('2026-07-25', '2026-07-26'), 1, 'sous le seuil d\'alerte');
assert.equal(joursDepuis('2026-07-24', '2026-07-26'), 2, 'seuil d\'alerte atteint');
assert.equal(joursDepuis('2026-06-30', '2026-07-01'), 1, 'changement de mois');
assert.equal(joursDepuis('pas-une-date', '2026-07-26'), null);
assert.equal(joursDepuis('2027-07-26', '2026-07-26'), null,
  'date future = faute de frappe, jamais une info fraîche');
assert.equal(dateFr('2026-07-24'), '24 juillet');

assert.equal(echappe('<img src=x onerror=alert(1)>'),
  '&lt;img src=x onerror=alert(1)&gt;', 'le tableur ne doit pas pouvoir injecter de balise');
assert.equal(echappe(null), '');

assert.deepEqual(parseCSV('a,b\n1,2'), [['a', 'b'], ['1', '2']]);
assert.deepEqual(
  parseCSV('commune,besoins\nBruges,"Eau, couches"'),
  [['commune', 'besoins'], ['Bruges', 'Eau, couches']],
  'virgule à l\'intérieur de guillemets',
);
assert.deepEqual(
  parseCSV('a\n"ligne1\nligne2"'),
  [['a'], ['ligne1\nligne2']],
  'retour à la ligne dans une cellule',
);
assert.deepEqual(parseCSV('a\n"il dit ""oui"""'), [['a'], ['il dit "oui"']], 'guillemets échappés');
assert.deepEqual(parseCSV('a,b\r\n1,2'), [['a', 'b'], ['1', '2']], 'fins de ligne Windows');
assert.deepEqual(parseCSV('a,,c'), [['a', '', 'c']], 'cellule vide');

assert.equal(parseDate('2026-07-26', '2026-07-26'), '2026-07-26');
assert.equal(parseDate('26/07/2026', '2026-07-26'), '2026-07-26');
assert.equal(parseDate('26/07', '2026-07-26'), '2026-07-26', 'année sous-entendue');
assert.equal(parseDate('26/07/26', '2026-07-26'), '2026-07-26');
assert.equal(parseDate('5/7/2026', '2026-07-26'), '2026-07-05', 'sans zéro devant');
assert.equal(parseDate('', '2026-07-26'), null);
assert.equal(parseDate('hier', '2026-07-26'), null);
assert.equal(parseDate('32/07/2026', '2026-07-26'), null, 'jour impossible');
assert.equal(parseDate('26/13/2026', '2026-07-26'), null, 'mois impossible');

assert.deepEqual(enListe('Eau; couches ;; lingettes'), ['Eau', 'couches', 'lingettes']);
assert.deepEqual(enListe('Eau\ncouches'), ['Eau', 'couches']);
assert.deepEqual(enListe(''), []);

assert.equal(telPropre('05 56 95 50 95'), '0556955095');
assert.equal(telPropre('+33 5 56 95 50 95'), '+33556955095');
assert.equal(telPropre('05.56.95.50.95'), '0556955095');
assert.equal(telPropre('javascript:alert(1)'), null, 'aucune URL injectable dans un lien tel:');
assert.equal(telPropre('12'), null, 'trop court');
assert.equal(telPropre('05 56 95 50 95 poste 4'), null,
  'mieux vaut aucun numéro qu\'un numéro recomposé qui ne sonne nulle part');
assert.equal(emailPropre('contact@eysines.fr'), 'contact@eysines.fr');
assert.equal(emailPropre('n\'importe quoi'), null);
assert.equal(emailPropre('a@b'), null, 'domaine sans extension');

const feuille = parseCSV(
  'Commune,Lieu,Horaires,Besoins,Ne plus apporter,Téléphone,Email,Vérifié le,Qui\n'
  + 'Bruges,Hôtel de Ville,"9h-13h","Eau; Couches",Vêtements,05 56 95 50 95,x@y.fr,26/07/2026,Marie\n'
  + ',Sans nom,9h,Eau,,,,26/07/2026,\n'
  + 'Vide,Mairie,9h,,,,,26/07/2026,\n'
);
const communes = lignesVersCommunes(feuille, '2026-07-26');
assert.equal(communes.length, 1, 'lignes sans commune ou sans contenu ignorées');
assert.deepEqual(communes[0], {
  nom: 'Bruges', lieu: 'Hôtel de Ville', horaires: '9h-13h',
  besoins: ['Eau', 'Couches'], satures: ['Vêtements'],
  tel: '0556955095', telLisible: '05 56 95 50 95', email: 'x@y.fr',
  maj: '2026-07-26', qui: 'Marie',
});

const colonnesMelangees = lignesVersCommunes(
  parseCSV('Qui,Commune,Besoins\nPaul,Eysines,Eau'), '2026-07-26',
);
assert.equal(colonnesMelangees[0].nom, 'Eysines', 'colonnes reconnues par leur nom, pas leur position');
assert.equal(colonnesMelangees[0].maj, null, 'colonne absente = date inconnue');

const avecBanniere = lignesVersCommunes(
  parseCSV('NE PAS MODIFIER CETTE FEUILLE SANS PRÉVENIR,,,\n'
    + 'Commune,Besoins,Vérifié le,Qui\nBruges,Eau,26/07/2026,Marie'),
  '2026-07-26',
);
assert.equal(avecBanniere.length, 1,
  'une ligne de consigne au-dessus des en-têtes ne doit pas vider la page');
assert.equal(avecBanniere[0].nom, 'Bruges');

assert.equal(lignesVersCommunes(parseCSV('Ville,Besoins\nBruges,Eau'), '2026-07-26'), null,
  'en-têtes méconnaissables = panne annoncée, jamais une liste vide');
assert.equal(lignesVersCommunes(parseCSV('<!DOCTYPE html><html><body>Connexion'), '2026-07-26'), null,
  'Google renvoie du HTML si la feuille cesse d\'être partagée');
assert.equal(lignesVersCommunes([], '2026-07-26'), null, 'réponse vide = panne');

const besoinsRenomme = lignesVersCommunes(
  parseCSV('Commune,Besoins urgents,Ne plus apporter\nBruges,Eau,Vêtements'), '2026-07-26',
);
assert.equal(besoinsRenomme, null,
  'une fiche qui n\'afficherait que « ne plus apporter » ferait croire que la mairie ne manque de rien');

const modele = lignesVersCommunes(
  parseCSV(readFileSync(new URL('./a-importer-dans-le-tableur.csv', import.meta.url), 'utf8')),
  '2026-07-26',
);
assert.equal(modele.length, 1, 'le modèle contient les en-têtes et une seule ligne d\'exemple');
assert.match(modele[0].nom, /EXEMPLE/, 'la ligne d\'exemple doit être reconnaissable comme telle');
assert.ok(modele[0].besoins.length && modele[0].satures.length,
  'l\'exemple doit montrer les deux colonnes de listes');
assert.equal(modele[0].tel, '0556000000');
assert.equal(modele[0].maj, '2026-07-26');

console.log('OK');
