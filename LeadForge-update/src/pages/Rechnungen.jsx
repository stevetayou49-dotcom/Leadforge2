import { useState } from 'react';
import {
  AlertTriangle, FileText, Plus, Printer, Receipt, Settings, Trash2, X,
} from 'lucide-react';
import { useInvoices } from '../lib/InvoiceContext';
import { useLeads } from '../lib/LeadsContext';

const money = (n) => (Number(n) || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
const STATUS_LIST = ['Offen', 'Bezahlt', 'Überfällig'];

export default function Rechnungen() {
  const { profileComplete, invoices, stats } = useInvoices();
  const [tab, setTab] = useState('rechnungen');
  const [showForm, setShowForm] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);

  return (
    <div>
      <div className="page-head">
        <div className="eyebrow"><Receipt size={13} /> RECHNUNGEN</div>
        <h1>Rechnungen <em>schreiben</em></h1>
        <p>Firmendaten einmal hinterlegen, dann Rechnungen mit fortlaufender Nummer erstellen und als PDF drucken.</p>
      </div>

      <div className="preset-row" style={{ marginBottom: 24 }}>
        <button type="button" className={`secondary-button compact ${tab === 'rechnungen' ? 'preset-active' : ''}`} onClick={() => setTab('rechnungen')}>
          <FileText size={14} /> Rechnungen
        </button>
        <button type="button" className={`secondary-button compact ${tab === 'firmendaten' ? 'preset-active' : ''}`} onClick={() => setTab('firmendaten')}>
          <Settings size={14} /> Firmendaten
        </button>
      </div>

      {!profileComplete && (
        <div className="error-banner" style={{ marginBottom: 18 }}>
          <AlertTriangle size={16} />
          Firmendaten sind noch unvollständig (Name, Adresse, Steuernummer/USt-ID) – bitte im Tab „Firmendaten“ ergänzen, bevor du eine Rechnung verschickst.
        </div>
      )}

      {tab === 'firmendaten' && <ProfileForm />}

      {tab === 'rechnungen' && (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
            <StatCard label="Offene Summe" value={money(stats.sumOpen)} />
            <StatCard label="Bezahlt (gesamt)" value={money(stats.sumPaid)} />
            <StatCard label="Rechnungen" value={stats.total} />
          </div>

          <div className="toolbar">
            <div className="toolbar-title"><h2>Alle Rechnungen</h2><span>{invoices.length}</span></div>
            <button className="primary-button compact" onClick={() => setShowForm(true)}><Plus size={15} /> Neue Rechnung</button>
          </div>

          <div className="table-card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nummer</th><th>Kunde</th><th>Datum</th><th>Fällig</th><th>Betrag</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} onClick={() => setActiveInvoice(inv)}>
                      <td>{inv.number}</td>
                      <td>{inv.customer?.name || '—'}</td>
                      <td>{inv.date}</td>
                      <td>{inv.dueDate}</td>
                      <td>{money(inv.total)}</td>
                      <td><StatusBadge status={inv.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {invoices.length === 0 && (
                <div className="empty">
                  <Receipt size={30} />
                  <strong>Noch keine Rechnungen</strong>
                  <span>Erstelle deine erste Rechnung über den Button oben.</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showForm && <InvoiceForm onClose={() => setShowForm(false)} />}
      {activeInvoice && <InvoiceDetail invoice={activeInvoice} onClose={() => setActiveInvoice(null)} />}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-icon warm"><Receipt size={16} /></div>
      <div><span>{label}</span><strong>{value}</strong></div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cls = status === 'Bezahlt' ? 'status-kunde' : status === 'Überfällig' ? 'status-badge' : 'status-interessiert';
  return <span className={`status-badge ${cls}`}><i />{status}</span>;
}

function ProfileForm() {
  const { profile, updateProfile } = useInvoices();
  const set = (key) => (e) => updateProfile({ [key]: e.target.value });
  const setBool = (key) => (e) => updateProfile({ [key]: e.target.checked });

  return (
    <div className="search-card">
      <div className="section-heading">
        <div><span className="section-icon"><Settings size={16} /></span><div><h2>Firmendaten</h2><p>Erscheinen auf jeder Rechnung im Impressum-Bereich</p></div></div>
      </div>
      <div className="form-grid">
        <label className="field"><span>Firmenname</span><input value={profile.companyName} onChange={set('companyName')} placeholder="z. B. Kiezseite" /></label>
        <label className="field"><span>Inhaber:in</span><input value={profile.ownerName} onChange={set('ownerName')} placeholder="Vor- und Nachname" /></label>
        <label className="field"><span>Straße & Hausnummer</span><input value={profile.street} onChange={set('street')} /></label>
        <label className="field"><span>PLZ & Ort</span><input value={profile.zipCity} onChange={set('zipCity')} /></label>
        <label className="field"><span>E-Mail</span><input value={profile.email} onChange={set('email')} /></label>
        <label className="field"><span>Telefon</span><input value={profile.phone} onChange={set('phone')} /></label>
        <label className="field"><span>Steuernummer</span><input value={profile.taxNumber} onChange={set('taxNumber')} placeholder="vom Finanzamt" /></label>
        <label className="field"><span>USt-IdNr. (optional)</span><input value={profile.vatId} onChange={set('vatId')} /></label>
        <label className="field"><span>IBAN</span><input value={profile.iban} onChange={set('iban')} /></label>
        <label className="field"><span>Bank</span><input value={profile.bankName} onChange={set('bankName')} /></label>
        <label className="field"><span>Rechnungs-Präfix (optional)</span><input value={profile.invoicePrefix} onChange={set('invoicePrefix')} placeholder="z. B. KS" /></label>
        <label className="field"><span>Nächste Rechnungsnummer</span><input type="number" min="1" value={profile.nextInvoiceSeq} onChange={(e) => updateProfile({ nextInvoiceSeq: Number(e.target.value) || 1 })} /></label>
      </div>
      <label className="page-check" style={{ marginTop: 16 }}>
        <input type="checkbox" checked={profile.kleinunternehmer} onChange={setBool('kleinunternehmer')} />
        Kleinunternehmerregelung nach § 19 UStG (keine Umsatzsteuer ausweisen)
      </label>
      {!profile.kleinunternehmer && (
        <label className="field" style={{ marginTop: 12, maxWidth: 220 }}>
          <span>Standard-Steuersatz (%)</span>
          <input type="number" value={profile.defaultTaxRate} onChange={(e) => updateProfile({ defaultTaxRate: Number(e.target.value) || 0 })} />
        </label>
      )}
      <p className="muted-note" style={{ marginTop: 16 }}>
        Hinweis: Dies ist kein Steuer- oder Rechtsberatungs-Ersatz. Lass deine Rechnungsvorlage einmal von
        einer Steuerberatung gegenprüfen, sobald du angemeldet bist.
      </p>
    </div>
  );
}

function InvoiceForm({ onClose }) {
  const { profile, createInvoice, emptyItem, computeTotals } = useInvoices();
  const { leads } = useLeads();
  const customers = leads.filter((l) => l.status === 'Kunde');

  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const [due] = useState(() => new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));

  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [date, setDate] = useState(today);
  const [dueDate, setDueDate] = useState(due);
  const [notes, setNotes] = useState('');
  const [kleinunternehmer, setKleinunternehmer] = useState(profile.kleinunternehmer);
  const [taxRate, setTaxRate] = useState(profile.defaultTaxRate);
  const [items, setItems] = useState([emptyItem()]);

  function pickCustomer(id) {
    const lead = customers.find((l) => l.id === id);
    if (!lead) return;
    setCustomerName(lead.name || '');
    setCustomerAddress(lead.address || '');
    setCustomerEmail(lead.email || '');
  }

  function updateItem(id, patch) {
    setItems((current) => current.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }
  function addItem() { setItems((current) => [...current, emptyItem()]); }
  function removeItem(id) { setItems((current) => current.filter((i) => i.id !== id)); }

  const totals = computeTotals(items, kleinunternehmer, taxRate);

  function handleSubmit() {
    if (!customerName.trim() || items.every((i) => !i.desc.trim())) return;
    createInvoice({
      customer: { name: customerName, address: customerAddress, email: customerEmail },
      date, dueDate, notes, kleinunternehmer, taxRate,
      items: items.filter((i) => i.desc.trim()),
    });
    onClose();
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal add-modal" onMouseDown={(e) => e.stopPropagation()} style={{ maxWidth: 780 }}>
        <div className="modal-head">
          <div><div className="eyebrow">NEUE RECHNUNG</div><h2>Rechnung erstellen</h2></div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>

        {customers.length > 0 && (
          <label className="field" style={{ marginTop: 18 }}>
            <span>Aus Kunden übernehmen (optional)</span>
            <select onChange={(e) => pickCustomer(e.target.value)} defaultValue="">
              <option value="" disabled>Kunde wählen…</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        )}

        <div className="form-grid" style={{ marginTop: 14 }}>
          <label className="field"><span>Kundenname</span><input value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></label>
          <label className="field"><span>Kunden-E-Mail</span><input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} /></label>
          <label className="field" style={{ gridColumn: '1 / -1' }}><span>Kundenadresse</span><input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} /></label>
          <label className="field"><span>Rechnungsdatum</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label className="field"><span>Fällig am</span><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></label>
        </div>

        <div style={{ marginTop: 22 }}>
          <span className="modal-label" style={{ marginTop: 0 }}>Positionen</span>
          {items.map((item) => (
            <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 110px 32px', gap: 8, marginTop: 8, alignItems: 'center' }}>
              <input placeholder="Beschreibung" value={item.desc} onChange={(e) => updateItem(item.id, { desc: e.target.value })} />
              <input type="number" min="0" placeholder="Menge" value={item.qty} onChange={(e) => updateItem(item.id, { qty: e.target.value })} />
              <input type="number" min="0" step="0.01" placeholder="Preis €" value={item.unitPrice} onChange={(e) => updateItem(item.id, { unitPrice: e.target.value })} />
              <button className="icon-button" onClick={() => removeItem(item.id)} disabled={items.length === 1}><Trash2 size={14} /></button>
            </div>
          ))}
          <button className="secondary-button compact" style={{ marginTop: 10 }} onClick={addItem}><Plus size={13} /> Position hinzufügen</button>
        </div>

        <label className="page-check" style={{ marginTop: 20 }}>
          <input type="checkbox" checked={kleinunternehmer} onChange={(e) => setKleinunternehmer(e.target.checked)} />
          Kleinunternehmerregelung (keine USt.)
        </label>
        {!kleinunternehmer && (
          <label className="field" style={{ marginTop: 10, maxWidth: 200 }}>
            <span>Steuersatz (%)</span>
            <input type="number" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value) || 0)} />
          </label>
        )}

        <label className="modal-label">
          Notiz (erscheint auf der Rechnung)
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="z. B. Zahlbar innerhalb von 14 Tagen" />
        </label>

        <div className="modal-score" style={{ marginTop: 20 }}>
          <div><span>Gesamtbetrag</span><strong>{money(totals.total)}</strong></div>
          <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--muted)' }}>
            Netto {money(totals.subtotal)}{!kleinunternehmer && <><br />zzgl. {money(totals.tax)} USt.</>}
          </div>
        </div>

        <div className="modal-actions">
          <button className="primary-button" onClick={handleSubmit}><FileText size={15} /> Rechnung erstellen</button>
          <button className="secondary-button" onClick={onClose}>Abbrechen</button>
        </div>
      </div>
    </div>
  );
}

