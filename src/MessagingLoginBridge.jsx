import { useEffect, useState } from 'react';
import { hasSupabaseConfig, supabase } from './lib/supabase';

function buttonText(button) {
  return button?.textContent?.replace(/\s+/g, ' ').trim() || '';
}

export default function MessagingLoginBridge() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) return undefined;

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setUser(data.session?.user || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const openExistingLogin = () => {
      const profileButton = document.querySelector('button[aria-label="Profil"]')
        || document.querySelector('button[aria-label="Navigation Profil"]');

      profileButton?.click();

      let attempts = 0;
      const timer = window.setInterval(() => {
        attempts += 1;
        const loginButton = Array.from(document.querySelectorAll('main button')).find((button) =>
          /^Connexion(?: candidat)?$/i.test(buttonText(button)),
        );

        if (loginButton) {
          window.clearInterval(timer);
          loginButton.click();
          return;
        }

        if (attempts >= 30) window.clearInterval(timer);
      }, 50);
    };

    const interceptUnauthenticatedMessaging = (event) => {
      const target = event.target instanceof Element
        ? event.target.closest('[data-nzela-messages], [data-nzela-messages-mobile]')
        : null;

      if (!target || user) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openExistingLogin();
    };

    document.addEventListener('click', interceptUnauthenticatedMessaging, true);
    return () => document.removeEventListener('click', interceptUnauthenticatedMessaging, true);
  }, [user]);

  return null;
}
