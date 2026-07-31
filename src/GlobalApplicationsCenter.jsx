import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  Download,
  ExternalLink,
  FileText,
  RefreshCw,
  Search,
  UserRound,
  X,
} from 'lucide-react';
import { hasSupabaseConfig, supabase } from './lib/supabase';

const PRIMARY_RECRUITER_EMAIL = 'eliebakala@gmail.com';
const STATUS_OPTIONS = [
  { value: 'pending', label: 'Nouvelle' },
  { value: 'reviewed', label: 'En cours' },
  { value: 'accepted', label: 'Acceptée' },
  { value: 'rejected', label: 'Refusée' },
];
const STATUS_STYLES = {
  pending: 'bg-blue-50 text-blue-700',
  reviewed: 'bg-amber-50 text-amber-800',
  accepted: 'bg-emerald-50 text-emerald-800',
  rejected: 'bg-red-50 text-red-700',
};

const one = (value) => (Array.isArray(value) ? value[0] : value);

function formatDate(value) {
  if (!value) return 'Date inconnue';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date inconnue';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function isToday(value) {
  const date = new Date(value);
  const today = new Date();
  return !Number.isNaN(date.getTime())
    && date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate();
}

function normalizeApplication(row) {
  const job = one(row.jobs);
  const company = one(job?.companies);
  return {
    id: row.id,
    name: row.nom || 'Candidat',
    email: row.email || '',
    phone: row.phone || '',
    message: row.message || '',
    cvPath: row.cv_url || '',
    cvName: row.cv_name || '',
    trackingEnabled: Boolean(row.tracking_enabled),
    trackingNumber: row.tracking_number || '',
    applicationOpened: Boolean(row.application_opened),
    status: row.status || 'pending',
    createdAt: row.created_at,
    jobTitle: job?.title || 'Offre',
    companyName: company?.name || 'Entreprise',
  };
}

