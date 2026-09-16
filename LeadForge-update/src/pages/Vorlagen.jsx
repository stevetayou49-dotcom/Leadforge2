import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Check, Copy, Download, ExternalLink, Link2, LayoutTemplate, Loader2, RefreshCw, Sparkles, Trash2, Upload,
} from 'lucide-react';
import { CATEGORIES, TEMPLATE_CATEGORIES } from '../lib/constants';
import { useLeads } from '../lib/LeadsContext';
import { useInbox } from '../lib/InboxContext';
import { STYLES } from '../lib/templates/styles';
import { PAGE_DEFS, PAGE_COUNT_PRESETS, buildSite, downloadSite } from '../lib/templates/generator';

export default function Vorlagen() {
  const { leads } = useLeads();
  const [params] = useSearchParams();

  const [businessName, setBusinessName] = useState('Musterbetrieb');
  const [category, setCategory] = useState(TEMPLATE_CATEGORIES[0]);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [styleId, setStyleId] = useState(STYLES[0].id);
  const [pageIds, setPageIds] = useState(PAGE_COUNT_PRESETS[4]);
  const [previewId, setPreviewId] = useState('home');
  const [downloading, setDownloading] = useState(false);
  const { config } = useInbox();
  const [demoState, setDemoState] = useState('idle'); // idle | creating | done | error
  const [demoUrl, setDemoUrl] = useState('');
  const [demoError, setDemoError] = useState('');
  const [copied, setCopied] = useState(false);
  const [customCode, setCustomCode] = useState('');

  // Verwaltung bereits erstellter Demo-Links (löschen, falls ein Kunde die Vorlage nicht möchte)
  const [demos, setDemos] = useState([]);
  const [demosLoading, setDemosLoading] = useState(false);
  const [demosError, setDemosError] = useState('');
  const [deletingSlug, setDeletingSlug] = useState('');

  // Upload einer zuvor heruntergeladenen (und ggf. selbst angepassten) .zip, um dafür einen Demo-Link zu erhalten
  const [uploadState, setUploadState] = useState('idle'); // idle | uploading | error
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // Lead-Daten vorausfüllen, wenn man von einem Lead aus hierher kommt
  useEffect(() => {
    const leadId = params.get('lead');
    if (!leadId) return;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- bewusstes Vorausfüllen beim Wechsel des Leads
    setBusinessName(lead.name || 'Musterbetrieb');
    if (CATEGORIES.includes(lead.category)) setCategory(lead.category);
    setAddress(lead.address || '');
    setPhone(lead.phone || '');
    setEmail(lead.email || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const optionalPages = PAGE_DEFS.filter((p) => !p.essential);
  const essentialPages = PAGE_DEFS.filter((p) => p.essential);

  function applyPreset(count) {
    setPageIds(PAGE_COUNT_PRESETS[count]);
    setPreviewId('home');
  }

  function togglePage(id) {
    setPageIds((current) => {
      if (current.includes(id)) return current.filter((p) => p !== id);
      const withNew = [...new Set([...current, id])];
      return PAGE_DEFS.filter((p) => withNew.includes(p.id)).map((p) => p.id);
    });
  }

  const orderedSelectedPages = PAGE_DEFS.filter((p) => pageIds.includes(p.id));

  const site = useMemo(() => buildSite({
    businessName, category, address, phone, email, styleId, pageIds, customCode,
  }), [businessName, category, address, phone, email, styleId, pageIds, customCode]);

  const activePage = site.pages.find((p) => p.id === previewId) || site.pages[0];
  const previewDoc = activePage ? activePage.html.replace('<link rel="stylesheet" href="style.css" />', `<style>${site.css}</style>`) : '';

  // Ein bereits erstellter Demo-Link passt nicht mehr, sobald sich die Vorlage ändert
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Demo-Link wird bewusst ungültig bei Änderungen
    setDemoState('idle');
    setDemoUrl('');
    setDemoError('');
  }, [site]);

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadSite({ businessName, category, address, phone, email, styleId, pageIds, customCode });
    } finally {
      setDownloading(false);
    }
  }

  function serverBase() {
    return config.apiUrl?.trim().replace(/\/$/, '') || '';
  }

  async function handleCreateDemo() {
    if (!config.adminKey) {
      setDemoState('error');
      setDemoError('Noch keine Server-Verbindung eingerichtet — unter „Anfragen“ → „Verbindung“ einmalig einrichten (gleicher Server, gleicher Admin-Schlüssel).');
      return;
    }
    setDemoState('creating');
    setDemoError('');
    try {
      const res = await fetch(`${serverBase()}/api/demos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': config.adminKey },
        body: JSON.stringify({ businessName, css: site.css, pages: site.pages.map((p) => ({ filename: p.filename, html: p.html })) }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Demo-Link konnte nicht erstellt werden.');
      setDemoUrl(`${window.location.origin}${data.path}`);
      setDemoState('done');
      loadDemos();
    } catch (err) {
      setDemoState('error');
      setDemoError(err.message || 'Demo-Link konnte nicht erstellt werden.');
    }
  }

  function copyDemoUrl() {
    navigator.clipboard.writeText(demoUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function loadDemos() {
    if (!config.adminKey) return;
    setDemosLoading(true);
    setDemosError('');
    try {
      const res = await fetch(`${serverBase()}/api/demos`, { headers: { 'x-admin-key': config.adminKey } });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Demos konnten nicht geladen werden.');
      setDemos(data.demos || []);
    } catch (err) {
      setDemosError(err.message || 'Demos konnten nicht geladen werden.');
    } finally {
      setDemosLoading(false);
    }
  }

  useEffect(() => {
    loadDemos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.adminKey]);

  async function handleDeleteDemo(slug) {
    setDeletingSlug(slug);
    try {
      const res = await fetch(`${serverBase()}/api/demos/${slug}`, { method: 'DELETE', headers: { 'x-admin-key': config.adminKey } });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Löschen fehlgeschlagen.');
      setDemos((current) => current.filter((d) => d.slug !== slug));
    } catch (err) {
      setDemosError(err.message || 'Löschen fehlgeschlagen.');
    } finally {
      setDeletingSlug('');
    }
  }

  async function handleUploadZip(file) {
    if (!file) return;
    if (!config.adminKey) {
      setUploadState('error');
      setUploadError('Noch keine Server-Verbindung eingerichtet — unter „Anfragen“ → „Verbindung“ einmalig einrichten.');
      return;
    }
    setUploadState('uploading');
    setUploadError('');
    try {
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(file);
      const pages = [];
      let css = '';
      await Promise.all(Object.keys(zip.files).map(async (filename) => {
        const entry = zip.files[filename];
        if (entry.dir) return;
        if (filename.endsWith('.html')) {
          pages.push({ filename, html: await entry.async('string') });
        } else if (filename === 'style.css') {
          css = await entry.async('string');
        }
      }));
      if (pages.length === 0) throw new Error('In der .zip wurden keine .html-Dateien gefunden.');
      const label = businessName || file.name.replace(/\.zip$/i, '');
      const res = await fetch(`${serverBase()}/api/demos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': config.adminKey },
        body: JSON.stringify({ businessName: label, css, pages }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Demo-Link konnte nicht erstellt werden.');
      setUploadState('idle');
      loadDemos();
    } catch (err) {
      setUploadState('error');
      setUploadError(err.message || 'Datei konnte nicht verarbeitet werden.');
    }
  }

  return (
    <div>
      <div className="page-head">
        <div className="eyebrow"><LayoutTemplate size={13} /> WEBSITE-VORLAGEN</div>
        <h1>Vorlage in Minuten <em>startklar</em></h1>
        <p>Branche, Stil und Seitenanzahl wählen – fertiger, vorgeschriebener HTML/CSS-Code zum Download, den du für jeden Lead individuell anpassen kannst.</p>
      </div>

      <div className="template-layout">
        <div className="template-form">
          <div className="search-card">
            <div className="section-heading">
              <div><span className="section-icon"><LayoutTemplate size={16} /></span><div><h2>Betrieb</h2><p>Wird direkt in die Vorlage übernommen</p></div></div>
            </div>
            <div className="form-grid">
              <label className="field"><span>Name des Betriebs</span>
                <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="z. B. Bella Italia" />
              </label>
              <label className="field"><span>Branche</span>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {TEMPLATE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label className="field"><span>Adresse</span>
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Straße, PLZ Ort" />
              </label>
              <label className="field"><span>Telefon</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="030 12345678" />
              </label>
              <label className="field" style={{ gridColumn: '1 / -1' }}><span>E-Mail</span>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@betrieb.de" />
              </label>
            </div>
          </div>

          <div className="search-card">
            <div className="section-heading">
              <div><span className="section-icon"><LayoutTemplate size={16} /></span><div><h2>Stil</h2><p>Bestimmt Farben, Schrift und Look</p></div></div>
            </div>
            <div className="style-grid">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`style-swatch ${styleId === s.id ? 'active' : ''}`}
                  onClick={() => setStyleId(s.id)}
                  style={{ background: s.colors.bg, borderColor: styleId === s.id ? s.colors.accent : undefined }}
                >
                  <span className="swatch-dots">
                    <i style={{ background: s.colors.accent }} />
                    <i style={{ background: s.colors.surface, border: `1px solid ${s.colors.line}` }} />
                    <i style={{ background: s.colors.text }} />
                  </span>
                  <strong style={{ color: s.colors.text }}>{s.name}</strong>
                  <span style={{ color: s.colors.muted }}>{s.description}</span>
                  {styleId === s.id && <Check size={15} className="swatch-check" style={{ color: s.colors.accent }} />}
                </button>
              ))}
            </div>
          </div>

          <div className="search-card">
            <div className="section-heading">
              <div><span className="section-icon"><LayoutTemplate size={16} /></span><div><h2>Seiten</h2><p>Wie viele Unterseiten soll die Website haben?</p></div></div>
            </div>
            <div className="preset-row">
              {[3, 4, 5, 6].map((count) => (
                <button
                  key={count}
                  type="button"
                  className={`secondary-button compact ${JSON.stringify(pageIds) === JSON.stringify(PAGE_COUNT_PRESETS[count]) ? 'preset-active' : ''}`}
                  onClick={() => applyPreset(count)}
                >
                  {count} Seiten
                </button>
              ))}
            </div>
            <div className="page-checks">
              {essentialPages.map((p) => (
                <label key={p.id} className="page-check disabled">
                  <input type="checkbox" checked readOnly disabled /> {p.label} <span>Pflicht</span>
                </label>
              ))}
              {optionalPages.map((p) => (
                <label key={p.id} className="page-check">
                  <input type="checkbox" checked={pageIds.includes(p.id)} onChange={() => togglePage(p.id)} /> {p.label}
                  {p.id === 'impressum' && <span>empfohlen (DE)</span>}
                </label>
              ))}
            </div>
          </div>

          <div className="search-card">
            <div className="section-heading">
              <div><span className="section-icon"><Sparkles size={16} /></span><div><h2>Erweitert</h2><p>Eigener Code, z. B. Animationen (optional)</p></div></div>
            </div>
            <label className="field">
              <span>Eigener HTML/CSS/JS-Code</span>
              <textarea
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                placeholder={'<style>...</style>\n<script>...</script>'}
                rows={5}
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />
            </label>
            <p className="muted-note">
              Wird auf jeder Seite direkt vor <code>&lt;/body&gt;</code> eingefügt. Praktisch für Animationen z. B. von{' '}
              <a href="https://reactbits.dev" target="_blank" rel="noreferrer">reactbits.dev</a> — dort bei der gewünschten
              Komponente die Variante <strong>„JS + CSS" (nicht Tailwind/TS)</strong> wählen, das ist reines HTML/CSS/JS ohne
              React und funktioniert hier direkt. Die React/TypeScript-Varianten dort funktionieren nicht ohne Weiteres,
              da diese Vorlagen kein React verwenden — sag Bescheid, falls du eine bestimmte Komponente übertragen möchtest.
            </p>
          </div>

          <div className="template-actions">
            <button className="primary-button full" onClick={handleDownload} disabled={downloading}>
              {downloading ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
              {downloading ? 'Wird erstellt…' : `Herunterladen (${orderedSelectedPages.length} Seiten, .zip)`}
            </button>
            <button className="secondary-button full" onClick={handleCreateDemo} disabled={demoState === 'creating'}>
              {demoState === 'creating' ? <Loader2 size={16} className="spin" /> : <Link2 size={16} />}
              {demoState === 'creating' ? 'Wird erstellt…' : 'Demo-Link erstellen'}
            </button>
          </div>

          {demoState === 'done' && (
            <div className="demo-link-box">
              <span className="eyebrow">DEMO-LINK BEREIT</span>
              <div className="demo-link-row">
                <code>{demoUrl}</code>
                <button className="icon-button" onClick={copyDemoUrl} title="Link kopieren">
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                </button>
                <a className="icon-button" href={demoUrl} target="_blank" rel="noreferrer" title="Öffnen">
                  <ExternalLink size={15} />
                </a>
              </div>
              <p className="muted-note">Diesen Link kannst du direkt an den Kunden schicken. Läuft nicht ab, bis du ihn manuell löschst.</p>
            </div>
          )}
          {demoState === 'error' && <p className="muted-note error" style={{ marginTop: 12 }}>{demoError}</p>}

          <div className="search-card" style={{ marginTop: 24 }}>
            <div className="section-heading">
              <div><span className="section-icon"><Upload size={16} /></span><div><h2>Vorlage hochladen</h2><p>Für eine heruntergeladene und selbst angepasste .zip einen Demo-Link erhalten</p></div></div>
            </div>
            <button className="secondary-button" onClick={() => fileInputRef.current?.click()} disabled={uploadState === 'uploading'}>
              {uploadState === 'uploading' ? <Loader2 size={15} className="spin" /> : <Upload size={15} />}
              {uploadState === 'uploading' ? 'Wird hochgeladen…' : '.zip auswählen'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              style={{ display: 'none' }}
              onChange={(e) => { handleUploadZip(e.target.files?.[0]); e.target.value = ''; }}
            />
            {uploadState === 'error' && <p className="muted-note error">{uploadError}</p>}
            <p className="muted-note">Nutzt den Namen aus dem Feld „Name des Betriebs" oben (oder den Dateinamen, falls leer).</p>
          </div>

          <div className="search-card" style={{ marginTop: 24 }}>
            <div className="section-heading">
              <div><span className="section-icon"><Link2 size={16} /></span><div><h2>Meine Demo-Links</h2><p>Alle aktuell online gespeicherten Vorschauen</p></div></div>
              <button className="icon-button" onClick={loadDemos} title="Aktualisieren"><RefreshCw size={14} className={demosLoading ? 'spin' : ''} /></button>
            </div>
            {!config.adminKey && <p className="muted-note">Verbindung unter „Anfragen“ → „Verbindung“ einrichten, um Demos zu verwalten.</p>}
            {demosError && <p className="muted-note error">{demosError}</p>}
            {config.adminKey && demos.length === 0 && !demosLoading && <p className="muted-note">Noch keine Demo-Links erstellt.</p>}
            {demos.map((d) => (
              <div key={d.slug} className="demo-list-row">
                <div>
                  <strong>{d.businessName}</strong>
                  <span>{new Date(d.createdAt).toLocaleDateString('de-DE')}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <a className="icon-button" href={`${window.location.origin}/demo/${d.slug}/`} target="_blank" rel="noreferrer" title="Öffnen"><ExternalLink size={14} /></a>
                  <button className="icon-button" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/demo/${d.slug}/`)} title="Link kopieren"><Copy size={14} /></button>
                  <button className="icon-button" onClick={() => handleDeleteDemo(d.slug)} disabled={deletingSlug === d.slug} title="Löschen">
                    {deletingSlug === d.slug ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="template-preview">
          <div className="preview-tabs">
            {site.pages.map((p) => (
              <button
                key={p.id}
                className={`preview-tab ${previewId === p.id || (previewId === 'home' && p.id === 'home') ? 'active' : ''} ${activePage?.id === p.id ? 'active' : ''}`}
                onClick={() => setPreviewId(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="preview-frame-wrap">
            <iframe title="Vorschau" className="preview-frame" srcDoc={previewDoc} />
          </div>
        </div>
      </div>
    </div>
  );
}
