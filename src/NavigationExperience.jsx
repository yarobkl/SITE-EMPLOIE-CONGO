import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, ClipboardList, X } from 'lucide-react';
import { hasSupabaseConfig, supabase } from './lib/supabase';
import './navigation-experience.css';

const FILTERS_KEY = 'nzelajobs.navigation.filters';
const JOBS_SCROLL_KEY = 'nzelajobs.navigation.jobsScroll';

const SCREEN_PATHS = {
  home: '/',
  jobs: '/offres',
  immobilier: '/immobilier',
  saved: '/favoris',
  tracking: '/candidatures',
  profile: '/profil',
  recruiter: '/recruteur',
  notifications: '/notifications',
  settings: '/parametres',
};

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeIdentity(value) {
  return normalizeText(value).toLocaleLowerCase('fr-FR');
}

function slugify(value) {
  return normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'offre';
}

function jobPath(job, apply = false) {
  if (!job?.id) return '/offres';
  const base = `/offres/${job.id}-${slugify(job.title)}`;
  return apply ? `${base}/postuler` : base;
}

function parseRoute(pathname = window.location.pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  const applyMatch = path.match(/^\/offres\/([0-9a-f-]{36})(?:-[^/]+)?\/postuler$/i);
  if (applyMatch) return { screen: 'apply', jobId: applyMatch[1] };
  const jobMatch = path.match(/^\/offres\/([0-9a-f-]{36})(?:-[^/]+)?$/i);
  if (jobMatch) return { screen: 'job', jobId: jobMatch[1] };
  const screen = Object.entries(SCREEN_PATHS).find(([, value]) => value === path)?.[0];
  return { screen: screen || 'home', jobId: '' };
}

function detectScreen() {
  const main = document.querySelector('.nz-platform-pane.is-active main')
    || document.querySelector('#root > div > main')
    || document.querySelector('main.soft-enter');
  if (!main) return { screen: '', main: null, title: '' };
  const title = normalizeText(main.querySelector('h1')?.textContent);
  const exact = {
    "Trouvez l’emploi qui vous correspond": 'home',
    "Offres d’emploi": 'jobs',
    'Un logement à trouver ou à publier, simplement.': 'immobilier',
    'Postuler': 'apply',
    'Offres sauvegardées': 'saved',
    'Mes candidatures': 'tracking',
    'Recruteur': 'recruiter',
    'Notifications': 'notifications',
    'Parametres': 'settings',
    'Paramètres': 'settings',
  };
  if (exact[title]) return { screen: exact[title], main, title };
  if (/^(Connexion|Inscription|Créer votre compte)/i.test(title)) return { screen: 'login', main, title };
  if (/profil/i.test(title)) return { screen: 'profile', main, title };
  if (/publier|modifier.*offre/i.test(title)) return { screen: 'post-job', main, title };
  const postuler = Array.from(main.querySelectorAll('button')).some((button) => normalizeText(button.textContent) === 'Postuler');
  if (postuler && main.querySelector('article header h1')) return { screen: 'job', main, title };
  return { screen: '', main, title };
}

function getCardIdentity(card) {
  const primaryButton = card.querySelector('button');
  const content = primaryButton?.querySelector('span.min-w-0.flex-1');
  const children = Array.from(content?.children || []);
  return {
    primaryButton,
    title: normalizeText(children[0]?.textContent),
    company: normalizeText(children[1]?.textContent),
    location: normalizeText(children[2]?.textContent).replace(/^.*?\s/, ''),
  };
}

function setControlledValue(element, value) {
  if (!element || value == null || element.value === value) return;
  const prototype = element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  setter?.call(element, value);
  element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
}

function readStoredJson(key, fallback) {
  try {
    const value = sessionStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredJson(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private browsing. Navigation still works.
  }
}

function findButton(predicate) {
  const activeScope = document.querySelector('.nz-platform-pane.is-active');
  const candidates = [
    ...Array.from(document.querySelectorAll('.nz-platform-header button, .nz-mobile-platform-nav button')),
    ...Array.from(activeScope?.querySelectorAll('button') || []),
    ...Array.from(document.querySelectorAll('button')),
  ];
  return [...new Set(candidates)].find((button) => predicate(button, normalizeText(button.textContent)));
}

function waitFor(getValue, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const tick = () => {
      const value = getValue();
      if (value) {
        resolve(value);
        return;
      }
      if (Date.now() - startedAt >= timeout) {
        reject(new Error('Navigation target unavailable'));
        return;
      }
      window.setTimeout(tick, 80);
    };
    tick();
  });
}