export default function GlobalApplicationsCenter() {
  const [authorized, setAuthorized] = useState(false);
  const [open, setOpen] = useState(false);
  const [applications, setApplications] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const newCount = applications.filter((item) => item.status === 'pending' && !item.applicationOpened).length;
  const todayCount = applications.filter((item) => isToday(item.createdAt)).length;
  const acceptedCount = applications.filter((item) => item.status === 'accepted').length;

  const visibleApplications = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return applications.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesSearch = !needle || [
        item.name,
        item.email,
        item.phone,
        item.jobTitle,
        item.companyName,
        item.trackingNumber,
      ].some((value) => value.toLowerCase().includes(needle));
      return matchesStatus && matchesSearch;
    });
  }, [applications, query, statusFilter]);

  const loadApplications = useCallback(async (silent = false) => {
    if (!authorized || !supabase) return;
    if (!silent) setLoading(true);
    setError('');
    const { data, error: loadError } = await supabase
      .from('applications')
      .select('id,job_id,candidate_id,nom,email,phone,message,cv_url,cv_name,tracking_enabled,tracking_number,application_opened,cv_opened,status,created_at,jobs(id,title,status,companies(id,name,owner_id))')
      .order('created_at', { ascending: false });

    if (loadError) setError('Impossible de charger toutes les candidatures.');
    else setApplications((data || []).map(normalizeApplication));
    if (!silent) setLoading(false);
  }, [authorized]);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) return undefined;
    let active = true;
    const useSession = (session) => {
      if (!active) return;
      const allowed = session?.user?.email?.toLowerCase() === PRIMARY_RECRUITER_EMAIL;
      setAuthorized(allowed);
      if (!allowed) {
        setOpen(false);
        setApplications([]);
      }
    };
    supabase.auth.getSession().then(({ data }) => useSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => useSession(session));
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authorized) return undefined;
    loadApplications();
    const timer = window.setInterval(() => loadApplications(true), open ? 10000 : 60000);
    return () => window.clearInterval(timer);
  }, [authorized, loadApplications, open]);

  useEffect(() => {
    if (!authorized) return undefined;

    const installButtons = () => {
      const nav = document.querySelector('header nav[aria-label="Navigation principale"]');
      if (nav && !nav.querySelector('[data-global-applications]')) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.globalApplications = 'true';
        button.className = 'header-link relative';
        button.textContent = 'Candidatures';
        nav.appendChild(button);
      }

      const actions = document.querySelector('header > div > div:last-child');
      if (actions && !actions.querySelector('[data-global-applications-mobile]')) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.globalApplicationsMobile = 'true';
        button.className = 'relative inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600';
        button.setAttribute('aria-label', 'Toutes les candidatures');
        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M9 12h6"/><path d="M9 16h6"/></svg>';
        actions.insertBefore(button, actions.firstChild);
      }
    };

    const handleClick = (event) => {
      const trigger = event.target instanceof Element
        ? event.target.closest('[data-global-applications], [data-global-applications-mobile]')
        : null;
      if (!trigger) return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(true);
      loadApplications();
    };

    installButtons();
    const root = document.getElementById('root');
    const observer = new MutationObserver(installButtons);
    if (root) observer.observe(root, { childList: true, subtree: true });
    document.addEventListener('click', handleClick, true);
    return () => {
      observer.disconnect();
      document.removeEventListener('click', handleClick, true);
      document.querySelectorAll('[data-global-applications], [data-global-applications-mobile]').forEach((node) => node.remove());
    };
  }, [authorized, loadApplications]);

  useEffect(() => {
    if (!authorized) return;
    document.querySelectorAll('[data-global-applications], [data-global-applications-mobile]').forEach((button) => {
      let badge = button.querySelector('[data-global-applications-badge]');
      if (!newCount) {
        badge?.remove();
        return;
      }
      if (!badge) {
        badge = document.createElement('span');
        badge.dataset.globalApplicationsBadge = 'true';
        badge.className = 'absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-blue-700 px-1 text-[10px] font-bold text-white ring-2 ring-white';
        button.appendChild(badge);
      }
      badge.textContent = newCount > 99 ? '99+' : String(newCount);
    });
  }, [authorized, newCount]);

  const flash = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2600);
  };

  const updateStatus = async (application, status) => {
    if (!supabase || actionId) return;
    setActionId(application.id);
    setError('');
    const payload = { status, application_opened: true };
    if (!application.applicationOpened) payload.application_seen_at = new Date().toISOString();
    const { error: updateError } = await supabase.from('applications').update(payload).eq('id', application.id);
    if (updateError) setError('Le statut de la candidature n’a pas pu être modifié.');
    else {
      setApplications((current) => current.map((item) => (
        item.id === application.id ? { ...item, status, applicationOpened: true } : item
      )));
      flash('Statut mis à jour');
    }
    setActionId('');
  };

  const accessCv = async (application, download = false) => {
    if (!supabase || !application.cvPath || actionId) return;
    const popup = download ? null : window.open('about:blank', '_blank');
    if (popup) popup.opener = null;
    setActionId(application.id);
    setError('');
    const options = download ? { download: application.cvName || 'cv.pdf' } : undefined;
    const { data, error: signedError } = await supabase.storage.from('cvs').createSignedUrl(application.cvPath, 300, options);

    if (signedError || !data?.signedUrl) {
      popup?.close();
      setError('Le CV est indisponible pour le moment.');
      setActionId('');
      return;
    }

    if (download) {
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = application.cvName || 'cv.pdf';
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
      status: application.status === 'pending' ? 'reviewed' : application.status,
    };
    if (!application.applicationOpened) payload.application_seen_at = now;
    await supabase.from('applications').update(payload).eq('id', application.id);
    setApplications((current) => current.map((item) => (
      item.id === application.id
        ? { ...item, applicationOpened: true, status: item.status === 'pending' ? 'reviewed' : item.status }
        : item
    )));
    flash(download ? 'Téléchargement lancé' : 'CV ouvert');
    setActionId('');
  };

  if (!authorized || !open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/45 backdrop-blur-sm md:p-6" role="dialog" aria-modal="true" aria-label="Toutes les candidatures Nzela Jobs">
      <div className="mx-auto flex h-full max-w-[1380px] flex-col overflow-hidden bg-white shadow-2xl md:h-[calc(100vh-3rem)] md:rounded-2xl md:border md:border-slate-200">
        <header className="border-b border-slate-200 p-4 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Compte recruteur principal</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950 md:text-3xl">Toutes les candidatures</h2>
              <p className="mt-1 text-sm text-slate-500">Tous les dossiers du site, y compris les candidatures rapides et celles déposées aujourd’hui.</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="secondary-icon-button shrink-0" aria-label="Fermer"><X size={20} /></button>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-2">
            <Metric value={applications.length} label="Total" icon={ClipboardList} />
            <Metric value={todayCount} label="Aujourd’hui" icon={UserRound} />
            <Metric value={newCount} label="Nouvelles" icon={FileText} />
            <Metric value={acceptedCount} label="Acceptées" icon={CheckCircle2} />
          </div>

          <div className="mt-5 grid gap-2 md:grid-cols-[1fr_190px_auto]">
            <label className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-300 px-3 focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-600">
              <Search size={18} className="text-slate-500" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, email, offre, entreprise…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            </label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-600" aria-label="Filtrer par statut">
              <option value="all">Tous les statuts</option>
              {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <button type="button" onClick={() => loadApplications()} disabled={loading} className="secondary-button"><RefreshCw size={17} className={loading ? 'animate-spin' : ''} /> Actualiser</button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
          {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
          {loading && applications.length === 0 && <p className="text-sm text-slate-500">Chargement de toutes les candidatures…</p>}
          <div className="grid gap-3">
            {visibleApplications.map((application) => {
              const statusLabel = STATUS_OPTIONS.find((option) => option.value === application.status)?.label || application.status;
              const busy = actionId === application.id;
              return (
                <article key={application.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[application.status] || 'bg-slate-100 text-slate-700'}`}>{statusLabel}</span>
                        {isToday(application.createdAt) && <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">Aujourd’hui</span>}
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{application.trackingEnabled ? 'Suivie' : 'Rapide'}</span>
                      </div>
                      <h3 className="mt-3 text-lg font-bold text-slate-950">{application.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-blue-700">{application.jobTitle}</p>
                      <p className="mt-1 flex items-center gap-2 text-sm text-slate-600"><Building2 size={16} /> {application.companyName}</p>
                      <div className="mt-3 grid gap-1 text-sm text-slate-600 sm:grid-cols-2"><span>{application.email || 'Email non renseigné'}</span><span>{application.phone || 'Téléphone non renseigné'}</span></div>
                    </div>
                    <div className="shrink-0 text-sm text-slate-500 lg:text-right"><p>{formatDate(application.createdAt)}</p>{application.trackingNumber && <p className="mt-1 font-semibold text-slate-700">{application.trackingNumber}</p>}</div>
                  </div>

                  {application.message && <div className="mt-4 rounded-lg bg-slate-50 p-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Message du candidat</p><p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">{application.message}</p></div>}

                  <div className="mt-4 grid gap-2 md:grid-cols-[190px_1fr_1fr]">
                    <select value={application.status} onChange={(event) => updateStatus(application, event.target.value)} disabled={busy} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100" aria-label={`Statut de ${application.name}`}>
                      {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    <button type="button" onClick={() => accessCv(application)} disabled={!application.cvPath || busy} className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"><ExternalLink size={16} /> {application.cvPath ? 'Ouvrir le CV' : 'Aucun CV'}</button>
                    <button type="button" onClick={() => accessCv(application, true)} disabled={!application.cvPath || busy} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 text-sm font-bold text-blue-800 transition hover:border-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500"><Download size={16} /> Télécharger le CV</button>
                  </div>
                </article>
              );
            })}
          </div>

          {!loading && visibleApplications.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center"><ClipboardList size={34} className="mx-auto text-slate-400" /><h3 className="mt-3 font-bold text-slate-950">Aucune candidature trouvée</h3><p className="mt-1 text-sm text-slate-500">Modifie la recherche ou le filtre de statut.</p></div>}
        </main>
      </div>
      {notice && <div className="fixed bottom-6 left-1/2 z-[130] -translate-x-1/2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-xl">{notice}</div>}
    </div>
  );
}

function Metric({ value, label, icon: Icon }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-3 text-center"><Icon size={17} className="mx-auto text-blue-700" /><p className="mt-1 text-xl font-bold text-slate-950">{value}</p><p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:text-xs">{label}</p></div>;
}
