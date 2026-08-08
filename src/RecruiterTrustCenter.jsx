import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, FileCheck2, ShieldCheck, Upload, X } from 'lucide-react';
import { hasSupabaseConfig, supabase } from './lib/supabase';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

function statusLabel(status, verified) {
  if (verified || status === 'approved') return ['Entreprise vérifiée', 'bg-emerald-50 text-emerald-700 border-emerald-200'];
  if (status === 'pending') return ['Vérification en cours', 'bg-amber-50 text-amber-800 border-amber-200'];
  if (status === 'rejected') return ['Vérification à reprendre', 'bg-red-50 text-red-700 border-red-200'];
  if (status === 'suspended') return ['Vérification suspendue', 'bg-red-50 text-red-700 border-red-200'];
  return ['Entreprise non vérifiée', 'bg-slate-50 text-slate-700 border-slate-200'];
}

export default function RecruiterTrustCenter() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [companyId, setCompanyId] = useState('');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async (sessionUser) => {
    if (!supabase || !sessionUser) return;
    const [{ data: profileRow }, { data: companyRows }, { data: verificationRows }] = await Promise.all([
      supabase.from('profiles').select('id,role,email').eq('id', sessionUser.id).maybeSingle(),
      supabase.from('companies').select('id,name,verified,city,sector').eq('owner_id', sessionUser.id).order('created_at', { ascending: false }),
      supabase.from('recruiter_verifications').select('id,company_id,professional_email,document_path,status,submitted_at,reviewed_at,review_note').eq('recruiter_id', sessionUser.id).order('submitted_at', { ascending: false }),
    ]);
    setProfile(profileRow || null);
    setCompanies(companyRows || []);
    setVerifications(verificationRows || []);
    if (!companyId && companyRows?.[0]?.id) setCompanyId(companyRows[0].id);
    if (!email) setEmail(profileRow?.email || sessionUser.email || '');
  }, [companyId, email]);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user || null;
      setUser(sessionUser);
      if (sessionUser) load(sessionUser);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user || null;
      setUser(sessionUser);
      if (sessionUser) load(sessionUser);
      else {
        setProfile(null);
        setCompanies([]);
        setVerifications([]);
        setOpen(false);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [load]);

  const selectedCompany = companies.find((company) => company.id === companyId) || companies[0] || null;
  const selectedVerification = useMemo(
    () => verifications.find((item) => item.company_id === selectedCompany?.id) || null,
    [selectedCompany?.id, verifications],
  );
  const [label, tone] = statusLabel(selectedVerification?.status, selectedCompany?.verified);

  if (!user || !profile || !['recruteur', 'admin'].includes(profile.role) || companies.length === 0) return null;

  async function submit(event) {
    event.preventDefault();
    if (!selectedCompany || busy) return;
    if (!email.trim() || !email.includes('@')) {
      setMessage('Renseignez une adresse e-mail professionnelle valide.');
      return;
    }
    if (!file && !selectedVerification?.document_path) {
      setMessage('Ajoutez un justificatif de l’entreprise (PDF, JPG ou PNG).');
      return;
    }
    if (file && (!ACCEPTED_TYPES.includes(file.type) || file.size > MAX_FILE_BYTES)) {
      setMessage('Le justificatif doit être un PDF/JPG/PNG de 5 Mo maximum.');
      return;
    }

    setBusy(true);
    setMessage('');
    let documentPath = selectedVerification?.document_path || null;
    try {
      if (file) {
        const extension = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg';
        documentPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from('verification-documents').upload(documentPath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });
        if (uploadError) throw uploadError;
      }

      const payload = {
        recruiter_id: user.id,
        company_id: selectedCompany.id,
        professional_email: email.trim().toLowerCase(),
        document_path: documentPath,
        status: 'pending',
      };
      const { error: saveError } = await supabase.from('recruiter_verifications').upsert(payload, {
        onConflict: 'recruiter_id,company_id',
      });
      if (saveError) throw saveError;
      setFile(null);
      setMessage('Demande envoyée. Nzela vérifiera l’entreprise avant validation.');
      await load(user);
    } catch (_error) {
      setMessage('La demande n’a pas pu être envoyée. Vérifiez le justificatif puis réessayez.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[84px] right-4 z-[70] inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-900 shadow-xl hover:border-blue-300 hover:text-blue-700"
      >
        <ShieldCheck size={18} className={selectedCompany?.verified ? 'text-emerald-600' : 'text-blue-700'} />
        {selectedCompany?.verified ? 'Entreprise vérifiée' : 'Vérifier mon entreprise'}
      </button>

      {open && (
        <div className="fixed inset-0 z-[230] overflow-y-auto bg-slate-950/45 p-3 backdrop-blur-sm md:p-6" role="dialog" aria-modal="true" aria-label="Vérification de l’entreprise">
          <div className="mx-auto max-w-xl rounded-2xl bg-white shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">Confiance Nzela</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">Vérifier mon entreprise</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">Une entreprise vérifiée publie directement. Une entreprise non vérifiée passe par la modération avant mise en ligne.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700" aria-label="Fermer"><X size={19} /></button>
            </header>

            <form onSubmit={submit} className="space-y-5 p-5">
              <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${tone}`}>{label}</div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-800">Entreprise</span>
                <select value={companyId} onChange={(event) => setCompanyId(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm">
                  {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-800">E-mail professionnel</span>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" placeholder="contact@entreprise.cg" />
              </label>

              <label className="block rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <span className="flex items-center gap-2 text-sm font-black text-slate-800"><Upload size={18} /> Justificatif de l’entreprise</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">RCCM, NIU, attestation professionnelle ou document équivalent. PDF/JPG/PNG, 5 Mo maximum.</span>
                <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => setFile(event.target.files?.[0] || null)} className="mt-3 block w-full text-sm" />
                {file && <span className="mt-2 flex items-center gap-2 text-xs font-bold text-emerald-700"><FileCheck2 size={15} /> {file.name}</span>}
              </label>

              {selectedVerification?.review_note && <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600"><strong>Note de Nzela :</strong> {selectedVerification.review_note}</div>}
              {message && <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">{message}</div>}

              <button type="submit" disabled={busy || selectedCompany?.verified} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300">
                <Building2 size={18} /> {selectedCompany?.verified ? 'Entreprise déjà vérifiée' : busy ? 'Envoi…' : selectedVerification ? 'Renvoyer pour vérification' : 'Envoyer la demande'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
