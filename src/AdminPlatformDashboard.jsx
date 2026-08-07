import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Briefcase,
  Building2,
  ClipboardList,
  Eye,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { hasSupabaseConfig, supabase } from './lib/supabase';
import { formatCount } from './editorial';

const PRIMARY_EMAIL = 'eliebakala@gmail.com';

const STATUS_LABELS = {
  candidat: 'Candidat',
  recruteur: 'Recruteur',
  admin: 'Administrateur',
  published: 'En ligne',
  paused: 'En pause',
  expired: 'Expirée',
  closed: 'Fermée',
  archived: 'Archivée',
  draft: 'Brouillon',
  suspended: 'Suspendue',
  pending: 'Nouvelle',
  reviewed: 'En cours',
  accepted: 'Acceptée',
  rejected: 'Refusée',
  approved: 'Approuvée',
};

const ACTIVITY_LABELS = {
  application_created: 'Candidature envoyée',
  application_submitted: 'Candidature envoyée',
  application_updated: 'Candidature mise à jour',
  job_created: 'Offre créée',
  job_published: 'Offre publiée',
  job_updated: 'Offre mise à jour',
  message_sent: 'Message envoyé',
  profile_updated: 'Profil mis à jour',
  user_signed_in: 'Connexion',
};

function statusLabel(status) {
  return STATUS_LABELS[status] || 'Statut inconnu';
}

function activityLabel(eventType) {
  return ACTIVITY_LABELS[eventType] || 'Activité de la plateforme';
}

const EMPTY_SNAPSHOT = {
  users_total: 0,
  candidates_total: 0,
  recruiters_total: 0,
  admins_total: 0,
  online_now: 0,
  active_today: 0,
  applications_total: 0,
  applications_today: 0,
  applications_pending: 0,
  applications_reviewed: 0,
  applications_accepted: 0,
  applications_rejected: 0,
  jobs_total: 0,
  jobs_published: 0,
  jobs_closed: 0,
  jobs_draft: 0,
  companies_total: 0,
  job_views_total: 0,
  favorites_total: 0,
  threads_total: 0,
  messages_total: 0,
  messages_unread: 0,
};

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function formatDate(value) {
  if (!value) return 'Jamais';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date inconnue';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function MetricCard({ icon: Icon, label, value, note, live = false }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <Icon size={19} />
        </div>
        {live && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> En direct
          </span>
        )}
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
      {note && <p className="mt-1 text-xs leading-5 text-slate-500">{note}</p>}
    </div>
  );
}

function StatusPill({ status }) {
  const tone = {
    candidat: 'bg-blue-50 text-blue-700',
    recruteur: 'bg-violet-50 text-violet-700',
    admin: 'bg-slate-900 text-white',
    published: 'bg-emerald-50 text-emerald-700',
    paused: 'bg-amber-50 text-amber-800',
    expired: 'bg-orange-50 text-orange-700',
    closed: 'bg-slate-100 text-slate-700',
    archived: 'bg-violet-50 text-violet-700',
    draft: 'bg-amber-50 text-amber-800',
    suspended: 'bg-red-50 text-red-700',
    pending: 'bg-blue-50 text-blue-700',
    reviewed: 'bg-amber-50 text-amber-800',
    accepted: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-red-50 text-red-700',
    approved: 'bg-emerald-50 text-emerald-700',
  };
  return (
    <span className={classNames('inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold', tone[status] || 'bg-slate-100 text-slate-700')}>
      {statusLabel(status)}
    </span>
  );
}

function EmptyPanel({ title, body }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <ClipboardList className="mx-auto text-slate-400" size={34} />
      <h3 className="mt-3 font-bold text-slate-950">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-500">{body}</p>
    </div>
  );
}

