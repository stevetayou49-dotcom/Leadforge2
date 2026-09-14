import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Check, Inbox, LayoutDashboard, LayoutTemplate, Menu, Receipt, Search, Settings, Sparkles, Users } from 'lucide-react';
import { useLeads } from '../lib/LeadsContext';

const navItems = [
  ['/', 'Dashboard', LayoutDashboard],
  ['/suche', 'Lead-Suche', Search],
  ['/leads', 'Meine Leads', Users],
  ['/vorlagen', 'Vorlagen', LayoutTemplate],
  ['/anfragen', 'Anfragen', Inbox],
  ['/rechnungen', 'Rechnungen', Receipt],
  ['/einstellungen', 'Einstellungen', Settings],
];

export default function Layout() {
  const { notice } = useLeads();
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand" onClick={() => setMobileMenu(false)}>
          <span className="brand-mark"><Sparkles size={17} /></span>
          <span>Lead<span>Forge</span></span>
        </NavLink>
        <nav className="desktop-nav">
          {navItems.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <Icon size={16} />{label}
            </NavLink>
          ))}
        </nav>
        <div className="top-actions">
          <button className="mobile-toggle" onClick={() => setMobileMenu((v) => !v)}><Menu size={20} /></button>
        </div>
      </header>

      {mobileMenu && (
        <div className="mobile-nav">
          {navItems.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setMobileMenu(false)}>
              <Icon size={17} />{label}
            </NavLink>
          ))}
        </div>
      )}

      <main className="page">
        <Outlet />
      </main>

      {notice && <div className="toast"><Check size={16} />{notice}</div>}
    </div>
  );
}
