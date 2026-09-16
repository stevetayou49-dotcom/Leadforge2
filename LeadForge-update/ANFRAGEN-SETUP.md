# Anfragen-System: Einrichtung

Kurzfassung: Die Kiezseite schickt Kontaktformular-Einsendungen an ein kleines
LeadForge-eigenes Backend. Dort werden sie gespeichert (Datei, kein Cloud-Dienst)
und sind nur mit einem geheimen Schlüssel sichtbar — in LeadForge selbst, unter
"Anfragen". Nimmst du dort einen Auftrag an, lädst du eine .ics-Kalenderdatei
herunter, die du einmal in deine Kalender-App importierst; sie erinnert dich
6 Wochen lang wöchentlich an einen kurzen Projekt-Check und endet dann von allein.

## 1. Lokal testen

```
cd LeadForge
npm install
cp .env.example .env
```

In `.env` einen zufälligen `ADMIN_KEY` eintragen (z. B. mit `openssl rand -hex 24`
erzeugen, oder einfach ein langes, zufälliges Passwort erfinden).

Ein einziger Befehl startet Server und Frontend zusammen:
```
npm start
```
(Alternativ getrennt in zwei Terminals: `npm run server` und `npm run dev`.)

In LeadForge unter "Anfragen" → "Verbindung": Server-Adresse leer lassen
(nutzt dann automatisch `/api/...` über den Vite-Proxy), Admin-Schlüssel aus
der `.env` eintragen, "Verbindung testen".

## 2. Live schalten

Die Kiezseite ist eine reine HTML-Seite (kein eigener Server) — das Backend
muss aber öffentlich erreichbar sein, damit ihr Kontaktformular etwas ankommt.
Zwei Wege:

**A) Ein gemeinsames Deployment (einfachste Variante)**
`npm run build` erzeugt `dist/`. Der Server liefert dieses `dist/` automatisch
mit aus (unter derselben Adresse wie die API). Du deployst also nur
`server.js` + `dist/` z. B. auf Render.com oder Railway.app (beide haben
kostenlose Einstiegsstufen für kleine Node-Apps):
- Node-Version: aktuelle LTS
- Start-Command: `npm run server`
- Build-Command: `npm run build && npm install`
- Umgebungsvariable `ADMIN_KEY` dort im Hosting-Dashboard setzen (nicht im Code!)
- Danach ist LeadForge selbst z. B. unter `https://dein-app.onrender.com`
  erreichbar — die URL nicht öffentlich verlinken, dann findet sie niemand
  zufällig. Für echten Zugriffsschutz zusätzlich Basic-Auth im Hosting
  aktivieren, falls verfügbar.

**B) Getrennt hosten**
Kiezseite z. B. bei Netlify/GitHub Pages, Backend separat (wie oben). Dann in
`kiezseite/index.html` die Zeile
```js
const API_BASE = '';
```
auf deine Backend-Adresse setzen, z. B. `const API_BASE = 'https://dein-backend.onrender.com';`
und in LeadForge unter "Anfragen" → "Verbindung" dieselbe Adresse eintragen.

## 3. E-Mail-Benachrichtigung bei neuer Anfrage (optional)

In der `.env` (lokal) bzw. bei den Umgebungsvariablen im Hosting (z. B. Render)
zusätzlich `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` und `NOTIFY_EMAIL`
setzen — Details und ein Gmail-Beispiel stehen direkt in `.env.example`. Ohne
diese Werte läuft alles normal weiter, es kommt nur keine Mail.

## 4. Demo-Links (Vorlagen an Kunden verschicken)

Unter "Vorlagen" gibt's jetzt neben "Herunterladen" auch "Demo-Link erstellen" —
nutzt denselben Server und denselben Admin-Schlüssel wie die Anfragen (unter
"Anfragen" → "Verbindung" einmal einrichten, dann funktioniert's auch hier).
Der Link ist öffentlich aufrufbar (kein Admin-Key nötig), damit Kunden ihn ohne
Anmeldung öffnen können. Läuft nicht automatisch ab — alte Demos ggf. manuell
über die API (`DELETE /api/demos/:slug`) aufräumen, sonst sammeln sie sich mit
der Zeit auf dem Server an.

## 5. Sicherheit, kurz zusammengefasst

- Der Admin-Schlüssel ist das einzige, was die Anfragen schützt — niemandem geben,
  nicht in Git committen (`.env` ist schon in `.gitignore`).
- Das öffentliche Formular hat ein Honeypot-Feld und ein einfaches Rate-Limit
  (max. 5 Einsendungen pro IP in 10 Minuten) gegen Spam-Bots.
- Die Daten liegen als Datei auf deinem Server (`server/data/anfragen.json`),
  nicht bei einem Drittanbieter.
