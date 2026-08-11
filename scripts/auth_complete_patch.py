from pathlib import Path
import re

p = Path('src/App.jsx')
s = p.read_text()

s = s.replace("  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);", "  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);\n  const [appleAuthLoading, setAppleAuthLoading] = useState(false);")

signup_pattern = re.compile(r"        if \(data\.user\) \{[\s\S]*?        \}\n        setLoginPassword\(''\);\n        setScreen\(loginRole === 'recruteur' \? 'recruiter' : 'profile'\);\n        notify\(data\.session \? 'Compte créé et connecté\.' : 'Compte créé\. Vérifiez votre adresse e-mail pour vous connecter\.'\);\n        return;", re.M)
signup_replacement = """        setLoginPassword('');
        if (data.session) {
          setAuthUser(data.user);
          setScreen(loginRole === 'recruteur' ? 'recruiter' : 'profile');
          notify('Compte créé et connecté.');
        } else {
          setAuthMode('signin');
          setScreen('login');
          notify('Compte créé. Vérifiez votre adresse e-mail, puis connectez-vous.');
        }
        return;"""
s, count = signup_pattern.subn(signup_replacement, s, count=1)
if count != 1:
    raise SystemExit('signup patch failed')

apple_pattern = re.compile(r"  const handleAppleSignIn = async \(\) => \{[\s\S]*?\n  \};\n\n  const handleLogout", re.M)
apple_replacement = """  const handleAppleSignIn = async () => {
    if (!hasSupabaseConfig || !supabase) {
      notify('La connexion avec Apple est temporairement indisponible.');
      return;
    }
    if (appleAuthLoading) return;
    if (isOffline) {
      notify('Pas de connexion Internet. Reconnectez-vous puis réessayez.');
      return;
    }
    if (serviceStatus !== 'online') {
      notify('Connexion avec Apple temporairement indisponible. Réessayez dans quelques instants.');
      return;
    }
    setAppleAuthLoading(true);
    localStorage.setItem(PENDING_LOGIN_ROLE_KEY, JSON.stringify(loginRole));
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: getAuthRedirectUrl(), skipBrowserRedirect: true },
      });
      if (error) {
        localStorage.removeItem(PENDING_LOGIN_ROLE_KEY);
        setAppleAuthLoading(false);
        notify(friendlyAuthError(error.message));
        return;
      }
      if (!data?.url) {
        localStorage.removeItem(PENDING_LOGIN_ROLE_KEY);
        setAppleAuthLoading(false);
        notify('Apple n’a pas renvoyé de page de connexion. Réessayez.');
        return;
      }
      await openExternalAuth(data.url);
    } catch {
      localStorage.removeItem(PENDING_LOGIN_ROLE_KEY);
      setAppleAuthLoading(false);
      notify('La connexion avec Apple est temporairement indisponible.');
    }
  };

  const handlePasswordReset = async () => {
    const email = loginEmail.trim();
    if (!email) {
      notify('Saisissez d’abord votre adresse e-mail.');
      return;
    }
    if (!hasSupabaseConfig || !supabase || isOffline) {
      notify('La récupération du mot de passe est temporairement indisponible.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: getWebUrlForPath('/profil') });
    if (error) {
      notify(friendlyEmailAuthError(error.message));
      return;
    }
    notify('E-mail de réinitialisation envoyé. Vérifiez votre boîte de réception.');
  };

  const handleLogout"""
s, count = apple_pattern.subn(apple_replacement, s, count=1)
if count != 1:
    raise SystemExit('apple patch failed')

