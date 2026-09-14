import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Link2, LayoutTemplate, Loader2, Mail, ScanSearch, X } from 'lucide-react';
import { STATUSES, scoreTone } from '../lib/constants';
import { useLeads } from '../lib/LeadsContext';

const VERDICT_LABEL = {
  modern: 'Modern & mobilfreundlich',
  veraltet: 'Veraltet',
  nicht_erreichbar: 'Nicht erreichbar',
  social_media_only: 'Nur Social Media',
  ungueltig: 'Ungültige URL',
};

export default function LeadModal({ lead, onClose }) {
  const { updateStatus, updateLead, deleteLead } = useLeads();
  const [showMail, setShowMail] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState('');

  const draft = `Betreff: Kurzer Website-Vorschlag für ${lead.name}\n\nGuten Tag,\n\nmir ist ${lead.name} aufgefallen. ${lead.reason || 'Ihre Online-Präsenz bietet Potenzial.'}\n\nIch erstelle moderne Websites für lokale Unternehmen in ${lead.city || lead.district || 'Ihrer Stadt'} und würde Ihnen gern unverbindlich zeigen, wie eine zeitgemäße Version aussehen könnte.\n\nViele Grüße\n[Dein Name]`;

  async function checkWebsite() {
    if (!lead.websiteUrl) return;
    setChecking(true);
    setCheckError('');
    try {
      const response = await fetch('/api/leads/check-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: lead.websiteUrl }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.message || 'Prüfung fehlgeschlagen');
      const r = data.result;
      const isPositiveForUs = r.verdict === 'veraltet' || r.verdict === 'social_media_only' || r.verdict === 'nicht_erreichbar';
      updateLead(lead.id, {
        website: r.verdict === 'modern' ? 'Website vorhanden' : r.verdict === 'social_media_only' ? 'Nur Social Media' : r.verdict === 'nicht_erreichbar' ? 'Nicht erreichbar' : 'Veraltet',
        reason: r.message,
        score: isPositiveForUs ? Math.max(lead.score, 78) : 40,
        websiteCheck: r,
      });
    } catch (error) {
      setCheckError(error.message || 'Unbekannter Fehler bei der Prüfung');
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="eyebrow">LEAD DETAIL</div>
            <h2>{lead.name}</h2>
            <p>{lead.category} · {lead.district}</p>
          </div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-score">
          <div><span>Lead Score</span><strong>{lead.score}<small>/100</small></strong></div>
          <div className={`score-ring ${scoreTone(lead.score)}`}>{lead.score}</div>
        </div>

        <div className="detail-grid">
          <Detail label="Adresse" value={lead.address || '—'} />
          <Detail label="Telefon" value={lead.phone ? <a href={`tel:${lead.phone.replace(/\s+/g, '')}`}>{lead.phone}</a> : '—'} />
          <Detail label="E-Mail" value={lead.email ? <a href={`mailto:${lead.email}`}>{lead.email}</a> : '—'} />
          <Detail label="Website" value={lead.website || '—'} />
          <Detail label="Öffnungszeiten" value={lead.openingHours || '—'} />
          <Detail label="Potenzial" value={lead.reason || '—'} />
        </div>

        {(lead.facebook || lead.instagram) && (
          <div className="social-row">
            {lead.facebook && <a className="secondary-button compact" href={lead.facebook} target="_blank" rel="noreferrer"><Link2 size={14} /> Facebook</a>}
            {lead.instagram && <a className="secondary-button compact" href={lead.instagram} target="_blank" rel="noreferrer"><Link2 size={14} /> Instagram</a>}
          </div>
        )}

        {lead.websiteCheck && (
          <div className="check-box">
            <strong>{VERDICT_LABEL[lead.websiteCheck.verdict] || lead.websiteCheck.verdict}</strong>
            <div className="check-meta">
              {lead.websiteCheck.https !== null && <span>{lead.websiteCheck.https ? 'HTTPS ✓' : 'Kein HTTPS'}</span>}
              {lead.websiteCheck.mobileFriendly !== null && <span>{lead.websiteCheck.mobileFriendly ? 'Mobilfreundlich ✓' : 'Nicht mobiloptimiert'}</span>}
              {lead.websiteCheck.loadTimeMs != null && <span>{lead.websiteCheck.loadTimeMs} ms</span>}
            </div>
          </div>
        )}

        {lead.priceMin && (
          <div className="offer-box">
            <div><strong>{lead.offer || 'Website-Angebot'}</strong><span>Empfohlener Rahmen: {lead.priceMin}–{lead.priceMax} €</span></div>
          </div>
        )}

        <label className="modal-label">
          Status
          <select value={lead.status || 'Neu'} onChange={(e) => updateStatus(lead.id, e.target.value)}>
            {STATUSES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>

        <div className="modal-actions">
          {lead.websiteUrl && (
            <button className="secondary-button" onClick={checkWebsite} disabled={checking}>
              {checking ? <Loader2 size={16} className="spin" /> : <ScanSearch size={16} />}
              {checking ? 'Prüfe…' : 'Website prüfen'}
            </button>
          )}
          <Link className="secondary-button link-button" to={`/vorlagen?lead=${lead.id}`}>
            <LayoutTemplate size={16} /> Website-Vorlage erstellen
          </Link>
          <button className="secondary-button" onClick={() => setShowMail(!showMail)}>
            <Mail size={16} /> {showMail ? 'Entwurf schließen' : 'E-Mail entwerfen'}
          </button>
          {lead.email && (
            <a
              className="secondary-button link-button"
              href={`mailto:${lead.email}?subject=${encodeURIComponent(`Kurzer Website-Vorschlag für ${lead.name}`)}&body=${encodeURIComponent(draft.split('\n\n').slice(1).join('\n\n'))}`}
            >
              <Mail size={16} /> Direkt mailen
            </a>
          )}
          {lead.websiteUrl && (
            <a className="secondary-button link-button" href={lead.websiteUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={16} /> Website
            </a>
          )}
          <button className="danger-button" onClick={() => { deleteLead(lead.id); onClose(); }}>Löschen</button>
        </div>

        {checkError && <div className="error-banner"><X size={16} />{checkError}</div>}
        {showMail && <textarea className="mail-draft" readOnly value={draft} onFocus={(e) => e.target.select()} />}
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return <div className="detail"><span>{label}</span><strong>{value}</strong></div>;
}
