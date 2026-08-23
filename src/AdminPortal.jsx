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
  Menu,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldAlert,
  UserRound,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { hasSupabaseConfig, supabase } from './lib/supabase';

const PRIMARY_EMAIL = 'eliebakala@gmail.com';

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
  median_hours_to_first_application: 0,
  applications_total: 0,
  applications_accepted: 0,
  application_acceptance_pct: 0,
  applications_progressed: 0,
  application_progress_pct: 0,
  applications_with_conversation: 0,
  application_to_conversation_pct: 0,
  active_talent_posts: 0,
  hired_talent_posts: 0,
  talent_invitations: 0,
  talent_invitations_accepted: 0,
  talent_invitation_acceptance_pct: 0,
  companies_total: 0,
  verified_companies: 0,
  verified_company_pct: 0,
};

const NAV_ITEMS = [
  ['overview', 'Vue d’ensemble', LayoutDashboard],
  ['marketplace', 'Marketplace', Activity],
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
  expired: 'Expirée',
  closed: 'Fermée',
  archived: 'Archivée',
  draft: 'Brouillon',
  suspended: 'Suspendue',
  pending: 'À vérifier',
  reviewed: 'En cours',
  accepted: 'Acceptée',
  rejected: 'Refusée',
  approved: 'Approuvée',
  blocked: 'Bloquée',
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

function cx(...values) {
  return values.filter(Boolean).join(' ');
}

function formatDate(value, short = false) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', short
    ? { day: '2-digit', month: 'short' }
    : { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function statusLabel(value) {
  return STATUS_LABELS[value] || value || 'Inconnu';
}

function activityLabel(value) {
  return ACTIVITY_LABELS[value] || 'Activité plateforme';
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
    draft: 'bg-slate-100 text-slate-700',
    closed: 'bg-slate-100 text-slate-700',
    blocked: 'bg-red-50 text-red-700',
    rejected: 'bg-red-50 text-red-700',
    suspended: 'bg-red-50 text-red-700',
  };
  return (
    <span className={cx('inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold', tones[status] || 'bg-slate-100 text-slate-700')}>
      {statusLabel(status)}
    </span>
  );
}

function MetricCard({ label, value, note, icon: Icon, accent = 'blue' }) {
  const iconTones = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    violet: 'bg-violet-50 text-violet-700',
    amber: 'bg-amber-50 text-amber-800',
  };
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
        </div>
        <div className={cx('flex h-11 w-11 items-center justify-center rounded-xl', iconTones[accent] || iconTones.blue)}>
          <Icon size={20} />
        </div>
      </div>
      {note && <p className="mt-3 text-xs font-medium leading-5 text-slate-400">{note}</p>}
    </article>
  );
}

function SectionCard({ title, eyebrow, action, children, className }) {
  return (
    <section className={cx('rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]', className)}>
      <div className="flex items-start justify-between gap-4">
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
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-10 text-center">
      <ClipboardList className="mx-auto text-slate-300" size={34} />
      <p className="mt-3 font-bold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
    </div>
  );
}

