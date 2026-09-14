import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { CATEGORIES, DISTRICTS } from '../lib/constants';
import { useLeads } from '../lib/LeadsContext';

export default function AddLeadModal({ onClose }) {
  const { addLead } = useLeads();
  const [form, setForm] = useState({ name: '', category: 'Restaurant', district: 'Kreuzberg', address: '', phone: '', email: '', website: 'Keine Website', websiteUrl: '' });
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const score = Math.min(100, (form.website === 'Keine Website' ? 55 : 35) + (form.phone ? 10 : 0) + (form.address ? 10 : 0) + (['Restaurant', 'Café', 'Barber', 'Friseur'].includes(form.category) ? 20 : 10));
    addLead({
      ...form,
      id: `manual-${Date.now()}`,
      score,
      status: 'Neu',
      reason: form.website === 'Keine Website' ? 'Keine eigene Website vorhanden' : 'Website auf Modernisierungsbedarf prüfen',
      priceMin: 450,
      priceMax: 950,
      offer: 'Individuelles Website-Angebot',
    });
    onClose();
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <form className="modal add-modal" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="eyebrow">NEUER LEAD</div>
            <h2>Unternehmen hinzufügen</h2>
            <p>Ein Lead, den du selbst entdeckt hast.</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="form-grid">
          <Field label="Unternehmen *"><input required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="z. B. Café am Park" /></Field>
          <Field label="Kategorie"><select value={form.category} onChange={(e) => update('category', e.target.value)}>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Bezirk"><select value={form.district} onChange={(e) => update('district', e.target.value)}>{DISTRICTS.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Website"><select value={form.website} onChange={(e) => update('website', e.target.value)}><option>Keine Website</option><option>Veraltet</option><option>Website vorhanden</option></select></Field>
          <Field label="Website-URL"><input value={form.websiteUrl} onChange={(e) => update('websiteUrl', e.target.value)} placeholder="https://…" /></Field>
          <Field label="Adresse"><input value={form.address} onChange={(e) => update('address', e.target.value)} /></Field>
          <Field label="Telefon"><input value={form.phone} onChange={(e) => update('phone', e.target.value)} /></Field>
          <Field label="E-Mail"><input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="info@…" /></Field>
        </div>
        <button className="primary-button full" type="submit"><Plus size={17} /> Lead speichern</button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}
