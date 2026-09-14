import { useMemo, useState } from 'react';
import { Download, MapPin, MoreHorizontal, Plus, Search } from 'lucide-react';
import { CATEGORIES, DISTRICTS, STATUSES, scoreTone } from '../lib/constants';
import { useLeads } from '../lib/LeadsContext';
import { WebsiteBadge, StatusBadge } from '../components/Badges';
import LeadModal from '../components/LeadModal';
import AddLeadModal from '../components/AddLeadModal';

export default function Leads() {
  const { leads, setNotice } = useLeads();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [district, setDistrict] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const filteredLeads = useMemo(() => leads.filter((lead) => {
    const text = `${lead.name} ${lead.address || ''} ${lead.category || ''}`.toLowerCase();
    return (!query || text.includes(query.toLowerCase()))
      && (!category || lead.category === category)
      && (!district || lead.district === district)
      && (!status || lead.status === status);
  }), [leads, query, category, district, status]);

  function exportCSV() {
    if (!filteredLeads.length) return setNotice('Keine Leads zum Exportieren');
    const headers = ['Name', 'Kategorie', 'Bezirk', 'Adresse', 'Telefon', 'E-Mail', 'Website', 'Website URL', 'Score', 'Status', 'Grund'];
    const rows = filteredLeads.map((lead) => [lead.name, lead.category, lead.district, lead.address || '', lead.phone || '', lead.email || '', lead.website || '', lead.websiteUrl || '', lead.score || 0, lead.status || 'Neu', lead.reason || '']);
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leadforge-leads.csv';
    a.click();
    URL.revokeObjectURL(url);
    setNotice('CSV exportiert');
  }

  return (
    <>
      <section className="toolbar">
        <div className="toolbar-title"><h2>Meine Leads</h2><span>{filteredLeads.length} Ergebnisse</span></div>
        <div className="toolbar-actions">
          <div className="inline-search"><Search size={15} /><input placeholder="Leads durchsuchen…" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          <select value={category} onChange={(e) => setCategory(e.target.value)}><option value="">Kategorie</option>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={district} onChange={(e) => setDistrict(e.target.value)}><option value="">Bezirk</option>{DISTRICTS.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Status</option>{STATUSES.map((item) => <option key={item}>{item}</option>)}</select>
          <button className="secondary-button" onClick={exportCSV}><Download size={16} /> Export</button>
          <button className="primary-button compact" onClick={() => setShowAdd(true)}><Plus size={16} /> Lead</button>
        </div>
      </section>

      <section className="table-card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Unternehmen</th><th>Kategorie</th><th>Bezirk</th><th>Website</th><th>Score</th><th>Status</th><th /></tr></thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr><td colSpan="7"><div className="empty"><Search size={28} /><strong>Keine Leads gefunden</strong><span>Ändere deine Filter oder starte eine neue Suche.</span></div></td></tr>
              ) : filteredLeads.map((lead) => (
                <tr key={lead.id} onClick={() => setSelected(lead)}>
                  <td><div className="company-cell"><span className="company-avatar">{lead.name?.slice(0, 1).toUpperCase()}</span><div><strong>{lead.name}</strong><small>{lead.address || 'Adresse nicht vorhanden'}</small></div></div></td>
                  <td><span className="muted-text">{lead.category}</span></td>
                  <td><span className="district"><MapPin size={13} />{lead.district || lead.city || 'Unbekannt'}</span></td>
                  <td><WebsiteBadge website={lead.website} url={lead.websiteUrl} /></td>
                  <td><span className={`score ${scoreTone(lead.score)}`}>{lead.score}<small>/100</small></span></td>
                  <td><StatusBadge status={lead.status} /></td>
                  <td><button className="row-more" onClick={(e) => { e.stopPropagation(); setSelected(lead); }}><MoreHorizontal size={17} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selected && <LeadModal lead={leads.find((l) => l.id === selected.id) || selected} onClose={() => setSelected(null)} />}
      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} />}
    </>
  );
}
