import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'leadforge-leads';

const seedLeads = [
  { id: 'demo-1', name: 'Bella Italia', category: 'Restaurant', district: 'Kreuzberg', address: 'Oranienstraße 45, 10999 Berlin', phone: '030 12345678', email: 'info@bella-italia-berlin.de', website: 'Keine Website', websiteUrl: '', score: 92, status: 'Neu', reason: 'Keine eigene Website gefunden', priceMin: 650, priceMax: 950, offer: 'Neue, moderne Website' },
  { id: 'demo-2', name: 'Café Morgenrot', category: 'Café', district: 'Neukölln', address: 'Karl-Marx-Straße 88, 12043 Berlin', phone: '030 23456789', email: '', website: 'Veraltet', websiteUrl: '', score: 86, status: 'Kontaktiert', reason: 'Online-Präsenz wirkt ausbaufähig', priceMin: 450, priceMax: 750, offer: 'Website-Modernisierung' },
  { id: 'demo-3', name: 'Barber Kings', category: 'Friseur & Barbershop', district: 'Mitte', address: 'Rosenthaler Straße 20, 10119 Berlin', phone: '030 34567890', email: 'kontakt@barberkings.de', website: 'Keine Website', websiteUrl: '', score: 89, status: 'Neu', reason: 'Keine eigene Website gefunden', priceMin: 650, priceMax: 950, offer: 'Neue, moderne Website' },
  { id: 'demo-4', name: 'Pizza Berlin', category: 'Restaurant', district: 'Friedrichshain', address: 'Warschauer Straße 25, 10243 Berlin', phone: '030 45678901', email: '', website: 'Veraltet', websiteUrl: '', score: 84, status: 'Interessiert', reason: 'Website könnte moderner und mobilfreundlicher sein', priceMin: 450, priceMax: 750, offer: 'Website-Modernisierung' },
];

function loadLeads() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : seedLeads;
  } catch {
    return seedLeads;
  }
}

const LeadsContext = createContext(null);

export function LeadsProvider({ children }) {
  const [leads, setLeads] = useState(loadLeads);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  function addLead(lead) {
    const normalized = { ...lead, id: lead.id || `lead-${Date.now()}` };
    let added = false;
    setLeads((current) => {
      if (current.some((item) => item.id === normalized.id)) return current;
      added = true;
      return [normalized, ...current];
    });
    setNotice(added ? 'Lead gespeichert' : 'Lead ist bereits gespeichert');
    return normalized;
  }

  function addLeads(newLeads) {
    setLeads((current) => {
      const map = new Map(current.map((lead) => [lead.id, lead]));
      let addedCount = 0;
      newLeads.forEach((lead) => {
        if (!map.has(lead.id)) {
          map.set(lead.id, lead);
          addedCount += 1;
        }
      });
      setNotice(addedCount ? `${addedCount} neue Leads gespeichert` : 'Keine neuen Leads (bereits vorhanden)');
      return [...map.values()];
    });
  }

  function updateLead(id, patch) {
    setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, ...patch } : lead)));
  }

  function updateStatus(id, nextStatus) {
    updateLead(id, { status: nextStatus });
    setNotice(`Status auf „${nextStatus}“ gesetzt`);
  }

  function deleteLead(id) {
    setLeads((current) => current.filter((lead) => lead.id !== id));
    setNotice('Lead entfernt');
  }

  function resetLeads() {
    setLeads(seedLeads);
    setNotice('Demo-Daten wiederhergestellt');
  }

  function clearLeads() {
    setLeads([]);
    setNotice('Alle Leads gelöscht');
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
    leads, stats, notice, setNotice,
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
