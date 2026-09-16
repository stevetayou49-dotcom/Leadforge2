import { Link } from 'react-router-dom';
import { ArrowRight, Globe2, Mail, Search, Sparkles, Store, Target, Users } from 'lucide-react';
import { useLeads } from '../lib/LeadsContext';
import { StatCard, WebsiteBadge, StatusBadge } from '../components/Badges';
import { scoreTone } from '../lib/constants';
import MaskedHeading from '../components/MaskedHeading';
import heroImage from '../assets/hero.png';

export default function Dashboard() {
  const { leads, stats } = useLeads();
  const recentLeads = [...leads]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 5);

  return (
    <>
      <section className="hero-row">
        <div>
          <div className="eyebrow"><Target size={14} /> LOCAL SALES OS</div>
          <MaskedHeading
            text="Finde die richtigen Leads"
            tag="h1"
            src={heroImage}
            reveal="rise"
            trigger="view"
            align="left"
            textScale={0.1}
          />
          <p>Entdecke lokale Unternehmen mit Website-Potenzial und verwandle sie in Kunden.</p>
        </div>
        <div className="hero-badge"><div className="pulse-dot" /><span>Berlin · Mönchengladbach</span><strong>•</strong><span>OpenStreetMap</span></div>
      </section>

      <section className="quick-actions">
        <Link to="/suche" className="quick-action">
          <span className="section-icon"><Search size={17} /></span>
          <div><strong>Neue Leads suchen</strong><span>Betriebe nach Stadt, Kategorie &amp; Bezirk finden</span></div>
          <ArrowRight size={16} />
        </Link>
        <Link to="/leads" className="quick-action">
          <span className="section-icon"><Users size={17} /></span>
          <div><strong>Meine Leads verwalten</strong><span>Pipeline, Status &amp; CSV-Export</span></div>
          <ArrowRight size={16} />
        </Link>
      </section>

      <section className="stats-grid">
        <StatCard icon={Users} label="Leads gesamt" value={stats.total} />
        <StatCard icon={Globe2} label="Keine Website" value={stats.noWebsite} accent />
        <StatCard icon={Sparkles} label="Website veraltet" value={stats.outdated} />
        <StatCard icon={Mail} label="Kontaktiert" value={stats.contacted} />
        <StatCard icon={Target} label="Interessiert" value={stats.interested} />
        <StatCard icon={Store} label="Kunden" value={stats.customers} />
      </section>

      <section className="table-card">
        <div className="toolbar" style={{ padding: '18px 20px 4px' }}>
          <div className="toolbar-title"><h2>Top-Leads nach Score</h2></div>
          <Link to="/leads" className="secondary-button">Alle Leads <ArrowRight size={15} /></Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Unternehmen</th><th>Kategorie</th><th>Website</th><th>Score</th><th>Status</th></tr></thead>
            <tbody>
              {recentLeads.length === 0 ? (
                <tr><td colSpan="5"><div className="empty"><Search size={28} /><strong>Noch keine Leads</strong><span>Starte deine erste Suche.</span></div></td></tr>
              ) : recentLeads.map((lead) => (
                <tr key={lead.id}>
                  <td><strong>{lead.name}</strong></td>
                  <td><span className="muted-text">{lead.category}</span></td>
                  <td><WebsiteBadge website={lead.website} url={lead.websiteUrl} /></td>
                  <td><span className={`score ${scoreTone(lead.score)}`}>{lead.score}<small>/100</small></span></td>
                  <td><StatusBadge status={lead.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer><span>LeadForge</span><span>Built for local business acquisition · Berlin & Mönchengladbach</span></footer>
    </>
  );
}
