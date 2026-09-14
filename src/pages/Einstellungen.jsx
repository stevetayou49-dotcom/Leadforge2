import { useRef, useState } from 'react';
import { AlertTriangle, Database, Download, RotateCcw, Settings, Trash2, Upload } from 'lucide-react';
import { useLeads } from '../lib/LeadsContext';

const BACKUP_KEYS = {
  leads: 'leadforge-leads',
  businessProfile: 'leadforge-business-profile',
  invoices: 'leadforge-invoices',
  inboxConfig: 'leadforge-inbox-config',
};

function exportBackup() {
  const data = { version: 1, exportedAt: new Date().toISOString() };
  Object.entries(BACKUP_KEYS).forEach(([key, storageKey]) => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try { data[key] = JSON.parse(raw); } catch { /* skip kaputte Werte */ }
    }
  });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leadforge-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importBackup(file, onDone) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      Object.entries(BACKUP_KEYS).forEach(([key, storageKey]) => {
        if (data[key] !== undefined) localStorage.setItem(storageKey, JSON.stringify(data[key]));
      });
      onDone(null);
    } catch {
      onDone('Datei konnte nicht gelesen werden — ist es eine gültige LeadForge-Sicherungsdatei?');
    }
  };
  reader.readAsText(file);
}

export default function Einstellungen() {
  const { leads, resetLeads, clearLeads } = useLeads();
  const [confirmClear, setConfirmClear] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef(null);

  function handleImportChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    importBackup(file, (err) => {
      if (err) {
        setImportMsg(err);
      } else {
        setImportMsg('Wiederhergestellt — Seite wird neu geladen …');
        setTimeout(() => window.location.reload(), 1200);
      }
    });
    e.target.value = '';
  }

  return (
    <>
      <section className="page-head">
        <div className="eyebrow"><Settings size={14} /> EINSTELLUNGEN</div>
        <h1>Verwaltung</h1>
        <p>Alles rund um deine gespeicherten Daten.</p>
      </section>

      <section className="settings-card">
        <div className="settings-row">
          <div className="section-icon"><Database size={17} /></div>
          <div>
            <strong>Speicherort</strong>
            <p>Deine {leads.length} Leads liegen nur lokal im Browser (LocalStorage) – kein Server, keine Kosten. Beim Löschen des Browser-Speichers gehen sie verloren.</p>
          </div>
        </div>

        <div className="settings-row">
          <div className="section-icon"><Download size={17} /></div>
          <div>
            <strong>Datensicherung herunterladen</strong>
            <p>Leads, Rechnungen, Firmendaten und Server-Verbindung als eine Datei sichern — regelmäßig empfohlen, falls der Browser-Speicher mal verloren geht.</p>
            <button className="secondary-button" onClick={exportBackup}><Download size={14} /> Backup herunterladen</button>
          </div>
        </div>

        <div className="settings-row">
          <div className="section-icon"><Upload size={17} /></div>
          <div>
            <strong>Datensicherung wiederherstellen</strong>
            <p>Eine zuvor heruntergeladene Backup-Datei einlesen. Überschreibt die aktuell gespeicherten Daten.</p>
            <button className="secondary-button" onClick={() => fileInputRef.current?.click()}><Upload size={14} /> Backup-Datei wählen</button>
            <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImportChange} style={{ display: 'none' }} />
            {importMsg && <p className="muted-note">{importMsg}</p>}
          </div>
        </div>

        <div className="settings-row">
          <div className="section-icon"><RotateCcw size={17} /></div>
          <div>
            <strong>Demo-Daten wiederherstellen</strong>
            <p>Setzt die Liste auf die vier Beispiel-Leads zurück.</p>
            <button className="secondary-button" onClick={resetLeads}>Zurücksetzen</button>
          </div>
        </div>

        <div className="settings-row">
          <div className="section-icon warn"><Trash2 size={17} /></div>
          <div>
            <strong>Alle Leads löschen</strong>
            <p>Entfernt sämtliche gespeicherten Leads unwiderruflich.</p>
            {!confirmClear ? (
              <button className="danger-button" onClick={() => setConfirmClear(true)}>Alle löschen</button>
            ) : (
              <div className="confirm-row">
                <span><AlertTriangle size={14} /> Wirklich alle {leads.length} Leads löschen?</span>
                <button className="danger-button" onClick={() => { clearLeads(); setConfirmClear(false); }}>Ja, löschen</button>
                <button className="secondary-button" onClick={() => setConfirmClear(false)}>Abbrechen</button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-row">
          <div className="section-icon"><Database size={17} /></div>
          <div>
            <strong>Über LeadForge</strong>
            <p>Die Lead-Suche nutzt OpenStreetMap (Overpass &amp; Nominatim) statt der Google Places API – dadurch entstehen keine laufenden Kosten. Die Website-Prüfung ruft die Zielseite direkt ab und bewertet HTTPS, Mobilfreundlichkeit und Erreichbarkeit.</p>
          </div>
        </div>
      </section>
    </>
  );
}
