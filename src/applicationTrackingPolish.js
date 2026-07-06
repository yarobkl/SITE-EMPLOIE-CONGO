import { hasSupabaseConfig, supabase } from './lib/supabase';

const STORE = 'nzela.applicationTracking';
const MAIL_STORE = 'nzela.mailQueue';
const PENDING_STORE = 'nzela.pendingTrackingSync';

function read(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value.slice(0, 100)));
}

function textOf(node) {
  return (node?.textContent || '').trim();
}

function makeRef() {
  return `NZJ-CAND-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
}

async function syncLatestApplication(item) {
  if (!hasSupabaseConfig || !supabase || !item?.ref) return;
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    let query = supabase.from('applications').select('id,tracking_number,created_at').order('created_at', { ascending: false }).limit(1);
    if (userId) query = query.eq('candidate_id', userId);
    else if (item.email) query = query.eq('email', item.email);
    else return;
    const { data } = await query;
    const latest = data?.[0];
    if (!latest?.id || latest.tracking_number) return;
    await supabase.from('applications').update({ tracking_number: item.ref }).eq('id', latest.id);
  } catch {}
}

function ensureRecentTracking() {
  const submit = Array.from(document.querySelectorAll('button')).find((button) => ['Envoyer et suivre', 'Envoyer rapidement'].some((label) => textOf(button).includes(label)));
  if (!submit || submit.dataset.nzelaTrackSubmit === 'true') return;
  submit.dataset.nzelaTrackSubmit = 'true';
  submit.addEventListener('click', () => {
    const title = Array.from(document.querySelectorAll('h1,h2,h3')).map(textOf).find((value) => value && !value.includes('Postuler')) || 'Candidature';
    const email = document.querySelector('input[type="email"]')?.value || '';
    const item = { ref: makeRef(), title, email, status: 'sent', createdAt: new Date().toISOString() };
    write(STORE, [item, ...read(STORE)]);
    localStorage.setItem(PENDING_STORE, JSON.stringify(item));
    window.setTimeout(() => syncLatestApplication(item), 1400);
    window.setTimeout(() => syncLatestApplication(item), 3200);
  });
}

function statusLabel(item) {
  if (item.status === 'cv_opened') return 'CV ouvert par le recruteur';
  if (item.status === 'application_seen') return 'Candidature vue par le recruteur';
  if (item.status === 'shortlisted') return 'Preselectionnee';
  if (item.status === 'rejected') return 'Refusee';
  return 'Candidature envoyee';
}

function addCandidateRefs() {
  const cards = Array.from(document.querySelectorAll('div.rounded-lg.border')).filter((card) => textOf(card).includes('Suivi actif') || textOf(card).includes('Candidature rapide'));
  const items = read(STORE);
  cards.forEach((card, index) => {
    if (card.querySelector('[data-nzela-tracking-ref]')) return;
    const item = items[index] || { ref: makeRef(), status: 'sent' };
    const box = document.createElement('div');
    box.dataset.nzelaTrackingRef = 'true';
    box.className = 'nzela-tracking-ref';
    box.innerHTML = `<strong>Numero de suivi: ${item.ref}</strong><span>${statusLabel(item)}</span>`;
    card.appendChild(box);
  });
}

async function syncStatusToDatabase(index, status) {
  if (!hasSupabaseConfig || !supabase) return;
  const items = read(STORE);
  const item = items[index];
  if (!item?.ref) return;
  try {
    const updates = status === 'cv_opened'
      ? { cv_opened: true, cv_opened_at: new Date().toISOString(), status: 'reviewed' }
      : { application_opened: true, application_seen_at: new Date().toISOString(), status: 'reviewed' };
    await supabase.from('applications').update(updates).eq('tracking_number', item.ref);
  } catch {}
}

function updateTracking(index, status) {
  const items = read(STORE);
  if (!items[index]) items[index] = { ref: makeRef(), status: 'sent', createdAt: new Date().toISOString() };
  items[index].status = status;
  items[index].updatedAt = new Date().toISOString();
  write(STORE, items);
  syncStatusToDatabase(index, status);
  const mail = { ref: items[index].ref, status, subject: status === 'cv_opened' ? 'Votre CV a ete ouvert' : 'Votre candidature a ete consultee', createdAt: new Date().toISOString() };
  write(MAIL_STORE, [mail, ...read(MAIL_STORE)]);
}

function bindRecruiterActions() {
  const recruiterCards = Array.from(document.querySelectorAll('article')).filter((card) => textOf(card).includes('Marquer la demande vue') || textOf(card).includes('Ouvrir le CV'));
  recruiterCards.forEach((card, index) => {
    if (!card.querySelector('[data-nzela-recruiter-ref]')) {
      const items = read(STORE);
      const item = items[index] || { ref: makeRef(), status: 'sent' };
      const box = document.createElement('div');
      box.dataset.nzelaRecruiterRef = 'true';
      box.className = 'nzela-recruiter-ref';
      box.innerHTML = `<strong>Numero candidat: ${item.ref}</strong><span>Le candidat sera notifie quand la demande ou le CV est ouvert.</span>`;
      card.appendChild(box);
    }
    Array.from(card.querySelectorAll('button')).forEach((button) => {
      const label = textOf(button);
      if (button.dataset.nzelaTrackingBound === 'true') return;
      if (label.includes('Marquer la demande vue')) {
        button.dataset.nzelaTrackingBound = 'true';
        button.addEventListener('click', () => updateTracking(index, 'application_seen'));
      }
      if (label.includes('Ouvrir le CV') || label.includes('Telecharger le CV')) {
        button.dataset.nzelaTrackingBound = 'true';
        button.addEventListener('click', () => updateTracking(index, 'cv_opened'));
      }
    });
  });
}

function addStyle() {
  if (document.getElementById('nzela-application-tracking-style')) return;
  const style = document.createElement('style');
  style.id = 'nzela-application-tracking-style';
  style.textContent = '.nzela-tracking-ref,.nzela-recruiter-ref{margin-top:12px;border:1px solid #dbeafe;border-radius:14px;background:#eff6ff;padding:12px}.nzela-tracking-ref strong,.nzela-recruiter-ref strong{display:block;color:#0f3b77;font-size:13px;font-weight:950}.nzela-tracking-ref span,.nzela-recruiter-ref span{display:block;margin-top:4px;color:#475569;font-size:12px;font-weight:750;line-height:1.45}';
  document.head.appendChild(style);
}

function runTrackingPass() {
  addStyle();
  ensureRecentTracking();
  addCandidateRefs();
  bindRecruiterActions();
  const pending = JSON.parse(localStorage.getItem(PENDING_STORE) || 'null');
  if (pending?.ref) syncLatestApplication(pending);
}

export function applyApplicationTrackingPolish() {
  const run = () => requestAnimationFrame(runTrackingPass);
  run();
  const observer = new MutationObserver(run);
  observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true, characterData: true });
  return () => observer.disconnect();
}
