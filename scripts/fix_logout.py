from pathlib import Path

p = Path('src/App.jsx')
s = p.read_text()
old = """  const handleLogout = async () => {
    if (hasSupabaseConfig && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(PENDING_LOGIN_ROLE_KEY);
    setAuthUser(null);
    setProfile(initialProfile);
    setApplications([]);
    setSavedIds([]);
    setNotifications([]);
    setScreen('home');
    notify('Déconnexion réussie.');
  };"""
new = """  const handleLogout = async () => {
    localStorage.removeItem(PENDING_LOGIN_ROLE_KEY);
    setAuthUser(null);
    setProfile(initialProfile);
    setApplications([]);
    setSavedIds([]);
    setNotifications([]);
    setLoginEmail('');
    setLoginPassword('');
    setAuthMode('signin');
    setLoginRole('candidat');
    setGoogleAuthLoading(false);
    setAppleAuthLoading(false);
    setScreen('home');
    window.history.replaceState({}, document.title, '/');
    window.scrollTo({ top: 0, behavior: 'auto' });
    notify('Déconnexion réussie.');

    if (hasSupabaseConfig && supabase) {
      try {
        const { error } = await supabase.auth.signOut({ scope: 'local' });
        if (error) throw error;
      } catch {
        // L’interface est déjà déconnectée : la prochaine initialisation Auth
        // vérifiera de nouveau la session au lieu de bloquer le bouton.
      }
    }
  };"""
if old not in s:
    raise SystemExit('logout block not found')
p.write_text(s.replace(old, new, 1))
