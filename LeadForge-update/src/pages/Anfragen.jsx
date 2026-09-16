import { useMemo, useState } from 'react';
import {
  AlertTriangle, Calendar, Check, Inbox, Loader2, RefreshCw, Settings, Trash2, X,
} from 'lucide-react';
import { useInbox } from '../lib/InboxContext';
import { useLeads } from '../lib/LeadsContext';
import { buildProjectReminderIcs, downloadIcs } from '../lib/ics';

export default function Anfragen() {
  const { config, anfragen, status, error, refresh } = useInbox();
  const [showSettings, setShowSettings] = useState(!config.adminKey);
  const [active, setActive] = useState(null);

  const counts = useMemo(() => ({
    neu: anfragen.filter((a) => a.status === 'Neu').length,
    total: anfragen.length,
  }), [anfragen]);

  return (
    <div>
      <div className="page-head">
        <div className="eyebrow"><Inbox size={13} /> ANFRAGEN</div>
        <h1>Anfragen von der <em>Kiezseite</em></h1>
        <p>Kontaktformular-Einsendungen deiner Website — nur für dich sichtbar, nicht öffentlich einsehbar.</p>
      </div>

      <div className="toolbar" style={{ marginBottom: 18 }}>
        <div className="toolbar-title"><h2>Posteingang</h2><span>{counts.neu} neu · {counts.total} gesamt</span></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="secondary-button compact" onClick={() => setShowSettings((v) => !v)}><Settings size={14} /> Verbindung</button>
          <button className="secondary-button compact" onClick={refresh} disabled={status === 'loading'}>
            {status === 'loading' ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />} Aktualisieren
          </button>
        </div>
      </div>

      {showSettings && <ConnectionSettings onDone={() => setShowSettings(false)} />}

      {!config.adminKey && !showSettings && (
        <div className="error-banner" style={{ marginBottom: 18 }}>
          <AlertTriangle size={16} /> Noch keine Verbindung eingerichtet — klicke oben auf „Verbindung“.
        </div>
      )}

      {status === 'error' && (
        <div className="error-banner" style={{ marginBottom: 18 }}><AlertTriangle size={16} /> {error}</div>
      )}

      {config.adminKey && (
        <div className="table-card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Paket</th><th>Eingegangen</th><th>Status</th></tr></thead>
              <tbody>
                {anfragen.map((a) => (
                  <tr key={a.id} onClick={() => setActive(a)}>
                    <td>{a.name}</td>
                    <td>{a.paket || '—'}</td>
                    <td>{new Date(a.createdAt).toLocaleDateString('de-DE')}</td>
                    <td><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {anfragen.length === 0 && status === 'ready' && (
              <div className="empty">
                <Inbox size={30} />
                <strong>Noch keine Anfragen</strong>
                <span>Sobald jemand das Kontaktformular auf der Kiezseite ausfüllt, taucht es hier auf.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {active && <AnfrageDetail anfrage={active} onClose={() => setActive(null)} />}
    </div>
  );
}

function StatusBadge({ status }) {
  const cls = status === 'Auftrag angenommen' ? 'status-kunde' : status === 'Abgelehnt' ? 'status-badge' : status === 'Kontaktiert' ? 'status-interessiert' : 'status-neu';
  return <span className={`status-badge ${cls}`}><i />{status}</span>;
}

function ConnectionSettings({ onDone }) {
  const { config, setConfig, testConnection } = useInbox();
  const [apiUrl, setApiUrl] = useState(config.apiUrl);
  const [adminKey, setAdminKey] = useState(config.adminKey);
  const [testState, setTestState] = useState('idle'); // idle | testing | ok | fail
  const [testMsg, setTestMsg] = useState('');

  async function handleTest() {
    setTestState('testing');
    try {
      await testConnection({ apiUrl, adminKey });
      setTestState('ok');
      setTestMsg('Verbindung erfolgreich.');
    } catch (err) {
      setTestState('fail');
      setTestMsg(err.message || 'Verbindung fehlgeschlagen.');
    }
  }

  function handleSave() {
    setConfig({ apiUrl, adminKey });
    onDone();
  }

  return (
    <div className="search-card" style={{ marginBottom: 24 }}>
      <div className="section-heading">
        <div><span className="section-icon"><Settings size={16} /></span><div><h2>Server-Verbindung</h2><p>Adresse deines LeadForge-Backends und der geheime Admin-Schlüssel aus der .env-Datei</p></div></div>
      </div>
      <div className="form-grid">
        <label className="field">
          <span>Server-Adresse (leer lassen, wenn Frontend & Server zusammen laufen)</span>
          <input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="z. B. https://deinbackend.onrender.com" />
        </label>
        <label className="field">
          <span>Admin-Schlüssel</span>
          <input value={adminKey} onChange={(e) => setAdminKey(e.target.value)} placeholder="ADMIN_KEY aus .env" type="password" />
        </label>
      </div>
      {testMsg && <p className={testState === 'ok' ? 'muted-note success' : 'muted-note error'}>{testMsg}</p>}
      <div className="modal-actions" style={{ marginTop: 12 }}>
        <button className="secondary-button" onClick={handleTest} disabled={testState === 'testing'}>
          {testState === 'testing' ? <Loader2 size={15} className="spin" /> : null} Verbindung testen
        </button>
        <button className="primary-button" onClick={handleSave}><Check size={15} /> Speichern</button>
      </div>
    </div>
  );
}

function AnfrageDetail({ anfrage, onClose }) {
  const { updateStatusRemote, deleteRemote } = useInbox();
  const { leads, addLead } = useLeads();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  async function accept() {
    setBusy(true);
    try {
      await updateStatusRemote(anfrage.id, 'Auftrag angenommen');

      const existing = anfrage.email && leads.find((l) => l.email && l.email.toLowerCase() === anfrage.email.toLowerCase());
      if (existing) {
        addLead({ ...existing, status: 'Kunde', offer: anfrage.paket || existing.offer });
      } else {
        addLead({
          id: `lead-${anfrage.id}`,
          name: anfrage.name,
          category: '',
          district: '',
          address: '',
          phone: '',
          email: anfrage.email,
          website: 'Ungeprüft',
          websiteUrl: '',
          score: 0,
          status: 'Kunde',
          reason: 'Über Kiezseite-Anfrage angenommen',
          priceMin: 0,
          priceMax: 0,
          offer: anfrage.paket || '',
        });
      }

      const ics = buildProjectReminderIcs({ customerName: anfrage.name, paket: anfrage.paket, notes: anfrage.nachricht });
      downloadIcs(ics, `projekt-${anfrage.name.replace(/\s+/g, '-').toLowerCase()}.ics`);
    } finally {
      setBusy(false);
      onClose();
    }
  }

  async function setStatus(newStatus) {
    setBusy(true);
    try { await updateStatusRemote(anfrage.id, newStatus); } finally { setBusy(false); }
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-head">
          <div><div className="eyebrow">ANFRAGE</div><h2>{anfrage.name}</h2></div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="form-grid" style={{ marginTop: 10 }}>
          <label className="field"><span>E-Mail</span><input value={anfrage.email} readOnly /></label>
          <label className="field"><span>Paket</span><input value={anfrage.paket || '—'} readOnly /></label>
        </div>
        <label className="field" style={{ marginTop: 12 }}>
          <span>Nachricht</span>
          <textarea readOnly value={anfrage.nachricht || '—'} rows={4} />
        </label>

        <div className="modal-actions" style={{ marginTop: 20, flexWrap: 'wrap' }}>
          {anfrage.status !== 'Auftrag angenommen' && (
            <button className="primary-button" onClick={accept} disabled={busy}>
              <Calendar size={15} /> Auftrag annehmen & Kalender-Erinnerung
            </button>
          )}
          {anfrage.status === 'Neu' && (
            <button className="secondary-button" onClick={() => setStatus('Kontaktiert')} disabled={busy}>Als kontaktiert markieren</button>
          )}
          {anfrage.status !== 'Abgelehnt' && anfrage.status !== 'Auftrag angenommen' && (
            <button className="secondary-button" onClick={() => setStatus('Abgelehnt')} disabled={busy}>Ablehnen</button>
          )}
          {!confirmDelete ? (
            <button className="danger-button" onClick={() => setConfirmDelete(true)}><Trash2 size={14} /> Löschen</button>
          ) : (
            <>
              <button className="danger-button" onClick={() => deleteRemote(anfrage.id).then(onClose)}>Sicher?</button>
              <button className="secondary-button" onClick={() => setConfirmDelete(false)}>Abbrechen</button>
            </>
          )}
        </div>
        <p className="muted-note" style={{ marginTop: 14 }}>
          Beim Annehmen wird automatisch ein Kunden-Eintrag in "Meine Leads" angelegt (oder ein bestehender
          Lead mit gleicher E-Mail auf Status "Kunde" gesetzt). Außerdem wird eine Kalenderdatei (.ics)
          heruntergeladen: wöchentliche Erinnerung für 6 Wochen, danach endet sie automatisch. Einfach in
          Google/Apple/Outlook-Kalender importieren.
        </p>
      </div>
    </div>
  );
}