login_pattern = re.compile(r"function LoginScreen\([\s\S]*?\n}\n\n(?=function RecruiterScreen)", re.M)
login_replacement = r'''function LoginScreen({ authMode, setAuthMode, loginRole, setLoginRole, loginEmail, setLoginEmail, loginPassword, setLoginPassword, profile, setProfile, handleAuth, handleGoogleSignIn, handleAppleSignIn, handlePasswordReset, googleAuthLoading, appleAuthLoading, googleAuthEnabled, serviceStatus, networkStatus, setScreen, notify }) {
  const isSignup = authMode === 'signup';
  const [showPassword, setShowPassword] = useState(false);
  const notifyInvalid = useInvalidNotice(notify, isSignup ? 'Complétez votre prénom, votre nom, votre e-mail et votre mot de passe.' : 'Renseignez votre adresse e-mail et votre mot de passe pour continuer.');
  const isRecruiterLogin = loginRole === 'recruteur';
  const authStatusText = serviceStatus === 'checking' ? 'Vérification du service en cours. Réessayez dans quelques secondes.' : 'Connexion temporairement indisponible. Réessayez un peu plus tard.';
  const switchMode = (mode) => { setAuthMode(mode); setLoginPassword(''); };

  return (
    <div className="mx-auto w-full max-w-md space-y-6 px-1 pb-8 pt-1">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => setScreen('home')} className="flex min-h-11 items-center gap-3 rounded-xl pr-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-600">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500 text-xl font-black text-white shadow-sm">N</span>
          <span><span className="block text-xl font-black tracking-tight text-slate-950">Nzela <span className="text-blue-600">Jobs</span></span><span className="block text-xs font-medium text-slate-500">L'emploi au Congo, plus simple.</span></span>
        </button>
        <span className="text-sm font-semibold text-slate-600">Français</span>
      </div>
      <div>
        <h1 className="text-[2rem] font-black tracking-tight text-slate-950">{isSignup ? 'Créer votre compte' : 'Bienvenue'}</h1>
        <p className="mt-2 text-base font-medium leading-7 text-slate-500">{isSignup ? (isRecruiterLogin ? 'Créez votre espace recruteur et commencez à publier vos offres.' : 'Créez votre espace candidat pour postuler et suivre vos candidatures.') : 'Connectez-vous pour accéder à votre espace et gérer vos opportunités.'}</p>
      </div>
      <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <button type="button" onClick={() => setLoginRole('candidat')} className={classNames('min-h-[5.2rem] px-3 py-3 text-base font-black transition-colors', !isRecruiterLogin ? 'bg-blue-50 text-blue-700 ring-2 ring-inset ring-blue-600' : 'text-slate-600')}><span className="block">Candidat</span><span className="mt-1 block text-xs font-medium">Je cherche un emploi</span></button>
        <button type="button" onClick={() => setLoginRole('recruteur')} className={classNames('min-h-[5.2rem] px-3 py-3 text-base font-black transition-colors', isRecruiterLogin ? 'bg-blue-50 text-blue-700 ring-2 ring-inset ring-blue-600' : 'text-slate-600')}><span className="block">Recruteur</span><span className="mt-1 block text-xs font-medium">Je recrute des talents</span></button>
      </div>
      {serviceStatus !== 'online' && <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-800">{authStatusText}</p>}
      {networkStatus === 'offline' && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold leading-5 text-red-800">Pas de connexion Internet.</p>}
      <div className="grid grid-cols-2 border-b border-slate-200">
        <button type="button" onClick={() => switchMode('signin')} className={classNames('min-h-12 border-b-[3px] text-sm font-black', !isSignup ? 'border-blue-600 text-slate-950' : 'border-transparent text-slate-400')}>Se connecter</button>
        <button type="button" onClick={() => switchMode('signup')} className={classNames('min-h-12 border-b-[3px] text-sm font-black', isSignup ? 'border-blue-600 text-slate-950' : 'border-transparent text-slate-400')}>Créer un compte</button>
      </div>
      <div className="space-y-3">
        <button type="button" onClick={handleGoogleSignIn} disabled={!googleAuthEnabled || googleAuthLoading || networkStatus === 'offline'} aria-busy={googleAuthLoading} className="flex min-h-14 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"><GoogleMark /> {googleAuthLoading ? 'Redirection vers Google…' : 'Continuer avec Google'}</button>
        <button type="button" onClick={handleAppleSignIn} disabled={appleAuthLoading || networkStatus === 'offline' || serviceStatus !== 'online'} aria-busy={appleAuthLoading} className="flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"><span aria-hidden="true" className="text-xl leading-none"></span> {appleAuthLoading ? 'Ouverture d’Apple…' : 'Continuer avec Apple'}</button>
      </div>
      <div className="flex items-center gap-3" aria-hidden="true"><span className="h-px flex-1 bg-slate-200" /><span className="text-xs font-bold text-slate-400">ou</span><span className="h-px flex-1 bg-slate-200" /></div>
      <form onSubmit={handleAuth} onInvalidCapture={notifyInvalid} className="space-y-4">
        {isSignup && <div className="grid grid-cols-2 gap-3"><TextField label="Prénom" value={profile.prenom} onChange={(prenom) => setProfile({ ...profile, prenom })} required /><TextField label="Nom" value={profile.nom} onChange={(nom) => setProfile({ ...profile, nom })} required /></div>}
        <TextField label="Adresse e-mail" type="email" value={loginEmail} onChange={setLoginEmail} required placeholder="votre@email.com" />
        <PasswordField label="Mot de passe" value={loginPassword} onChange={setLoginPassword} required placeholder="Minimum 6 caractères" visible={showPassword} onToggle={() => setShowPassword((visible) => !visible)} />
        {!isSignup && <div className="-mt-2 text-right"><button type="button" onClick={handlePasswordReset} className="min-h-10 text-sm font-semibold text-blue-600 hover:text-blue-800">Mot de passe oublié ?</button></div>}
        <button type="submit" className="flex min-h-14 w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 px-5 text-base font-black text-white shadow-lg shadow-blue-200 transition hover:from-blue-800 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600">{isSignup ? `Créer mon compte ${isRecruiterLogin ? 'recruteur' : 'candidat'}` : `Se connecter comme ${isRecruiterLogin ? 'recruteur' : 'candidat'}`}</button>
      </form>
      <p className="text-center text-xs font-medium leading-5 text-slate-500">{isSignup ? 'Votre profil est créé une seule fois et reste lié à votre compte.' : 'Vos données sont sécurisées et confidentielles.'}</p>
    </div>
  );
}
'''
s, count = login_pattern.subn(login_replacement + '\n', s, count=1)
if count != 1:
    raise SystemExit('LoginScreen patch failed')

s = s.replace('handleAppleSignIn={handleAppleSignIn}', 'handleAppleSignIn={handleAppleSignIn}\n            handlePasswordReset={handlePasswordReset}')
s = s.replace('googleAuthLoading={googleAuthLoading}', 'googleAuthLoading={googleAuthLoading}\n            appleAuthLoading={appleAuthLoading}')
s = s.replace('loginPassword={loginPassword}\n            setLoginPassword={setLoginPassword}', 'loginPassword={loginPassword}\n            setLoginPassword={setLoginPassword}\n            profile={profile}\n            setProfile={setProfile}')

p.write_text(s)