function LoginScreen({ onSuccess }) {
  const [email, setEmail] = useState(PRIMARY_EMAIL);
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
    else onSuccess(data.session);
    setBusy(false);
  }

  async function signInWithGoogle() {
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
    <div className="min-h-screen bg-[#f6f7f9] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white"><ShieldCheck size={21} /></div>
            <div><p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Nzela Jobs</p><h1 className="text-xl font-black text-slate-950">Administration</h1></div>
          </div>
          <p className="mt-6 text-sm leading-6 text-slate-500">Espace réservé au pilotage de la plateforme, aux vérifications et à la modération.</p>
          {!hasSupabaseConfig && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">La connexion Supabase n’est pas configurée pour ce déploiement.</div>}
          {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
          <form onSubmit={signIn} className="mt-6 space-y-4">
            <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-600">Adresse e-mail</span><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-50" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-600">Mot de passe</span><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-50" /></label>
            <button disabled={busy || !hasSupabaseConfig} className="flex h-12 w-full items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50">{busy ? 'Connexion…' : 'Se connecter'}</button>
          </form>
          <div className="my-5 flex items-center gap-3"><div className="h-px flex-1 bg-slate-200" /><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">ou</span><div className="h-px flex-1 bg-slate-200" /></div>
          <button type="button" onClick={signInWithGoogle} disabled={busy || !hasSupabaseConfig} className="flex h-12 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">Continuer avec Google</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPortal() {
  const [session, setSession] = useState(null);
  const [access, setAccess] = useState('checking');
  const [active, setActive] = useState('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [snapshot, setSnapshot] = useState(EMPTY_SNAPSHOT);
  const [marketplace, setMarketplace] = useState(EMPTY_MARKETPLACE);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [activity, setActivity] = useState([]);
  const [atRiskJobs, setAtRiskJobs] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [moderation, setModeration] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const refreshTimer = useRef(null);

  const resolveAccess = useCallback(async (nextSession) => {
    setSession(nextSession || null);
    if (!nextSession?.user || !supabase) {
      setAccess('guest');
      return;
    }
    if (nextSession.user.email?.toLowerCase() === PRIMARY_EMAIL) {
      setAccess('admin');
      return;
    }
    const { data, error: roleError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', nextSession.user.id)
      .maybeSingle();
    setAccess(!roleError && data?.role === 'admin' ? 'admin' : 'denied');
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

  const loadDashboard = useCallback(async (quiet = false) => {
    if (access !== 'admin' || !supabase) return;
    if (!quiet) setLoading(true);
    setError('');
    const results = await Promise.all([
      supabase.rpc('admin_platform_snapshot'),
      supabase.rpc('admin_marketplace_kpis'),
      supabase.rpc('admin_users_overview'),
      supabase.rpc('admin_jobs_overview'),
      supabase.rpc('admin_recent_activity', { p_limit: 100 }),
      supabase.rpc('admin_marketplace_jobs_at_risk'),
      supabase.rpc('admin_recruiter_verifications'),
      supabase.rpc('admin_job_moderation_queue'),
    ]);
    const firstError = results.find((item) => item.error)?.error;
    if (firstError) setError('Certaines données administratives ne peuvent pas être chargées pour le moment.');
    setSnapshot({ ...EMPTY_SNAPSHOT, ...(results[0].data || {}) });
    setMarketplace({ ...EMPTY_MARKETPLACE, ...(results[1].data || {}) });
    setUsers(results[2].data || []);
    setJobs(results[3].data || []);
    setActivity(results[4].data || []);
    setAtRiskJobs(results[5].data || []);
    setVerifications(results[6].data || []);
    setModeration(results[7].data || []);
    if (!quiet) setLoading(false);
  }, [access]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
    refreshTimer.current = window.setTimeout(() => loadDashboard(true), 450);
  }, [loadDashboard]);

  useEffect(() => {
    if (access !== 'admin' || !supabase) return undefined;
    loadDashboard();
    const channel = supabase
      .channel('nzela-admin-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recruiter_verifications' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_reports' }, scheduleRefresh)
      .subscribe();
    const timer = window.setInterval(() => loadDashboard(true), 30000);
    return () => {
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
      window.clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [access, loadDashboard, scheduleRefresh]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredUsers = useMemo(() => users.filter((item) => !normalizedQuery || [item.full_name, item.email, item.role, item.professional_title, item.city].some((value) => String(value || '').toLowerCase().includes(normalizedQuery))), [users, normalizedQuery]);
  const filteredJobs = useMemo(() => jobs.filter((item) => !normalizedQuery || [item.title, item.company_name, item.location, item.contract_type, item.status].some((value) => String(value || '').toLowerCase().includes(normalizedQuery))), [jobs, normalizedQuery]);
  const filteredActivity = useMemo(() => activity.filter((item) => !normalizedQuery || [item.actor, item.detail, item.event_type].some((value) => String(value || '').toLowerCase().includes(normalizedQuery))), [activity, normalizedQuery]);
  const topJobs = useMemo(() => [...jobs].sort((a, b) => Number(b.application_count || 0) - Number(a.application_count || 0)).slice(0, 5), [jobs]);
  const pendingVerifications = useMemo(() => verifications.filter((item) => item.status === 'pending').length, [verifications]);
  const pendingModeration = useMemo(() => moderation.filter((item) => item.moderation_status === 'pending').length, [moderation]);

  const activitySeries = useMemo(() => {
    const days = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      days.push({ key: date.toISOString().slice(0, 10), label: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(date), value: 0 });
    }
    activity.forEach((item) => {
      const key = item.created_at ? new Date(item.created_at).toISOString().slice(0, 10) : '';
      const target = days.find((day) => day.key === key);
      if (target) target.value += 1;
    });
    return days;
  }, [activity]);
  const maxActivity = Math.max(1, ...activitySeries.map((item) => item.value));

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
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
    await loadDashboard(true);
    setBusy('');
  }

  async function reviewModeration(item, decision) {
    if (!supabase || busy) return;
    const note = window.prompt('Note de modération :', decision === 'approved' ? 'Offre contrôlée et validée par Nzela.' : 'Offre bloquée après contrôle de sécurité.');
    if (note === null) return;
    setBusy(`moderate-${item.job_id}`);
    const { error: rpcError } = await supabase.rpc('admin_review_job_moderation', { p_job_id: item.job_id, p_decision: decision, p_review_note: note });
    if (rpcError) setError('La décision de modération n’a pas pu être enregistrée.');
    await loadDashboard(true);
    setBusy('');
  }

  if (access === 'checking') return <div className="flex min-h-screen items-center justify-center bg-[#f6f7f9]"><RefreshCw className="animate-spin text-slate-400" size={28} /></div>;
  if (access === 'guest') return <LoginScreen onSuccess={resolveAccess} />;
  if (access === 'denied') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7f9] px-4"><div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50"><ShieldAlert className="mx-auto text-red-500" size={42} /><h1 className="mt-4 text-xl font-black text-slate-950">Accès non autorisé</h1><p className="mt-2 text-sm leading-6 text-slate-500">Ce compte n’a pas de rôle administrateur Nzela Jobs.</p><button type="button" onClick={signOut} className="mt-6 h-11 rounded-xl bg-slate-950 px-5 text-sm font-black text-white">Se déconnecter</button></div></div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-950">
      <aside className={cx('fixed inset-y-0 left-0 z-50 w-[268px] border-r border-slate-200 bg-white transition-transform lg:translate-x-0', menuOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white"><ShieldCheck size={20} /></div><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">Nzela Jobs</p><p className="text-base font-black">Admin</p></div></div>
          <button type="button" className="lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Fermer le menu"><X size={20} /></button>
        </div>
        <nav className="space-y-1 p-4">
          {NAV_ITEMS.map(([id, label, Icon]) => {
            const badge = id === 'verifications' ? pendingVerifications : id === 'moderation' ? pendingModeration : 0;
            return (
              <button key={id} type="button" onClick={() => { setActive(id); setMenuOpen(false); }} className={cx('flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition', active === id ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950')}>
                <Icon size={18} /><span className="flex-1">{label}</span>{badge > 0 && <span className={cx('rounded-full px-2 py-0.5 text-[10px] font-black', active === id ? 'bg-white text-slate-950' : 'bg-red-50 text-red-700')}>{badge}</span>}
              </button>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-100 p-4">
          <div className="rounded-2xl bg-slate-50 p-3"><p className="truncate text-xs font-black text-slate-800">{session?.user?.email}</p><p className="mt-1 text-[11px] font-semibold text-slate-400">Administrateur Nzela</p><button type="button" onClick={signOut} className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:bg-slate-100"><LogOut size={15} /> Déconnexion</button></div>
        </div>
      </aside>
      {menuOpen && <button type="button" className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[1px] lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Fermer le menu" />}

      <div className="lg:pl-[268px]">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-20 items-center gap-3 px-4 sm:px-6 xl:px-8">
            <button type="button" onClick={() => setMenuOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white lg:hidden" aria-label="Ouvrir le menu"><Menu size={20} /></button>
            <div className="min-w-0 flex-1"><p className="text-xs font-bold text-slate-400">Nzela Jobs / Administration</p><h1 className="truncate text-xl font-black tracking-tight">{NAV_ITEMS.find(([id]) => id === active)?.[1] || 'Administration'}</h1></div>
            <div className="hidden w-full max-w-sm items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 md:flex"><Search size={17} className="text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher…" className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none" />{query && <button type="button" onClick={() => setQuery('')} className="text-slate-400"><X size={16} /></button>}</div>
            <button type="button" onClick={() => loadDashboard()} disabled={loading} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50" aria-label="Actualiser"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button>
            <div className="hidden h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-sm font-black text-blue-700 sm:flex">NZ</div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 xl:p-8">
          {error && <div className="flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"><span>{error}</span><button type="button" onClick={() => setError('')}><X size={17} /></button></div>}
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Données réelles · synchronisation automatique</div>

          {active === 'overview' && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Utilisateurs" value={snapshot.users_total} note={`${snapshot.candidates_total} candidats · ${snapshot.recruiters_total} recruteurs`} icon={Users} accent="blue" />
                <MetricCard label="Candidatures" value={snapshot.applications_total} note={`${snapshot.applications_today} reçue(s) aujourd’hui`} icon={ClipboardList} accent="emerald" />
                <MetricCard label="Offres d’emploi" value={snapshot.jobs_total} note={`${snapshot.jobs_published} actuellement en ligne`} icon={Briefcase} accent="violet" />
                <MetricCard label="Entreprises" value={snapshot.companies_total} note={`${marketplace.verified_companies} entreprise(s) vérifiée(s)`} icon={Building2} accent="amber" />
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
                <SectionCard title="Activité de la plateforme" eyebrow="7 derniers jours">
                  <div className="mt-6 flex h-64 items-end gap-3 sm:gap-5">
                    {activitySeries.map((item) => (
                      <div key={item.key} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                        <span className="text-xs font-black text-slate-500">{item.value}</span>
                        <div className="flex h-44 w-full items-end rounded-xl bg-slate-50 p-1"><div className="w-full rounded-lg bg-slate-950 transition-all" style={{ height: `${Math.max(6, (item.value / maxActivity) * 100)}%` }} /></div>
                        <span className="text-[11px] font-bold capitalize text-slate-400">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </SectionCard>
                <SectionCard title="État aujourd’hui" eyebrow="Temps réel">
                  <div className="mt-5 space-y-3">
                    {[
                      ['Connectés maintenant', snapshot.online_now, Eye],
                      ['Actifs aujourd’hui', snapshot.active_today, Activity],
                      ['Messages non lus', snapshot.messages_unread, Bell],
                      ['Offres favorites', snapshot.favorites_total, Briefcase],
                    ].map(([label, value, Icon]) => <div key={label} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm"><Icon size={18} /></div><p className="flex-1 text-sm font-bold text-slate-600">{label}</p><p className="text-lg font-black text-slate-950">{value}</p></div>)}
                  </div>
                </SectionCard>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
                <SectionCard title="Offres les plus performantes" eyebrow="Candidatures">
                  <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-left"><thead><tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400"><th className="pb-3">Offre</th><th className="pb-3">Statut</th><th className="pb-3 text-right">Candidatures</th><th className="pb-3 text-right">Vues</th></tr></thead><tbody>{topJobs.map((job) => <tr key={job.job_id} className="border-b border-slate-100 last:border-0"><td className="py-4"><p className="font-black text-slate-900">{job.title}</p><p className="mt-1 text-xs font-semibold text-slate-400">{job.company_name} · {job.location}</p></td><td className="py-4"><StatusBadge status={job.status} /></td><td className="py-4 text-right font-black">{job.application_count}</td><td className="py-4 text-right font-bold text-slate-500">{job.view_count}</td></tr>)}{topJobs.length === 0 && <tr><td colSpan="4" className="py-6 text-center text-sm text-slate-400">Aucune offre disponible.</td></tr>}</tbody></table></div>
                </SectionCard>
                <SectionCard title="Activité récente" eyebrow="Flux live">
                  <div className="mt-4 space-y-1">{activity.slice(0, 7).map((item, index) => <div key={`${item.entity_id}-${index}`} className="flex gap-3 rounded-xl p-3 hover:bg-slate-50"><div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" /><div className="min-w-0 flex-1"><p className="text-sm font-black text-slate-800">{activityLabel(item.event_type)}</p><p className="truncate text-xs font-semibold text-slate-500">{item.actor} · {item.detail}</p></div><p className="shrink-0 text-[10px] font-bold text-slate-400">{formatDate(item.created_at, true)}</p></div>)}{activity.length === 0 && <EmptyState title="Aucune activité" body="Les nouvelles actions apparaîtront ici." />}</div>
                </SectionCard>
              </div>
            </>
          )}

          {active === 'marketplace' && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Couverture des offres" value={`${marketplace.job_application_coverage_pct}%`} note={`${marketplace.live_jobs_without_applications} offre(s) sans candidature`} icon={Briefcase} />
                <MetricCard label="Candidatures / offre" value={marketplace.avg_applications_per_live_job} note="Moyenne sur les offres en ligne" icon={ClipboardList} accent="emerald" />
                <MetricCard label="Vers conversation" value={`${marketplace.application_to_conversation_pct}%`} note={`${marketplace.applications_with_conversation} conversation(s)`} icon={Bell} accent="violet" />
                <MetricCard label="Entreprises vérifiées" value={`${marketplace.verified_company_pct}%`} note={`${marketplace.verified_companies}/${marketplace.companies_total}`} icon={ShieldCheck} accent="amber" />
              </div>
              <SectionCard title="Offres à surveiller" eyebrow="Action requise">
                <div className="mt-5 grid gap-3 lg:grid-cols-2">{atRiskJobs.map((item) => <article key={item.job_id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-slate-400">{item.company_name}</p><h3 className="mt-1 font-black text-slate-950">{item.title}</h3></div><span className={cx('rounded-full px-2.5 py-1 text-[11px] font-black', item.health === 'critical' ? 'bg-red-50 text-red-700' : item.health === 'watch' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-700')}>{item.health === 'critical' ? 'Critique' : item.health === 'watch' ? 'À surveiller' : 'Nouvelle'}</span></div><p className="mt-3 text-sm font-semibold text-slate-500">0 candidature · {Math.max(1, Math.floor(Number(item.age_hours || 0) / 24))} jour(s) en ligne</p></article>)}{atRiskJobs.length === 0 && <div className="lg:col-span-2"><EmptyState title="Aucune offre à risque" body="Toutes les offres publiques ont reçu une candidature." /></div>}</div>
              </SectionCard>
            </>
          )}

          {active === 'users' && (
            <SectionCard title="Utilisateurs" eyebrow={`${filteredUsers.length} compte(s)`}>
              <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[820px] text-left"><thead><tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400"><th className="pb-3">Utilisateur</th><th className="pb-3">Rôle</th><th className="pb-3">Activité</th><th className="pb-3 text-right">Candidatures</th><th className="pb-3 text-right">Messages</th><th className="pb-3 text-right">Dernière présence</th></tr></thead><tbody>{filteredUsers.map((item) => <tr key={item.user_id} className="border-b border-slate-100 last:border-0"><td className="py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500"><UserRound size={17} /></div><div><p className="font-black text-slate-900">{item.full_name || item.email}</p><p className="mt-0.5 text-xs font-semibold text-slate-400">{item.email}</p></div></div></td><td className="py-4"><StatusBadge status={item.role} /></td><td className="py-4 text-sm font-semibold text-slate-500">{item.current_context || '—'}</td><td className="py-4 text-right font-black">{item.application_count}</td><td className="py-4 text-right font-bold text-slate-500">{item.sent_message_count}</td><td className="py-4 text-right text-xs font-semibold text-slate-400">{formatDate(item.last_seen_at || item.last_sign_in_at)}</td></tr>)}{filteredUsers.length === 0 && <tr><td colSpan="6" className="py-8 text-center text-sm text-slate-400">Aucun utilisateur trouvé.</td></tr>}</tbody></table></div>
            </SectionCard>
          )}

          {active === 'jobs' && (
            <SectionCard title="Offres d’emploi" eyebrow={`${filteredJobs.length} offre(s)`}>
              <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[820px] text-left"><thead><tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400"><th className="pb-3">Offre</th><th className="pb-3">Statut</th><th className="pb-3">Contrat</th><th className="pb-3 text-right">Candidatures</th><th className="pb-3 text-right">Vues</th><th className="pb-3 text-right">Favoris</th></tr></thead><tbody>{filteredJobs.map((item) => <tr key={item.job_id} className="border-b border-slate-100 last:border-0"><td className="py-4"><p className="font-black text-slate-900">{item.title}</p><p className="mt-1 text-xs font-semibold text-slate-400">{item.company_name} · {item.location}</p></td><td className="py-4"><StatusBadge status={item.status} /></td><td className="py-4 text-sm font-bold text-slate-500">{item.contract_type}</td><td className="py-4 text-right font-black">{item.application_count}</td><td className="py-4 text-right font-bold text-slate-500">{item.view_count}</td><td className="py-4 text-right font-bold text-slate-500">{item.favorite_count}</td></tr>)}{filteredJobs.length === 0 && <tr><td colSpan="6" className="py-8 text-center text-sm text-slate-400">Aucune offre trouvée.</td></tr>}</tbody></table></div>
            </SectionCard>
          )}

          {active === 'verifications' && (
            <SectionCard title="Vérifications recruteurs" eyebrow={`${pendingVerifications} en attente`}>
              <div className="mt-5 grid gap-4 xl:grid-cols-2">{verifications.map((item) => <article key={item.verification_id} className="rounded-2xl border border-slate-200 p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-slate-950">{item.company_name || 'Entreprise non renseignée'}</h3><p className="mt-1 text-sm font-bold text-slate-600">{item.recruiter_name || item.recruiter_email}</p><p className="mt-1 text-xs font-semibold text-slate-400">{item.professional_email || item.recruiter_email}</p></div><StatusBadge status={item.status} /></div><div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-500"><span>Demande : {formatDate(item.submitted_at)}</span><span>{item.company_verified ? 'Déjà vérifiée' : 'Non vérifiée'}</span></div><button type="button" onClick={() => openEvidence(item)} disabled={busy === `evidence-${item.verification_id}`} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 text-sm font-black text-blue-700 disabled:opacity-50"><FileText size={17} /> Voir le justificatif</button>{item.status === 'pending' && <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => reviewVerification(item, 'approved')} disabled={Boolean(busy)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-black text-white disabled:opacity-50"><CheckCircle2 size={17} /> Approuver</button><button type="button" onClick={() => reviewVerification(item, 'rejected')} disabled={Boolean(busy)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white text-sm font-black text-red-700 disabled:opacity-50"><XCircle size={17} /> Refuser</button></div>}</article>)}{verifications.length === 0 && <div className="xl:col-span-2"><EmptyState title="Aucune demande" body="Les nouvelles vérifications apparaîtront ici." /></div>}</div>
            </SectionCard>
          )}

          {active === 'moderation' && (
            <SectionCard title="Trust & Safety" eyebrow={`${pendingModeration} offre(s) à contrôler`}>
              <div className="mt-5 grid gap-4 xl:grid-cols-2">{moderation.map((item) => <article key={item.job_id} className="rounded-2xl border border-slate-200 p-5"><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><StatusBadge status={item.moderation_status} />{item.open_report_count > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-red-700"><AlertTriangle size={13} /> {item.open_report_count} signalement(s)</span>}</div><h3 className="mt-3 font-black text-slate-950">{item.job_title}</h3><p className="mt-1 text-sm font-bold text-slate-600">{item.company_name}</p></div></div>{item.moderation_reason && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-900">{item.moderation_reason}</p>}{Object.entries(item.report_reasons || {}).length > 0 && <div className="mt-3 flex flex-wrap gap-2">{Object.entries(item.report_reasons || {}).map(([reason, count]) => <span key={reason} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{REASON_LABELS[reason] || reason} · {count}</span>)}</div>}<div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => reviewModeration(item, 'approved')} disabled={Boolean(busy)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-black text-white disabled:opacity-50"><CheckCircle2 size={17} /> Valider</button><button type="button" onClick={() => reviewModeration(item, 'blocked')} disabled={Boolean(busy)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white text-sm font-black text-red-700 disabled:opacity-50"><XCircle size={17} /> Bloquer</button></div></article>)}{moderation.length === 0 && <div className="xl:col-span-2"><EmptyState title="File vide" body="Aucune offre n’attend de contrôle." /></div>}</div>
            </SectionCard>
          )}

          {active === 'activity' && (
            <SectionCard title="Activité de la plateforme" eyebrow={`${filteredActivity.length} événement(s)`}>
              <div className="mt-5 space-y-2">{filteredActivity.map((item, index) => <article key={`${item.entity_id}-${item.created_at}-${index}`} className="flex gap-4 rounded-2xl border border-slate-100 p-4 transition hover:border-slate-200 hover:bg-slate-50"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Activity size={18} /></div><div className="min-w-0 flex-1"><p className="text-sm font-black text-slate-900">{activityLabel(item.event_type)}</p><p className="mt-1 text-sm font-semibold text-slate-600">{item.actor}</p><p className="mt-1 text-sm leading-6 text-slate-500">{item.detail}</p></div><div className="flex shrink-0 items-center gap-2 text-xs font-bold text-slate-400">{formatDate(item.created_at)}<ChevronRight size={15} /></div></article>)}{filteredActivity.length === 0 && <EmptyState title="Aucune activité" body="Les événements de la plateforme apparaîtront ici." />}</div>
            </SectionCard>
          )}
        </main>
      </div>
    </div>
  );
}
