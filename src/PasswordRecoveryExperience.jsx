import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { hasSupabaseConfig, supabase } from './lib/supabase';

function hasRecoveryHint() {
  if (typeof window === 'undefined') return false;
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return search.get('type') === 'recovery'
    || hash.get('type') === 'recovery'
    || window.location.pathname === '/nouveau-mot-de-passe';
}

export default function PasswordRecoveryExperience() {
  const recoveryDetectedRef = useRef(hasRecoveryHint());
  const [active, setActive] = useState(recoveryDetectedRef.current);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) return undefined;

    let mounted = true;
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY') {
        recoveryDetectedRef.current = true;
        setActive(true);
        setReady(Boolean(session));
        setError('');
      } else if (recoveryDetectedRef.current && session) {
        setReady(true);
      }
    });

    if (recoveryDetectedRef.current) {
      supabase.auth.getSession().then(({ data }) => {
        if (mounted) setReady(Boolean(data.session));
      });
    }

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!active) return null;

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (!ready || !supabase) {
      setError('Ce lien de réinitialisation n’est plus valide. Demandez un nouveau lien depuis la page de connexion.');
      return;
    }
    if (password.length < 8) {
      setError('Votre nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmation) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError('Impossible de modifier le mot de passe. Demandez un nouveau lien et réessayez.');
      return;
    }

    setSuccess(true);
    setPassword('');
    setConfirmation('');
  };

  const returnToLogin = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        // La navigation reste possible même si la fermeture réseau échoue.
      }
    }
    window.history.replaceState({}, document.title, '/');
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[10000] overflow-y-auto bg-slate-50 px-4 py-8 sm:py-12">
      <main className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="text-2xl font-black tracking-tight text-slate-950"><span className="text-blue-600">Nzela</span> Jobs</div>
          <p className="mt-1 text-sm font-semibold text-slate-500">La plateforme emploi du Congo</p>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
          {success ? (
            <div className="text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><ShieldCheck size={34} /></span>
              <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-950">Mot de passe modifié</h1>
              <p className="mt-3 text-sm font-medium leading-6 text-slate-600">Votre nouveau mot de passe est enregistré. Vous pouvez maintenant vous reconnecter à votre compte Nzela Jobs.</p>
              <button type="button" onClick={returnToLogin} className="mt-7 min-h-14 w-full rounded-xl bg-blue-600 px-5 text-base font-black text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100">
                Revenir à la connexion
              </button>
            </div>
          ) : (
            <>
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><ShieldCheck size={28} /></span>
              <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-950">Choisissez un nouveau mot de passe</h1>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600">Créez un nouveau mot de passe pour sécuriser votre compte Nzela Jobs.</p>

              {!ready && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-900">Vérification du lien sécurisé en cours…</div>}

              <form onSubmit={submit} className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-black text-slate-800">Nouveau mot de passe</span>
                  <div className="flex min-h-14 items-center rounded-xl border border-slate-300 bg-white px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" placeholder="8 caractères minimum" className="min-w-0 flex-1 bg-transparent text-base font-semibold text-slate-950 outline-none placeholder:text-slate-400" required />
                    <button type="button" onClick={() => setShowPassword((value) => !value)} className="ml-2 flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-black text-slate-800">Confirmer le mot de passe</span>
                  <div className="flex min-h-14 items-center rounded-xl border border-slate-300 bg-white px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50">
                    <input type={showConfirmation ? 'text' : 'password'} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" placeholder="Répétez le nouveau mot de passe" className="min-w-0 flex-1 bg-transparent text-base font-semibold text-slate-950 outline-none placeholder:text-slate-400" required />
                    <button type="button" onClick={() => setShowConfirmation((value) => !value)} className="ml-2 flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label={showConfirmation ? 'Masquer la confirmation' : 'Afficher la confirmation'}>{showConfirmation ? <EyeOff size={19} /> : <Eye size={19} />}</button>
                  </div>
                </label>

                {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700" role="alert">{error}</p>}

                <button type="submit" disabled={submitting || !ready} className="min-h-14 w-full rounded-xl bg-blue-600 px-5 text-base font-black text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-300">
                  {submitting ? 'Enregistrement…' : 'Enregistrer le nouveau mot de passe'}
                </button>
              </form>

              <div className="mt-5 flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3 text-xs font-semibold leading-5 text-slate-500">
                <ShieldCheck className="mt-0.5 shrink-0 text-blue-600" size={18} />
                <span>Pour votre sécurité, ne réutilisez pas un mot de passe déjà utilisé sur un autre service.</span>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