function InvoiceDetail({ invoice, onClose }) {
  const { profile, updateInvoiceStatus, deleteInvoice } = useInvoices();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal invoice-print" onMouseDown={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
        <div className="modal-head no-print">
          <div><div className="eyebrow">RECHNUNG {invoice.number}</div><h2>{invoice.customer?.name}</h2></div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="invoice-sheet">
          <div className="invoice-parties">
            <div>
              <strong>{profile.companyName || '[Firmenname fehlt]'}</strong><br />
              {profile.ownerName && <>{profile.ownerName}<br /></>}
              {profile.street}<br />{profile.zipCity}<br />
              {profile.email}{profile.phone && ` · ${profile.phone}`}
            </div>
            <div className="invoice-meta">
              <div><span>Rechnungsnummer</span><strong>{invoice.number}</strong></div>
              <div><span>Datum</span><strong>{invoice.date}</strong></div>
              <div><span>Fällig am</span><strong>{invoice.dueDate}</strong></div>
            </div>
          </div>

          <div className="invoice-bill-to">
            <span>Rechnung an</span>
            <strong>{invoice.customer?.name}</strong>
            {invoice.customer?.address && <div>{invoice.customer.address}</div>}
            {invoice.customer?.email && <div>{invoice.customer.email}</div>}
          </div>

          <table className="invoice-table">
            <thead><tr><th>Beschreibung</th><th>Menge</th><th>Einzelpreis</th><th>Summe</th></tr></thead>
            <tbody>
              {invoice.items.map((i) => (
                <tr key={i.id}>
                  <td>{i.desc}</td>
                  <td>{i.qty}</td>
                  <td>{money(i.unitPrice)}</td>
                  <td>{money((Number(i.qty) || 0) * (Number(i.unitPrice) || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="invoice-totals">
            <div><span>Netto</span><strong>{money(invoice.subtotal)}</strong></div>
            {invoice.kleinunternehmer
              ? <div className="tax-note">Gemäß § 19 Abs. 1 UStG wird keine Umsatzsteuer berechnet.</div>
              : <div><span>USt. ({invoice.taxRate}%)</span><strong>{money(invoice.tax)}</strong></div>}
            <div className="grand-total"><span>Gesamtbetrag</span><strong>{money(invoice.total)}</strong></div>
          </div>

          {(profile.iban || profile.taxNumber || profile.vatId) && (
            <div className="invoice-footer-info">
              {profile.taxNumber && <div>Steuernummer: {profile.taxNumber}</div>}
              {profile.vatId && <div>USt-IdNr.: {profile.vatId}</div>}
              {profile.iban && <div>IBAN: {profile.iban}{profile.bankName && ` · ${profile.bankName}`}</div>}
            </div>
          )}

          {invoice.notes && <p className="invoice-notes">{invoice.notes}</p>}
        </div>

        <div className="modal-actions no-print">
          <select value={invoice.status} onChange={(e) => updateInvoiceStatus(invoice.id, e.target.value)}>
            {STATUS_LIST.map((s) => <option key={s}>{s}</option>)}
          </select>
          <button className="secondary-button" onClick={() => window.print()}><Printer size={15} /> Drucken / PDF</button>
          {!confirmDelete ? (
            <button className="danger-button" onClick={() => setConfirmDelete(true)}>Löschen</button>
          ) : (
            <>
              <button className="danger-button" onClick={() => { deleteInvoice(invoice.id); onClose(); }}>Sicher?</button>
              <button className="secondary-button" onClick={() => setConfirmDelete(false)}>Abbrechen</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
