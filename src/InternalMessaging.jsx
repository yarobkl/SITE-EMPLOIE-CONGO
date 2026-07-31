import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Building2, MessageSquare, Search, Send, User, X } from 'lucide-react';
import { hasSupabaseConfig, supabase } from './lib/supabase';

function formatMessageTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function initials(value) {
  return (value || 'Nzela Jobs')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function InternalMessaging() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const selectedThread = threads.find((thread) => thread.id === selectedThreadId) || null;

  const unreadCount = useMemo(
    () => threads.reduce((total, thread) => total + (thread.unreadCount || 0), 0),
    [threads],
  );

  const filteredThreads = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return threads;
    return threads.filter((thread) =>
      [thread.company_name, thread.candidate_name, thread.job_title, thread.last_message_preview]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [query, threads]);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) return undefined;

    supabase.auth.getUser().then(({ data }) => setUser(data.user || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (!session?.user) {
        setOpen(false);
        setThreads([]);
        setMessages([]);
        setSelectedThreadId('');
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const loadThreads = useCallback(async () => {
    if (!user || !supabase) return;

    const { data, error: threadError } = await supabase
      .from('message_threads')
      .select('id,application_id,job_id,company_id,candidate_id,recruiter_id,candidate_name,company_name,job_title,last_message_preview,last_sender_id,last_message_at,created_at')
      .order('last_message_at', { ascending: false });

    if (threadError) {
      setError('La messagerie est momentanément indisponible.');
      return;
    }

    const rows = data || [];
    const enriched = await Promise.all(rows.map(async (thread) => {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('thread_id', thread.id)
        .neq('sender_id', user.id)
        .is('read_at', null);
      return { ...thread, unreadCount: count || 0 };
    }));

    setThreads(enriched);
    if (!selectedThreadId && enriched.length) setSelectedThreadId(enriched[0].id);
  }, [selectedThreadId, user]);

  const loadApplications = useCallback(async () => {
    if (!user || !supabase) return;
    const { data } = await supabase
      .from('applications')
      .select('id,job_id,candidate_id,nom,email,created_at,jobs(id,title,company_id,companies(id,name,owner_id))')
      .order('created_at', { ascending: false });
    setApplications((data || []).filter((application) => {
      const company = application.jobs?.companies;
      return application.candidate_id === user.id || company?.owner_id === user.id;
    }));
  }, [user]);

  const loadMessages = useCallback(async (threadId) => {
    if (!threadId || !user || !supabase) return;

    const { data, error: messageError } = await supabase
      .from('messages')
      .select('id,thread_id,sender_id,body,read_at,created_at')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (messageError) {
      setError('Impossible de charger cette conversation.');
      return;
    }

    setMessages(data || []);
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('thread_id', threadId)
      .neq('sender_id', user.id)
      .is('read_at', null);
    loadThreads();
  }, [loadThreads, user]);

  useEffect(() => {
    if (!open || !user) return undefined;
    setLoading(true);
    Promise.all([loadThreads(), loadApplications()]).finally(() => setLoading(false));
    const timer = window.setInterval(() => {
      loadThreads();
      if (selectedThreadId) loadMessages(selectedThreadId);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [loadApplications, loadMessages, loadThreads, open, selectedThreadId, user]);

  useEffect(() => {
    if (open && selectedThreadId) loadMessages(selectedThreadId);
  }, [loadMessages, open, selectedThreadId]);

  useEffect(() => {
    const handleOpen = () => {
      if (!user) {
        window.alert('Connectez-vous pour accéder à vos messages.');
        return;
      }
      setOpen(true);
    };

    const installDesktopButton = () => {
      const nav = document.querySelector('header nav[aria-label="Navigation principale"]');
      if (!nav || nav.querySelector('[data-nzela-messages]')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.nzelaMessages = 'true';
      button.className = 'header-link relative';
      button.textContent = 'Messages';
      button.addEventListener('click', handleOpen);
      nav.appendChild(button);
    };

    const installMobileButton = () => {
      const headerActions = document.querySelector('header > div > div:last-child');
      if (!headerActions || headerActions.querySelector('[data-nzela-messages-mobile]')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.nzelaMessagesMobile = 'true';
      button.className = 'relative inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600';
      button.setAttribute('aria-label', 'Messages');
      button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>';
      button.addEventListener('click', handleOpen);
      headerActions.insertBefore(button, headerActions.firstChild);
    };

    const refreshBadges = () => {
      document.querySelectorAll('[data-nzela-message-badge]').forEach((node) => node.remove());
      if (!unreadCount) return;
      document.querySelectorAll('[data-nzela-messages], [data-nzela-messages-mobile]').forEach((button) => {
        const badge = document.createElement('span');
        badge.dataset.nzelaMessageBadge = 'true';
        badge.className = 'absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-blue-700 px-1 text-[10px] font-bold text-white ring-2 ring-white';
        badge.textContent = unreadCount > 9 ? '9+' : String(unreadCount);
        button.appendChild(badge);
      });
    };

    const install = () => {
      installDesktopButton();
      installMobileButton();
      refreshBadges();
    };

    install();
    const observer = new MutationObserver(install);
    observer.observe(document.getElementById('root'), { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [unreadCount, user]);

  const startConversation = async (application) => {
    if (!user || !supabase) return;
    const company = application.jobs?.companies;
    if (!application.candidate_id || !company?.owner_id) {
      setError('Cette candidature ne permet pas encore la messagerie interne.');
      return;
    }

    const payload = {
      application_id: application.id,
      job_id: application.job_id,
      company_id: company.id,
      candidate_id: application.candidate_id,
      recruiter_id: company.owner_id,
      candidate_name: application.nom || application.email || 'Candidat',
      company_name: company.name || 'Entreprise',
      job_title: application.jobs?.title || 'Offre d’emploi',
      last_message_at: new Date().toISOString(),
    };

    const { data, error: createError } = await supabase
      .from('message_threads')
      .upsert(payload, { onConflict: 'application_id' })
      .select()
      .single();

    if (createError) {
      setError('Impossible d’ouvrir cette conversation.');
      return;
    }

    await loadThreads();
    setSelectedThreadId(data.id);
    setMessages([]);
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !selectedThread || !user || !supabase || sending) return;

    setSending(true);
    setError('');
    const now = new Date().toISOString();
    const { error: sendError } = await supabase.from('messages').insert({
      thread_id: selectedThread.id,
      sender_id: user.id,
      body,
    });

    if (!sendError) {
      await supabase
        .from('message_threads')
        .update({
          last_message_preview: body.slice(0, 180),
          last_sender_id: user.id,
          last_message_at: now,
          updated_at: now,
        })
        .eq('id', selectedThread.id);
      setDraft('');
      await Promise.all([loadMessages(selectedThread.id), loadThreads()]);
    } else {
      setError('Le message n’a pas pu être envoyé.');
    }
    setSending(false);
  };

  if (!open) return null;

  const roleIsRecruiter = selectedThread?.recruiter_id === user?.id;
  const partnerName = selectedThread
    ? (roleIsRecruiter ? selectedThread.candidate_name : selectedThread.company_name)
    : '';

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/40 p-0 backdrop-blur-sm md:p-6" role="dialog" aria-modal="true" aria-label="Messagerie Nzela Jobs">
      <div className="mx-auto flex h-full max-w-[1380px] overflow-hidden bg-white shadow-2xl md:h-[calc(100vh-3rem)] md:rounded-2xl md:border md:border-slate-200">
        <aside className={`${selectedThread ? 'hidden md:flex' : 'flex'} w-full flex-col border-r border-slate-200 md:w-[390px]`}>
          <div className="border-b border-slate-200 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Nzela Jobs</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">Messages</h2>
              </div>
              <button onClick={() => setOpen(false)} className="secondary-icon-button" aria-label="Fermer"><X size={20} /></button>
            </div>
            <label className="mt-4 flex min-h-11 items-center gap-3 rounded-lg border border-slate-300 px-3 focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-600">
              <Search size={18} className="text-slate-500" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une conversation" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            </label>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && <p className="p-5 text-sm text-slate-500">Chargement des conversations…</p>}
            {!loading && filteredThreads.map((thread) => {
              const recruiterView = thread.recruiter_id === user?.id;
              const name = recruiterView ? thread.candidate_name : thread.company_name;
              return (
                <button key={thread.id} onClick={() => setSelectedThreadId(thread.id)} className={`flex w-full gap-3 border-b border-slate-100 p-4 text-left transition hover:bg-slate-50 ${selectedThreadId === thread.id ? 'bg-blue-50' : 'bg-white'}`}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-sm font-bold text-white">{initials(name)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <strong className="truncate text-sm text-slate-950">{name}</strong>
                      <span className="shrink-0 text-[11px] text-slate-500">{formatMessageTime(thread.last_message_at)}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs font-semibold text-slate-600">{thread.job_title}</span>
                    <span className="mt-1 flex items-center justify-between gap-2">
                      <span className="truncate text-sm text-slate-500">{thread.last_message_preview || 'Conversation prête'}</span>
                      {thread.unreadCount > 0 && <span className="flex min-h-5 min-w-5 items-center justify-center rounded-full bg-blue-700 px-1 text-[10px] font-bold text-white">{thread.unreadCount}</span>}
                    </span>
                  </span>
                </button>
              );
            })}

            {!loading && threads.length === 0 && (
              <div className="p-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <MessageSquare size={22} className="text-blue-700" />
                  <h3 className="mt-3 font-bold text-slate-950">Aucune conversation</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Démarrez un échange depuis une candidature liée à votre compte.</p>
                </div>
                <div className="mt-5 space-y-2">
                  {applications.map((application) => (
                    <button key={application.id} onClick={() => startConversation(application)} className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50">
                      <span className="block text-sm font-bold text-slate-950">{application.jobs?.title || 'Offre d’emploi'}</span>
                      <span className="mt-1 block text-sm text-slate-600">{application.jobs?.companies?.name || application.nom || 'Candidature'}</span>
                      <span className="mt-3 inline-flex text-sm font-bold text-blue-700">Ouvrir la conversation</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        <section className={`${selectedThread ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col bg-slate-50`}>
          {selectedThread ? (
            <>
              <header className="flex min-h-[82px] items-center gap-3 border-b border-slate-200 bg-white px-4 md:px-6">
                <button onClick={() => setSelectedThreadId('')} className="secondary-icon-button md:hidden" aria-label="Retour"><ArrowLeft size={20} /></button>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-700 font-bold text-white">{initials(partnerName)}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-bold text-slate-950">{partnerName}</h3>
                  <p className="truncate text-sm text-slate-500">{selectedThread.job_title} · {selectedThread.company_name}</p>
                </div>
                <button onClick={() => setOpen(false)} className="secondary-icon-button hidden md:inline-flex" aria-label="Fermer"><X size={20} /></button>
              </header>

              <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
                <div className="mx-auto max-w-3xl space-y-4">
                  <div className="mx-auto max-w-xl rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
                    <p className="text-sm font-semibold text-slate-700">Conversation liée à la candidature pour <strong>{selectedThread.job_title}</strong>.</p>
                  </div>
                  {messages.map((message) => {
                    const mine = message.sender_id === user?.id;
                    return (
                      <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm ${mine ? 'rounded-br-md bg-blue-700 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'}`}>
                          <p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                          <p className={`mt-1 text-right text-[10px] ${mine ? 'text-blue-100' : 'text-slate-400'}`}>{formatMessageTime(message.created_at)}{mine && message.read_at ? ' · Lu' : ''}</p>
                        </div>
                      </div>
                    );
                  })}
                  {messages.length === 0 && <p className="py-12 text-center text-sm text-slate-500">Écrivez le premier message de cette conversation.</p>}
                </div>
              </div>

              <form onSubmit={sendMessage} className="border-t border-slate-200 bg-white p-3 md:p-5">
                <div className="mx-auto flex max-w-3xl items-end gap-2">
                  <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={1} maxLength={4000} placeholder="Écrire un message…" className="min-h-12 max-h-36 flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-600" />
                  <button type="submit" disabled={!draft.trim() || sending} className="primary-button h-12 w-12 shrink-0 px-0" aria-label="Envoyer"><Send size={19} /></button>
                </div>
                {error && <p className="mx-auto mt-2 max-w-3xl text-sm font-semibold text-red-600">{error}</p>}
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center">
              <div className="max-w-sm">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><MessageSquare size={28} /></span>
                <h3 className="mt-4 text-xl font-bold text-slate-950">Vos échanges de recrutement</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Sélectionnez une conversation pour discuter avec le candidat ou l’entreprise.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
