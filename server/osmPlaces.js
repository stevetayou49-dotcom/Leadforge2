import { ALL_CATEGORIES_OPTION } from '../src/lib/constants.js';

// Findet Unternehmen über die kostenlose OpenStreetMap-Infrastruktur
// (Nominatim für die Bezirksgrenzen, Overpass für die eigentliche Suche).
// Es wird kein API-Key benötigt.

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Nominatim/Overpass verlangen einen aussagekräftigen User-Agent statt eines Keys.
const USER_AGENT = 'LeadForge-Schulprojekt/1.0 (+kontakt-optional)';

// Kategorie -> eine oder mehrere Filtergruppen (jede Gruppe = eine OSM-Abfrage,
// alle Gruppen zusammen per OR verknüpft). Barber & Friseur landen beide unter
// shop=hairdresser, weil OSM dafür keinen eigenen Barber-Tag pflegt.
const CATEGORY_TAGS = {
  Restaurant: [[['amenity', 'restaurant']]],
  'Café': [[['amenity', 'cafe']]],
  'Friseur & Barbershop': [[['shop', 'hairdresser']]],
  Fitnessstudio: [[['leisure', 'fitness_centre']]],
  Einzelhandel: [[['shop', null]]], // beliebiger shop=* Tag
};

// "Alle Kategorien": mehrere Filtergruppen gleichzeitig, statt auf einen Tag
// festgelegt zu sein. Deckt die gängigen lokalen Geschäftstypen ab.
const ALL_GROUPS = [
  [['shop', null]],
  [['amenity', 'restaurant']],
  [['amenity', 'cafe']],
  [['amenity', 'bar']],
  [['amenity', 'fast_food']],
  [['amenity', 'pub']],
  [['leisure', 'fitness_centre']],
  [['office', null]],
  [['craft', null]],
];

function tagsForCategory(category) {
  if (category === ALL_CATEGORIES_OPTION) return ALL_GROUPS;
  return CATEGORY_TAGS[category] || null;
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Anfrage an ${new URL(url).hostname} fehlgeschlagen (${res.status}): ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function geocodeArea(district, city) {
  const cityName = city || 'Berlin';
  const query = district ? `${district}, ${cityName}, Deutschland` : `${cityName}, Deutschland`;
  const url = `${NOMINATIM_URL}?format=json&limit=1&countrycodes=de&q=${encodeURIComponent(query)}`;
  const results = await fetchJson(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!results.length) {
    throw new Error(`„${district ? `${district}, ${cityName}` : cityName}“ konnte nicht gefunden werden.`);
  }
  const [south, north, west, east] = results[0].boundingbox.map(Number);
  return { south, north, west, east };
}

function buildOverpassQuery(groups, bbox) {
  const { south, west, north, east } = bbox;
  const bboxStr = `${south},${west},${north},${east}`;
  const statements = groups
    .map((group) => {
      const filters = group
        .map(([key, value]) => (value ? `["${key}"="${value}"]` : `["${key}"]`))
        .join('');
      return `node${filters}(${bboxStr});\n      way${filters}(${bboxStr});`;
    })
    .join('\n      ');
  return `
    [out:json][timeout:25];
    (
      ${statements}
    );
    out center;
  `;
}

function buildAddress(tags, city) {
  const street = tags['addr:street'];
  const houseNumber = tags['addr:housenumber'];
  const postcode = tags['addr:postcode'];
  const addrCity = tags['addr:city'] || city || 'Berlin';
  if (!street) return '';
  return `${street}${houseNumber ? ' ' + houseNumber : ''}, ${postcode ? postcode + ' ' : ''}${addrCity}`;
}

function toLead({ tags = {}, lat, lon, center }, category, district, city) {
  const coords = center || { lat, lon };
  const website = tags.website || tags['contact:website'] || '';
  const email = tags.email || tags['contact:email'] || '';
  const facebook = normalizeSocial(tags.facebook || tags['contact:facebook'], 'facebook.com');
  const instagram = normalizeSocial(tags.instagram || tags['contact:instagram'], 'instagram.com');
  const isAllCategories = category === ALL_CATEGORIES_OPTION;
  return {
    osmId: `${tags.name || 'unbenannt'}-${coords.lat}-${coords.lon}`,
    name: tags.name || 'Unbenannter Betrieb',
    category: (!isAllCategories && category) || tags.shop || tags.amenity || tags.leisure || tags.office || tags.craft || 'Unternehmen',
    city: city || 'Berlin',
    district: district || city || 'Berlin',
    address: buildAddress(tags, city),
    phone: tags.phone || tags['contact:phone'] || '',
    email,
    facebook,
    instagram,
    openingHours: tags.opening_hours || '',
    website: website ? 'Ungeprüft' : 'Keine Website',
    websiteUrl: website ? normalizeUrl(website) : '',
    score: website ? 60 : 90,
    status: 'Neu',
    reason: website
      ? 'Website vorhanden – Zustand noch nicht geprüft'
      : 'Keine Website in den Kartendaten hinterlegt',
    priceMin: website ? 450 : 650,
    priceMax: website ? 750 : 950,
    offer: website ? 'Website-Modernisierung' : 'Neue, moderne Website',
    lat: coords.lat,
    lon: coords.lon,
  };
}

function normalizeSocial(value, host) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.includes(host)) return `https://${value.replace(/^\/+/, '')}`;
  // OSM speichert Social-Handles teils nur als Nutzername ohne URL
  return `https://${host}/${value.replace(/^@/, '')}`;
}

function normalizeUrl(url) {
  if (!/^https?:\/\//i.test(url)) return `https://${url}`;
  return url;
}

export async function searchOsmPlaces({ category, district, city }) {
  const tagPairs = tagsForCategory(category);
  if (!tagPairs) {
    throw new Error(`Unbekannte Kategorie „${category}“.`);
  }

  const bbox = await geocodeArea(district, city);
  const query = buildOverpassQuery(tagPairs, bbox);

  const payload = await fetchJson(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  const elements = (payload.elements || []).filter((el) => el.tags?.name);
  const seen = new Set();
  const leads = [];
  for (const element of elements) {
    const lead = toLead(element, category, district, city);
    if (seen.has(lead.osmId)) continue;
    seen.add(lead.osmId);
    leads.push(lead);
  }
  return leads;
}
