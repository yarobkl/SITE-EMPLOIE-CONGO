import { useCallback, useEffect, useMemo, useState } from 'react';
import { Briefcase, CalendarDays, Eye, EyeOff, RefreshCw, Search, X } from 'lucide-react';
import { hasSupabaseConfig, supabase } from './lib/supabase';

const PRIMARY_EMAIL = 'eliebakala@gmail.com';

const STATUS_META = {
  published: { label: 'En ligne', className: 'bg-emerald-50 text-emerald-700' },
  paused: { label: 'En pause', className: 'bg-amber-50 text-amber-800' },
  expired: { label: 'Expirée', className: 'bg-orange-50 text-orange-700' },
  closed: { label: 'Fermée', className: 'bg-slate-100 text-slate-700' },
  archived: { label: 'Archivée', className: 'bg-violet-50 text-violet-700' },
  draft: { label: 'Brouillon', className: 'bg-blue-50 text-blue-700' },
};

function formatDate(value) {
  if (!value) return 'Non définie';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date inconnue';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date);
}

function remainingLabel(item) {
  if (item.status !== 'published' || item.days_remaining == null) return null;
  if (item.days_remaining <= 0) return 'Expire aujourd’hui';
  if (item.days_remaining === 1) return '1 jour restant';
  return `${item.days_remaining} jours restants`;
}