export default function AdminPlatformDashboard() {
  const [authorized, setAuthorized] = useState(false);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('overview');
  const [snapshot, setSnapshot] = useState(EMPTY_SNAPSHOT);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const refreshTimerRef = useRef(null);

  const loadDashboard = useCallback(async (quiet = false) => {
    if (!authorized || !supabase) return;
    if (!quiet) setLoading(true);
    setError('');

    const [snapshotResult, usersResult, jobsResult, activityResult] = await Promise.all([
      supabase.rpc('admin_platform_snapshot'),
      supabase.rpc('admin_users_overview'),
      supabase.rpc('admin_jobs_overview'),
      supabase.rpc('admin_recent_activity', { p_limit: 80 }),
    ]);

    const firstError = snapshotResult.error || usersResult.error || jobsResult.error || activityResult.error;
    if (firstError) {
      setError('Certaines données du tableau de bord ne peuvent pas être chargées.');
    } else {
      setSnapshot({ ...EMPTY_SNAPSHOT, ...(snapshotResult.data || {}) });
      setUsers(usersResult.data || []);
      setJobs(jobsResult.data || []);
      setActivity(activityResult.data || []);
    }

    if (!quiet) setLoading(false);
  }, [authorized]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = window.setTimeout(() => loadDashboard(true), 450);
  }, [loadDashboard]);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) return undefined;

    const applySession = (session) => {
      const allowed = session?.user?.email?.toLowerCase() === PRIMARY_EMAIL;
      setAuthorized(allowed);
      if (!allowed) setOpen(false);
    };

    supabase.auth.getSession().then(({ data }) => applySession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => applySession(session));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authorized) return undefined;
    loadDashboard();

    const channel = supabase
      .channel('admin-platform-dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_presence' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_threads' }, scheduleRefresh)
      .subscribe();

    const interval = window.setInterval(() => loadDashboard(true), 30000);
    return () => {
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
      window.clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [authorized, loadDashboard, scheduleRefresh]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredUsers = useMemo(() => users.filter((item) => {
    if (!normalizedQuery) return true;
    return [item.full_name, item.email, item.role, item.professional_title, item.city, item.current_context]
      .some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
  }), [users, normalizedQuery]);

  const filteredJobs = useMemo(() => jobs.filter((item) => {
    if (!normalizedQuery) return true;
    return [item.title, item.company_name, item.location, item.contract_type, item.status]
      .some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
  }), [jobs, normalizedQuery]);

  const filteredActivity = useMemo(() => activity.filter((item) => {
    if (!normalizedQuery) return true;
    return [item.actor, item.detail, item.event_type]
      .some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
  }), [activity, normalizedQuery]);

  if (!authorized) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 top-[76px] z-[70] inline-flex min-h-11 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-bold text-white shadow-xl transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
      >
        <ShieldCheck size={18} /> Pilotage
        {snapshot.online_now > 0 && (
          <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] text-white">{snapshot.online_now}</span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-50">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 md:px-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Données en temps réel</p>
                </div>
                <h1 className="mt-1 truncate text-xl font-bold text-slate-950 md:text-2xl">Centre de contrôle Nzela Jobs</h1>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => loadDashboard()}
                  disabled={loading}
                  aria-label="Actualiser les données"
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
                >
                  <RefreshCw size={19} className={loading ? 'animate-spin' : ''} />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fermer le tableau de bord"
                  className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 md:px-6 md:py-7">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard icon={User} label="Utilisateurs inscrits" value={snapshot.users_total} note={`${formatCount(snapshot.candidates_total, 'candidat')} · ${formatCount(snapshot.recruiters_total, 'recruteur')}`} />
              <MetricCard icon={Eye} label="Connectés maintenant" value={snapshot.online_now} note={`${formatCount(snapshot.active_today, 'utilisateur actif', 'utilisateurs actifs')} aujourd’hui`} live />
              <MetricCard icon={ClipboardList} label="Candidatures totales" value={snapshot.applications_total} note={`${formatCount(snapshot.applications_today, 'candidature')} aujourd’hui`} live />
              <MetricCard icon={Briefcase} label="Offres totales" value={snapshot.jobs_total} note={`${formatCount(snapshot.jobs_published, 'offre en ligne', 'offres en ligne')} · ${formatCount(snapshot.jobs_closed, 'offre fermée', 'offres fermées')}`} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard icon={Building2} label="Entreprises" value={snapshot.companies_total} />
              <MetricCard icon={Bell} label="Messages" value={snapshot.messages_total} note={`${formatCount(snapshot.messages_unread, 'message')} à lire`} />
              <MetricCard icon={Eye} label="Vues d’offres" value={snapshot.job_views_total} />
              <MetricCard icon={Briefcase} label="Offres favorites" value={snapshot.favorites_total} />
            </div>

            <div className="overflow-x-auto border-b border-slate-200">
              <div className="flex min-w-max gap-1">
                {[
                  ['overview', 'Vue générale'],
                  ['users', 'Utilisateurs'],
                  ['jobs', 'Offres'],
                  ['activity', 'Activité en direct'],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    className={classNames(
                      'min-h-11 border-b-2 px-4 text-sm font-bold',
                      tab === id ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {tab !== 'overview' && (
              <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-300 bg-white px-4">
                <Search size={19} className="text-slate-500" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher dans les données"
                  className="min-w-0 flex-1 bg-transparent text-base outline-none"
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')} aria-label="Effacer la recherche" className="text-slate-500">
                    <X size={18} />
                  </button>
                )}
              </label>
            )}

            {tab === 'overview' && (
              <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-xl border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-bold text-slate-950">État des candidatures</h2>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-blue-50 p-4"><p className="text-2xl font-bold text-blue-700">{snapshot.applications_pending}</p><p className="mt-1 text-sm font-semibold text-blue-950">Nouvelles</p></div>
                    <div className="rounded-lg bg-amber-50 p-4"><p className="text-2xl font-bold text-amber-800">{snapshot.applications_reviewed}</p><p className="mt-1 text-sm font-semibold text-amber-950">En cours</p></div>
                    <div className="rounded-lg bg-emerald-50 p-4"><p className="text-2xl font-bold text-emerald-700">{snapshot.applications_accepted}</p><p className="mt-1 text-sm font-semibold text-emerald-950">Acceptées</p></div>
                    <div className="rounded-lg bg-red-50 p-4"><p className="text-2xl font-bold text-red-700">{snapshot.applications_rejected}</p><p className="mt-1 text-sm font-semibold text-red-950">Refusées</p></div>
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-bold text-slate-950">Derniers utilisateurs actifs</h2>
                  <div className="mt-4 divide-y divide-slate-100">
                    {users.slice(0, 6).map((item) => (
                      <div key={item.user_id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-950">{item.full_name || item.email}</p>
                          <p className="truncate text-xs text-slate-500">{item.current_context || 'Aucune activité récente'}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className={classNames('inline-flex items-center gap-1.5 text-xs font-bold', item.is_online ? 'text-emerald-700' : 'text-slate-500')}>
                            <span className={classNames('h-2 w-2 rounded-full', item.is_online ? 'bg-emerald-500' : 'bg-slate-300')} />
                            {item.is_online ? 'En ligne' : 'Hors ligne'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {users.length === 0 && <p className="py-4 text-sm text-slate-500">Aucun utilisateur disponible.</p>}
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
                  <h2 className="text-lg font-bold text-slate-950">Activité récente</h2>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {activity.slice(0, 8).map((item, index) => (
                      <div key={`${item.entity_id}-${item.created_at}-${index}`} className="rounded-lg border border-slate-200 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{activityLabel(item.event_type)}</p>
                        <p className="mt-1 font-bold text-slate-950">{item.actor}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
                        <p className="mt-2 text-xs text-slate-400">{formatDate(item.created_at)}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {tab === 'users' && (
              <div className="grid gap-3">
                {filteredUsers.map((item) => (
                  <article key={item.user_id} className="rounded-xl border border-slate-200 bg-white p-4 md:p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-950">{item.full_name || 'Utilisateur'}</h2>
                          <StatusPill status={item.role} />
                          <span className={classNames('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold', item.is_online ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600')}>
                            <span className={classNames('h-2 w-2 rounded-full', item.is_online ? 'bg-emerald-500' : 'bg-slate-300')} />
                            {item.is_online ? 'En ligne maintenant' : 'Hors ligne'}
                          </span>
                        </div>
                        <p className="mt-1 break-all text-sm font-semibold text-slate-600">{item.email}</p>
                        <p className="mt-1 text-sm text-slate-500">{item.professional_title || 'Poste non renseigné'}{item.city ? ` · ${item.city}` : ''}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 md:min-w-[280px]">
                        <div className="rounded-lg bg-slate-50 p-3 text-center"><p className="text-lg font-bold">{item.application_count}</p><p className="text-[10px] font-bold uppercase text-slate-500">Candidatures</p></div>
                        <div className="rounded-lg bg-slate-50 p-3 text-center"><p className="text-lg font-bold">{item.saved_job_count}</p><p className="text-[10px] font-bold uppercase text-slate-500">Favoris</p></div>
                        <div className="rounded-lg bg-slate-50 p-3 text-center"><p className="text-lg font-bold">{item.sent_message_count}</p><p className="text-[10px] font-bold uppercase text-slate-500">Messages</p></div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 border-t border-slate-200 pt-4 text-sm md:grid-cols-3">
                      <p><span className="font-semibold text-slate-500">Activité :</span> {item.current_context || 'Non disponible'}</p>
                      <p><span className="font-semibold text-slate-500">Dernière présence :</span> {formatDate(item.last_seen_at || item.last_sign_in_at)}</p>
                      <p><span className="font-semibold text-slate-500">Compte créé :</span> {formatDate(item.account_created_at)}</p>
                    </div>

                    {Array.isArray(item.applied_jobs) && item.applied_jobs.length > 0 && (
                      <div className="mt-4 rounded-lg bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Candidatures de cette personne</p>
                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          {item.applied_jobs.map((job) => (
                            <div key={job.application_id} className="rounded-lg border border-slate-200 bg-white p-3">
                              <p className="font-bold text-slate-950">{job.title}</p>
                              <p className="mt-1 text-sm text-slate-500">{job.company || 'Entreprise'} · {statusLabel(job.status)}</p>
                              <p className="mt-1 text-xs text-slate-400">{formatDate(job.applied_at)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                ))}
                {filteredUsers.length === 0 && <EmptyPanel title="Aucun utilisateur trouvé" body="Modifiez la recherche pour afficher d’autres comptes." />}
              </div>
            )}

            {tab === 'jobs' && (
              <div className="grid gap-3 md:grid-cols-2">
                {filteredJobs.map((item) => (
                  <article key={item.job_id} className="rounded-xl border border-slate-200 bg-white p-4 md:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{item.company_name}</p>
                        <h2 className="mt-1 text-lg font-bold text-slate-950">{item.title}</h2>
                        <p className="mt-1 text-sm text-slate-500">{item.location} · {item.contract_type}</p>
                      </div>
                      <StatusPill status={item.status} />
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-200 pt-4">
                      <div className="text-center"><p className="text-xl font-bold">{item.application_count}</p><p className="text-[10px] font-bold uppercase text-slate-500">Candidatures</p></div>
                      <div className="text-center"><p className="text-xl font-bold">{item.view_count}</p><p className="text-[10px] font-bold uppercase text-slate-500">Vues</p></div>
                      <div className="text-center"><p className="text-xl font-bold">{item.favorite_count}</p><p className="text-[10px] font-bold uppercase text-slate-500">Favoris</p></div>
                    </div>
                    <p className="mt-4 text-xs text-slate-400">Créée le {formatDate(item.created_at)}</p>
                  </article>
                ))}
                {filteredJobs.length === 0 && <EmptyPanel title="Aucune offre trouvée" body="Modifiez la recherche pour afficher d’autres offres." />}
              </div>
            )}

            {tab === 'activity' && (
              <div className="grid gap-3">
                {filteredActivity.map((item, index) => (
                  <article key={`${item.entity_id}-${item.created_at}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{activityLabel(item.event_type)}</p>
                        <h2 className="mt-1 font-bold text-slate-950">{item.actor}</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
                      </div>
                      <p className="shrink-0 text-xs font-semibold text-slate-400">{formatDate(item.created_at)}</p>
                    </div>
                  </article>
                ))}
                {filteredActivity.length === 0 && <EmptyPanel title="Aucune activité trouvée" body="Les nouvelles actions de la plateforme apparaîtront ici." />}
              </div>
            )}
          </main>
        </div>
      )}
    </>
  );
}
