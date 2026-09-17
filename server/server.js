import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { searchOsmPlaces } from './osmPlaces.js';
import { checkWebsite } from './websiteCheck.js';
import { readAll, addAnfrage, updateStatus, removeAnfrage } from './anfragenStore.js';
import { notifyNewAnfrage } from './mailer.js';
import { createDemo, listDemos, deleteDemo, demoFilePath } from './demoStore.js';
import * as leadsStore from './leadsStore.js';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3001);
const ADMIN_KEY = process.env.ADMIN_KEY || '';

app.use(cors());
app.use(express.json());

app.get('/api/test', (_req, res) => res.json({ success: true, message: 'LeadForge Backend läuft 🚀' }));

app.get('/api/leads/search', async (req, res) => {
  try {
    const { category = '', district = '', city = '' } = req.query;
    if (!category) {
      return res.status(400).json({ success: false, message: 'Bitte eine Kategorie angeben.', leads: [] });
    }
    const leads = await searchOsmPlaces({ category, district, city });
    res.json({ success: true, count: leads.length, leads });
  } catch (error) {
    console.error('Leadsuche-Fehler:', error);
    res.status(500).json({ success: false, message: error.message || 'Fehler bei der Leadsuche', leads: [] });
  }
});

app.post('/api/leads/check-website', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) {
      return res.status(400).json({ success: false, message: 'Keine URL übergeben.' });
    }
    const result = await checkWebsite(url);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Website-Check-Fehler:', error);
    res.status(500).json({ success: false, message: error.message || 'Fehler bei der Website-Prüfung' });
  }
});

// --- Gespeicherte Leads (gemeinsame Datenbank, von allen Nutzern geteilt) ---

app.get('/api/saved-leads', async (_req, res) => {
  try {
    const leads = await leadsStore.readAll();
    res.json({ success: true, leads });
  } catch (error) {
    console.error('Fehler beim Laden der gespeicherten Leads:', error);
    res.status(500).json({ success: false, message: error.message || 'Fehler beim Laden.', leads: [] });
  }
});

app.post('/api/saved-leads', async (req, res) => {
  try {
    const { lead, leads } = req.body || {};
    if (Array.isArray(leads)) {
      const results = await leadsStore.upsertLeads(leads);
      return res.json({ success: true, addedCount: results.filter((r) => r.added).length });
    }
    if (!lead) return res.status(400).json({ success: false, message: 'Kein Lead übergeben.' });
    const { lead: saved, added } = await leadsStore.upsertLead(lead);
    res.json({ success: true, lead: saved, added });
  } catch (error) {
    console.error('Fehler beim Speichern des Leads:', error);
    res.status(500).json({ success: false, message: error.message || 'Fehler beim Speichern.' });
  }
});

app.patch('/api/saved-leads/:id', async (req, res) => {
  try {
    const updated = await leadsStore.updateLead(req.params.id, req.body || {});
    if (!updated) return res.status(404).json({ success: false, message: 'Lead nicht gefunden.' });
    res.json({ success: true, lead: updated });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Leads:', error);
    res.status(500).json({ success: false, message: error.message || 'Fehler beim Aktualisieren.' });
  }
});

app.delete('/api/saved-leads/:id', async (req, res) => {
  try {
    const ok = await leadsStore.deleteLead(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Lead nicht gefunden.' });
    res.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Löschen des Leads:', error);
    res.status(500).json({ success: false, message: error.message || 'Fehler beim Löschen.' });
  }
});

app.post('/api/saved-leads/replace-all', async (req, res) => {
  try {
    const { leads } = req.body || {};
    await leadsStore.replaceAll(Array.isArray(leads) ? leads : []);
    res.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Zurücksetzen der Leads:', error);
    res.status(500).json({ success: false, message: error.message || 'Fehler beim Zurücksetzen.' });
  }
});

app.delete('/api/saved-leads', async (_req, res) => {
  try {
    await leadsStore.clearAll();
    res.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Löschen aller Leads:', error);
    res.status(500).json({ success: false, message: error.message || 'Fehler beim Löschen.' });
  }
});

// --- Anfragen (Kontaktformular der Kiezseite) ---------------------------

// simple in-memory rate limit für den öffentlichen Endpunkt (pro IP, gleitendes Fenster)
const submissionLog = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 Minuten
  const timestamps = (submissionLog.get(ip) || []).filter((t) => now - t < windowMs);
  timestamps.push(now);
  submissionLog.set(ip, timestamps);
  return timestamps.length > 5; // max 5 Anfragen pro IP in 10 Min.
}

function requireAdmin(req, res, next) {
  if (!ADMIN_KEY) {
    return res.status(500).json({ success: false, message: 'Server ist nicht konfiguriert (ADMIN_KEY fehlt).' });
  }
  const key = req.get('x-admin-key');
  if (key !== ADMIN_KEY) {
    return res.status(401).json({ success: false, message: 'Nicht autorisiert.' });
  }
  return next();
}

// öffentlich: wird vom Kontaktformular der Kiezseite aufgerufen
app.post('/api/anfragen', async (req, res) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    if (isRateLimited(ip)) {
      return res.status(429).json({ success: false, message: 'Zu viele Anfragen, bitte später erneut versuchen.' });
    }
    const { name, email, paket, nachricht, website } = req.body || {};
    if (website) {
      // Honeypot-Feld: unsichtbar für Menschen, wird nur von Bots ausgefüllt
      return res.json({ success: true });
    }
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name und E-Mail sind erforderlich.' });
    }
    const entry = await addAnfrage({ name, email, paket, nachricht });
    notifyNewAnfrage(entry); // läuft im Hintergrund,
