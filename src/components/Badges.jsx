import { ExternalLink, Globe2, HelpCircle, X } from 'lucide-react';

export function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="stat-card">
      <div className={accent ? 'stat-icon warm' : 'stat-icon'}><Icon size={17} /></div>
      <div><span>{label}</span><strong>{value}</strong></div>
    </div>
  );
}

export function WebsiteBadge({ website, url }) {
  const missing = website === 'Keine Website';
  const unchecked = website === 'Ungeprüft';
  const className = missing ? 'website-badge missing' : unchecked ? 'website-badge unchecked' : 'website-badge outdated';
  const Icon = missing ? X : unchecked ? HelpCircle : Globe2;
  return (
    <span className={className}>
      <Icon size={12} />{website || 'Unbekannt'}
      {url && (
        <a href={url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
          <ExternalLink size={11} />
        </a>
      )}
    </span>
  );
}

export function StatusBadge({ status }) {
  return <span className={`status-badge status-${String(status || 'Neu').toLowerCase()}`}><i />{status || 'Neu'}</span>;
}
