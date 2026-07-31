import { useEffect } from 'react';
import { hasSupabaseConfig, supabase } from './lib/supabase';

function readCurrentContext() {
  const heading = document.querySelector('main h1')?.textContent?.replace(/\s+/g, ' ').trim();
  if (heading) return heading;
  return window.location.pathname || 'Navigation';
}

export default function PlatformPresenceTracker() {
  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) return undefined;

    let activeUser = null;
    let timer = null;
    let stopped = false;

    const touch = async (visible = document.visibilityState === 'visible') => {
      if (!activeUser || stopped) return;
      await supabase.rpc('touch_user_presence', {
        p_context: readCurrentContext(),
        p_is_visible: visible,
      });
    };

    const restart = (session) => {
      activeUser = session?.user || null;
      if (timer) window.clearInterval(timer);
      timer = null;
      if (!activeUser) return;
      touch();
      timer = window.setInterval(() => touch(), 25000);
    };

    supabase.auth.getSession().then(({ data }) => restart(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => restart(session));

    const onVisibility = () => touch(document.visibilityState === 'visible');
    const onFocus = () => touch(true);
    const onPageHide = () => touch(false);

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    window.addEventListener('pagehide', onPageHide);

    return () => {
      stopped = true;
      if (timer) window.clearInterval(timer);
      authListener.subscription.unsubscribe();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, []);

  return null;
}
