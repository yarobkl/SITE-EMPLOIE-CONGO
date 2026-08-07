import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, ClipboardList, Download, ExternalLink, Search, User, X } from 'lucide-react';
import { hasSupabaseConfig, supabase } from './lib/supabase';

const PRIMARY_EMAIL = 'eliebakala@gmail.com';
const STATUSES = [
  ['pending', 'Nouvelle'],
  ['reviewed', 'En cours'],
  ['accepted', 'Acceptée'],
  ['rejected', 'Refusée'],
];
const STATUS_CLASS = {
  pending: 'bg-blue-50 text-blue-700',
  reviewed: 'bg-amber-50 text-amber-800',
  accepted: 'bg-emerald-50 text-emerald-800',
  rejected: 'bg-red-50 text-red-700',
};

const first = (value) => (Array.isArray(value) ? value[0] : value);
const today = (value) => {
  const date = new Date(value);
  const now = new Date();
  return !Number.isNaN(date.getTime())
    && date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
};
const dateLabel = (value) => new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value));

function normalize(row) {
  const job = first(row.jobs);
  const company = first(job?.companies);
  return {
    id: row.id,
    name: row.nom || 'Candidat',
    email: row.email || '',
    phone: row.phone || '',
    message: row.message || '',
    cvPath: row.cv_url || '',
    cvName: row.cv_name || '',
    tracked: Boolean(row.tracking_enabled),
    reference: row.tracking_number || '',
    opened: Boolean(row.application_opened),
    status: row.status || 'pending',
    createdAt: row.created_at,
    jobTitle: job?.title || 'Offre',
    companyName: company?.name || 'Entreprise',
  };
}

