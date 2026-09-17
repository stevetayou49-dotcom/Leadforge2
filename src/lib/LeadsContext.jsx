import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const seedLeads = [
  { id: 'demo-1', name: 'Bella Italia', category: 'Restaurant', district: 'Kreuzberg', address: 'Oranienstraße 45, 10999 Berlin', phone: '030 12345678', email: 'info@bella-italia-berlin.de', website: 'Keine Website', websiteUrl: '', score: 92, status: 'Neu', reason: 'Keine eigene Website gefunden', priceMin: 650, priceMax: 950, offer: 'Neue, moderne Website' },
  { id: 'demo-2', name: 'Café Morgenrot', category: 'Café', district: 'Neukölln', address: 'Karl-Marx-Straße 88, 12043 Berlin', phone: '030 23456789', email: '', website: 'Veraltet', websiteUrl: '', score: 86, status: 'Kontaktiert', reason: 'Online-Präsenz wirkt ausbaufähig', priceMin: 450, priceMax: 750, offer: 'Website-Modernisierung' },
  { id: 'demo-3', name: 'Barber Kings', category: 'Friseur & Barbershop', district: 'Mitte', address: 'Rosenthaler Straße 20, 10119 Berlin', phone: '030 34567890', email: 'kontakt@barberkings.de', website: 'Keine Website', websiteUrl: '', score: 89, status: 'Neu', reason: 'Keine eigene Website gefunden', priceMin: 650, priceMax: 950, offer: 'Neue, moderne Website' },
  { id: 'demo-4', name: 'Pizza Berlin', category: 'Restaurant', district: 'Friedrichshain', address: 'Warschauer Straße 25, 10243 Berlin', phone: '030 45678901', email: '', website: 'Veraltet', websiteUrl: '', score: 84, status: 'Interessiert', reason: 'Website könnte moderner und mobilfreundlicher sein', priceMin: 450, priceMax: 750, offer: 'Website-Modernisierung' },
];

// Alle Leads liegen jetzt in der gemeinsamen Datenbank auf dem Server statt im
// localStorage des Browsers — so sehen alle Nutzer dieselben Leads.
const API_BASE = '/api/saved-leads';
const POLL_INTERVAL_MS = 4000; // regelmäßig neu laden, damit Änderungen anderer sichtbar werden

const LeadsContext = createContext(null);

export function LeadsProvider({ children }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const skipNextPoll = useRef(false);

  async function fetchLeads({ silent = false } = {}) {
    try {
      const res = await fetch(API_BASE);
      const data = await res.json();
      if (data.success) setLeads(data.leads);
    } catch {
      if (!silent) setNotice('Verbindung zum Server fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeads();
    const timer = setInterval(() => {
      if (skipNextPoll.current) {
        skipNextPoll.current = false;
        return;
      }
      fetchLeads({ silent: true });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  async function addLead(lead) {
    const normalized = { ...lead, id: lead.id || `lead-${Date.now()}` };
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead: normalized }),
    });
    const data = await res.json();
    if (data.success) {
      skipNextPoll.current = true;
      setLeads((current) => (current.some((l) => l.id === data.lead.id) ? current : [data.lead, ...current]));
      setNotice(data.added ? 'Lead gespeichert' : 'Lead ist bereits gespeichert');
    }
    return data.lead || normalized;
  }

  async function addLeads(newLeads) {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leads: newLeads }),
    });
    const data = await res.json();
    setNotice(data.addedCount ? `${data.addedCount} neue Leads gespeichert` : 'Keine neuen Leads (bereits vorhanden)');
    await fetchLeads({ silent: true });
  }

  async function updateLead(id, patch) {
    skipNextPoll.current = true;
    setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, ...patch } : lead)));
    await fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
  }

  async function updateStatus(id, nextStatus) {
    await updateLead(id, { status: nextStatus });
    setNotice(`Status auf „${nextStatus}“ gesetzt`);
  }

  async function deleteLead(id) {
    skipNextPoll.current = true;
    setLeads((current) => current.filter((lead) => lead.id !== id));
    await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    setNotice('Lead entfernt');
  }

  async function resetLeads() {
    skipNextPoll.current = true;
    setLeads(seedLeads);
    await fetch(`${API_BASE}/replace-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leads: seedLeads }),
    });
    setNotice('Demo-Daten wiederhergestellt (für alle)');
  }

  async function clearLeads() {
    skipNextPoll.current = true;
    setLeads([]);
    await fetch(API_BASE, { method: 'DELETE' });
    setNotice('Alle Leads gelöscht (für alle)');
  }

  const stats = useMemo(() => ({
    total: leads.length,
    noWebsite: leads.filter((l) => l.website === 'Keine Website').length,
    outdated: leads.filter((l) => l.website === 'Veraltet').length,
    unchecked: leads.filter((l) => l.website === 'Ungeprüft').length,
    contacted: leads.filter((l) => l.status === 'Kontaktiert').length,
    interested: leads.filter((l) => l.status === 'Interessiert').length,
    customers: leads.filter((l) => l.status === 'Kunde').length,
  }), [leads]);

  const value = {
    leads, stats, notice, setNotice, loading,
    addLead, addLeads, updateLead, updateStatus, deleteLead, resetLeads, clearLeads,
  };

  return <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLeads() {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error('useLeads muss innerhalb von <LeadsProvider> verwendet werden');
  return ctx;
}