export default function NavigationExperience() {
  const [jobs, setJobs] = useState([]);
  const [confirmation, setConfirmation] = useState(null);
  const jobsRef = useRef([]);
  const suppressHistoryRef = useRef(false);
  const resolvingRouteRef = useRef(false);
  const restoreScrollRef = useRef(false);
  const lastScreenRef = useRef('');
  const lastSuccessRef = useRef('');
  const filtersAppliedMainRef = useRef(null);

  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  const jobsByIdentity = useMemo(() => {
    const index = new Map();
    jobs.forEach((job) => {
      const exact = [job.title, job.company, job.location].map(normalizeIdentity).join('|');
      const loose = [job.title, job.company].map(normalizeIdentity).join('|');
      index.set(exact, job);
      if (!index.has(loose)) index.set(loose, job);
    });
    return index;
  }, [jobs]);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) return undefined;
    let active = true;
    supabase
      .from('jobs')
      .select('id,title,location,status,companies(name)')
      .eq('status', 'published')
      .then(({ data }) => {
        if (!active) return;
        setJobs((data || []).map((row) => ({
          id: row.id,
          title: row.title,
          location: row.location,
          company: Array.isArray(row.companies) ? row.companies[0]?.name : row.companies?.name,
        })));
      });
    return () => {
      active = false;
    };
  }, []);

  const enhanceCards = useCallback(() => {
    document.querySelectorAll('.job-card').forEach((card) => {
      if (!(card instanceof HTMLElement)) return;
      const identity = getCardIdentity(card);
      if (!identity.primaryButton || !identity.title) return;
      const exact = [identity.title, identity.company, identity.location].map(normalizeIdentity).join('|');
      const loose = [identity.title, identity.company].map(normalizeIdentity).join('|');
      const job = jobsByIdentity.get(exact) || jobsByIdentity.get(loose);
      if (!job) return;
      card.dataset.jobId = job.id;
      card.dataset.jobTitle = job.title;
      card.dataset.jobCompany = job.company || '';
      identity.primaryButton.dataset.openJobId = job.id;
      identity.primaryButton.setAttribute('aria-label', `Ouvrir l’offre ${job.title} chez ${job.company || 'cette entreprise'}`);
    });
  }, [jobsByIdentity]);

  const saveFilters = useCallback(() => {
    const screen = detectScreen();
    if (screen.screen !== 'jobs') return;
    writeStoredJson(FILTERS_KEY, {
      query: screen.main.querySelector('input[aria-label="Métier ou mot-clé"]')?.value || '',
      city: screen.main.querySelector('select[aria-label="Ville"]')?.value || 'Toutes',
      contract: screen.main.querySelector('select[aria-label="Type de contrat"]')?.value || 'Tous',
      sort: screen.main.querySelector('select[aria-label="Trier les offres"]')?.value || 'recent',
    });
  }, []);

  const restoreFilters = useCallback((main) => {
    if (!main || filtersAppliedMainRef.current === main) return;
    filtersAppliedMainRef.current = main;
    const filters = readStoredJson(FILTERS_KEY, null);
    if (!filters) return;
    window.setTimeout(() => {
      setControlledValue(main.querySelector('input[aria-label="Métier ou mot-clé"]'), filters.query || '');
      setControlledValue(main.querySelector('select[aria-label="Ville"]'), filters.city || 'Toutes');
      setControlledValue(main.querySelector('select[aria-label="Type de contrat"]'), filters.contract || 'Tous');
      setControlledValue(main.querySelector('select[aria-label="Trier les offres"]'), filters.sort || 'recent');
    }, 30);
  }, []);

  const findJob = useCallback((jobId) => jobsRef.current.find((job) => job.id === jobId), []);

  const updateMeta = useCallback((screen, job) => {
    const title = screen === 'job' || screen === 'apply'
      ? `${job?.title || 'Offre d’emploi'} chez ${job?.company || 'une entreprise'} | Nzela Jobs`
      : screen === 'immobilier'
        ? 'Immobilier au Congo | Nzela'
      : screen === 'jobs'
        ? 'Offres d’emploi au Congo | Nzela Jobs'
        : 'Nzela Jobs - Plateforme de recrutement au Congo';
    document.title = title;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.href.split('#')[0];
  }, []);

  const pushPath = useCallback((path, state = {}, replace = false) => {
    if (window.location.pathname === path) return;
    const method = replace ? 'replaceState' : 'pushState';
    window.history[method]({ ...(window.history.state || {}), nzelaNavigation: true, ...state }, '', path);
  }, []);

  const clickWithoutHistory = useCallback(async (button) => {
    if (!button) return false;
    suppressHistoryRef.current = true;
    button.click();
    window.setTimeout(() => {
      suppressHistoryRef.current = false;
    }, 120);
    return true;
  }, []);

  const navigateToJobs = useCallback(async () => {
    const current = detectScreen().screen;
    if (current === 'jobs') return;
    const button = findButton((element, text) =>
      text === 'Trouver un emploi'
      || element.getAttribute('aria-label') === 'Navigation Offres'
      || text === 'Voir les offres',
    );
    await clickWithoutHistory(button);
    await waitFor(() => detectScreen().screen === 'jobs');
  }, [clickWithoutHistory]);

  const navigateToJob = useCallback(async (jobId) => {
    const currentRoute = parseRoute();
    if (detectScreen().screen === 'job' && currentRoute.jobId === jobId) return;
    await navigateToJobs();
    enhanceCards();
    const card = await waitFor(() => {
      enhanceCards();
      return document.querySelector(`.job-card[data-job-id="${jobId}"]`);
    });
    const primaryButton = card.querySelector('button[data-open-job-id]') || card.querySelector('button');
    await clickWithoutHistory(primaryButton);
    await waitFor(() => detectScreen().screen === 'job');
  }, [clickWithoutHistory, enhanceCards, navigateToJobs]);

  const resolveRoute = useCallback(async (route, replace = false) => {
    if (resolvingRouteRef.current) return;
    resolvingRouteRef.current = true;
    try {
      if (route.screen === 'job' || route.screen === 'apply') {
        await waitFor(() => findJob(route.jobId), 10000);
        await navigateToJob(route.jobId);
        if (route.screen === 'apply') {
          const applyButton = findButton((_element, text) => text === 'Postuler');
          await clickWithoutHistory(applyButton);
          await waitFor(() => detectScreen().screen === 'apply');
        }
        updateMeta(route.screen, findJob(route.jobId));
        return;
      }

      const selectors = {
        home: (element, text) => element.getAttribute('aria-label') === "Retour à l'accueil" || element.getAttribute('aria-label') === 'Navigation Accueil' || text === 'Accueil',
        jobs: (element, text) => text === 'Trouver un emploi' || element.getAttribute('aria-label') === 'Navigation Offres',
        immobilier: (element, text) => text === 'Immobilier' || element.getAttribute('aria-label') === 'Navigation Immobilier',
        saved: (_element, text) => text === 'Favoris',
        tracking: (element, _text) => element.getAttribute('aria-label') === 'Navigation Suivi',
        profile: (element, _text) => element.getAttribute('aria-label') === 'Profil' || element.getAttribute('aria-label') === 'Navigation Profil',
        recruiter: (element, _text) => element.getAttribute('aria-label') === 'Navigation Recruteur',
        notifications: (element, _text) => String(element.getAttribute('aria-label') || '').startsWith('Notifications'),
        settings: (element, _text) => element.getAttribute('aria-label') === 'Paramètres',
      };
      const predicate = selectors[route.screen] || selectors.home;
      const button = findButton(predicate);
      if (button) {
        await clickWithoutHistory(button);
      } else if (route.screen === 'jobs') {
        await navigateToJobs();
      }
      if (replace) pushPath(SCREEN_PATHS[route.screen] || '/', { screen: route.screen }, true);
      updateMeta(route.screen);
    } catch {
      if (route.screen === 'job' || route.screen === 'apply') {
        await navigateToJobs().catch(() => {});
        pushPath('/offres', { screen: 'jobs' }, true);
      }
    } finally {
      resolvingRouteRef.current = false;
    }
  }, [clickWithoutHistory, findJob, navigateToJob, navigateToJobs, pushPath, updateMeta]);

  const shareCurrentJob = useCallback(async (job) => {
    const url = `${window.location.origin}${jobPath(job)}`;
    const data = {
      title: `${job.title} — ${job.company}`,
      text: `${job.title} chez ${job.company}, à ${job.location}.`,
      url,
    };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(`${data.text} ${url}`);
        setConfirmation({ type: 'copied', reference: '', title: 'Lien de l’offre copié', body: 'Le lien direct est prêt à être partagé.' });
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        setConfirmation({ type: 'error', reference: '', title: 'Partage indisponible', body: 'Réessaie dans quelques instants.' });
      }
    }
  }, []);

  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return undefined;

    const sync = () => {
      enhanceCards();
      const current = detectScreen();
      if (!current.screen) return;
      document.body.dataset.nzScreen = current.screen;

      const activeMobile = document.querySelector('nav[aria-label="Navigation mobile"] button.text-blue-700');
      document.querySelectorAll('nav[aria-label="Navigation mobile"] button').forEach((button) => {
        button.classList.toggle('nz-mobile-active', button === activeMobile);
      });

      if (current.screen === 'jobs') {
        restoreFilters(current.main);
        if (restoreScrollRef.current) {
          restoreScrollRef.current = false;
          const top = Number(sessionStorage.getItem(JOBS_SCROLL_KEY) || 0);
          window.setTimeout(() => window.scrollTo({ top, behavior: 'auto' }), 100);
        }
      }

      if (current.screen === 'job') {
        const heading = normalizeText(current.main.querySelector('article header h1')?.textContent);
        const company = normalizeText(current.main.querySelector('article header p.text-blue-700')?.textContent);
        const job = jobsRef.current.find((item) => normalizeIdentity(item.title) === normalizeIdentity(heading) && normalizeIdentity(item.company) === normalizeIdentity(company));
        if (job) updateMeta('job', job);
      }

      const status = document.querySelector('[role="status"]');
      const statusText = normalizeText(status?.textContent);
      if (/^Candidature envoyee\. Reference /i.test(statusText) && statusText !== lastSuccessRef.current) {
        lastSuccessRef.current = statusText;
        const reference = statusText.replace(/^.*Reference\s+/i, '');
        setConfirmation({
          type: 'application',
          reference,
          title: 'Candidature envoyée',
          body: 'Le recruteur a reçu ton dossier. Tu peux maintenant suivre son évolution depuis ton espace.',
        });
      }

      lastScreenRef.current = current.screen;
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

    const handleFieldChange = (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) saveFilters();
    };

    const handleClick = (event) => {
      const target = event.target instanceof Element ? event.target.closest('button, a') : null;
      if (!(target instanceof HTMLElement)) return;

      // MobilePlatformShell pilote lui-même le geste, l'animation et l'URL.
      // L'ancien routeur s'exécute en capture avant React : s'il intervient ici,
      // l'adresse change alors que la rubrique visible reste encore l'ancienne.
      if (
        target.closest('.nz-mobile-platform-nav')
        || document.documentElement.dataset.nzPlatformSuppressClick === 'true'
      ) return;

      const current = detectScreen();
      const text = normalizeText(target.textContent);
      const aria = target.getAttribute('aria-label') || '';

      if (target.closest('.nz2-root')) return;

      if (aria === 'Partager cette offre' && current.screen === 'job') {
        const route = parseRoute();
        const job = findJob(route.jobId) || jobsRef.current.find((item) => normalizeIdentity(item.title) === normalizeIdentity(current.title));
        if (job) {
          event.preventDefault();
          event.stopPropagation();
          shareCurrentJob(job);
        }
        return;
      }

      if (target.dataset.openJobId && !suppressHistoryRef.current) {
        const job = findJob(target.dataset.openJobId);
        if (!job) return;
        saveFilters();
        sessionStorage.setItem(JOBS_SCROLL_KEY, String(window.scrollY));
        document.documentElement.dataset.nzNavDirection = 'forward';
        pushPath(jobPath(job), { screen: 'job', jobId: job.id });
        return;
      }

      if (current.screen === 'job' && text === 'Postuler' && !suppressHistoryRef.current) {
        const route = parseRoute();
        const job = findJob(route.jobId);
        if (job) {
          document.documentElement.dataset.nzNavDirection = 'forward';
          pushPath(jobPath(job, true), { screen: 'apply', jobId: job.id });
        }
        return;
      }

      const isJobBack = current.screen === 'job' && text === 'Retour aux offres';
      const isApplyBack = current.screen === 'apply' && text === 'Retour';
      if ((isJobBack || isApplyBack) && !suppressHistoryRef.current) {
        event.preventDefault();
        event.stopPropagation();
        document.documentElement.dataset.nzNavDirection = 'back';
        if (isJobBack) restoreScrollRef.current = true;
        if (window.history.state?.nzelaNavigation) window.history.back();
        else resolveRoute(isJobBack ? { screen: 'jobs', jobId: '' } : { screen: 'job', jobId: parseRoute().jobId });
        return;
      }

      if (suppressHistoryRef.current) return;
      const routeTarget = (() => {
        if (aria === "Retour à l'accueil" || aria === 'Navigation Accueil') return { screen: 'home', path: '/' };
        if (text === 'Trouver un emploi' || aria === 'Navigation Offres' || text === 'Rechercher' || text === 'Voir tout' || text === 'Voir les offres') return { screen: 'jobs', path: '/offres' };
        if (text === 'Immobilier' || aria === 'Navigation Immobilier') return { screen: 'immobilier', path: '/immobilier' };
        if (text === 'Favoris' || aria === 'Voir mes offres sauvegardées') return { screen: 'saved', path: '/favoris' };
        if (aria === 'Navigation Suivi') return { screen: 'tracking', path: '/candidatures' };
        if (aria === 'Profil' || aria === 'Navigation Profil') return { screen: 'profile', path: '/profil' };
        if (aria === 'Navigation Recruteur') return { screen: 'recruiter', path: '/recruteur' };
        if (aria.startsWith('Notifications')) return { screen: 'notifications', path: '/notifications' };
        if (aria === 'Paramètres') return { screen: 'settings', path: '/parametres' };
        return null;
      })();
      if (routeTarget && window.location.pathname !== routeTarget.path) {
        document.documentElement.dataset.nzNavDirection = 'forward';
        pushPath(routeTarget.path, { screen: routeTarget.screen });
      }
    };

    const handlePopState = () => {
      document.documentElement.dataset.nzNavDirection = 'back';
      const route = parseRoute();
      if (route.screen === 'jobs') restoreScrollRef.current = true;
      resolveRoute(route);
    };

    document.addEventListener('click', handleClick, true);
    document.addEventListener('input', handleFieldChange, true);
    document.addEventListener('change', handleFieldChange, true);
    window.addEventListener('popstate', handlePopState);

    const initialRoute = parseRoute();
    window.history.replaceState({ ...(window.history.state || {}), nzelaNavigation: true, ...initialRoute }, '', window.location.href);
    if (initialRoute.screen !== 'home') resolveRoute(initialRoute, true);

    return () => {
      observer.disconnect();
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('input', handleFieldChange, true);
      document.removeEventListener('change', handleFieldChange, true);
      window.removeEventListener('popstate', handlePopState);
      delete document.body.dataset.nzScreen;
      delete document.documentElement.dataset.nzNavDirection;
    };
  }, [enhanceCards, findJob, resolveRoute, restoreFilters, saveFilters, shareCurrentJob, updateMeta]);

  const openTracking = () => {
    setConfirmation(null);
    const button = findButton((element) => element.getAttribute('aria-label') === 'Navigation Suivi');
    if (button) {
      pushPath('/candidatures', { screen: 'tracking' });
      button.click();
    }
  };

  if (!confirmation) return null;

  return (
    <div className="nz-confirmation-backdrop fixed inset-0 z-[170] flex items-end justify-center bg-slate-950/35 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={confirmation.title}>
      <section className="nz-confirmation-sheet w-full max-w-md rounded-t-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:rounded-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${confirmation.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
            <CheckCircle2 size={29} />
          </span>
          <button type="button" onClick={() => setConfirmation(null)} className="secondary-icon-button" aria-label="Fermer la confirmation">
            <X size={19} />
          </button>
        </div>
        <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">{confirmation.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{confirmation.body}</p>
        {confirmation.reference && (
          <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Référence</p>
            <p className="mt-1 break-all font-mono text-sm font-bold text-blue-950">{confirmation.reference}</p>
          </div>
        )}
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {confirmation.type === 'application' && (
            <button type="button" onClick={openTracking} className="primary-button">
              <ClipboardList size={18} /> Voir mon suivi
            </button>
          )}
          <button type="button" onClick={() => setConfirmation(null)} className={confirmation.type === 'application' ? 'secondary-button' : 'primary-button sm:col-span-2'}>
            Continuer <ArrowRight size={17} />
          </button>
        </div>
      </section>
    </div>
  );
}
