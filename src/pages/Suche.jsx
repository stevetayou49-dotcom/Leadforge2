import { useState } from 'react';
import { Globe2, Plus, Search, X } from 'lucide-react';
import { CATEGORIES, ALL_CATEGORIES_OPTION, CITIES, CITY_DISTRICTS, scoreTone } from '../lib/constants';
import { useLeads } from '../lib/LeadsContext';
import { WebsiteBadge } from '../components/Badges';

export default function Suche() {
  const { leads, addLead, addLeads } = useLeads();
  const [category, setCategory] = useState('Restaurant');
  const [city, setCity] = useState('Berlin');
  const [district, setDistrict] = useState(CITY_DISTRICTS.Berlin[0]);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const savedIds = new Set(leads.map((l) => l.id));

  function handleCityChange(nextCity) {
    setCity(nextCity);
    setDistrict(CITY_DISTRICTS[nextCity]?.[0] || '');
  }

  async function search(e) {
    e.preventDefault();
    setSearching(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (city) params.set('city', city);
      if (district) params.set('district', district);
      const response = await fetch(`/api/leads/search?${params.toString()}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.message || 'Die Suche ist fehlgeschlagen.');
      const incoming = (data.leads || []).map((lead) => ({ ...lead, id: lead.osmId }));
      setResults(incoming);
      setSearched(true);
    } catch (err) {
      setError(err.message || 'Unbekannter Fehler');
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function saveAll() {
    const unsaved = results.filter((lead) => !savedIds.has(lead.id));
    if (!unsaved.length) return;
    addLeads(unsaved);
  }

  return (
    <>
      <section className="page-head">
        <div className="eyebrow"><Search size={14} /> LEAD-SUCHE</div>
        <h1>Neue Leads finden</h1>
        <p>Kostenlose Suche über OpenStreetMap – kein API-Key nötig.</p>
      </section>

      <section className="search-card">
        <div className="section-heading">
          <div><span className="section-icon"><Search size={17} /></span><div><h2>Betriebe durchsuchen</h2><p>Kategorie und Bezirk wählen, Ergebnisse prüfen und speichern.</p></div></div>
          <span className="powered"><Globe2 size={13} /> OpenStreetMap</span>
        </div>
        <form onSubmit={search} className="search-grid">
          <label>Kategorie<select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>{ALL_CATEGORIES_OPTION}</option>
            {CATEGORIES.map((item) => <option key={item}>{item}</option>)}
          </select></label>
          <label>Stadt<select value={city} onChange={(e) => handleCityChange(e.target.value)}>{CITIES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Bezirk<select value={district} onChange={(e) => setDistrict(e.target.value)}>{(CITY_DISTRICTS[city] || []).map((item) => <option key={item}>{item}</option>)}</select></label>
          <button className="primary-button" disabled={searching}>{searching ? 'Suche läuft…' : <><Search size={17} /> Leads suchen</>}</button>
        </form>
        {error && <div className="error-banner"><X size={16} />{error}</div>}
      </section>

      {searched && (
        <section className="table-card">
          <div className="toolbar" style={{ padding: '18px 20px' }}>
            <div className="toolbar-title"><h2>Ergebnisse</h2><span>{results.length} gefunden</span></div>
            {results.length > 0 && <button className="secondary-button" onClick={saveAll}><Plus size={16} /> Alle speichern</button>}
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Unternehmen</th><th>Adresse</th><th>Website</th><th>Score</th><th /></tr></thead>
              <tbody>
                {results.length === 0 ? (
                  <tr><td colSpan="5"><div className="empty"><Search size={28} /><strong>Keine Treffer</strong><span>Andere Kategorie oder Bezirk probieren.</span></div></td></tr>
                ) : results.map((lead) => {
                  const saved = savedIds.has(lead.id);
                  return (
                    <tr key={lead.id}>
                      <td><strong>{lead.name}</strong></td>
                      <td><span className="muted-text">{lead.address || '—'}</span></td>
                      <td><WebsiteBadge website={lead.website} url={lead.websiteUrl} /></td>
                      <td><span className={`score ${scoreTone(lead.score)}`}>{lead.score}<small>/100</small></span></td>
                      <td>
                        <button className={saved ? 'secondary-button compact' : 'primary-button compact'} disabled={saved} onClick={() => addLead(lead)}>
                          {saved ? 'Gespeichert' : <><Plus size={14} /> Speichern</>}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
