import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldAlert, X, XCircle } from 'lucide-react';
import { hasSupabaseConfig, supabase } from './lib/supabase';

const PRIMARY_EMAIL = 'eliebakala@gmail.com';
const REASON_LABELS = {
  scam: 'Arnaque suspectée',
  payment_request: 'Demande de paiement',
  identity: 'Identité douteuse',
  misleading: 'Contenu trompeur',
  discrimination: 'Discrimination',
  other: 'Autre motif',
};

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function ModerationPill({ status }) {
  const map = {
    pending: ['À vérifier', 'bg-amber-50 text-amber-800'],
    blocked: ['Bloquée', 'bg-red-50 text-red-700'],
    approved: ['Validée', 'bg-emerald-50 text-emerald-700'],
  };
  const [label, tone] = map[status] || ['Inconnu', 'bg-slate-100 text-slate-700'];
  return <span className={`rounded-full px-3 py-1 text-xs font-black ${tone}`}>{label}</span>;
}

export default function TrustSafetyAdmin() {
  const [authorized, setAuthorized] = useState(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState('');
  const [reports, setReports] = useState({});

  const pendingCount = useMemo(() => items.filter((item) => item.moderation_status === 'pending').length, [items]);

  const load = useCallback(async (quiet = false) => {
    if (!authorized || !supabase) return;
    if (!quiet) setLoading(true);
    setError('');
    const { data, error: rpcError } = await supabase.rpc('admin_job_moderation_queue');
    if (rpcError) setError('La file de modération ne peut pas être chargée.');
    else setItems(data || []);
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
    const timer = window.setInterval(() => load(true), open ? 15000 : 60000);
    return () => window.clearInterval(timer);
  }, [authorized, load, open]);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  async function toggleReports(item) {
    if (expanded === item.job_id) {
      setExpanded('');
      return;
    }
    setExpanded(item.job_id);
    if (reports[item.job_id]) return;
    const { data, error: rpcError } = await supabase.rpc('admin_job_reports', { p_job_id: item.job_id });
    if (rpcError) setError('Les détails des signalements ne peuvent pas être chargés.');
    else setReports((current) => ({ ...current, [item.job_id]: data || [] }));
  }

  async function review(item, decision) {
    if (busy) return;
    const defaultNote = decision === 'approved'
      ? 'Offre contrôlée et validée par Nzela.'
      : 'Offre bloquée après contrôle de sécurité.';
    const note = window.prompt('Note de modération :', defaultNote);
    if (note === null) return;
    setBusy(item.job_id);
    setError('');
    const { error: rpcError } = await supabase.rpc('admin_review_job_moderation', {
      p_job_id: item.job_id,
      p_decision: decision,
      p_review_note: note,
    });
    if (rpcError) setError('La décision de modération n’a pas pu être enregistrée.');
    else {
      setReports((current) => ({ ...current, [item.job_id]: undefined }));
      await load();
    }
    setBusy('');
  }

  if (!authorized) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 top-[184px] z-[72] inline-flex min-h-11 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-black text-white shadow-xl hover:bg-slate-800"
      >
        <ShieldAlert size={18} /> Modération
        {pendingCount > 0 && <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[11px] text-slate-950">{pendingCount}</span>}
      </button>

      {open && (
        <div className="fixed inset-0 z-[225] overflow-y-auto bg-slate-50" role="dialog" aria-modal="true" aria-label="Modération des offres">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 md:px-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-red-700">Trust & Safety</p>
                <h1 className="mt-1 text-xl font-black text-slate-950 md:text-2xl">Modération des offres</h1>
                <p className="mt-1 text-sm text-slate-500">Offres non vérifiées et signalements candidats.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => load()} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white" aria-label="Actualiser"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button>
                <button type="button" onClick={() => setOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white" aria-label="Fermer"><X size={19} /></button>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-6xl space-y-4 px-4 py-5 md:px-6 md:py-7">
            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <CheckCircle2 className="mx-auto text-emerald-600" size={38} />
                <h2 className="mt-3 text-lg font-black text-slate-950">Aucune offre à contrôler</h2>
                <p className="mt-1 text-sm text-slate-500">La file Trust & Safety est vide.</p>
              </div>
            ) : items.map((item) => {
              const reasons = Object.entries(item.report_reasons || {});
              const details = reports[item.job_id] || [];
              return (
                <article key={item.job_id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><ModerationPill status={item.moderation_status} />{item.company_verified && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">Entreprise vérifiée</span>}</div>
                      <h2 className="mt-3 text-lg font-black text-slate-950">{item.job_title}</h2>
                      <p className="mt-1 text-sm font-bold text-slate-700">{item.company_name}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.owner_name || item.owner_email || 'Recruteur'} · {formatDate(item.created_at)}</p>
                    </div>
                    {item.open_report_count > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700"><AlertTriangle size={14} /> {item.open_report_count} signalement{item.open_report_count > 1 ? 's' : ''}</span>}
                  </div>

                  {item.moderation_reason && <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">{item.moderation_reason}</p>}
                  {reasons.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{reasons.map(([reason, count]) => <span key={reason} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{REASON_LABELS[reason] || reason} · {count}</span>)}</div>}

                  {item.open_report_count > 0 && (
                    <button type="button" onClick={() => toggleReports(item)} className="mt-4 text-sm font-black text-blue-700 hover:underline">{expanded === item.job_id ? 'Masquer les signalements' : 'Voir les signalements'}</button>
                  )}

                  {expanded === item.job_id && (
                    <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
                      {details.length === 0 ? <p className="text-sm text-slate-500">Chargement…</p> : details.map((report) => (
                        <div key={report.report_id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                          <p className="font-black text-slate-800">{REASON_LABELS[report.reason] || report.reason}</p>
                          {report.details && <p className="mt-1 leading-6 text-slate-600">{report.details}</p>}
                          <p className="mt-2 text-xs text-slate-400">{report.reporter_name || report.reporter_email || 'Utilisateur'} · {formatDate(report.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    <button type="button" disabled={busy === item.job_id} onClick={() => review(item, 'approved')} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white disabled:bg-slate-300"><CheckCircle2 size={18} /> Valider l’offre</button>
                    <button type="button" disabled={busy === item.job_id} onClick={() => review(item, 'blocked')} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 text-sm font-black text-red-700 disabled:text-slate-400"><XCircle size={18} /> Bloquer l’offre</button>
                  </div>
                </article>
              );
            })}
          </main>
        </div>
      )}
    </>
  );
}
