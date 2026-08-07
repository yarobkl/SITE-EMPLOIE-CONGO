import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Building2, Loader2, MessageSquare, RefreshCw, Search, Send, X } from 'lucide-react';
import { hasSupabaseConfig, supabase } from './lib/supabase';

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
};

const initials = (value = 'Nzela') => String(value).split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
const textOf = (node) => node?.textContent?.replace(/\s+/g, ' ').trim() || '';
const randomId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function openMainLogin() {
  const profileButton = document.querySelector('button[aria-label="Profil"]') || document.querySelector('button[aria-label="Navigation Profil"]');
  profileButton?.click();
  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    const button = Array.from(document.querySelectorAll('main button')).find((item) => /^Connexion(?: candidat)?$/i.test(textOf(item)));
    if (button) { window.clearInterval(timer); button.click(); }
    if (attempts >= 40) window.clearInterval(timer);
  }, 50);
}

function contextLabel(thread) {
  return thread?.context_type === 'property' ? 'Immobilier' : 'Emploi';
}

export default function MessagingCenterV2() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const selectedIdRef = useRef('');

  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
  const selected = threads.find((thread) => thread.id === selectedId) || null;
  const unreadCount = threads.reduce((sum, thread) => sum + Number(thread.unread_count || 0), 0);

  const visibleThreads = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('fr-FR');
    if (!normalized) return threads;
    return threads.filter((thread) => [thread.company_name, thread.candidate_name, thread.job_title, thread.last_message_preview, contextLabel(thread)]
      .filter(Boolean).some((value) => String(value).toLocaleLowerCase('fr-FR').includes(normalized)));
  }, [query, threads]);

  const loadThreads = useCallback(async () => {
    if (!supabase || !user) return [];
    const { data, error: rpcError } = await supabase.rpc('get_my_message_threads');
    if (rpcError) { setError('Impossible de charger votre messagerie.'); return []; }
    const rows = data || [];
    setThreads(rows);
    setSelectedId((current) => rows.some((item) => item.id === current) ? current : rows[0]?.id || '');
    return rows;
  }, [user]);

  const loadApplications = useCallback(async () => {
    if (!supabase || !user) return;
    const { data } = await supabase.from('applications')
      .select('id,job_id,candidate_id,nom,created_at,jobs(id,title,company_id,companies(id,name,owner_id))')
      .order('created_at', { ascending: false }).limit(80);
    setApplications((data || []).filter((item) => item.candidate_id === user.id || item.jobs?.companies?.owner_id === user.id));
  }, [user]);

  const loadMessages = useCallback(async (threadId = selectedIdRef.current) => {
    if (!supabase || !user || !threadId) { setMessages([]); return; }
    const { data, error: messageError } = await supabase.from('messages')
      .select('id,thread_id,sender_id,body,read_at,created_at,client_id,property_inquiry_id')
      .eq('thread_id', threadId).order('created_at', { ascending: true });
    if (messageError) { setError('Impossible de charger cette conversation.'); return; }
    setMessages(data || []);
    const { error: readError } = await supabase.rpc('mark_message_thread_read', { p_thread_id: threadId });
    if (!readError) setThreads((current) => current.map((thread) => thread.id === threadId ? { ...thread, unread_count: 0 } : thread));
  }, [user]);

  const refreshAll = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    setError('');
    await Promise.all([loadThreads(), loadApplications()]);
    if (selectedIdRef.current) await loadMessages(selectedIdRef.current);
    setRefreshing(false);
  }, [loadApplications, loadMessages, loadThreads, user]);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) return undefined;
    let active = true;
    supabase.auth.getSession().then(({ data }) => { if (active) setUser(data.session?.user || null); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user || null;
      setUser(next);
      if (!next) { setOpen(false); setThreads([]); setMessages([]); setApplications([]); setSelectedId(''); }
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    Promise.all([loadThreads(), loadApplications()]).finally(() => setLoading(false));
  }, [loadApplications, loadThreads, open, user]);

  useEffect(() => {
    if (open && user && selectedId) loadMessages(selectedId);
  }, [loadMessages, open, selectedId, user]);

  useEffect(() => {
    if (!open || !user || !supabase) return undefined;
    const channel = supabase.channel(`nzela-messages-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        const row = payload.new || payload.old || {};
        loadThreads();
        if (row.thread_id && row.thread_id === selectedIdRef.current) loadMessages(row.thread_id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_threads' }, () => loadThreads())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'property_inquiries' }, () => loadThreads())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadMessages, loadThreads, open, user]);

  useEffect(() => {
    if (!open || !user) return undefined;
    const timer = window.setInterval(() => {
      loadThreads();
      if (selectedIdRef.current) loadMessages(selectedIdRef.current);
    }, 30000);
    return () => window.clearInterval(timer);
  }, [loadMessages, loadThreads, open, user]);

  useEffect(() => {
    const installButtons = () => {
      const nav = document.querySelector('header nav[aria-label="Navigation principale"]');
      if (nav && !nav.querySelector('[data-nzela-messages-v2]')) {
        nav.querySelectorAll('[data-nzela-messages]').forEach((node) => node.remove());
        const button = document.createElement('button');
        button.type = 'button'; button.dataset.nzelaMessagesV2 = 'true'; button.className = 'header-link relative'; button.textContent = 'Messages';
        nav.appendChild(button);
      }
      const actions = document.querySelector('header > div > div:last-child');
      if (actions && !actions.querySelector('[data-nzela-messages-mobile-v2]')) {
        actions.querySelectorAll('[data-nzela-messages-mobile]').forEach((node) => node.remove());
        const button = document.createElement('button');
        button.type = 'button'; button.dataset.nzelaMessagesMobileV2 = 'true';
        button.className = 'relative inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600';
        button.setAttribute('aria-label', 'Messages');
        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>';
        actions.insertBefore(button, actions.firstChild);
      }
    };
    const onClick = async (event) => {
      const trigger = event.target instanceof Element ? event.target.closest('[data-nzela-messages-v2],[data-nzela-messages-mobile-v2]') : null;
      if (!trigger) return;
      event.preventDefault(); event.stopPropagation();
      if (!supabase) return openMainLogin();
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) return openMainLogin();
      setUser(data.session.user); setOpen(true);
    };
    installButtons();
    const root = document.getElementById('root');
    const observer = new MutationObserver(installButtons);
    if (root) observer.observe(root, { childList: true, subtree: true });
    document.addEventListener('click', onClick, true);
    return () => { observer.disconnect(); document.removeEventListener('click', onClick, true); };
  }, []);

  useEffect(() => {
    document.querySelectorAll('[data-nzela-messages-v2],[data-nzela-messages-mobile-v2]').forEach((button) => {
      let badge = button.querySelector('[data-message-badge-v2]');
      if (!unreadCount) { badge?.remove(); return; }
      if (!badge) {
        badge = document.createElement('span'); badge.dataset.messageBadgeV2 = 'true';
        badge.className = 'absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-blue-700 px-1 text-[10px] font-bold text-white ring-2 ring-white';
        button.appendChild(badge);
      }
      badge.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
    });
  }, [unreadCount]);

  async function startConversation(application) {
    if (!supabase || !user) return;
    setError(''); setSending(true);
    const { data, error: rpcError } = await supabase.rpc('get_or_create_message_thread', { p_application_id: application.id });
    setSending(false);
    if (rpcError || !data?.id) { setError('Impossible d’ouvrir cette conversation.'); return; }
    await loadThreads(); setSelectedId(data.id); await loadMessages(data.id);
  }

  async function sendMessage(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !selectedId || sending || !supabase) return;
    setSending(true); setError('');
    const clientId = randomId();
    const optimistic = { id: `pending-${clientId}`, client_id: clientId, thread_id: selectedId, sender_id: user.id, body, created_at: new Date().toISOString(), pending: true };
    setMessages((current) => [...current, optimistic]); setDraft('');
    const { error: rpcError } = await supabase.rpc('send_message', { p_thread_id: selectedId, p_body: body, p_client_id: clientId });
    if (rpcError) {
      setMessages((current) => current.filter((item) => item.id !== optimistic.id));
      setDraft(body); setError('Le message n’a pas pu être envoyé. Réessayez.');
    } else {
      await Promise.all([loadMessages(selectedId), loadThreads()]);
    }
    setSending(false);
  }

  if (!open || !user) return null;

  const recruiterView = selected?.recruiter_id === user.id;
  const partner = selected ? (recruiterView ? selected.candidate_name : selected.company_name) : '';
  const applicationsWithoutThread = applications.filter((application) => !threads.some((thread) => thread.application_id === application.id)).slice(0, 12);

  return (
    <div className="fixed inset-0 z-[240] bg-slate-950/45 backdrop-blur-sm md:p-6" role="dialog" aria-modal="true" aria-label="Messagerie Nzela">
      <div className="mx-auto flex h-full max-w-[1380px] overflow-hidden bg-white shadow-2xl md:h-[calc(100vh-3rem)] md:rounded-2xl md:border md:border-slate-200">
        <aside className={`${selected ? 'hidden md:flex' : 'flex'} w-full flex-col border-r border-slate-200 md:w-[390px]`}>
          <div className="border-b border-slate-200 p-5">
            <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Nzela</p><h2 className="mt-1 text-2xl font-bold text-slate-950">Messages</h2></div><div className="flex gap-2"><button type="button" onClick={refreshAll} disabled={refreshing} className="secondary-icon-button" aria-label="Actualiser">{refreshing ? <Loader2 size={19} className="animate-spin" /> : <RefreshCw size={19} />}</button><button type="button" onClick={() => setOpen(false)} className="secondary-icon-button" aria-label="Fermer"><X size={20} /></button></div></div>
            <label className="mt-4 flex min-h-11 items-center gap-3 rounded-lg border border-slate-300 px-3 focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-100"><Search size={18} className="text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une conversation" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
          </div>
          {error && <p className="mx-4 mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
          <div className="flex-1 overflow-y-auto">
            {loading && <p className="p-5 text-sm text-slate-500">Chargement des conversations…</p>}
            {!loading && visibleThreads.map((thread) => {
              const name = thread.recruiter_id === user.id ? thread.candidate_name : thread.company_name;
              return <button key={thread.id} type="button" onClick={() => setSelectedId(thread.id)} className={`flex w-full gap-3 border-b border-slate-100 p-4 text-left hover:bg-slate-50 ${selectedId === thread.id ? 'bg-blue-50' : 'bg-white'}`}>
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white ${thread.context_type === 'property' ? 'bg-emerald-600' : 'bg-blue-700'}`}>{thread.context_type === 'property' ? <Building2 size={20} /> : initials(name)}</span>
                <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><strong className="truncate text-sm text-slate-950">{name || 'Conversation'}</strong><small className="shrink-0 text-slate-500">{formatDate(thread.last_message_at)}</small></span><span className="block truncate text-xs font-semibold text-slate-600">{contextLabel(thread)} · {thread.job_title}</span><span className="mt-1 flex items-center justify-between gap-2"><span className="truncate text-sm text-slate-500">{thread.last_message_preview || 'Aucun message'}</span>{Number(thread.unread_count || 0) > 0 && <span className="rounded-full bg-blue-700 px-2 py-0.5 text-[10px] font-bold text-white">{thread.unread_count}</span>}</span></span>
              </button>;
            })}
            {!loading && !visibleThreads.length && <div className="p-7 text-center"><MessageSquare className="mx-auto text-slate-400" size={32} /><h3 className="mt-3 font-bold text-slate-950">Aucune conversation</h3><p className="mt-1 text-sm leading-6 text-slate-500">Les échanges emploi et immobilier apparaîtront ici.</p></div>}
            {applicationsWithoutThread.length > 0 && <div className="border-t border-slate-200 p-4"><p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Candidatures sans conversation</p>{applicationsWithoutThread.map((application) => <button key={application.id} type="button" onClick={() => startConversation(application)} disabled={sending} className="mb-2 w-full rounded-xl border border-slate-200 p-3 text-left hover:border-blue-300 hover:bg-blue-50"><strong className="block truncate text-sm text-slate-900">{application.jobs?.title || 'Offre'}</strong><span className="text-xs text-slate-500">{application.jobs?.companies?.name || application.nom || 'Ouvrir la conversation'}</span></button>)}</div>}
          </div>
        </aside>

        <main className={`${selected ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col`}>
          {!selected ? <div className="flex flex-1 items-center justify-center p-8 text-center"><div><MessageSquare className="mx-auto text-blue-700" size={36} /><h3 className="mt-4 text-xl font-bold">Sélectionnez une conversation</h3></div></div> : <>
            <header className="flex min-h-[76px] items-center gap-3 border-b border-slate-200 px-4 md:px-6"><button type="button" onClick={() => setSelectedId('')} className="secondary-icon-button md:hidden" aria-label="Retour"><ArrowLeft size={20} /></button><span className={`flex h-11 w-11 items-center justify-center rounded-lg font-bold text-white ${selected.context_type === 'property' ? 'bg-emerald-600' : 'bg-blue-700'}`}>{selected.context_type === 'property' ? <Building2 size={20} /> : initials(partner)}</span><div className="min-w-0"><strong className="block truncate text-slate-950">{partner || 'Conversation'}</strong><span className="block truncate text-xs font-semibold text-slate-500">{contextLabel(selected)} · {selected.job_title}</span></div></header>
            <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">{messages.length ? <div className="mx-auto flex max-w-3xl flex-col gap-3">{messages.map((message) => { const mine = message.sender_id === user.id; return <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-sm ${mine ? 'rounded-br-md bg-blue-700 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'} ${message.pending ? 'opacity-60' : ''}`}><p className="whitespace-pre-wrap break-words">{message.body}</p><small className={`mt-1 block text-[10px] ${mine ? 'text-blue-100' : 'text-slate-400'}`}>{message.pending ? 'Envoi…' : formatDate(message.created_at)}</small></div></div>; })}</div> : <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">Écrivez le premier message de cette conversation.</div>}</div>
            <form onSubmit={sendMessage} className="border-t border-slate-200 bg-white p-3 md:p-4"><div className="mx-auto flex max-w-3xl items-end gap-2"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} rows={1} maxLength={4000} placeholder="Écrivez votre message…" className="max-h-36 min-h-11 flex-1 resize-none rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /><button type="submit" disabled={sending || !draft.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white disabled:opacity-50" aria-label="Envoyer">{sending ? <Loader2 size={19} className="animate-spin" /> : <Send size={19} />}</button></div></form>
          </>}
        </main>
      </div>
    </div>
  );
}
