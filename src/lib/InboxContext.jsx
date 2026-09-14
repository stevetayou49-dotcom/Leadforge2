import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const CONFIG_KEY = 'leadforge-inbox-config';

function loadConfig() {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    return stored ? JSON.parse(stored) : { apiUrl: '', adminKey: '' };
  } catch {
    return { apiUrl: '', adminKey: '' };
  }
}

const InboxContext = createContext(null);

export function InboxProvider({ children }) {
  const [config, setConfig] = useState(loadConfig);
  const [anfragen, setAnfragen] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [error, setError] = useState('');

  useEffect(() => { localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); }, [config]);

  const base = config.apiUrl?.trim().replace(/\/$/, '') || '';

  const refresh = useCallback(async () => {
    if (!config.adminKey) { setStatus('idle'); return; }
    setStatus('loading');
    setError('');
    try {
      const res = await fetch(`${base}/api/anfragen`, { headers: { 'x-admin-key': config.adminKey } });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Verbindung fehlgeschlagen');
      setAnfragen(data.anfragen || []);
      setStatus('ready');
    } catch (err) {
      setError(err.message || 'Verbindung fehlgeschlagen');
      setStatus('error');
    }
  }, [base, config.adminKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- gewollter Datenabruf beim Mount
    refresh();
  }, [refresh]);

  async function updateStatusRemote(id, newStatus) {
    const res = await fetch(`${base}/api/anfragen/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': config.adminKey },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Update fehlgeschlagen');
    setAnfragen((current) => current.map((a) => (a.id === id ? data.anfrage : a)));
    return data.anfrage;
  }

  async function deleteRemote(id) {
    const res = await fetch(`${base}/api/anfragen/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': config.adminKey },
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Löschen fehlgeschlagen');
    setAnfragen((current) => current.filter((a) => a.id !== id));
  }

  async function testConnection(candidate) {
    const testBase = candidate.apiUrl?.trim().replace(/\/$/, '') || '';
    const res = await fetch(`${testBase}/api/test`);
    if (!res.ok) throw new Error('Server nicht erreichbar');
    const listRes = await fetch(`${testBase}/api/anfragen`, { headers: { 'x-admin-key': candidate.adminKey } });
    const listData = await listRes.json();
    if (!listRes.ok || !listData.success) throw new Error(listData.message || 'Admin-Key ungültig');
    return true;
  }

  const value = { config, setConfig, anfragen, status, error, refresh, updateStatusRemote, deleteRemote, testConnection };
  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useInbox() {
  const ctx = useContext(InboxContext);
  if (!ctx) throw new Error('useInbox muss innerhalb von <InboxProvider> verwendet werden');
  return ctx;
}
