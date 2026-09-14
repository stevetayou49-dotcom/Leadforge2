import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const PROFILE_KEY = 'leadforge-business-profile';
const INVOICES_KEY = 'leadforge-invoices';

const defaultProfile = {
  companyName: '',
  ownerName: '',
  street: '',
  zipCity: '',
  email: '',
  phone: '',
  taxNumber: '',
  vatId: '',
  kleinunternehmer: true,
  defaultTaxRate: 19,
  iban: '',
  bic: '',
  bankName: '',
  invoicePrefix: '',
  nextInvoiceSeq: 1,
};

function loadProfile() {
  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    return stored ? { ...defaultProfile, ...JSON.parse(stored) } : defaultProfile;
  } catch {
    return defaultProfile;
  }
}

function loadInvoices() {
  try {
    const stored = localStorage.getItem(INVOICES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function emptyItem() {
  return { id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, desc: '', qty: 1, unitPrice: 0 };
}

function computeTotals(items, kleinunternehmer, taxRate) {
  const subtotal = items.reduce((sum, i) => sum + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0);
  const tax = kleinunternehmer ? 0 : subtotal * ((Number(taxRate) || 0) / 100);
  return { subtotal, tax, total: subtotal + tax };
}

const InvoiceContext = createContext(null);

export function InvoiceProvider({ children }) {
  const [profile, setProfile] = useState(loadProfile);
  const [invoices, setInvoices] = useState(loadInvoices);
  const [notice, setNotice] = useState('');

  useEffect(() => { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices)); }, [invoices]);

  // markiert offene, überfällige Rechnungen automatisch beim Start
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- gewollter Abgleich beim Mount
    setInvoices((current) => {
      let changed = false;
      const next = current.map((inv) => {
        if (inv.status === 'Offen' && inv.dueDate && inv.dueDate < today) {
          changed = true;
          return { ...inv, status: 'Überfällig' };
        }
        return inv;
      });
      return changed ? next : current;
    });
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  function updateProfile(patch) {
    setProfile((current) => ({ ...current, ...patch }));
  }

  function formatInvoiceNumber(seq, date) {
    const year = new Date(date || Date.now()).getFullYear();
    const padded = String(seq).padStart(3, '0');
    return profile.invoicePrefix ? `${profile.invoicePrefix}-${year}-${padded}` : `${year}-${padded}`;
  }

  function createInvoice(draft) {
    const items = draft.items && draft.items.length ? draft.items : [emptyItem()];
    const kleinunternehmer = draft.kleinunternehmer ?? profile.kleinunternehmer;
    const taxRate = draft.taxRate ?? profile.defaultTaxRate;
    const totals = computeTotals(items, kleinunternehmer, taxRate);
    const number = formatInvoiceNumber(profile.nextInvoiceSeq, draft.date);
    const invoice = {
      id: `inv-${Date.now()}`,
      number,
      date: draft.date,
      dueDate: draft.dueDate,
      customer: draft.customer,
      items,
      notes: draft.notes || '',
      kleinunternehmer,
      taxRate,
      status: 'Offen',
      ...totals,
      createdAt: new Date().toISOString(),
    };
    setInvoices((current) => [invoice, ...current]);
    setProfile((current) => ({ ...current, nextInvoiceSeq: current.nextInvoiceSeq + 1 }));
    setNotice(`Rechnung ${number} erstellt`);
    return invoice;
  }

  function updateInvoiceStatus(id, status) {
    setInvoices((current) => current.map((inv) => (inv.id === id ? { ...inv, status } : inv)));
    setNotice(`Status auf „${status}“ gesetzt`);
  }

  function deleteInvoice(id) {
    setInvoices((current) => current.filter((inv) => inv.id !== id));
    setNotice('Rechnung gelöscht');
  }

  const stats = useMemo(() => ({
    total: invoices.length,
    open: invoices.filter((i) => i.status === 'Offen').length,
    paid: invoices.filter((i) => i.status === 'Bezahlt').length,
    overdue: invoices.filter((i) => i.status === 'Überfällig').length,
    sumOpen: invoices.filter((i) => i.status === 'Offen' || i.status === 'Überfällig').reduce((s, i) => s + i.total, 0),
    sumPaid: invoices.filter((i) => i.status === 'Bezahlt').reduce((s, i) => s + i.total, 0),
  }), [invoices]);

  const profileComplete = Boolean(
    profile.companyName && profile.street && profile.zipCity
    && (profile.kleinunternehmer || profile.vatId || profile.taxNumber),
  );

  const value = {
    profile, updateProfile, profileComplete,
    invoices, stats, notice, setNotice,
    createInvoice, updateInvoiceStatus, deleteInvoice,
    emptyItem, computeTotals,
  };

  return <InvoiceContext.Provider value={value}>{children}</InvoiceContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useInvoices() {
  const ctx = useContext(InvoiceContext);
  if (!ctx) throw new Error('useInvoices muss innerhalb von <InvoiceProvider> verwendet werden');
  return ctx;
}
