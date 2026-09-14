# LeadForge

LeadForge ist ein lokales Lead-Generation-Dashboard für Berliner Unternehmen mit Website-Potenzial.

Die App läuft komplett kostenlos: Die Lead-Suche nutzt **OpenStreetMap** (Overpass & Nominatim) statt der
kostenpflichtigen Google Places API, und ein eigener Website-Check ruft die Zielseite direkt ab, statt
sich auf einen groben Google-Flag zu verlassen. Es wird kein API-Key benötigt.

## Start

Einmalig beim ersten Mal (installiert alle benötigten Pakete):

```bash
npm install
```

Danach reicht ein einziger Befehl, der Server und App zusammen startet:

```bash
npm start
```

Dann `http://localhost:5173` öffnen. Mit `Strg+C` beendet das beide Prozesse zusammen.

## API-Test

```bash
curl http://localhost:3001/api/test
curl 'http://localhost:3001/api/leads/search?category=Restaurant&district=Kreuzberg'
```

## Struktur

- `/` Dashboard – Kennzahlen & Top-Leads
- `/suche` Lead-Suche – Betriebe über OpenStreetMap finden und speichern
- `/leads` Meine Leads – Tabelle, Filter, Status-Pipeline, CSV-Export
- `/einstellungen` Verwaltung – Daten zurücksetzen/löschen, Info zur App

## Funktionen

- Kostenlose Lead-Suche über OpenStreetMap (Overpass API + Nominatim), kein API-Key
- Echter Website-Check: erreichbar? HTTPS? mobilfreundlich? nur Social-Media-Seite statt echter Website?
- Lead-Score & Website-Potenzial
- Leads speichern in LocalStorage (kein Server nötig, keine laufenden Kosten)
- Status-Pipeline (Neu → Kontaktiert → Interessiert → Kunde)
- Lead-Detailansicht mit E-Mail-Entwurf
- CSV-Export
- Manuelle Leads
- Mehrseitiges, responsives Dashboard (kein Alles-auf-einer-Seite)

## Hinweis zu OpenStreetMap

Overpass und Nominatim sind kostenlose Community-Dienste mit Fair-Use-Regeln (z. B. max. 1 Anfrage/Sekunde
bei Nominatim). Für eine Bewerbungs-/Portfolio-Nutzung völlig ausreichend; bei sehr hohem Suchvolumen ggf.
eigene Overpass-Instanz oder kostenpflichtige Alternative in Betracht ziehen.
