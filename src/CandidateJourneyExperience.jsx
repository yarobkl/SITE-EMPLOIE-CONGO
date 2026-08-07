import { useEffect } from 'react';
import { hasSupabaseConfig, supabase } from './lib/supabase';
import './candidate-journey-experience.css';

const PENDING_APPLICATION_KEY = 'nzelajobs.candidateJourney.pendingApplication';
const DRAFT_PREFIX = 'nzelajobs.candidateJourney.draft.';
const PENDING_MAX_AGE = 2 * 60 * 60 * 1000;

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function readJson(storage, key, fallback = null) {
  try {
    const value = storage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Le parcours reste fonctionnel lorsque le stockage navigateur est indisponible.
  }
}

function removeStored(storage, key) {
  try {
    storage.removeItem(key);
  } catch {
    // Rien à faire.
  }
}

function getJobId(pathname = window.location.pathname) {
  const match = pathname.match(/^\/offres\/([0-9a-f-]{36})(?:-[^/]+)?\/postuler\/?$/i);
  return match?.[1] || '';
}

function getApplyForm() {
  const main = document.querySelector('#root main') || document.querySelector('main');
  if (!(main instanceof HTMLElement)) return null;
  const heading = normalizeText(main.querySelector('h1')?.textContent);
  if (heading !== 'Postuler' && document.body.dataset.nzScreen !== 'apply') return null;
  return Array.from(main.querySelectorAll('form')).find((form) => {
    const submit = form.querySelector('button[type="submit"]');
    return submit && /envoyer/i.test(normalizeText(submit.textContent));
  }) || null;
}

function getFieldByLabel(form, expectedLabel) {
  const normalizedExpected = normalizeText(expectedLabel).toLocaleLowerCase('fr-FR');
  const labels = Array.from(form.querySelectorAll('label'));
  const label = labels.find((item) => normalizeText(item.textContent).toLocaleLowerCase('fr-FR').startsWith(normalizedExpected));
  return label?.querySelector('input, textarea') || null;
}

function setControlledValue(element, value) {
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) return;
  if (!value || element.value.trim()) return;
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  if (!setter) return;
  setter.call(element, value);
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function getDraft(form) {
  return {
    nom: getFieldByLabel(form, 'Nom complet')?.value || '',
    email: getFieldByLabel(form, 'Adresse e-mail')?.value || '',
    phone: getFieldByLabel(form, 'Téléphone')?.value || '',
    message: getFieldByLabel(form, 'Message au recruteur')?.value || '',
    updatedAt: Date.now(),
  };
}

function restoreDraft(form, jobId) {
  const draft = readJson(sessionStorage, `${DRAFT_PREFIX}${jobId}`, null);
  if (!draft) return;
  setControlledValue(getFieldByLabel(form, 'Nom complet'), draft.nom);
  setControlledValue(getFieldByLabel(form, 'Adresse e-mail'), draft.email);
  setControlledValue(getFieldByLabel(form, 'Téléphone'), draft.phone);
  setControlledValue(getFieldByLabel(form, 'Message au recruteur'), draft.message);
}

function prefillFromProfile(form) {
  const profile = readJson(localStorage, 'congoemploi.v2.profile', null);
  if (!profile) return;
  const fullName = `${profile.prenom || ''} ${profile.nom || ''}`.trim();
  setControlledValue(getFieldByLabel(form, 'Nom complet'), fullName);
  setControlledValue(getFieldByLabel(form, 'Adresse e-mail'), profile.email || '');
  setControlledValue(getFieldByLabel(form, 'Téléphone'), profile.phone || '');
}

function createStatusPanel(form) {
  const existing = form.parentElement?.querySelector('[data-nz-candidate-status]');
  if (existing instanceof HTMLElement) return existing;
  const panel = document.createElement('section');
  panel.dataset.nzCandidateStatus = 'true';
  panel.className = 'nz-candidate-status';
  panel.setAttribute('aria-live', 'polite');
  form.parentElement?.insertBefore(panel, form);
  return panel;
}

function clearStatusPanel(form) {
  form.parentElement?.querySelector('[data-nz-candidate-status]')?.remove();
}

