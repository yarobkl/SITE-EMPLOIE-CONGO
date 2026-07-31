import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { hasSupabaseConfig, supabase } from './lib/supabase';

const PRIMARY_EMAIL = 'eliebakala@gmail.com';

export default function OfferLifecycleMobileTrigger() {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) return undefined;
    const apply = (session) => setAuthorized(session?.user?.email?.toLowerCase() === PRIMARY_EMAIL);
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => apply(session));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (!authorized) return null;

  return (
    <button
      type="button"
      data-offer-lifecycle="true"
      aria-label="Gérer la durée des offres"
      className="fixed right-4 top-[132px] z-[70] inline-flex h-11 w-11 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-800 shadow-lg md:hidden"
    >
      <CalendarDays size={19} />
    </button>
  );
}
