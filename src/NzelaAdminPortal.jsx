import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Eye,
  FileText,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  User,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { hasSupabaseConfig, supabase } from './lib/supabase';

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

const EMPTY_MARKETPLACE = {
  live_jobs: 0,
  live_jobs_with_applications: 0,
  live_jobs_without_applications: 0,
  job_application_coverage_pct: 0,
  avg_applications_per_live_job: 0,
  applications_total: 0,
  applications_accepted: 0,
  application_progress_pct: 0,
  applications_with_conversation: 0,
  application_to_conversation_pct: 0,
  active_talent_posts: 0,
  talent_invitations: 0,
  talent_invitations_accepted: 0,
  companies_total: 0,
  verified_companies: 0,
  verified_company_pct: 0,
};

const NAV = [
  ['overview', 'Vue d’ensemble', LayoutDashboard],
  ['marketplace', 'Marketplace', TrendingUp],
  ['users', 'Utilisateurs', Users],
  ['jobs', 'Offres', Briefcase],
  ['verifications', 'Vérifications', ShieldCheck],
  ['moderation', 'Trust & Safety', ShieldAlert],
  ['activity', 'Activité', Bell],
];

const STATUS_LABELS = {
  candidat: 'Candidat',
  recruteur: 'Recruteur',
  admin: 'Administrateur',
  published: 'En ligne',
  paused: 'En pause',
  closed: 'Fermée',
  draft: 'Brouillon',
  pending: 'À vérifier',
  reviewed: 'En cours',
  accepted: 'Acceptée',
  rejected: 'Refusée',
  approved: 'Approuvée',
  blocked: 'Bloquée',
  suspended: 'Suspendue',
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

const REASON_LABELS = {
  scam: 'Arnaque suspectée',
  payment_request: 'Demande de paiement',
  identity: 'Identité douteuse',
  misleading: 'Contenu trompeur',
  discrimination: 'Discrimination',
  other: 'Autre motif',
};

const DATA_CALLS = [
  ['snapshot', () => supabase.rpc('admin_platform_snapshot')],
  ['marketplace', () => supabase.rpc('admin_marketplace_kpis')],
  ['users', () => supabase.rpc('admin_users_overview')],
  ['jobs', () => supabase.rpc('admin_jobs_overview')],
  ['activity', () => supabase.rpc('admin_recent_activity', { p_limit: 100 })],
  ['risk', () => supabase.rpc('admin_marketplace_jobs_at_risk')],
  ['verifications', () => supabase.rpc('admin_recruiter_verifications')],
  ['moderation', () => supabase.rpc('admin_job_moderation_queue')],
];

function cx(...values) {
  return values.filter(Boolean).join(' ');
}

function formatDate(value, compact = false) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(
    'fr-FR',
    compact
      ? { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
      : { dateStyle: 'medium', timeStyle: 'short' },
  ).format(date);
}

function formatSync(value) {
  if (!value) return 'En attente';
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(value);
}

function statusLabel(status) {
  return STATUS_LABELS[status] || status || 'Inconnu';
}

function StatusBadge({ status }) {
  const tones = {
    admin: 'bg-slate-950 text-white',
    candidat: 'bg-blue-50 text-blue-700',
    recruteur: 'bg-violet-50 text-violet-700',
    published: 'bg-emerald-50 text-emerald-700',
    approved: 'bg-emerald-50 text-emerald-700',
    accepted: 'bg-emerald-50 text-emerald-700',
    pending: 'bg-amber-50 text-amber-800',
    reviewed: 'bg-amber-50 text-amber-800',
    rejected: 'bg-red-50 text-red-700',
    blocked: 'bg-red-50 text-red-700',
    suspended: 'bg-red-50 text-red-700',
  };
  return (
    <span className={cx('inline-flex rounded-full px-2.5 py-1 text-[11px] font-black', tones[status] || 'bg-slate-100 text-slate-700')}>
      {statusLabel(status)}
    </span>
  );
}

function MetricCard({ label, value, note, icon: Icon, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    violet: 'bg-violet-50 text-violet-700',
    amber: 'bg-amber-50 text-amber-800',
  };
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
        </div>
        <div className={cx('flex h-11 w-11 items-center justify-center rounded-xl', tones[tone] || tones.blue)}>
          <Icon size={20} />
        </div>
      </div>
      {note && <p className="mt-3 text-xs font-medium leading-5 text-slate-400">{note}</p>}
    </article>
  );
}