export default function GlobalApplicationsCenterV2() {
  const [authorized, setAuthorized] = useState(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async (quiet = false) => {
    if (!authorized || !supabase) return;
    if (!quiet) setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase
      .from('applications')
      .select('id,nom,email,phone,message,cv_url,cv_name,tracking_enabled,tracking_number,application_opened,status,created_at,jobs(title,companies(name))')
      .order('created_at', { ascending: false });
    if (queryError) setError('Impossible de charger toutes les candidatures.');
    else setItems((data || []).map(normalize));
    if (!quiet) setLoading(false);
  }, [authorized]);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) return undefined;
    const apply = (session) => {
      const allowed = session?.user?.email?.toLowerCase() === PRIMARY_EMAIL;
      setAuthorized(allowed);
      if (!allowed) setOpen(false);
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => apply(session));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authorized) return undefined;
    load();
    const timer = window.setInterval(() => load(true), open ? 10000 : 60000);
    return () => window.clearInterval(timer);
  }, [authorized, load, open]);

  useEffect(() => {
    if (!authorized) return undefined;
    const install = () => {
      const nav = document.querySelector('header nav[aria-label="Navigation principale"]');
      if (nav && !nav.querySelector('[data-all-applications]')) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.allApplications = 'true';
        button.className = 'header-link relative';
        button.textContent = 'Candidatures';
        nav.appendChild(button);
      }
      const actions = document.querySelector('header > div > div:last-child');
      if (actions && !actions.querySelector('[data-all-applications-mobile]')) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.allApplicationsMobile = 'true';
        button.className = 'relative inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600';
        button.setAttribute('aria-label', 'Toutes les candidatures');
        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M8 12h8M8 16h8"/></svg>';
        actions.insertBefore(button, actions.firstChild);
      }
    };
    const click = (event) => {
      const trigger = event.target instanceof Element
        ? event.target.closest('[data-all-applications], [data-all-applications-mobile]')
        : null;
      if (!trigger) return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(true);
      load();
    };
    install();
    const observer = new MutationObserver(install);
    const root = document.getElementById('root');
    if (root) observer.observe(root, { childList: true, subtree: true });
    document.addEventListener('click', click, true);
    return () => {
      observer.disconnect();
      document.removeEventListener('click', click, true);
      document.querySelectorAll('[data-all-applications], [data-all-applications-mobile]').forEach((node) => node.remove());
    };
  }, [authorized, load]);

  const newCount = items.filter((item) => item.status === 'pending' && !item.opened).length;
  useEffect(() => {
    document.querySelectorAll('[data-all-applications], [data-all-applications-mobile]').forEach((button) => {
      let badge = button.querySelector('[data-applications-count]');
      if (!newCount) {
        badge?.remove();
        return;
      }
      if (!badge) {
        badge = document.createElement('span');
        badge.dataset.applicationsCount = 'true';
        badge.className = 'absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-blue-700 px-1 text-[10px] font-bold text-white ring-2 ring-white';
        button.appendChild(badge);
      }
      badge.textContent = newCount > 99 ? '99+' : String(newCount);
    });
  }, [newCount]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => {
      const statusOk = filter === 'all' || item.status === filter;
      const searchOk = !needle || [item.name, item.email, item.phone, item.jobTitle, item.companyName, item.reference]
        .some((value) => value.toLowerCase().includes(needle));
      return statusOk && searchOk;
    });
  }, [filter, items, search]);

  const setStatus = async (item, status) => {
    if (busy) return;
    setBusy(item.id);
    const payload = { status, application_opened: true };
    if (!item.opened) payload.application_seen_at = new Date().toISOString();
    const { error: updateError } = await supabase.from('applications').update(payload).eq('id', item.id);
    if (updateError) setError('Le statut n’a pas pu être modifié.');
    else setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status, opened: true } : entry));
    setBusy('');
  };

  const openCv = async (item, download = false) => {
    if (!item.cvPath || busy) return;
    const popup = download ? null : window.open('about:blank', '_blank');
    if (popup) popup.opener = null;
    setBusy(item.id);
    const options = download ? { download: item.cvName || 'cv.pdf' } : undefined;
    const { data, error: cvError } = await supabase.storage.from('cvs').createSignedUrl(item.cvPath, 300, options);
    if (cvError || !data?.signedUrl) {
      popup?.close();
      setError('Le CV est indisponible pour le moment.');
      setBusy('');
      return;
    }
    if (download) {
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = item.cvName || 'cv.pdf';
      link.target = '_blank';
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else if (popup) popup.location.href = data.signedUrl;

    const now = new Date().toISOString();
    const payload = {
      cv_opened: true,
      cv_opened_at: now,
      application_opened: true,
      status: item.status === 'pending' ? 'reviewed' : item.status,
    };
    if (!item.opened) payload.application_seen_at = now;
    await supabase.from('applications').update(payload).eq('id', item.id);
    setItems((current) => current.map((entry) => entry.id === item.id
      ? { ...entry, opened: true, status: entry.status === 'pending' ? 'reviewed' : entry.status }
      : entry));
    setBusy('');
  };

  if (!authorized || !open) return null;
  const todayCount = items.filter((item) => today(item.createdAt)).length;
  const acceptedCount = items.filter((item) => item.status === 'accepted').length;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/45 backdrop-blur-sm md:p-6" role="dialog" aria-modal="true" aria-label="Toutes les candidatures">
      <div className="mx-auto flex h-full max-w-[1380px] flex-col overflow-hidden bg-white shadow-2xl md:h-[calc(100vh-3rem)] md:rounded-2xl md:border md:border-slate-200">
        <header className="border-b border-slate-200 p-4 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Recruteur principal</p><h2 className="mt-1 text-2xl font-bold text-slate-950 md:text-3xl">Toutes les candidatures</h2><p className="mt-1 text-sm text-slate-500">Candidatures avec ou sans suivi, anciennes et récentes.</p></div>
            <button type="button" onClick={() => setOpen(false)} className="secondary-icon-button" aria-label="Fermer"><X size={20} /></button>
          </div>
          <div className="mt-5 grid grid-cols-4 gap-2">
            <Metric icon={ClipboardList} value={items.length} label="Total" />
            <Metric icon={User} value={todayCount} label="Aujourd’hui" />
            <Metric icon={ClipboardList} value={newCount} label="Nouvelles" />
            <Metric icon={User} value={acceptedCount} label="Acceptées" />
          </div>
          <div className="mt-5 grid gap-2 md:grid-cols-[1fr_190px_auto]">
            <label className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-300 px-3 focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-600"><Search size={18} className="text-slate-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, e-mail, offre, entreprise…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
            <select value={filter} onChange={(event) => setFilter(event.target.value)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"><option value="all">Tous les statuts</option>{STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <button type="button" onClick={() => load()} disabled={loading} className="secondary-button">{loading ? 'Actualisation…' : 'Actualiser'}</button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
          {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
          <div className="grid gap-3">
            {visible.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2"><span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_CLASS[item.status]}`}>{STATUSES.find(([value]) => value === item.status)?.[1] || item.status}</span>{today(item.createdAt) && <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">Aujourd’hui</span>}<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{item.tracked ? 'Avec suivi' : 'Sans suivi'}</span></div>
                    <h3 className="mt-3 text-lg font-bold text-slate-950">{item.name}</h3><p className="mt-1 text-sm font-semibold text-blue-700">{item.jobTitle}</p><p className="mt-1 flex items-center gap-2 text-sm text-slate-600"><Building2 size={16} />{item.companyName}</p><div className="mt-3 grid gap-1 text-sm text-slate-600 sm:grid-cols-2"><span>{item.email || 'Adresse e-mail non renseignée'}</span><span>{item.phone || 'Téléphone non renseigné'}</span></div>
                  </div>
                  <div className="text-sm text-slate-500 lg:text-right"><p>{dateLabel(item.createdAt)}</p>{item.reference && <p className="mt-1 font-semibold text-slate-700">{item.reference}</p>}</div>
                </div>
                {item.message && <div className="mt-4 rounded-lg bg-slate-50 p-3"><p className="text-xs font-bold uppercase text-slate-500">Message</p><p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">{item.message}</p></div>}
                <div className="mt-4 grid gap-2 md:grid-cols-[190px_1fr_1fr]">
                  <select value={item.status} onChange={(event) => setStatus(item, event.target.value)} disabled={busy === item.id} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 disabled:bg-slate-100">{STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                  <button type="button" onClick={() => openCv(item)} disabled={!item.cvPath || busy === item.id} className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white disabled:bg-slate-200 disabled:text-slate-500"><ExternalLink size={16} />{item.cvPath ? 'Ouvrir le CV' : 'Aucun CV'}</button>
                  <button type="button" onClick={() => openCv(item, true)} disabled={!item.cvPath || busy === item.id} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 text-sm font-bold text-blue-800 disabled:bg-slate-100 disabled:text-slate-500"><Download size={16} />Télécharger le CV</button>
                </div>
              </article>
            ))}
          </div>
          {!loading && visible.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center"><ClipboardList className="mx-auto text-slate-400" size={34} /><h3 className="mt-3 font-bold">Aucune candidature trouvée</h3></div>}
        </main>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, value, label }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-3 text-center"><Icon size={17} className="mx-auto text-blue-700" /><p className="mt-1 text-xl font-bold text-slate-950">{value}</p><p className="text-[10px] font-bold uppercase text-slate-500 sm:text-xs">{label}</p></div>;
}
