import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FileText, RefreshCw, ShieldCheck, X, XCircle } from 'lucide-react';
import { hasSupabaseConfig, supabase } from './lib/supabase';

const PRIMARY_EMAIL = 'eliebakala@gmail.com';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function StatusPill({ status }) {
  const settings = {
    pending: ['En attente', 'bg-amber-50 text-amber-800'],
    approved: ['Approuvée', 'bg-emerald-50 text-emerald-700'],
    rejected: ['Refusée', 'bg-red-50 text-red-700'],
    suspended: ['Suspendue', 'bg-slate-100 text-slate-700'],
  };
  const [label, tone] = settings[status] || ['Statut inconnu', 'bg-slate-100 text-slate-700'];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${tone}`}>{label}</span>;
}

export default function RecruiterVerificationAdmin() {
  const [authorized, setAuthorized] = useState(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [evidenceBusy, setEvidenceBusy] = useState('');

  const pendingCount = useMemo(() => items.filter((item) => item.status === 'pending').length, [items]);

  const load = useCallback(async () => {
    if (!authorized || !supabase) return;
    setLoading(true);
    setError('');
    const { data, error: rpcError } = await supabase.rpc('admin_recruiter_verifications');
    if (rpcError) setError('Les demandes de vérification des recruteurs ne peuvent pas être chargées.');
    else setItems(data || []);
    setLoading(false);
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
    if (authorized) load();
  }, [authorized, load]);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  async function openEvidence(item) {
    if (evidenceBusy) return;
    setEvidenceBusy(item.verification_id);
    setError('');
    const { data: row, error: rowError } = await supabase
      .from('recruiter_verifications')
      .select('document_path')
      .eq('id', item.verification_id)
      .maybeSingle();
    if (rowError || !row?.document_path) {
      setError('Aucun justificatif n’est disponible pour cette demande.');
      setEvidenceBusy('');
      return;
    }
    const popup = window.open('about:blank', '_blank');
    if (popup) popup.opener = null;
    const { data, error: signedError } = await supabase.storage
      .from('verification-documents')
      .createSignedUrl(row.document_path, 300);
    if (signedError || !data?.signedUrl) {
      popup?.close();
      setError('Le justificatif ne peut pas être ouvert pour le moment.');
    } else if (popup) popup.location.href = data.signedUrl;
    setEvidenceBusy('');
  }

  async function review(item, decision) {
    setError('');
    setSuccess('');
    const defaultNote = decision === 'approved'
      ? 'Entreprise et identité du recruteur vérifiées.'
      : 'Merci de corriger ou compléter les informations de l’entreprise.';
    const note = window.prompt('Note adressée au recruteur :', defaultNote);
    if (note === null) return;

    const { error: rpcError } = await supabase.rpc('admin_review_recruiter_verification', {
      p_verification_id: item.verification_id,
      p_decision: decision,
      p_review_note: note,
    });
    if (rpcError) {
      setError('La décision n’a pas pu être enregistrée.');
      return;
    }
    setSuccess(decision === 'approved' ? 'Le recruteur est maintenant vérifié.' : 'La demande a été refusée.');
    await load();
  }

  if (!authorized) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 top-[132px] z-[72] inline-flex min-h-11 items-center gap-2 rounded-full bg-blue-700 px-4 text-sm font-black text-white shadow-xl transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        <ShieldCheck size={18} /> Vérifications
        {pendingCount > 0 && <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[11px] text-slate-950">{pendingCount}</span>}
      </button>

      {open && (
        <div className="fixed inset-0 z-[210] overflow-y-auto bg-slate-50">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 md:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">Sécurité des recruteurs</p>
                <h1 className="mt-1 text-xl font-black text-slate-950 md:text-2xl">Vérifications des entreprises</h1>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={load} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700" aria-label="Actualiser"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button>
                <button type="button" onClick={() => setOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white" aria-label="Fermer"><X size={20} /></button>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-5xl space-y-4 px-4 py-5 md:px-6 md:py-7">
            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
            {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</div>}

            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <ShieldCheck className="mx-auto text-slate-400" size={36} />
                <h2 className="mt-3 font-black text-slate-950">Aucune demande de vérification</h2>
                <p className="mt-1 text-sm text-slate-500">Les nouvelles demandes des recruteurs apparaîtront ici.</p>
              </div>
            ) : items.map((item) => (
              <article key={item.verification_id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-950">{item.company_name || 'Entreprise non renseignée'}</h2>
                    <p className="mt-1 text-sm font-bold text-slate-700">{item.recruiter_name || item.recruiter_email}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.professional_email || item.recruiter_email}</p>
                  </div>
                  <StatusPill status={item.status} />
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <p><span className="font-bold text-slate-800">Demande :</span> {formatDate(item.submitted_at)}</p>
                  <p><span className="font-bold text-slate-800">Entreprise déjà vérifiée :</span> {item.company_verified ? 'Oui' : 'Non'}</p>
                </div>
                {item.review_note && <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">{item.review_note}</p>}
                <button type="button" onClick={() => openEvidence(item)} disabled={evidenceBusy === item.verification_id} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-black text-blue-700 hover:bg-blue-100 disabled:text-slate-400">
                  <FileText size={18} /> {evidenceBusy === item.verification_id ? 'Ouverture…' : 'Voir le justificatif'}
                </button>
                {item.status === 'pending' && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <button type="button" onClick={() => review(item, 'approved')} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white hover:bg-emerald-700"><CheckCircle2 size={18} /> Approuver</button>
                    <button type="button" onClick={() => review(item, 'rejected')} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 text-sm font-black text-red-700 hover:bg-red-50"><XCircle size={18} /> Refuser</button>
                  </div>
                )}
              </article>
            ))}
          </main>
        </div>
      )}
    </>
  );
}
