export const norm = (s) =>
  (s ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const correspond = (commune, requete) => {
  const mots = norm(requete).split(' ').filter(Boolean);
  if (!mots.length) return true;
  const foin = norm(
    [commune.nom, commune.lieu, ...commune.besoins, ...commune.satures].join(' ')
  );
  return mots.every((m) => foin.includes(m));
};

export const joursDepuis = (dateISO, maintenant) => {
  const ecart = Date.parse(`${maintenant}T00:00:00Z`) - Date.parse(`${dateISO}T00:00:00Z`);
  return Number.isNaN(ecart) || ecart < 0 ? null : Math.floor(ecart / 86400000);
};

export const echappe = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const dateFr = (dateISO) =>
  new Date(`${dateISO}T00:00:00Z`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });

export const parseCSV = (texte) => {
  const t = (texte ?? '').replace(/\r\n?/g, '\n');
  const lignes = [];
  let ligne = [];
  let champ = '';
  let dansGuillemets = false;

  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (dansGuillemets) {
      if (c !== '"') champ += c;
      else if (t[i + 1] === '"') { champ += '"'; i++; }
      else dansGuillemets = false;
    } else if (c === '"') dansGuillemets = true;
    else if (c === ',') { ligne.push(champ); champ = ''; }
    else if (c === '\n') { ligne.push(champ); lignes.push(ligne); ligne = []; champ = ''; }
    else champ += c;
  }
  if (champ !== '' || ligne.length) { ligne.push(champ); lignes.push(ligne); }
  return lignes;
};

export const parseDate = (valeur, aujourdhui) => {
  const s = (valeur ?? '').trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  let annee, mois, jour;

  if (m) [, annee, mois, jour] = m;
  else {
    m = s.match(/^(\d{1,2})[/.\- ](\d{1,2})(?:[/.\- ](\d{2}|\d{4}))?$/);
    if (!m) return null;
    [, jour, mois, annee] = m;
    annee = annee ?? aujourdhui.slice(0, 4);
    if (annee.length === 2) annee = `20${annee}`;
  }

  const iso = `${annee}-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
  const date = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === iso ? iso : null;
};

export const enListe = (valeur) =>
  (valeur ?? '')
    .split(/[;\n]/)
    .map((v) => v.trim())
    .filter(Boolean);

export const telPropre = (valeur) => {
  const brut = (valeur ?? '').trim();
  if (!/^[\d+\s.()/-]+$/.test(brut)) return null;
  const t = brut.replace(/[^0-9+]/g, '');
  return /^\+?\d{6,15}$/.test(t) ? t : null;
};

export const emailPropre = (valeur) => {
  const e = (valeur ?? '').trim();
  return /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[a-zA-Z]{2,}$/.test(e) ? e : null;
};

const COLONNES = {
  commune: 'nom',
  lieu: 'lieu',
  horaires: 'horaires',
  besoins: 'besoins',
  'ne plus apporter': 'satures',
  telephone: 'tel',
  email: 'email',
  'verifie le': 'maj',
  qui: 'qui',
};

const COLONNES_REQUISES = ['nom', 'besoins'];

export const lignesVersCommunes = (lignes, aujourdhui) => {
  const rangEntetes = lignes.findIndex((ligne) => {
    const cles = ligne.map((h) => COLONNES[norm(h)]);
    return COLONNES_REQUISES.every((requise) => cles.includes(requise));
  });
  if (rangEntetes < 0) return null;
  const entetes = lignes[rangEntetes].map((h) => COLONNES[norm(h)]);

  return lignes.slice(rangEntetes + 1).map((ligne) => {
    const brut = {};
    entetes.forEach((cle, i) => { if (cle) brut[cle] = ligne[i] ?? ''; });
    return {
      nom: (brut.nom ?? '').trim(),
      lieu: (brut.lieu ?? '').trim(),
      horaires: (brut.horaires ?? '').trim(),
      besoins: enListe(brut.besoins),
      satures: enListe(brut.satures),
      tel: telPropre(brut.tel),
      telLisible: (brut.tel ?? '').trim(),
      email: emailPropre(brut.email),
      emailLisible: (brut.email ?? '').trim(),
      maj: parseDate(brut.maj, aujourdhui),
      qui: (brut.qui ?? '').trim(),
    };
  }).filter((c) => c.nom);
};