function StatusPill({ status }) {
  const meta = STATUS_META[status] || { label: status || 'Inconnu', className: 'bg-slate-100 text-slate-700' };
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${meta.className}`}>{meta.label}</span>;
}

export default function OfferLifecycleCenter() {
  const [authorized, setAuthorized] = useState(false);
  const [open, setOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async (quiet = false) => {
    if (!authorized || !supabase) return;
    if (!quiet) setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase.rpc('admin_jobs_overview');
    if (queryError) setError('Impossible de charger le cycle de vie des offres.');
    else setJobs(data || []);
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
    const channel = supabase
      .channel('offer-lifecycle-center-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => load(true))
      .subscribe();
    const interval = window.setInterval(() => load(true), 60000);
    return () => {
      window.clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [authorized, load]);

  useEffect(() => {
    if (!authorized) return undefined;
    const install = () => {
      const nav = document.querySelector('header nav[aria-label="Navigation principale"]');
      if (nav && !nav.querySelector('[data-offer-lifecycle]')) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.offerLifecycle = 'true';
        button.className = 'header-link';
        button.textContent = 'Durée des offres';
        nav.appendChild(button);
      }
    };
    const click = (event) => {
      const trigger = event.target instanceof Element ? event.target.closest('[data-offer-lifecycle]') : null;
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
      document.querySelectorAll('[data-offer-lifecycle]').forEach((node) => node.remove());
    };
  }, [authorized, load]);

  const counts = useMemo(() => ({
    published: jobs.filter((item) => item.status === 'published').length,
    expiring: jobs.filter((item) => item.status === 'published' && item.days_remaining != null && item.days_remaining <= 5).length,
    expired: jobs.filter((item) => item.status === 'expired').length,
    archived: jobs.filter((item) => item.status === 'archived').length,
  }), [jobs]);

  const visibleJobs = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return jobs.filter((item) => {
      const matchesFilter = filter === 'all' || item.status === filter;
      const matchesSearch = !needle || [item.title, item.company_name, item.location, item.contract_type, item.status]
        .some((value) => String(value || '').toLowerCase().includes(needle));
      return matchesFilter && matchesSearch;
    });
  }, [filter, jobs, query]);

  const changeStatus = async (job, nextStatus) => {
    if (busy || !supabase) return;
    setBusy(job.job_id);
    setError('');
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ status: nextStatus })
      .eq('id', job.job_id);
    if (updateError) setError('Le statut de cette offre n’a pas pu être modifié.');
    else await load(true);
    setBusy('');
  };

  if (!authorized) return null;

  return open ? (
    <div className="fixed inset-0 z-[135] overflow-y-auto bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 md:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Gestion automatique</p>
            <h1 className="mt-1 text-xl font-bold text-slate-950 md:text-2xl">Durée et expiration des offres</h1>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => load()} disabled={loading} aria-label="Actualiser" className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 disabled:opacity-50">
              <RefreshCw size={19} className={loading ? 'animate-spin' : ''} />
            </button>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
              <X size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 md:px-6 md:py-7">
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

        <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
          <p className="font-bold">Règle active sur Nzela Jobs</p>
          <p>Une offre reste en ligne 30 jours. Une alerte est envoyée 5 jours avant son expiration. Elle est ensuite retirée du public, archivée après 6 mois et peut être republiée pour 30 jours sans perdre ses candidatures.</p>
          <p className="mt-2">Les CV sont conservés 12 mois, puis supprimés automatiquement du stockage. L’historique de la candidature reste conservé.</p>
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-3xl font-bold">{counts.published}</p><p className="mt-1 text-sm font-semibold text-slate-600">En ligne</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-3xl font-bold text-orange-700">{counts.expiring}</p><p className="mt-1 text-sm font-semibold text-slate-600">Expirent sous 5 jours</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-3xl font-bold">{counts.expired}</p><p className="mt-1 text-sm font-semibold text-slate-600">Expirées</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-3xl font-bold">{counts.archived}</p><p className="mt-1 text-sm font-semibold text-slate-600">Archivées</p></div>
        </section>

        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-300 bg-white px-4">
            <Search size={19} className="text-slate-500" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une offre" className="min-w-0 flex-1 bg-transparent text-base outline-none" />
          </label>
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold outline-none">
            <option value="all">Tous les statuts</option>
            <option value="published">En ligne</option>
            <option value="paused">En pause</option>
            <option value="expired">Expirées</option>
            <option value="closed">Fermées</option>
            <option value="archived">Archivées</option>
            <option value="draft">Brouillons</option>
          </select>
        </div>

        <section className="grid gap-3 md:grid-cols-2">
          {visibleJobs.map((job) => {
            const remaining = remainingLabel(job);
            const isBusy = busy === job.job_id;
            return (
              <article key={job.job_id} className="rounded-xl border border-slate-200 bg-white p-4 md:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{job.company_name}</p>
                    <h2 className="mt-1 text-lg font-bold text-slate-950">{job.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">{job.location} · {job.contract_type}</p>
                  </div>
                  <StatusPill status={job.status} />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 text-center">
                  <div><p className="text-lg font-bold">{job.application_count}</p><p className="text-[10px] font-bold uppercase text-slate-500">Candidatures</p></div>
                  <div><p className="text-lg font-bold">{job.view_count}</p><p className="text-[10px] font-bold uppercase text-slate-500">Vues</p></div>
                  <div><p className="text-lg font-bold">{job.favorite_count}</p><p className="text-[10px] font-bold uppercase text-slate-500">Favoris</p></div>
                </div>

                <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
                  <p className="flex items-center justify-between gap-3"><span className="text-slate-500">Publication</span><strong>{formatDate(job.published_at || job.created_at)}</strong></p>
                  <p className="flex items-center justify-between gap-3"><span className="text-slate-500">Expiration</span><strong>{formatDate(job.expires_at)}</strong></p>
                  {remaining && <p className={`font-bold ${job.days_remaining <= 5 ? 'text-orange-700' : 'text-emerald-700'}`}>{remaining}</p>}
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {job.status === 'published' ? (
                    <>
                      <button type="button" disabled={isBusy} onClick={() => changeStatus(job, 'paused')} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-amber-300 px-4 text-sm font-bold text-amber-800 disabled:opacity-50">
                        <EyeOff size={17} /> Mettre en pause
                      </button>
                      <button type="button" disabled={isBusy} onClick={() => changeStatus(job, 'closed')} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-700 disabled:opacity-50">
                        Fermer l’offre
                      </button>
                    </>
                  ) : (
                    <button type="button" disabled={isBusy} onClick={() => changeStatus(job, 'published')} className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2">
                      <Eye size={17} /> {job.status === 'paused' ? 'Reprendre pour 30 jours' : 'Republier pour 30 jours'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        {!loading && visibleJobs.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <Briefcase className="mx-auto text-slate-400" size={34} />
            <h2 className="mt-3 font-bold text-slate-950">Aucune offre trouvée</h2>
            <p className="mt-1 text-sm text-slate-500">Modifie le filtre ou la recherche.</p>
          </div>
        )}
      </main>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => { setOpen(true); load(); }}
      className="fixed right-4 top-[132px] z-[70] hidden min-h-11 items-center gap-2 rounded-full border border-blue-200 bg-white px-4 text-sm font-bold text-blue-800 shadow-lg md:inline-flex"
    >
      <CalendarDays size={18} /> Durée des offres
      {counts.expiring > 0 && <span className="rounded-full bg-orange-600 px-2 py-0.5 text-[11px] text-white">{counts.expiring}</span>}
    </button>
  );
}
