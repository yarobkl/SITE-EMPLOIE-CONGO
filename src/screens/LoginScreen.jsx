import { useState } from 'react';
import { BackButton, PageHeader, PasswordField, SocialLoginButton, TextField } from '../components/ui';
import { classNames } from '../lib/format';
import { OAUTH_PROVIDERS } from '../constants';

export default function LoginScreen({ authMode, setAuthMode, loginRole, setLoginRole, loginEmail, setLoginEmail, loginPassword, setLoginPassword, handleAuth, handleOAuthSignIn, setScreen }) {
  const isSignup = authMode === 'signup';
  const [showPassword, setShowPassword] = useState(false);
  const isRecruiterLogin = loginRole === 'recruteur';
  const loginTitle = `${isSignup ? 'Inscription' : 'Connexion'} ${isRecruiterLogin ? 'recruteur' : 'candidat'}`;
  const loginSubtitle = isRecruiterLogin ? 'Espace employeur pour publier les offres et voir les CV' : 'Espace candidat pour postuler et suivre tes candidatures';

  return (
    <div className="mx-auto max-w-md space-y-5">
      <BackButton onClick={() => setScreen('home')} label="Accueil" />
      <PageHeader title={loginTitle} subtitle={loginSubtitle} />
      <div className="grid grid-cols-2 rounded-lg border border-slate-200 bg-white p-1">
        <button type="button" onClick={() => setLoginRole('candidat')} className={classNames('min-h-11 rounded-md text-sm font-black', !isRecruiterLogin ? 'bg-blue-700 text-white' : 'text-slate-600')}>
          Candidat
        </button>
        <button type="button" onClick={() => setLoginRole('recruteur')} className={classNames('min-h-11 rounded-md text-sm font-black', isRecruiterLogin ? 'bg-blue-700 text-white' : 'text-slate-600')}>
          Recruteur
        </button>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm font-black text-slate-900">Continuer avec</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {OAUTH_PROVIDERS.map((item) => (
            <SocialLoginButton key={item.provider} item={item} onClick={() => handleOAuthSignIn(item.provider)} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 rounded-lg border border-slate-200 bg-white p-1">
        <button type="button" onClick={() => setAuthMode('signin')} className={classNames('min-h-11 rounded-md text-sm font-black', !isSignup ? 'bg-blue-700 text-white' : 'text-slate-600')}>
          Connexion
        </button>
        <button type="button" onClick={() => setAuthMode('signup')} className={classNames('min-h-11 rounded-md text-sm font-black', isSignup ? 'bg-blue-700 text-white' : 'text-slate-600')}>
          Inscription
        </button>
      </div>
      <form onSubmit={handleAuth} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        <TextField label="Email" type="email" value={loginEmail} onChange={setLoginEmail} required />
        <PasswordField
          label="Mot de passe"
          value={loginPassword}
          onChange={setLoginPassword}
          required
          placeholder="Minimum 8 caracteres"
          visible={showPassword}
          onToggle={() => setShowPassword((visible) => !visible)}
        />
        <button type="submit" className="min-h-12 w-full rounded-lg bg-blue-700 px-5 font-black text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600">
          {isSignup ? `Creer mon compte ${isRecruiterLogin ? 'recruteur' : 'candidat'}` : `Me connecter comme ${isRecruiterLogin ? 'recruteur' : 'candidat'}`}
        </button>
        <p className="text-xs font-semibold leading-5 text-slate-500">
          {isSignup
            ? `Ce compte sera cree comme ${isRecruiterLogin ? 'recruteur' : 'candidat'}. Si une validation email est demandee, confirme le lien recu avant de te reconnecter.`
            : isRecruiterLogin
              ? 'Utilise ici ton compte recruteur pour voir tes offres, tes candidats et leurs CV.'
              : 'Utilise ici ton compte candidat pour postuler et suivre tes candidatures.'}
        </p>
      </form>
    </div>
  );
}