function Panel({ title, eyebrow, action, children, className = '' }) {
  return (
    <section className={cx('rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          {eyebrow && <p className="text-[11px] font-black uppercase tracking-[0.14em] text-blue-700">{eyebrow}</p>}
          <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ title, body }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-9 text-center">
      <ClipboardList className="mx-auto text-slate-300" size={32} />
      <p className="mt-3 font-black text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
    </div>
  );
}

function ProgressRow({ label, value, detail }) {
  const safeValue = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-slate-800">{label}</p>
          {detail && <p className="mt-0.5 text-xs font-semibold text-slate-400">{detail}</p>}
        </div>
        <p className="text-sm font-black text-slate-950">{safeValue}%</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-slate-950 transition-all" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

function LoginScreen({ onSession }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function signIn(event) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError('');
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) setError('Connexion impossible. Vérifiez vos identifiants.');
    else onSession(data.session);
    setBusy(false);
  }

  async function google() {
    if (!supabase) return;
    setBusy(true);
    setError('');
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (authError) {
      setError('La connexion Google ne peut pas être lancée.');
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6f8] px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60">
        <div className="bg-slate-950 p-7 text-white sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10"><ShieldCheck size={21} /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-300">Nzela Jobs</p>
              <h1 className="text-xl font-black">Centre de contrôle</h1>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-300">Pilotage, modération et suivi opérationnel de la plateforme.</p>
        </div>
        <div className="p-7 sm:p-8">
          {!hasSupabaseConfig && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">Supabase n’est pas configuré pour ce déploiement.</div>}
          {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
          <form onSubmit={signIn} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">Adresse e-mail</span>
              <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">Mot de passe</span>
              <input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50" />
            </label>
            <button disabled={busy || !hasSupabaseConfig} className="h-12 w-full rounded-xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50">{busy ? 'Connexion…' : 'Se connecter'}</button>
          </form>
          <div className="my-5 flex items-center gap-3"><div className="h-px flex-1 bg-slate-200" /><span className="text-[11px] font-black uppercase tracking-wider text-slate-400">ou</span><div className="h-px flex-1 bg-slate-200" /></div>
          <button type="button" onClick={google} disabled={busy || !hasSupabaseConfig} className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">Continuer avec Google</button>
        </div>
      </div>
    </div>
  );
}

export default function NzelaAdminPortal() {
  const [session, setSession] = useState(null);
  const [access, setAccess] = useState('checking');
  const [tab, setTab] = useState('overview');
  const [query, setQuery] = useState('');
  const [snapshot, setSnapshot] = useState(EMPTY_SNAPSHOT);
  const [marketplace, setMarketplace] = useState(EMPTY_MARKETPLACE);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [activity, setActivity] = useState([]);
  const [atRisk, setAtRisk] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [moderation, setModeration] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const refreshRef = useRef(null);

  const resolveAccess = useCallback(async (nextSession) => {
    setSession(nextSession || null);
    if (!nextSession?.user || !supabase) {
      setAccess('guest');
      return;
    }
    const { data: isAdmin, error: accessError } = await supabase.rpc('is_nzela_admin', { p_user_id: nextSession.user.id });
    setAccess(!accessError && isAdmin === true ? 'admin' : 'denied');
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setAccess('guest');
      return undefined;
    }
    supabase.auth.getSession().then(({ data }) => resolveAccess(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => resolveAccess(nextSession));
    return () => listener.subscription.unsubscribe();
  }, [resolveAccess]);

  const load = useCallback(async (quiet = false) => {
    if (access !== 'admin' || !supabase) return;
    if (!quiet) setLoading(true);
    setError('');
    try {
      const results = await Promise.all(DATA_CALLS.map(([, run]) => run()));
      const failures = results.map((result, index) => (result.error ? DATA_CALLS[index][0] : null)).filter(Boolean);
      if (failures.length) setError('Certaines données administratives sont momentanément indisponibles. Les autres blocs restent à jour.');
      setSnapshot({ ...EMPTY_SNAPSHOT, ...(results[0].data || {}) });
      setMarketplace({ ...EMPTY_MARKETPLACE, ...(results[1].data || {}) });
      setUsers(results[2].data || []);
      setJobs(results[3].data || []);
      setActivity(results[4].data || []);
      setAtRisk(results[5].data || []);
      setVerifications(results[6].data || []);
      setModeration(results[7].data || []);
      setLastUpdated(new Date());
    } catch (_loadError) {
      setError('Impossible de synchroniser le centre de contrôle pour le moment.');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [access]);

  const schedule = useCallback(() => {
    if (refreshRef.current) window.clearTimeout(refreshRef.current);
    refreshRef.current = window.setTimeout(() => load(true), 450);
  }, [load]);

  useEffect(() => {
    if (access !== 'admin' || !supabase) return undefined;
    load();
    const channel = supabase.channel('nzela-admin-live-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recruiter_verifications' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_reports' }, schedule)
      .subscribe();
    const timer = window.setInterval(() => load(true), 30000);
    return () => {
      if (refreshRef.current) window.clearTimeout(refreshRef.current);
      window.clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [access, load, schedule]);

  const needle = query.trim().toLowerCase();
  const filteredUsers = useMemo(() => users.filter((item) => !needle || [item.full_name, item.email, item.role, item.professional_title, item.city].some((value) => String(value || '').toLowerCase().includes(needle))), [users, needle]);
  const filteredJobs = useMemo(() => jobs.filter((item) => !needle || [item.title, item.company_name, item.location, item.contract_type, item.status].some((value) => String(value || '').toLowerCase().includes(needle))), [jobs, needle]);
  const filteredActivity = useMemo(() => activity.filter((item) => !needle || [item.actor, item.detail, item.event_type].some((value) => String(value || '').toLowerCase().includes(needle))), [activity, needle]);
  const topJobs = useMemo(() => [...jobs].sort((a, b) => Number(b.application_count || 0) - Number(a.application_count || 0)).slice(0, 5), [jobs]);
  const pendingVerifications = verifications.filter((item) => item.status === 'pending').length;
  const pendingModeration = moderation.filter((item) => item.moderation_status === 'pending').length;

  const activitySeries = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return { key: date.toISOString().slice(0, 10), label: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(date), value: 0 };
    });
    activity.forEach((item) => {
      const key = item.created_at ? new Date(item.created_at).toISOString().slice(0, 10) : '';
      const target = days.find((day) => day.key === key);
      if (target) target.value += 1;
    });
    return days;
  }, [activity]);
  const maxActivity = Math.max(1, ...activitySeries.map((item) => item.value));

  const funnel = [
    ['À étudier', snapshot.applications_pending, 'bg-amber-500'],
    ['En cours', snapshot.applications_reviewed, 'bg-blue-600'],
    ['Acceptées', snapshot.applications_accepted, 'bg-emerald-600'],
    ['Refusées', snapshot.applications_rejected, 'bg-slate-400'],
  ];
  const maxFunnel = Math.max(1, ...funnel.map(([, value]) => Number(value || 0)));

  const quickActions = [
    { label: 'Offres à surveiller', value: atRisk.length, target: 'marketplace', icon: AlertTriangle },
    { label: 'Vérifications en attente', value: pendingVerifications, target: 'verifications', icon: ShieldCheck },
    { label: 'Modérations à traiter', value: pendingModeration, target: 'moderation', icon: ShieldAlert },
  ];

  async function signOut() {
    await supabase?.auth.signOut();
    setSession(null);
    setAccess('guest');
  }

  async function openEvidence(item) {
    if (!supabase || busy) return;
    setBusy(`evidence-${item.verification_id}`);
    const { data: row } = await supabase.from('recruiter_verifications').select('document_path').eq('id', item.verification_id).maybeSingle();
    if (!row?.document_path) {
      setError('Aucun justificatif n’est disponible pour cette demande.');
      setBusy('');
      return;
    }
    const popup = window.open('about:blank', '_blank');
    if (popup) popup.opener = null;
    const { data, error: signedError } = await supabase.storage.from('verification-documents').createSignedUrl(row.document_path, 300);
    if (signedError || !data?.signedUrl) {
      popup?.close();
      setError('Le justificatif ne peut pas être ouvert.');
    } else if (popup) popup.location.href = data.signedUrl;
    setBusy('');
  }

  async function reviewVerification(item, decision) {
    if (!supabase || busy) return;
    const note = window.prompt('Note adressée au recruteur :', decision === 'approved' ? 'Entreprise et identité du recruteur vérifiées.' : 'Merci de corriger ou compléter les informations de l’entreprise.');
    if (note === null) return;
    setBusy(`verify-${item.verification_id}`);
    const { error: rpcError } = await supabase.rpc('admin_review_recruiter_verification', { p_verification_id: item.verification_id, p_decision: decision, p_review_note: note });
    if (rpcError) setError('La décision n’a pas pu être enregistrée.');
    await load(true);
    setBusy('');
  }

  async function reviewModeration(item, decision) {
    if (!supabase || busy) return;
    const note = window.prompt('Note de modération :', decision === 'approved' ? 'Offre contrôlée et validée par Nzela.' : 'Offre bloquée après contrôle de sécurité.');
    if (note === null) return;
    setBusy(`moderate-${item.job_id}`);
    const { error: rpcError } = await supabase.rpc('admin_review_job_moderation', { p_job_id: item.job_id, p_decision: decision, p_review_note: note });
    if (rpcError) setError('La décision de modération n’a pas pu être enregistrée.');
    await load(true);
    setBusy('');
  }

  if (access === 'checking') return <div className="flex min-h-screen items-center justify-center bg-[#f4f6f8]"><RefreshCw className="animate-spin text-slate-400" size={28} /></div>;
  if (access === 'guest') return <LoginScreen onSession={resolveAccess} />;
  if (access === 'denied') return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6f8] px-4">
      <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <ShieldAlert className="mx-auto text-red-500" size={42} />
        <h1 className="mt-4 text-xl font-black">Accès non autorisé</h1>
        <p className="mt-2 text-sm text-slate-500">Ce compte n’a pas les droits administrateur Nzela Jobs.</p>
        <button type="button" onClick={signOut} className="mt-6 h-11 rounded-xl bg-slate-950 px-5 text-sm font-black text-white">Se déconnecter</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] bg-slate-950 text-white lg:block">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10"><ShieldCheck size={20} /></div>
          <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-300">Nzela Jobs</p><p className="text-base font-black">Centre de contrôle</p></div>
        </div>
        <nav className="space-y-1 p-4">
          {NAV.map(([id, label, Icon]) => {
            const badge = id === 'verifications' ? pendingVerifications : id === 'moderation' ? pendingModeration : 0;
            return (
              <button key={id} type="button" onClick={() => setTab(id)} className={cx('flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition', tab === id ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white')}>
                <Icon size={18} /><span className="flex-1">{label}</span>
                {badge > 0 && <span className={cx('rounded-full px-2 py-0.5 text-[10px] font-black', tab === id ? 'bg-red-50 text-red-700' : 'bg-red-500/20 text-red-200')}>{badge}</span>}
              </button>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4">
          <div className="rounded-2xl bg-white/5 p-3">
            <p className="truncate text-xs font-black text-white">{session?.user?.email}</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-400">Administrateur Nzela</p>
            <button type="button" onClick={signOut} className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-white/10 text-xs font-black text-white transition hover:bg-white/15"><LogOut size={15} /> Déconnexion</button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-20 items-center gap-3 px-4 sm:px-6 xl:px-8">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-400">Nzela Jobs / Administration</p>
              <h1 className="truncate text-xl font-black tracking-tight">{NAV.find(([id]) => id === tab)?.[1]}</h1>
            </div>
            <div className="hidden w-full max-w-sm items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 md:flex">
              <Search size={17} className="text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher…" className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none" />
              {query && <button type="button" onClick={() => setQuery('')}><X size={16} className="text-slate-400" /></button>}
            </div>
            <div className="hidden text-right xl:block"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Dernière synchro</p><p className="mt-1 text-xs font-black text-slate-700">{formatSync(lastUpdated)}</p></div>
            <button type="button" onClick={() => load()} disabled={loading} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button>
          </div>
          <div className="overflow-x-auto border-t border-slate-100 px-3 py-2 lg:hidden"><div className="flex min-w-max gap-1">{NAV.map(([id, label]) => <button key={id} type="button" onClick={() => setTab(id)} className={cx('rounded-lg px-3 py-2 text-xs font-black', tab === id ? 'bg-slate-950 text-white' : 'text-slate-500')}>{label}</button>)}</div></div>
        </header>

        <main className="mx-auto max-w-[1540px] space-y-6 p-4 sm:p-6 xl:p-8" aria-busy={loading}>
          <div className="flex flex-col gap-3 md:hidden">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3"><Search size={17} className="text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher…" className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none" />{query && <button type="button" onClick={() => setQuery('')}><X size={16} className="text-slate-400" /></button>}</div>
          </div>
          {error && <div className="flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"><span>{error}</span><button type="button" onClick={() => setError('')}><X size={17} /></button></div>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Données réelles · synchronisation automatique</div>
            <p className="text-xs font-semibold text-slate-400">Actualisé à {formatSync(lastUpdated)}</p>
          </div>

          {tab === 'overview' && <>
            <section className="overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-300/30 sm:p-7">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div><p className="text-xs font-black uppercase tracking-[0.16em] text-blue-300">Pilotage plateforme</p><h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Tout Nzela en un coup d’œil.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Suivi des utilisateurs, offres, candidatures, entreprises et alertes de confiance depuis les données de production.</p></div>
                <div className="grid grid-cols-3 gap-2 sm:min-w-[390px]">{quickActions.map(({ label, value, target, icon: Icon }) => <button key={label} type="button" onClick={() => setTab(target)} className="rounded-2xl bg-white/10 p-3 text-left transition hover:bg-white/15"><Icon size={17} className="text-blue-300" /><p className="mt-3 text-2xl font-black">{value}</p><p className="mt-1 text-[10px] font-bold leading-4 text-slate-300">{label}</p></button>)}</div>
              </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Utilisateurs" value={snapshot.users_total} note={`${snapshot.candidates_total} candidats · ${snapshot.recruiters_total} recruteurs`} icon={User} />
              <MetricCard label="Candidatures" value={snapshot.applications_total} note={`${snapshot.applications_today} reçue(s) aujourd’hui`} icon={ClipboardList} tone="emerald" />
              <MetricCard label="Offres d’emploi" value={snapshot.jobs_total} note={`${snapshot.jobs_published} en ligne · ${snapshot.jobs_closed} fermée(s)`} icon={Briefcase} tone="violet" />
              <MetricCard label="Entreprises" value={snapshot.companies_total} note={`${marketplace.verified_companies} vérifiée(s)`} icon={Building2} tone="amber" />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
              <Panel title="Activité de la plateforme" eyebrow="7 derniers jours">
                <div className="mt-6 flex h-64 items-end gap-3 sm:gap-5">{activitySeries.map((item) => <div key={item.key} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"><span className="text-xs font-black text-slate-500">{item.value}</span><div className="flex h-44 w-full items-end rounded-xl bg-slate-50 p-1"><div className="w-full rounded-lg bg-slate-950 transition-all" style={{ height: `${Math.max(6, (item.value / maxActivity) * 100)}%` }} /></div><span className="text-[11px] font-bold capitalize text-slate-400">{item.label}</span></div>)}</div>
              </Panel>
              <Panel title="État aujourd’hui" eyebrow="Temps réel">
                <div className="mt-5 space-y-3">{[['Connectés maintenant', snapshot.online_now, Eye], ['Actifs aujourd’hui', snapshot.active_today, Activity], ['Messages non lus', snapshot.messages_unread, Bell], ['Offres favorites', snapshot.favorites_total, Briefcase]].map(([label, value, Icon]) => <div key={label} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm"><Icon size={18} /></div><p className="flex-1 text-sm font-bold text-slate-600">{label}</p><p className="text-lg font-black">{value}</p></div>)}</div>
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Parcours des candidatures" eyebrow="Pipeline">
                <div className="mt-5 space-y-4">{funnel.map(([label, value, tone]) => <div key={label}><div className="mb-2 flex items-center justify-between"><p className="text-sm font-black text-slate-700">{label}</p><p className="text-sm font-black text-slate-950">{value}</p></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={cx('h-full rounded-full', tone)} style={{ width: `${Math.max(4, (Number(value || 0) / maxFunnel) * 100)}%` }} /></div></div>)}</div>
              </Panel>
              <Panel title="Santé du marketplace" eyebrow="Conversion">
                <div className="mt-5 space-y-5">
                  <ProgressRow label="Offres avec candidature" value={marketplace.job_application_coverage_pct} detail={`${marketplace.live_jobs_with_applications}/${marketplace.live_jobs} offres actives`} />
                  <ProgressRow label="Candidature → conversation" value={marketplace.application_to_conversation_pct} detail={`${marketplace.applications_with_conversation} candidature(s) avec conversation`} />
                  <ProgressRow label="Entreprises vérifiées" value={marketplace.verified_company_pct} detail={`${marketplace.verified_companies}/${marketplace.companies_total} entreprises`} />
                </div>
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
              <Panel title="Offres les plus performantes" eyebrow="Candidatures">
                {topJobs.length ? <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-left"><thead><tr className="border-b border-slate-100 text-[11px] font-black uppercase text-slate-400"><th className="pb-3">Offre</th><th className="pb-3">Statut</th><th className="pb-3 text-right">Candidatures</th><th className="pb-3 text-right">Vues</th></tr></thead><tbody>{topJobs.map((job) => <tr key={job.job_id} className="border-b border-slate-100 last:border-0"><td className="py-4"><p className="font-black">{job.title}</p><p className="mt-1 text-xs font-semibold text-slate-400">{job.company_name} · {job.location}</p></td><td><StatusBadge status={job.status} /></td><td className="text-right font-black">{job.application_count}</td><td className="text-right font-bold text-slate-500">{job.view_count}</td></tr>)}</tbody></table></div> : <div className="mt-5"><EmptyState title="Aucune offre" body="Les performances apparaîtront dès la première publication." /></div>}
              </Panel>
              <Panel title="Activité récente" eyebrow="Flux live">
                <div className="mt-4 space-y-1">{activity.slice(0, 7).map((item, index) => <div key={`${item.entity_id}-${index}`} className="flex gap-3 rounded-xl p-3 transition hover:bg-slate-50"><span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" /><div className="min-w-0 flex-1"><p className="text-sm font-black">{ACTIVITY_LABELS[item.event_type] || 'Activité plateforme'}</p><p className="truncate text-xs font-semibold text-slate-500">{item.actor} · {item.detail}</p></div><p className="shrink-0 text-[10px] font-bold text-slate-400">{formatDate(item.created_at, true)}</p></div>)}{activity.length === 0 && <EmptyState title="Aucune activité" body="Les nouvelles actions apparaîtront ici." />}</div>
              </Panel>
            </div>
          </>}

          {tab === 'marketplace' && <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Couverture des offres" value={`${marketplace.job_application_coverage_pct}%`} note={`${marketplace.live_jobs_without_applications} offre(s) sans candidature`} icon={Briefcase} /><MetricCard label="Candidatures / offre" value={marketplace.avg_applications_per_live_job} note="Moyenne des offres en ligne" icon={ClipboardList} tone="emerald" /><MetricCard label="Vers conversation" value={`${marketplace.application_to_conversation_pct}%`} note={`${marketplace.applications_with_conversation} conversation(s)`} icon={Bell} tone="violet" /><MetricCard label="Entreprises vérifiées" value={`${marketplace.verified_company_pct}%`} note={`${marketplace.verified_companies}/${marketplace.companies_total}`} icon={ShieldCheck} tone="amber" /></div>
            <Panel title="Offres à surveiller" eyebrow="Action requise"><div className="mt-5 grid gap-3 lg:grid-cols-2">{atRisk.map((item) => <article key={item.job_id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase text-slate-400">{item.company_name}</p><h3 className="mt-1 font-black">{item.title}</h3></div><span className={cx('rounded-full px-2.5 py-1 text-[11px] font-black', item.health === 'critical' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800')}>{item.health === 'critical' ? 'Critique' : 'À surveiller'}</span></div><p className="mt-3 text-sm font-semibold text-slate-500">{item.application_count || 0} candidature · {Math.max(1, Math.floor(Number(item.age_hours || 0) / 24))} jour(s) en ligne</p></article>)}{atRisk.length === 0 && <div className="lg:col-span-2"><EmptyState title="Aucune offre à risque" body="Toutes les offres ont reçu une candidature." /></div>}</div></Panel>
          </>}

          {tab === 'users' && <Panel title="Utilisateurs" eyebrow={`${filteredUsers.length} compte(s)`}><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[820px] text-left"><thead><tr className="border-b border-slate-100 text-[11px] font-black uppercase text-slate-400"><th className="pb-3">Utilisateur</th><th className="pb-3">Rôle</th><th className="pb-3">Activité</th><th className="pb-3 text-right">Candidatures</th><th className="pb-3 text-right">Messages</th><th className="pb-3 text-right">Dernière présence</th></tr></thead><tbody>{filteredUsers.map((item) => <tr key={item.user_id} className="border-b border-slate-100 last:border-0"><td className="py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500"><User size={17} /></div><div><p className="font-black">{item.full_name || item.email}</p><p className="text-xs font-semibold text-slate-400">{item.email}</p></div></div></td><td><StatusBadge status={item.role} /></td><td className="text-sm font-semibold text-slate-500">{item.current_context || '—'}</td><td className="text-right font-black">{item.application_count}</td><td className="text-right font-bold text-slate-500">{item.sent_message_count}</td><td className="text-right text-xs font-semibold text-slate-400">{formatDate(item.last_seen_at || item.last_sign_in_at)}</td></tr>)}{filteredUsers.length === 0 && <tr><td colSpan="6" className="py-8 text-center text-sm text-slate-400">Aucun utilisateur trouvé.</td></tr>}</tbody></table></div></Panel>}

          {tab === 'jobs' && <Panel title="Offres d’emploi" eyebrow={`${filteredJobs.length} offre(s)`}><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[820px] text-left"><thead><tr className="border-b border-slate-100 text-[11px] font-black uppercase text-slate-400"><th className="pb-3">Offre</th><th className="pb-3">Statut</th><th className="pb-3">Contrat</th><th className="pb-3 text-right">Candidatures</th><th className="pb-3 text-right">Vues</th><th className="pb-3 text-right">Favoris</th></tr></thead><tbody>{filteredJobs.map((item) => <tr key={item.job_id} className="border-b border-slate-100 last:border-0"><td className="py-4"><p className="font-black">{item.title}</p><p className="text-xs font-semibold text-slate-400">{item.company_name} · {item.location}</p></td><td><StatusBadge status={item.status} /></td><td className="text-sm font-bold text-slate-500">{item.contract_type}</td><td className="text-right font-black">{item.application_count}</td><td className="text-right font-bold text-slate-500">{item.view_count}</td><td className="text-right font-bold text-slate-500">{item.favorite_count}</td></tr>)}{filteredJobs.length === 0 && <tr><td colSpan="6" className="py-8 text-center text-sm text-slate-400">Aucune offre trouvée.</td></tr>}</tbody></table></div></Panel>}

          {tab === 'verifications' && <Panel title="Vérifications recruteurs" eyebrow={`${pendingVerifications} en attente`}><div className="mt-5 grid gap-4 xl:grid-cols-2">{verifications.map((item) => <article key={item.verification_id} className="rounded-2xl border border-slate-200 p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black">{item.company_name || 'Entreprise non renseignée'}</h3><p className="mt-1 text-sm font-bold text-slate-600">{item.recruiter_name || item.recruiter_email}</p><p className="text-xs font-semibold text-slate-400">{item.professional_email || item.recruiter_email}</p></div><StatusBadge status={item.status} /></div><div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-500">Demande : {formatDate(item.submitted_at)}</div><button type="button" onClick={() => openEvidence(item)} disabled={busy === `evidence-${item.verification_id}`} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 text-sm font-black text-blue-700 disabled:opacity-50"><FileText size={17} /> Voir le justificatif</button>{item.status === 'pending' && <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => reviewVerification(item, 'approved')} disabled={Boolean(busy)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-black text-white disabled:opacity-50"><CheckCircle2 size={17} /> Approuver</button><button type="button" onClick={() => reviewVerification(item, 'rejected')} disabled={Boolean(busy)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 text-sm font-black text-red-700 disabled:opacity-50"><XCircle size={17} /> Refuser</button></div>}</article>)}{verifications.length === 0 && <div className="xl:col-span-2"><EmptyState title="Aucune demande" body="Les nouvelles vérifications apparaîtront ici." /></div>}</div></Panel>}

          {tab === 'moderation' && <Panel title="Trust & Safety" eyebrow={`${pendingModeration} offre(s) à contrôler`}><div className="mt-5 grid gap-4 xl:grid-cols-2">{moderation.map((item) => <article key={item.job_id} className="rounded-2xl border border-slate-200 p-5"><div className="flex flex-wrap items-center gap-2"><StatusBadge status={item.moderation_status} />{item.open_report_count > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-red-700"><AlertTriangle size={13} /> {item.open_report_count} signalement(s)</span>}</div><h3 className="mt-3 font-black">{item.job_title}</h3><p className="mt-1 text-sm font-bold text-slate-600">{item.company_name}</p>{item.moderation_reason && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">{item.moderation_reason}</p>}{Object.entries(item.report_reasons || {}).length > 0 && <div className="mt-3 flex flex-wrap gap-2">{Object.entries(item.report_reasons || {}).map(([reason, count]) => <span key={reason} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{REASON_LABELS[reason] || reason} · {count}</span>)}</div>}<div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => reviewModeration(item, 'approved')} disabled={Boolean(busy)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-black text-white disabled:opacity-50"><CheckCircle2 size={17} /> Valider</button><button type="button" onClick={() => reviewModeration(item, 'blocked')} disabled={Boolean(busy)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 text-sm font-black text-red-700 disabled:opacity-50"><XCircle size={17} /> Bloquer</button></div></article>)}{moderation.length === 0 && <div className="xl:col-span-2"><EmptyState title="File vide" body="Aucune offre n’attend de contrôle." /></div>}</div></Panel>}

          {tab === 'activity' && <Panel title="Activité de la plateforme" eyebrow={`${filteredActivity.length} événement(s)`}><div className="mt-5 space-y-2">{filteredActivity.map((item, index) => <article key={`${item.entity_id}-${item.created_at}-${index}`} className="flex gap-4 rounded-2xl border border-slate-100 p-4 transition hover:bg-slate-50"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Activity size={18} /></div><div className="min-w-0 flex-1"><p className="text-sm font-black">{ACTIVITY_LABELS[item.event_type] || 'Activité plateforme'}</p><p className="mt-1 text-sm font-semibold text-slate-600">{item.actor}</p><p className="mt-1 text-sm text-slate-500">{item.detail}</p></div><div className="flex shrink-0 items-center gap-2 text-xs font-bold text-slate-400">{formatDate(item.created_at)}<ChevronRight size={15} /></div></article>)}{filteredActivity.length === 0 && <EmptyState title="Aucune activité" body="Les événements apparaîtront ici." />}</div></Panel>}
        </main>
      </div>
    </div>
  );
}
