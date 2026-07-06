import { hasSupabaseConfig, supabase } from './lib/supabase';

function textOf(node) {
  return (node?.textContent || '').trim();
}

function getApplyForm() {
  const title = Array.from(document.querySelectorAll('h1')).find((node) => textOf(node) === 'Postuler');
  if (!title) return null;
  return Array.from(document.querySelectorAll('form')).find((form) => textOf(form).includes('CV PDF')) || null;
}

function showMessage(form, message, tone = 'blue') {
  let box = form.querySelector('[data-nzela-apply-message]');
  if (!box) {
    box = document.createElement('div');
    box.dataset.nzelaApplyMessage = 'true';
    box.style.borderRadius = '14px';
    box.style.padding = '12px';
    box.style.fontSize = '13px';
    box.style.fontWeight = '850';
    box.style.lineHeight = '1.5';
    form.insertBefore(box, form.firstChild);
  }
  box.style.border = tone === 'red' ? '1px solid #fecaca' : '1px solid #bfdbfe';
  box.style.background = tone === 'red' ? '#fef2f2' : '#eff6ff';
  box.style.color = tone === 'red' ? '#991b1b' : '#0f3b77';
  box.textContent = message;
}

function parseJobTitle() {
  const header = Array.from(document.querySelectorAll('h1')).find((node) => textOf(node) === 'Postuler');
  const subtitle = textOf(header?.parentElement?.querySelector('p'));
  const parts = subtitle.split(' - ');
  return { role: parts[0] || '', company: parts.slice(1).join(' - ') || '' };
}

function makeRef() {
  return `NZJ-CAND-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
}

async function findJobId(role, company) {
  if (!hasSupabaseConfig || !supabase || !role) return null;
  try {
    const { data } = await supabase
      .from('jobs')
      .select('id,title,companies(name)')
      .eq('title', role)
      .limit(10);
    const match = (data || []).find((row) => (row.companies?.name || '').toLowerCase() === company.toLowerCase()) || data?.[0];
    return match?.id || null;
  } catch {
    return null;
  }
}

async function uploadCv(file, userId, ref) {
  if (!hasSupabaseConfig || !supabase || !file) return '';
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'cv.pdf';
  const folder = userId || 'public';
  const path = `${folder}/${ref}-${safeName}`;
  const { error } = await supabase.storage.from('cvs').upload(path, file, { contentType: 'application/pdf', upsert: false });
  if (error) throw error;
  return path;
}

async function rescueSubmit(event) {
  const form = event.target.closest('form');
  if (!form || form.dataset.nzelaRescueBusy === 'true') return;
  const button = event.target.closest('button');
  if (!button || !['Envoyer et suivre', 'Envoyer rapidement'].some((label) => textOf(button).includes(label))) return;

  event.preventDefault();
  event.stopPropagation();
  form.dataset.nzelaRescueBusy = 'true';

  try {
    const nom = form.querySelector('input[type="text"]')?.value?.trim() || '';
    const email = form.querySelector('input[type="email"]')?.value?.trim() || '';
    const phone = form.querySelector('input[type="tel"]')?.value?.trim() || '';
    const message = form.querySelector('textarea')?.value?.trim() || '';
    const file = form.querySelector('input[type="file"]')?.files?.[0] || null;

    if (!nom || !email || !phone) {
      showMessage(form, 'Complete le nom, l email et le telephone avant de postuler.', 'red');
      return;
    }
    if (!file) {
      showMessage(form, 'Ajoute un CV PDF avant de postuler.', 'red');
      return;
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showMessage(form, 'Le CV doit etre un PDF.', 'red');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showMessage(form, 'Le CV doit faire moins de 2 Mo.', 'red');
      return;
    }

    showMessage(form, 'Envoi de la candidature en cours...');
    const ref = makeRef();
    const { data: userData } = hasSupabaseConfig && supabase ? await supabase.auth.getUser() : { data: null };
    const userId = userData?.user?.id || null;
    const { role, company } = parseJobTitle();
    const jobId = await findJobId(role, company);
    const cvPath = await uploadCv(file, userId, ref);

    if (hasSupabaseConfig && supabase && jobId) {
      const { error } = await supabase.from('applications').insert({
        job_id: jobId,
        candidate_id: userId,
        nom,
        email,
        phone,
        message,
        cv_url: cvPath,
        cv_name: file.name,
        cv_size: file.size,
        tracking_enabled: Boolean(userId),
        application_opened: false,
        cv_opened: false,
        status: 'pending',
        tracking_number: ref,
      });
      if (error) throw error;
    }

    const items = JSON.parse(localStorage.getItem('nzela.applicationTracking') || '[]');
    localStorage.setItem('nzela.applicationTracking', JSON.stringify([{ ref, title: role || 'Candidature', email, status: 'sent', createdAt: new Date().toISOString() }, ...items].slice(0, 100)));
    showMessage(form, `Candidature envoyee. Numero de suivi: ${ref}`);
  } catch (error) {
    showMessage(form, `Envoi bloque: ${error?.message || 'erreur inconnue'}`, 'red');
  } finally {
    window.setTimeout(() => { form.dataset.nzelaRescueBusy = 'false'; }, 700);
  }
}

export function applyApplyRescuePolish() {
  const bind = () => {
    const form = getApplyForm();
    if (!form || form.dataset.nzelaRescueBound === 'true') return;
    form.dataset.nzelaRescueBound = 'true';
    form.addEventListener('click', rescueSubmit, true);
  };
  bind();
  const observer = new MutationObserver(bind);
  observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}