function renderChecking(form) {
  const panel = createStatusPanel(form);
  panel.className = 'nz-candidate-status nz-candidate-status--checking';
  panel.replaceChildren();
  const title = document.createElement('strong');
  title.textContent = 'Vérification de votre candidature';
  const body = document.createElement('span');
  body.textContent = 'Nous vérifions que cette offre n’a pas déjà reçu votre candidature.';
  panel.append(title, body);
}

function navigateToTracking() {
  const button = Array.from(document.querySelectorAll('button')).find((item) => {
    const label = item.getAttribute('aria-label') || '';
    const text = normalizeText(item.textContent);
    return label === 'Navigation Suivi' || text === 'Mes candidatures';
  });
  if (button) {
    button.click();
    return;
  }
  window.history.pushState({ nzelaNavigation: true, screen: 'tracking' }, '', '/candidatures');
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function renderDuplicate(form, application) {
  const panel = createStatusPanel(form);
  panel.className = 'nz-candidate-status nz-candidate-status--duplicate';
  panel.replaceChildren();

  const content = document.createElement('div');
  const title = document.createElement('strong');
  title.textContent = 'Vous avez déjà postulé à cette offre';
  const body = document.createElement('span');
  const date = application?.created_at ? new Date(application.created_at).toLocaleDateString('fr-FR') : '';
  body.textContent = date
    ? `Candidature envoyée le ${date}. Retrouvez son avancement dans votre suivi.`
    : 'Retrouvez l’avancement de cette candidature dans votre suivi.';
  content.append(title, body);

  const action = document.createElement('button');
  action.type = 'button';
  action.className = 'nz-candidate-status__action';
  action.textContent = 'Voir le suivi';
  action.addEventListener('click', navigateToTracking, { once: true });
  panel.append(content, action);
}

function renderResumeNotice(form) {
  const panel = createStatusPanel(form);
  panel.className = 'nz-candidate-status nz-candidate-status--resume';
  panel.replaceChildren();
  const title = document.createElement('strong');
  title.textContent = 'Connexion réussie : reprenez votre candidature';
  const body = document.createElement('span');
  body.textContent = 'Vos informations ont été restaurées. Sélectionnez à nouveau votre CV avant l’envoi.';
  panel.append(title, body);
}

function setSubmitGuard(form, guarded) {
  const submit = form.querySelector('button[type="submit"]');
  if (!(submit instanceof HTMLButtonElement)) return;
  if (guarded) {
    submit.dataset.nzCandidateGuard = 'true';
    submit.disabled = true;
    submit.setAttribute('aria-disabled', 'true');
    return;
  }
  if (submit.dataset.nzCandidateGuard === 'true') {
    delete submit.dataset.nzCandidateGuard;
    submit.disabled = false;
    submit.removeAttribute('aria-disabled');
  }
}

export default function CandidateJourneyExperience() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;

    let active = true;
    let currentForm = null;
    let currentJobId = '';
    let currentApplication = null;
    let currentUser = null;
    let cleanupCurrentForm = null;
    let resumeTimer = null;

    const saveCurrentDraft = () => {
      if (!currentForm || !currentJobId) return;
      writeJson(sessionStorage, `${DRAFT_PREFIX}${currentJobId}`, getDraft(currentForm));
    };

    const checkExistingApplication = async (form, jobId) => {
      if (!hasSupabaseConfig || !supabase || !currentUser || !jobId) {
        currentApplication = null;
        setSubmitGuard(form, false);
        return;
      }

      renderChecking(form);
      setSubmitGuard(form, true);
      const { data, error } = await supabase
        .from('applications')
        .select('id,status,tracking_number,created_at')
        .eq('candidate_id', currentUser.id)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!active || form !== currentForm || jobId !== currentJobId) return;
      if (error) {
        currentApplication = null;
        clearStatusPanel(form);
        setSubmitGuard(form, false);
        return;
      }

      currentApplication = data?.[0] || null;
      if (currentApplication) {
        renderDuplicate(form, currentApplication);
        setSubmitGuard(form, true);
      } else {
        clearStatusPanel(form);
        setSubmitGuard(form, false);
      }
    };

    const installForm = () => {
      const form = getApplyForm();
      const jobId = getJobId();
      if (!form || !jobId) return;
      if (form === currentForm && jobId === currentJobId) {
        if (currentApplication) setSubmitGuard(form, true);
        return;
      }

      cleanupCurrentForm?.();
      currentForm = form;
      currentJobId = jobId;
      currentApplication = null;
      form.dataset.nzCandidateJourney = 'ready';

      restoreDraft(form, jobId);
      if (currentUser) prefillFromProfile(form);

      const pending = readJson(sessionStorage, PENDING_APPLICATION_KEY, null);
      const resumed = pending
        && pending.jobId === jobId
        && Date.now() - Number(pending.createdAt || 0) < PENDING_MAX_AGE;
      if (resumed) {
        renderResumeNotice(form);
        removeStored(sessionStorage, PENDING_APPLICATION_KEY);
      }

      const onInput = () => saveCurrentDraft();
      const onSubmitCapture = (event) => {
        saveCurrentDraft();
        if (currentApplication) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation?.();
          renderDuplicate(form, currentApplication);
          return;
        }

        const submit = form.querySelector('button[type="submit"]');
        const trackedMode = /suivre/i.test(normalizeText(submit?.textContent));
        if (trackedMode && !currentUser) {
          writeJson(sessionStorage, PENDING_APPLICATION_KEY, {
            path: window.location.pathname,
            jobId,
            createdAt: Date.now(),
          });
        }
      };

      form.addEventListener('input', onInput);
      form.addEventListener('submit', onSubmitCapture, true);
      cleanupCurrentForm = () => {
        form.removeEventListener('input', onInput);
        form.removeEventListener('submit', onSubmitCapture, true);
        setSubmitGuard(form, false);
      };

      checkExistingApplication(form, jobId);
    };

    const resumePendingApplication = () => {
      const pending = readJson(sessionStorage, PENDING_APPLICATION_KEY, null);
      if (!pending?.path || !pending?.jobId) return;
      if (Date.now() - Number(pending.createdAt || 0) >= PENDING_MAX_AGE) {
        removeStored(sessionStorage, PENDING_APPLICATION_KEY);
        return;
      }
      window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => {
        if (!active) return;
        if (window.location.pathname !== pending.path) {
          window.history.pushState({ nzelaNavigation: true, screen: 'apply', jobId: pending.jobId }, '', pending.path);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
        window.setTimeout(installForm, 250);
      }, 850);
    };

    const clearCompletedDraft = (nodes) => {
      const completed = nodes.some((node) => /candidature envoy[eé]e/i.test(normalizeText(node.textContent)));
      if (!completed || !currentJobId) return;
      removeStored(sessionStorage, `${DRAFT_PREFIX}${currentJobId}`);
      removeStored(sessionStorage, PENDING_APPLICATION_KEY);
    };

    const observer = new MutationObserver((mutations) => {
      const addedNodes = mutations.flatMap((mutation) => Array.from(mutation.addedNodes));
      clearCompletedDraft(addedNodes);
      installForm();
    });
    const root = document.getElementById('root');
    if (root) observer.observe(root, { childList: true, subtree: true });

    let authSubscription = null;
    const bootstrap = async () => {
      if (hasSupabaseConfig && supabase) {
        const { data } = await supabase.auth.getSession();
        currentUser = data.session?.user || null;
        if (currentUser) resumePendingApplication();
        const listener = supabase.auth.onAuthStateChange((_event, session) => {
          currentUser = session?.user || null;
          if (currentUser) {
            resumePendingApplication();
            if (currentForm) {
              prefillFromProfile(currentForm);
              checkExistingApplication(currentForm, currentJobId);
            }
          }
        });
        authSubscription = listener.data.subscription;
      }
      installForm();
    };

    bootstrap().catch(() => installForm());

    return () => {
      active = false;
      window.clearTimeout(resumeTimer);
      observer.disconnect();
      authSubscription?.unsubscribe();
      cleanupCurrentForm?.();
    };
  }, []);

  return null;
}
