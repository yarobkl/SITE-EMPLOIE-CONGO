import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Bookmark,
  Briefcase,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Download,
  Edit3,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  Home,
  LayoutDashboard,
  ListFilter,
  LogOut,
  MapPin,
  PlusCircle,
  Search,
  Send,
  Share2,
  Settings,
  ShieldCheck,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { hasSupabaseConfig, supabase } from './lib/supabase';

const initialJobs = [];

const CONGO_CITIES = [
  'Brazzaville',
  'Pointe-Noire',
  'Dolisie',
  'Nkayi',
  'Ouesso',
  'Owando',
  'Oyo',
  'Impfondo',
  'Madingou',
  'Sibiti',
  'Kinkala',
  'Djambala',
  'Gamboma',
  'Mossendjo',
];

const CONTRACT_TYPES = ['CDI', 'CDD', 'Stage', 'Freelance', 'Hybride'];

const initialProfile = {
  nom: '',
  prenom: '',
  email: '',
  phone: '',
  city: 'Brazzaville',
  role: 'candidat',
  title: '',
  avatarDataUrl: '',
};

function useInvalidNotice(notify, message) {
  const lastNoticeRef = useRef(0);
  return () => {
    const now = Date.now();
    if (now - lastNoticeRef.current < 1200) return;
    lastNoticeRef.current = now;
    notify(message);
  };
}

const MAX_CV_BYTES = 2 * 1024 * 1024;
const MAX_CV_LABEL = '2 Mo';
const PENDING_LOGIN_ROLE_KEY = 'congoemploi.pendingLoginRole';

const emptyApplication = {
  nom: '',
  email: '',
  phone: '',
  message: '',
  mode: 'tracked',
  cvName: '',
  cvSize: 0,
  cvType: '',
  cvFile: null,
};
const emptyJob = { role: '', company: '', loc: 'Brazzaville', type: 'CDI', salary: '', sector: '', description: '' };

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function useStoredState(key, fallback) {
  const [value, setValue] = useState(() => readStorage(key, fallback));
  const setStoredValue = (nextValue) => {
    setValue((current) => {
      const resolved = typeof nextValue === 'function' ? nextValue(current) : nextValue;
      localStorage.setItem(key, JSON.stringify(resolved));
      return resolved;
    });
  };
  return [value, setStoredValue];
}

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function getAuthRedirectUrl() {
  return window.location.origin;
}

function getOAuthErrorFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return params.get('error_description') || params.get('error') || hashParams.get('error_description') || hashParams.get('error') || '';
}

function cleanAuthParamsFromUrl() {
  const url = new URL(window.location.href);
  const hadSearchAuthParams = ['error', 'error_description', 'code'].some((key) => url.searchParams.has(key));
  const hadHashAuthParams = /access_token|refresh_token|error|code/.test(url.hash);
  if (!hadSearchAuthParams && !hadHashAuthParams) return;
  url.searchParams.delete('error');
  url.searchParams.delete('error_description');
  url.searchParams.delete('code');
  url.hash = '';
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}`);
}

function friendlyAuthError(message) {
  if (!message) return 'Connexion interrompue. Reessaie dans quelques instants.';
  const lower = message.toLowerCase();
  if (lower.includes('redirect') || lower.includes('callback')) {
    return 'Connexion mal configuree. Verifie les URLs autorisees dans Supabase.';
  }
  if (lower.includes('provider') || lower.includes('disabled')) {
    return 'Connexion externe non activee pour le moment.';
  }
  return 'Connexion interrompue. Reessaie avec ton email.';
}

function friendlyEmailAuthError(message) {
  const lower = (message || '').toLowerCase();
  if (lower.includes('invalid login') || lower.includes('invalid credentials')) {
    return 'Email ou mot de passe incorrect.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirme ton email avant de te connecter.';
  }
  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return 'Un compte existe deja avec cet email.';
  }
  if (lower.includes('password')) {
    return 'Mot de passe invalide. Utilise au moins 6 caracteres.';
  }
  return 'Connexion impossible pour le moment. Reessaie dans quelques instants.';
}

function getInitials(profile) {
  const letters = [profile.prenom, profile.nom]
    .filter(Boolean)
    .map((value) => value.trim().charAt(0))
    .join('');
  return (letters || profile.email?.charAt(0) || 'U').slice(0, 2).toUpperCase();
}

function getVisitorKey() {
  const storageKey = 'congoemploi.v2.visitorKey';
  const existing = localStorage.getItem(storageKey);
  if (existing) return existing;
  const next = crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(storageKey, next);
  return next;
}

function isSupabaseId(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function createTrackingNumber() {
  const year = new Date().getFullYear();
  const randomPart = crypto?.randomUUID
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 6)
    : Math.random().toString(36).slice(2, 8);
  return `NZJ-CAND-${year}-${randomPart.toUpperCase()}`;
}

function formatRelativeDate(value) {
  if (!value) return 'Récemment publiée';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Récemment publiée';
  const elapsedDays = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
  if (elapsedDays === 0) return "Publiée aujourd'hui";
  if (elapsedDays === 1) return 'Publiée il y a 1 jour';
  return `Publiée il y a ${elapsedDays} jours`;
}

function getApplicationStatus(application) {
  if (application.cvOpened) return { label: 'CV consulté', tone: 'success' };
  if (application.applicationOpened || application.status === 'reviewed') {
    return { label: "En cours d'étude", tone: 'success' };
  }
  return { label: 'Candidature envoyée', tone: 'neutral' };
}

function normalizeJob(row) {
  return {
    id: row.id,
    companyId: row.company_id,
    company: row.companies?.name || row.company || 'Entreprise',
    role: row.title || row.role,
    loc: row.location || row.loc,
    type: row.contract_type || row.type,
    salary: row.salary_range || row.salary,
    sector: row.sector || 'General',
    description: row.description,
    requirements: row.requirements?.length ? row.requirements : ['Experience pertinente', 'Disponibilite', 'Motivation'],
    status: row.status || 'published',
    createdAt: row.created_at,
  };
}

function normalizeApplication(row) {
  return {
    id: row.id,
    jobId: row.job_id,
    jobRole: row.jobs?.title || 'Offre',
    company: row.jobs?.companies?.name || 'Entreprise',
    status: row.status,
    trackingEnabled: row.tracking_enabled,
    applicationOpened: row.application_opened,
    cvOpened: row.cv_opened,
    applicationSeenAt: row.application_seen_at,
    cvOpenedAt: row.cv_opened_at,
    trackingNumber: row.tracking_number,
    createdAt: row.created_at,
    cvPath: row.cv_url,
    cvName: row.cv_name,
    cvSize: row.cv_size,
    candidateId: row.candidate_id,
    nom: row.nom,
    email: row.email,
    phone: row.phone,
    message: row.message || '',
  };
}

function normalizeNotification(row) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    read: row.read,
    createdAt: row.created_at,
  };
}

function normalizeBoostRequest(row) {
  return {
    id: row.id,
    jobId: row.job_id,
    companyId: row.company_id,
    recruiterId: row.recruiter_id,
    plan: row.plan,
    message: row.message || '',
    status: row.status,
    createdAt: row.created_at,
    jobTitle: row.jobs?.title || 'Offre',
    company: row.jobs?.companies?.name || row.companies?.name || 'Entreprise',
  };
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [selectedJob, setSelectedJob] = useState(null);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('Toutes');
  const [contract, setContract] = useState('Tous');
  const [sortOrder, setSortOrder] = useState('recent');
  const [toast, setToast] = useState('');
  const [authMode, setAuthMode] = useState('signin');
  const [loginRole, setLoginRole] = useState('candidat');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(hasSupabaseConfig);
  const [serviceStatus, setServiceStatus] = useState(hasSupabaseConfig ? 'checking' : 'offline');
  const [applicationForm, setApplicationForm] = useState(emptyApplication);
  const [jobForm, setJobForm] = useState(emptyJob);
  const [editingJob, setEditingJob] = useState(null);
  const [applicationSubmitting, setApplicationSubmitting] = useState(false);

  const [jobs, setJobs] = useStoredState('nzelajobs.v3.jobs', initialJobs);
  const [profile, setProfile] = useStoredState('congoemploi.v2.profile', initialProfile);
  const [savedIds, setSavedIds] = useStoredState('congoemploi.v2.savedIds', []);
  const [applications, setApplications] = useStoredState('congoemploi.v2.applications', []);
  const [recruiterJobs, setRecruiterJobs] = useState([]);
  const [recruiterApplications, setRecruiterApplications] = useState([]);
  const [recruiterJobStats, setRecruiterJobStats] = useState({});
  const [boostRequests, setBoostRequests] = useState([]);
  const [notifications, setNotifications] = useStoredState('congoemploi.v2.notifications', [
    { id: 1, title: 'Bienvenue sur Nzela Jobs', body: 'Votre espace emploi est prêt.', read: false },
  ]);
  const isLoggedIn = Boolean(authUser);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) return;
    let cancelled = false;
    async function loadJobs() {
      const { data, error } = await supabase
        .from('jobs')
        .select('id,company_id,title,description,location,contract_type,salary_range,sector,requirements,status,created_at,companies(name)')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (error) {
        setServiceStatus('degraded');
        return;
      }
      setServiceStatus('online');
      setJobs((data || []).map(normalizeJob));
    }
    loadJobs();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setAuthLoading(false);
      return undefined;
    }

    let active = true;

    async function bootstrapAuth() {
      const oauthError = getOAuthErrorFromUrl();
      if (oauthError) {
        setToast(friendlyAuthError(oauthError));
        window.setTimeout(() => setToast(''), 3200);
      }
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      cleanAuthParamsFromUrl();
      if (error) {
        setToast('Session expiree. Reconnecte-toi pour continuer.');
        window.setTimeout(() => setToast(''), 3200);
      }
      setAuthUser(data.session?.user || null);
      setAuthLoading(false);
    }

    bootstrapAuth();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user || null);
      setAuthLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase || !authUser) return;
    let cancelled = false;

    async function loadUserData() {
      const pendingRole = readStorage(PENDING_LOGIN_ROLE_KEY, '');
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('nom,prenom,email,phone,city,role,title')
        .eq('id', authUser.id)
        .maybeSingle();
      let effectiveRole = profileRow?.role || 'candidat';

      if (!cancelled) {
        if (profileRow) {
          localStorage.removeItem(PENDING_LOGIN_ROLE_KEY);
          setProfile((current) => ({ ...current, ...profileRow, email: profileRow.email || authUser.email || current.email }));
          if (screen === 'login') {
            setScreen(profileRow.role === 'recruteur' ? 'recruiter' : 'profile');
          }
        } else {
          const metadata = authUser.user_metadata || {};
          const displayName = metadata.full_name || metadata.name || '';
          const [firstName = '', ...lastNameParts] = displayName.split(' ').filter(Boolean);
          const nextProfile = {
            id: authUser.id,
            email: authUser.email,
            role: metadata.role || pendingRole || 'candidat',
            prenom: metadata.prenom || firstName,
            nom: metadata.nom || lastNameParts.join(' '),
            phone: '',
            city: 'Brazzaville',
            title: '',
          };
          effectiveRole = nextProfile.role;
          await supabase.from('profiles').upsert(nextProfile);
          localStorage.removeItem(PENDING_LOGIN_ROLE_KEY);
          setProfile((current) => ({ ...current, ...nextProfile }));
          if (screen === 'login') {
            setScreen(nextProfile.role === 'recruteur' ? 'recruiter' : 'profile');
          }
        }
      }

      const { data: userApplications } = await supabase
        .from('applications')
        .select('id,job_id,candidate_id,nom,email,phone,message,cv_url,cv_name,cv_size,tracking_enabled,tracking_number,application_opened,application_seen_at,cv_opened,cv_opened_at,status,created_at,jobs(title,companies(name))')
        .order('created_at', { ascending: false });

      if (!cancelled && userApplications) {
        setApplications(userApplications.map(normalizeApplication));
      }

      const { data: userSaved } = await supabase
        .from('saved_jobs')
        .select('job_id')
        .order('created_at', { ascending: false });

      if (!cancelled && userSaved) {
        setSavedIds(userSaved.map((item) => item.job_id));
      }

      const { data: userNotifications } = await supabase
        .from('notifications')
        .select('id,title,body,read,created_at')
        .order('created_at', { ascending: false });

      if (!cancelled && userNotifications) {
        setNotifications(userNotifications.map(normalizeNotification));
      }

      const { data: ownedCompanies } = await supabase
        .from('companies')
        .select('id,name')
        .eq('owner_id', authUser.id);
      const companyIds = ownedCompanies?.map((company) => company.id) || [];
      if (effectiveRole === 'admin') {
        const { data: adminBoostRequests } = await supabase
          .from('boost_requests')
          .select('id,job_id,company_id,recruiter_id,plan,message,status,created_at,jobs(title,companies(name)),companies(name)')
          .order('created_at', { ascending: false });
        if (!cancelled && adminBoostRequests) setBoostRequests(adminBoostRequests.map(normalizeBoostRequest));
      } else if (companyIds.length) {
        const { data: ownBoostRequests } = await supabase
          .from('boost_requests')
          .select('id,job_id,company_id,recruiter_id,plan,message,status,created_at,jobs(title,companies(name)),companies(name)')
          .in('company_id', companyIds)
          .order('created_at', { ascending: false });
        if (!cancelled && ownBoostRequests) setBoostRequests(ownBoostRequests.map(normalizeBoostRequest));
      } else if (!cancelled) {
        setBoostRequests([]);
      }
      if (!companyIds.length) {
        if (!cancelled) {
          setRecruiterJobs([]);
          setRecruiterApplications([]);
        }
        return;
      }

      const { data: ownedJobs } = await supabase
        .from('jobs')
        .select('id,company_id,title,description,location,contract_type,salary_range,sector,requirements,status,created_at,companies(name)')
        .in('company_id', companyIds)
        .order('created_at', { ascending: false });
      const normalizedOwnedJobs = ownedJobs?.map(normalizeJob) || [];
      const ownedJobIds = normalizedOwnedJobs.map((job) => job.id);

      if (!cancelled) {
        setRecruiterJobs(normalizedOwnedJobs);
      }

      if (!ownedJobIds.length) {
        if (!cancelled) {
          setRecruiterApplications([]);
          setRecruiterJobStats({});
        }
        return;
      }

      const { data: receivedApplications } = await supabase
        .from('applications')
        .select('id,job_id,candidate_id,nom,email,phone,message,cv_url,cv_name,cv_size,tracking_enabled,tracking_number,application_opened,application_seen_at,cv_opened,cv_opened_at,status,created_at,jobs(title,companies(name))')
        .in('job_id', ownedJobIds)
        .order('created_at', { ascending: false });

      if (!cancelled && receivedApplications) {
        setRecruiterApplications(receivedApplications.map(normalizeApplication));
      }

      const nextStats = Object.fromEntries(ownedJobIds.map((id) => [id, { views: 0, saves: 0 }]));
      const [{ data: viewRows }, { data: saveRows }] = await Promise.all([
        supabase.from('job_views').select('job_id').in('job_id', ownedJobIds),
        supabase.from('saved_jobs').select('job_id').in('job_id', ownedJobIds),
      ]);
      viewRows?.forEach((row) => {
        if (nextStats[row.job_id]) nextStats[row.job_id].views += 1;
      });
      saveRows?.forEach((row) => {
        if (nextStats[row.job_id]) nextStats[row.job_id].saves += 1;
      });
      if (!cancelled) setRecruiterJobStats(nextStats);
    }

    loadUserData();
    return () => {
      cancelled = true;
    };
  }, [authUser?.id]);

  const publishedJobs = jobs.filter((job) => job.status === 'published');
  const hasPublishedOffer = recruiterJobs.length > 0;
  const filteredJobs = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = publishedJobs.filter((job) => {
      const matchesQuery = !needle || [job.role, job.company, job.sector]
        .some((value) => (value || '').toLowerCase().includes(needle));
      const matchesCity = city === 'Toutes' || job.loc === city;
      const matchesContract = contract === 'Tous' || job.type === contract;
      return matchesQuery && matchesCity && matchesContract;
    });
    return [...matches].sort((left, right) => {
      if (sortOrder === 'title') return left.role.localeCompare(right.role, 'fr');
      if (sortOrder === 'company') return left.company.localeCompare(right.company, 'fr');
      return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
    });
  }, [publishedJobs, query, city, contract, sortOrder]);

  const savedJobs = publishedJobs.filter((job) => savedIds.includes(job.id));
  const unreadCount = notifications.filter((item) => !item.read).length;
  const activeJob = selectedJob || filteredJobs[0];

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const openLogin = (role = 'candidat', mode = 'signin') => {
    setLoginRole(role);
    setAuthMode(mode);
    setScreen('login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openJob = (job, nextScreen = 'job') => {
    setSelectedJob(job);
    setScreen(nextScreen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (nextScreen === 'job' && hasSupabaseConfig && supabase && typeof job.id === 'string') {
      supabase.from('job_views').upsert({
        job_id: job.id,
        viewer_id: authUser?.id || null,
        session_key: getVisitorKey(),
      }, { onConflict: 'job_id,session_key' });
    }
  };

  const clearSearch = () => {
    setQuery('');
    setCity('Toutes');
    setContract('Tous');
    setSortOrder('recent');
  };

  const toggleSave = async (job) => {
    const exists = savedIds.includes(job.id);
    setSavedIds((current) => {
      return exists ? current.filter((id) => id !== job.id) : [...current, job.id];
    });
    if (hasSupabaseConfig && supabase && authUser) {
      if (exists) {
        await supabase.from('saved_jobs').delete().eq('job_id', job.id);
      } else {
        await supabase.from('saved_jobs').insert({ job_id: job.id, candidate_id: authUser.id });
      }
    }
    notify(exists ? 'Offre retiree des favoris' : 'Offre sauvegardee');
  };

  const handleAuth = async (event) => {
    event.preventDefault();
    if (!hasSupabaseConfig || !supabase) {
      notify('Connexion indisponible pour le moment.');
      return;
    }
    if (serviceStatus !== 'online') {
      notify(serviceStatus === 'checking' ? 'Verification du service en cours. Reessaie dans quelques secondes.' : 'Connexion temporairement indisponible. La production doit etre rebranchee.');
      return;
    }
    if (loginPassword.length < 6) {
      notify('Mot de passe: 6 caracteres minimum.');
      return;
    }

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: loginEmail,
          password: loginPassword,
          options: {
            data: {
              role: loginRole,
              nom: profile.nom,
              prenom: profile.prenom,
            },
          },
        });
        if (error) {
          notify(friendlyEmailAuthError(error.message));
          return;
        }
        if (data.user) {
          const nextProfile = {
            id: data.user.id,
            email: data.user.email,
            role: loginRole,
            nom: profile.nom,
            prenom: profile.prenom,
            phone: profile.phone,
            city: profile.city,
            title: profile.title,
          };
          await supabase.from('profiles').upsert({
            ...nextProfile,
          });
          setProfile((current) => ({ ...current, ...nextProfile }));
        }
        setLoginPassword('');
        setScreen(loginRole === 'recruteur' ? 'recruiter' : 'profile');
        notify(data.session ? 'Compte cree et connecte' : 'Compte cree. Verifie ton email pour te connecter.');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) {
        notify(friendlyEmailAuthError(error.message));
        return;
      }
      const { data: signedProfile } = await supabase
        .from('profiles')
        .select('nom,prenom,email,phone,city,role,title')
        .eq('id', data.user.id)
        .maybeSingle();
      const signedRole = signedProfile?.role || data.user.user_metadata?.role || 'candidat';
      if (loginRole === 'recruteur' && signedRole !== 'recruteur') {
        notify('Ce compte est candidat. Utilise un compte recruteur ou change le type dans ton profil.');
        setProfile((current) => ({ ...current, ...(signedProfile || {}), email: data.user.email || current.email }));
        setScreen('profile');
        return;
      }
      setAuthUser(data.user);
      setProfile((current) => ({ ...current, ...(signedProfile || {}), email: data.user.email || signedProfile?.email || current.email }));
      setLoginEmail('');
      setLoginPassword('');
      setScreen(loginRole === 'recruteur' ? 'recruiter' : 'profile');
      notify('Connexion reussie');
    } catch {
      setServiceStatus('degraded');
      notify('Connexion temporairement indisponible. Reessaie apres verification du service.');
    }
  };

  const handleLogout = async () => {
    if (hasSupabaseConfig && supabase) {
      await supabase.auth.signOut();
    }
    setAuthUser(null);
    setProfile(initialProfile);
    setApplications([]);
    setSavedIds([]);
    setNotifications([]);
    setScreen('home');
    notify('Deconnexion reussie');
  };

  const submitApplication = async (event) => {
    event.preventDefault();
    if (applicationSubmitting) return;
    if (!activeJob) {
      notify('Selectionne une offre avant de postuler.');
      setScreen('jobs');
      return;
    }
    if (!applicationForm.cvName) {
      notify(`Ajoute un CV PDF de ${MAX_CV_LABEL} maximum.`);
      return;
    }
    if (applicationForm.mode === 'tracked' && !isLoggedIn) {
      notify('Connecte-toi pour suivre cette candidature.');
      openLogin('candidat');
      return;
    }
    if (hasSupabaseConfig && !isSupabaseId(activeJob.id)) {
      notify("Cette offre n'est pas encore synchronisee. Recharge les offres puis reessaie.");
      setScreen('jobs');
      return;
    }
    const trackingEnabled = applicationForm.mode === 'tracked' && isLoggedIn;
    const trackingNumber = createTrackingNumber();
    let cvPath = '';
    setApplicationSubmitting(true);
    notify('Envoi de la candidature en cours...');
    try {
    if (hasSupabaseConfig && supabase && applicationForm.cvFile) {
      const safeName = applicationForm.cvName
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const cvOwnerFolder = trackingEnabled && authUser ? authUser.id : 'public';
      const filePath = `${cvOwnerFolder}/${Date.now()}-${safeName || 'cv.pdf'}`;
      const { error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(filePath, applicationForm.cvFile, {
          contentType: 'application/pdf',
          upsert: false,
        });
      if (!uploadError) {
        cvPath = filePath;
      } else {
        notify("Le CV n'a pas pu etre envoye. Reessaie avant d'envoyer la candidature.");
        setApplicationSubmitting(false);
        return;
      }
    }
    const { cvFile, ...applicationValues } = applicationForm;
    const baseApplication = {
      id: Date.now(),
      jobId: activeJob.id,
      jobRole: activeJob.role,
      company: activeJob.company,
      status: 'pending',
      trackingEnabled,
      applicationOpened: false,
      cvOpened: false,
      applicationSeenAt: null,
      cvOpenedAt: null,
      trackingNumber,
      createdAt: new Date().toISOString(),
      cvPath,
      ...applicationValues,
      nom: applicationForm.nom || `${profile.prenom} ${profile.nom}`.trim(),
      email: applicationForm.email || profile.email,
      phone: applicationForm.phone || profile.phone,
    };
    let application = baseApplication;
    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('applications').insert({
        job_id: activeJob.id,
        candidate_id: trackingEnabled && authUser ? authUser.id : null,
        nom: baseApplication.nom,
        email: baseApplication.email,
        phone: baseApplication.phone,
        message: baseApplication.message,
        cv_url: cvPath,
        cv_name: baseApplication.cvName,
        cv_size: baseApplication.cvSize || 0,
        tracking_enabled: baseApplication.trackingEnabled,
        tracking_number: trackingNumber,
        application_opened: false,
        cv_opened: false,
        status: 'pending',
      })
        .select('id,job_id,candidate_id,nom,email,phone,message,cv_url,cv_name,cv_size,tracking_enabled,tracking_number,application_opened,application_seen_at,cv_opened,cv_opened_at,status,created_at,jobs(title,companies(name))')
        .single();
      if (error) {
        setApplicationSubmitting(false);
        notify(`Candidature non envoyee: ${error.message || 'base indisponible'}`);
        return;
      }
      application = normalizeApplication(data);
    }
    setApplications((current) => [application, ...current]);
    const nextNotification = {
      id: Date.now(),
      title: trackingEnabled ? 'Candidature suivie envoyee' : 'Candidature rapide envoyee',
      body: trackingEnabled ? `${activeJob.role}: suivi ${trackingNumber} actif.` : `${activeJob.role}: CV recu, reference ${trackingNumber}.`,
      read: false,
    };
    setNotifications((current) => [nextNotification, ...current]);
    if (trackingEnabled && hasSupabaseConfig && supabase && authUser) {
      await supabase.from('notifications').insert({
        user_id: authUser.id,
        title: nextNotification.title,
        body: nextNotification.body,
        read: false,
      });
    }
    setApplicationForm(emptyApplication);
    setScreen('profile');
    notify(`Candidature envoyee. Suivi ${trackingNumber}`);
    } catch (error) {
      notify(`Candidature non envoyee: ${error?.message || 'service indisponible'}`);
    } finally {
      setApplicationSubmitting(false);
    }
  };

  const openCvFile = async (application, mode = 'open') => {
    if (!application?.cvPath) {
      notify('Aucun fichier CV disponible pour cette candidature.');
      return false;
    }
    if (!hasSupabaseConfig || !supabase) {
      notify('Service de fichiers indisponible pour le moment.');
      return false;
    }

    const cvWindow = mode === 'open' ? window.open('about:blank', '_blank') : null;
    if (cvWindow) cvWindow.opener = null;
    const signedUrlOptions = mode === 'download' ? { download: application.cvName || 'cv.pdf' } : undefined;
    const { data, error } = await supabase.storage.from('cvs').createSignedUrl(application.cvPath, 60 * 5, signedUrlOptions);
    if (error || !data?.signedUrl) {
      cvWindow?.close();
      notify('CV indisponible pour le moment.');
      return false;
    }

    if (mode === 'download') {
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = application.cvName || 'cv.pdf';
      link.target = '_blank';
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
      notify('Telechargement du CV lance.');
      return true;
    }

    if (cvWindow) {
      cvWindow.location.href = data.signedUrl;
    } else {
      window.location.href = data.signedUrl;
    }
    return true;
  };

  const markApplicationActivity = async (applicationId, field, shouldOpenCv = false) => {
    const currentApplication = [...recruiterApplications, ...applications].find((item) => item.id === applicationId);
    if (!currentApplication) return;

    if (shouldOpenCv) {
      notify('Ouverture du CV en cours...');
      const opened = await openCvFile(currentApplication, 'open');
      if (!opened) return;
    }

    const wasAlreadyOpened = Boolean(currentApplication[field]);
    const timestampField = field === 'cvOpened' ? 'cvOpenedAt' : 'applicationSeenAt';
    const dbTimestampField = field === 'cvOpened' ? 'cv_opened_at' : 'application_seen_at';
    const dbBooleanField = field === 'cvOpened' ? 'cv_opened' : 'application_opened';
    const openedAt = new Date().toISOString();
    const changedApplication = wasAlreadyOpened
      ? currentApplication
      : { ...currentApplication, [field]: true, [timestampField]: openedAt, status: 'reviewed' };
    const updateItem = (item) => {
      if (item.id !== applicationId) return item;
      return item[field] ? item : { ...item, [field]: true, [timestampField]: openedAt, status: 'reviewed' };
    };
    setApplications((current) => current.map(updateItem));
    setRecruiterApplications((current) => current.map(updateItem));

    if (!wasAlreadyOpened && hasSupabaseConfig && supabase && typeof applicationId === 'string') {
      await supabase
        .from('applications')
        .update({
          [dbBooleanField]: true,
          [dbTimestampField]: openedAt,
          status: 'reviewed',
        })
        .eq('id', applicationId);
    }

    if (changedApplication.trackingEnabled && !wasAlreadyOpened) {
      const title = field === 'cvOpened' ? 'CV ouvert' : 'Demande consultee';
      const body = `${changedApplication.company} a ${field === 'cvOpened' ? 'ouvert ton CV' : 'ouvert ta candidature'}.`;
      setNotifications((current) => [{ id: Date.now(), title, body, read: false }, ...current]);
      if (hasSupabaseConfig && supabase && changedApplication.candidateId) {
        await supabase.from('notifications').insert({
          user_id: changedApplication.candidateId,
          title,
          body,
          read: false,
        });
      }
      notify(title);
    } else if (!changedApplication.trackingEnabled) {
      notify('Action recruteur enregistree, pas de notification pour candidature rapide.');
    }

  };

  const downloadApplicationCv = async (applicationId) => {
    const currentApplication = [...recruiterApplications, ...applications].find((item) => item.id === applicationId);
    if (!currentApplication) return;
    notify('Preparation du telechargement du CV...');
    const downloaded = await openCvFile(currentApplication, 'download');
    if (downloaded) await markApplicationActivity(applicationId, 'cvOpened');
  };

  const publishJob = async (event) => {
    event.preventDefault();
    if (!isLoggedIn) {
      notify('Connecte-toi pour publier une offre.');
      openLogin('recruteur');
      return;
    }
    if (profile.role !== 'recruteur') {
      notify('Active le mode recruteur dans ton profil.');
      setScreen('profile');
      return;
    }
    notify("Publication de l'offre en cours...");
    const nextJob = {
      id: Date.now(),
      requirements: ['Experience pertinente', 'Disponibilite', 'Motivation'],
      status: 'published',
      ...jobForm,
    };
    if (hasSupabaseConfig && supabase) {
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({ owner_id: authUser.id, name: nextJob.company, city: nextJob.loc, sector: nextJob.sector })
        .select('id')
        .single();
      if (companyError || !company?.id) {
        notify(`Entreprise non creee: ${companyError?.message || 'base indisponible'}`);
        return;
      }
      const { data: savedJob, error: jobError } = await supabase
        .from('jobs')
        .insert({
          company_id: company.id,
          title: nextJob.role,
          description: nextJob.description,
          location: nextJob.loc,
          contract_type: nextJob.type,
          salary_range: nextJob.salary,
          sector: nextJob.sector,
          requirements: nextJob.requirements,
          status: 'published',
        })
        .select('id,company_id,title,description,location,contract_type,salary_range,sector,requirements,status,created_at,companies(name)')
        .single();
      if (jobError || !savedJob) {
        notify(`Offre non publiee: ${jobError?.message || 'base indisponible'}`);
        return;
      }
      nextJob.id = savedJob.id;
      nextJob.companyId = savedJob.company_id;
    }
    setJobs((current) => [nextJob, ...current]);
    setRecruiterJobs((current) => [nextJob, ...current]);
    setJobForm(emptyJob);
    setNotifications((current) => [
      { id: Date.now(), title: 'Offre publiee', body: `${nextJob.role} est maintenant visible`, read: false },
      ...current,
    ]);
    setScreen('recruiter');
    notify('Offre publiee');
  };

  const startEditJob = (job) => {
    setEditingJob(job);
    setJobForm({
      role: job.role || '',
      company: job.company || '',
      loc: job.loc || 'Brazzaville',
      type: job.type || 'CDI',
      salary: job.salary || '',
      sector: job.sector || '',
      description: job.description || '',
    });
    setScreen('post-job');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveJobEdit = async (event) => {
    event.preventDefault();
    if (!editingJob) return;
    notify("Enregistrement de l'offre en cours...");
    const updatedJob = { ...editingJob, ...jobForm };
    if (hasSupabaseConfig && supabase && typeof editingJob.id === 'string') {
      const { error } = await supabase
        .from('jobs')
        .update({
          title: updatedJob.role,
          description: updatedJob.description,
          location: updatedJob.loc,
          contract_type: updatedJob.type,
          salary_range: updatedJob.salary,
          sector: updatedJob.sector,
        })
        .eq('id', editingJob.id);
      if (error) {
        notify("Modification impossible pour l'instant.");
        return;
      }
      if (updatedJob.companyId) {
        await supabase.from('companies').update({ name: updatedJob.company, city: updatedJob.loc, sector: updatedJob.sector }).eq('id', updatedJob.companyId);
      }
    }
    const replaceJob = (job) => (job.id === editingJob.id ? updatedJob : job);
    setJobs((current) => current.map(replaceJob));
    setRecruiterJobs((current) => current.map(replaceJob));
    setEditingJob(null);
    setJobForm(emptyJob);
    setScreen('recruiter');
    notify('Offre modifiee');
  };

  const deleteJob = async (job) => {
    const confirmed = window.confirm(`Supprimer l'offre "${job.role}" ?`);
    if (!confirmed) return;
    notify('Suppression de l offre en cours...');
    if (hasSupabaseConfig && supabase && typeof job.id === 'string') {
      const { error } = await supabase.from('jobs').delete().eq('id', job.id);
      if (error) {
        notify("Suppression impossible pour l'instant.");
        return;
      }
    }
    const removeJob = (item) => item.id !== job.id;
    setJobs((current) => current.filter(removeJob));
    setRecruiterJobs((current) => current.filter(removeJob));
    setRecruiterApplications((current) => current.filter((item) => item.jobId !== job.id));
    setRecruiterJobStats((current) => {
      const next = { ...current };
      delete next[job.id];
      return next;
    });
    notify('Offre supprimee');
  };

  const requestJobBoost = async (job) => {
    if (!hasSupabaseConfig || !supabase || !authUser) {
      notify('Connecte-toi comme recruteur pour demander un boost.');
      return;
    }
    if (!isSupabaseId(job.id) || !job.companyId) {
      notify("Cette offre doit etre synchronisee avant d'activer un boost.");
      return;
    }
    notify('Demande de boost en cours...');
    const { data, error } = await supabase
      .from('boost_requests')
      .insert({
        job_id: job.id,
        company_id: job.companyId,
        recruiter_id: authUser.id,
        plan: 'standard',
        message: `Demande de boost pour ${job.role}`,
        status: 'pending',
      })
      .select('id,job_id,company_id,recruiter_id,plan,message,status,created_at,jobs(title,companies(name)),companies(name)')
      .single();
    if (error) {
      notify(`Demande de boost non envoyee: ${error.message || 'base indisponible'}`);
      return;
    }
    setBoostRequests((current) => [normalizeBoostRequest(data), ...current]);
    notify('Demande de boost envoyee a l admin.');
  };

  const reviewBoostRequest = async (requestId, status) => {
    if (!hasSupabaseConfig || !supabase || profile.role !== 'admin') {
      notify('Action reservee a l admin.');
      return;
    }
    const { error } = await supabase
      .from('boost_requests')
      .update({ status, reviewed_by: authUser.id, reviewed_at: new Date().toISOString() })
      .eq('id', requestId);
    if (error) {
      notify(`Demande non mise a jour: ${error.message || 'base indisponible'}`);
      return;
    }
    setBoostRequests((current) => current.map((item) => (item.id === requestId ? { ...item, status } : item)));
    notify(status === 'approved' ? 'Boost valide' : 'Boost rejete');
  };

  const updateProfile = async (event) => {
    event.preventDefault();
    if (hasSupabaseConfig && supabase && authUser) {
      const { error } = await supabase.from('profiles').upsert({
        id: authUser.id,
        email: authUser.email,
        role: profile.role || 'candidat',
        nom: profile.nom,
        prenom: profile.prenom,
        phone: profile.phone,
        city: profile.city,
        title: profile.title,
      });
      if (error) {
        notify('Profil garde localement, base indisponible.');
        return;
      }
    }
    notify('Profil mis a jour');
  };

  const openRecruiterSpace = () => {
    if (!isLoggedIn) {
      openLogin('recruteur');
      return;
    }
    if (profile.role !== 'recruteur' && !hasPublishedOffer) {
      notify("Ton compte candidat n'a pas encore d'espace recruteur actif.");
      setScreen('profile');
      return;
    }
    setScreen('recruiter');
  };

  const middleNavItem = profile.role === 'admin'
    ? { id: 'admin', label: 'Admin', icon: ShieldCheck }
    : profile.role === 'recruteur'
      ? { id: 'recruiter', label: 'Recruteur', icon: LayoutDashboard }
      : { id: 'tracking', label: 'Suivi', icon: ClipboardList };
  const visibleNavItems = [
    { id: 'home', label: 'Accueil', icon: Home },
    { id: 'jobs', label: 'Offres', icon: Briefcase },
    middleNavItem,
    { id: 'profile', label: 'Profil', icon: User },
  ];
  const showMobileChrome = !['job', 'apply', 'login', 'post-job'].includes(screen);

  const renderScreen = () => {
    if (screen === 'jobs') return <JobsScreen jobs={filteredJobs} query={query} setQuery={setQuery} city={city} setCity={setCity} contract={contract} setContract={setContract} sortOrder={sortOrder} setSortOrder={setSortOrder} clearSearch={clearSearch} openJob={openJob} setScreen={setScreen} savedIds={savedIds} toggleSave={toggleSave} />;
    if (screen === 'job') return <JobScreen job={activeJob} saved={savedIds.includes(activeJob?.id)} toggleSave={toggleSave} setScreen={setScreen} notify={notify} />;
    if (screen === 'apply') return <ApplyScreen job={activeJob} form={applicationForm} setForm={setApplicationForm} submitApplication={submitApplication} submitting={applicationSubmitting} setScreen={setScreen} openLogin={openLogin} isLoggedIn={isLoggedIn} profile={profile} notify={notify} />;
    if (screen === 'saved') return <SavedScreen jobs={savedJobs} openJob={openJob} />;
    if (screen === 'tracking') return <TrackingScreen applications={applications} setScreen={setScreen} openLogin={openLogin} isLoggedIn={isLoggedIn} authLoading={authLoading} />;
    if (screen === 'profile') return <ProfileScreen profile={profile} setProfile={setProfile} applications={applications} updateProfile={updateProfile} setScreen={setScreen} openLogin={openLogin} openRecruiterSpace={openRecruiterSpace} isLoggedIn={isLoggedIn} authLoading={authLoading} handleLogout={handleLogout} hasPublishedOffer={hasPublishedOffer} />;
    if (screen === 'login') return <LoginScreen authMode={authMode} setAuthMode={setAuthMode} loginRole={loginRole} setLoginRole={setLoginRole} loginEmail={loginEmail} setLoginEmail={setLoginEmail} loginPassword={loginPassword} setLoginPassword={setLoginPassword} handleAuth={handleAuth} serviceStatus={serviceStatus} setScreen={setScreen} notify={notify} />;
    if (screen === 'recruiter') return <RecruiterScreen jobs={recruiterJobs} applications={recruiterApplications} stats={recruiterJobStats} boostRequests={boostRequests} setScreen={setScreen} openLogin={openLogin} markApplicationActivity={markApplicationActivity} downloadApplicationCv={downloadApplicationCv} startEditJob={startEditJob} deleteJob={deleteJob} requestJobBoost={requestJobBoost} isLoggedIn={isLoggedIn} role={profile.role} />;
    if (screen === 'admin') return <AdminScreen boostRequests={boostRequests} reviewBoostRequest={reviewBoostRequest} role={profile.role} setScreen={setScreen} />;
    if (screen === 'post-job') return <PostJobScreen form={jobForm} setForm={setJobForm} onSubmit={editingJob ? saveJobEdit : publishJob} setScreen={setScreen} editing={Boolean(editingJob)} cancelEdit={() => { setEditingJob(null); setJobForm(emptyJob); setScreen('recruiter'); }} notify={notify} />;
    if (screen === 'notifications') return <NotificationsScreen notifications={notifications} setNotifications={setNotifications} />;
    if (screen === 'settings') return <SettingsScreen serviceStatus={serviceStatus} />;
    return <HomeScreen jobs={filteredJobs.slice(0, 3)} totalJobs={publishedJobs.length} query={query} setQuery={setQuery} city={city} setCity={setCity} clearSearch={clearSearch} openJob={openJob} setScreen={setScreen} openLogin={openLogin} savedIds={savedIds} toggleSave={toggleSave} />;
  };

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <header className={classNames('sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur', showMobileChrome ? 'block' : 'hidden md:block')}>
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-4 md:px-6">
          <button onClick={() => setScreen('home')} aria-label="Retour à l'accueil" className="smooth-button flex min-h-11 items-center rounded-md px-1 text-left focus:outline-none focus:ring-2 focus:ring-blue-600">
            <BrandLogo />
          </button>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
            <button onClick={() => setScreen('jobs')} className="header-link">Trouver un emploi</button>
            <button onClick={() => setScreen('saved')} className="header-link">Favoris</button>
            <button onClick={openRecruiterSpace} className="header-link">Espace recruteur</button>
          </nav>

          <div className="flex items-center gap-0.5">
            <IconButton label="Notifications" onClick={() => setScreen('notifications')} badge={unreadCount}>
              <Bell size={20} />
            </IconButton>
            <IconButton label="Profil" onClick={() => setScreen('profile')}>
              <User size={20} />
            </IconButton>
            <span className="hidden md:block">
              <IconButton label="Paramètres" onClick={() => setScreen('settings')}>
              <Settings size={20} />
              </IconButton>
            </span>
          </div>
        </div>
      </header>

      <main key={screen} className="soft-enter mx-auto max-w-6xl px-4 pb-28 pt-5 md:px-6 md:pb-12 md:pt-8">
        {renderScreen()}
      </main>

      {showMobileChrome && (
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white pb-[max(env(safe-area-inset-bottom),0.45rem)] pt-1.5 md:hidden" aria-label="Navigation mobile">
        <div className="mx-auto grid max-w-md grid-cols-4 px-2">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = screen === item.id || (item.id === 'jobs' && ['job', 'apply'].includes(screen));
            return (
              <button
                key={item.id}
                aria-label={`Navigation ${item.label}`}
                onClick={() => (item.id === 'recruiter' ? openRecruiterSpace() : setScreen(item.id))}
                className={classNames('smooth-button flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600', active ? 'text-blue-700' : 'text-slate-500 hover:text-slate-800')}
              >
                <Icon size={21} strokeWidth={active ? 2.4 : 1.8} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
      )}

      {toast && (
        <div role="status" aria-live="polite" className="soft-enter fixed bottom-24 left-4 right-4 z-[60] mx-auto max-w-sm rounded-lg border border-slate-200 bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white shadow-xl md:bottom-6">
          {toast}
        </div>
      )}
    </div>
  );
}

function IconButton({ label, children, onClick, badge }) {
  return (
    <button onClick={onClick} aria-label={badge > 0 ? `${label}, ${badge} non lue${badge > 1 ? 's' : ''}` : label} className="smooth-button relative flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
      {children}
      {badge > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-blue-700 ring-2 ring-white" />}
    </button>
  );
}

function HomeScreen({ jobs, totalJobs, query, setQuery, city, setCity, clearSearch, openJob, setScreen, openLogin, savedIds, toggleSave }) {
  return (
    <div className="space-y-9 md:space-y-12">
      <section className="mx-auto max-w-4xl py-3 md:py-12">
        <div className="max-w-2xl">
          <p className="mb-3 text-sm font-semibold text-blue-700">{totalJobs > 0 ? `${totalJobs} offres disponibles au Congo` : 'La plateforme emploi du Congo'}</p>
          <h1 className="text-[2rem] font-bold leading-[1.15] tracking-[-0.035em] text-slate-950 sm:text-4xl md:text-5xl">
            Trouvez l’emploi qui vous correspond
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-6 text-slate-600 md:text-base">
            Recherchez un poste, postulez avec votre CV et suivez vos candidatures simplement.
          </p>
        </div>

        <div className="mt-7 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_8px_28px_rgba(15,23,42,0.06)] md:mt-9 md:p-4">
          <SearchPanel query={query} setQuery={setQuery} city={city} setCity={setCity} clearSearch={clearSearch} onSubmit={() => setScreen('jobs')} />
          <button onClick={() => setScreen('jobs')} className="primary-button mt-3 w-full">
            Rechercher
          </button>
        </div>
      </section>

      <section>
        <SectionTitle title="Offres récentes" action="Voir tout" onAction={() => setScreen('jobs')} />
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onClick={() => openJob(job)}
              saved={savedIds.includes(job.id)}
              onSave={() => toggleSave(job)}
            />
          ))}
        </div>
        {jobs.length === 0 && (
          <EmptyState
            title="Les offres arrivent"
            body="Aucune offre ne correspond encore à cette recherche."
            action="Voir toutes les offres"
            onAction={() => setScreen('jobs')}
          />
        )}
      </section>

      <section className="flex flex-col gap-4 border-t border-slate-200 py-7 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Vous recrutez au Congo ?</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Publiez une offre et gérez les candidatures depuis votre espace.</p>
        </div>
        <button onClick={() => openLogin('recruteur')} className="secondary-button shrink-0">
          Publier une offre
        </button>
      </section>
    </div>
  );
}

function JobsScreen({ jobs, query, setQuery, city, setCity, contract, setContract, sortOrder, setSortOrder, clearSearch, openJob, setScreen, savedIds, toggleSave }) {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <PageHeader title="Offres d’emploi" subtitle="Trouvez votre prochaine opportunité" />
        <button onClick={() => setScreen('saved')} className="secondary-icon-button" aria-label="Voir mes offres sauvegardées">
          <Bookmark size={20} />
        </button>
      </div>

      <SearchPanel query={query} setQuery={setQuery} city={city} setCity={setCity} clearSearch={clearSearch} showCity={false} />

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Filtres des offres">
        <label className="filter-select">
          <ListFilter size={15} />
          <span className="sr-only">Type de contrat</span>
          <select value={contract} onChange={(event) => setContract(event.target.value)} aria-label="Type de contrat">
            <option>Tous</option>
            {CONTRACT_TYPES.map((option) => <option key={option}>{option}</option>)}
          </select>
          <ChevronDown size={14} />
        </label>
        <label className="filter-select">
          <MapPin size={15} />
          <span className="sr-only">Ville</span>
          <select value={city} onChange={(event) => setCity(event.target.value)} aria-label="Ville">
            <option>Toutes</option>
            {CONGO_CITIES.map((option) => <option key={option}>{option}</option>)}
          </select>
          <ChevronDown size={14} />
        </label>
        <label className="filter-select">
          <CalendarDays size={15} />
          <span className="sr-only">Trier les offres</span>
          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} aria-label="Trier les offres">
            <option value="recent">Plus récentes</option>
            <option value="title">Titre A–Z</option>
            <option value="company">Entreprise A–Z</option>
          </select>
          <ChevronDown size={14} />
        </label>
      </div>

      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <p className="text-sm font-bold text-slate-950">{jobs.length} offre{jobs.length === 1 ? '' : 's'}</p>
        {(query || city !== 'Toutes' || contract !== 'Tous') && (
          <button type="button" onClick={clearSearch} className="text-sm font-semibold text-blue-700">Réinitialiser</button>
        )}
      </div>

      <div className="grid gap-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} onClick={() => openJob(job)} saved={savedIds.includes(job.id)} onSave={() => toggleSave(job)} />
        ))}
      </div>
      {jobs.length === 0 && <EmptyState title="Aucune offre trouvée" body="Modifiez la ville, le contrat ou le mot-clé pour relancer la recherche." action="Réinitialiser" onAction={clearSearch} />}
    </div>
  );
}

function JobScreen({ job, saved, toggleSave, setScreen, notify }) {
  if (!job) return <EmptyState title="Offre introuvable" body="Retournez à la liste des offres." />;
  const shareJob = async () => {
    const shareData = {
      title: `${job.role} — ${job.company}`,
      text: `${job.role} chez ${job.company}, à ${job.loc}.`,
      url: window.location.origin,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        notify('Lien de l’offre copié');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') notify('Partage indisponible pour le moment');
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between">
        <BackButton onClick={() => setScreen('jobs')} label="Retour aux offres" />
        <div className="flex gap-1">
          <button onClick={() => toggleSave(job)} aria-label={saved ? 'Retirer des favoris' : 'Sauvegarder cette offre'} className={classNames('secondary-icon-button', saved ? 'border-blue-200 bg-blue-50 text-blue-700' : '')}>
            <Bookmark size={20} fill={saved ? 'currentColor' : 'none'} />
          </button>
          <button onClick={shareJob} aria-label="Partager cette offre" className="secondary-icon-button">
            <Share2 size={20} />
          </button>
        </div>
      </div>

      <article className="pb-4">
        <header className="border-b border-slate-200 pb-6">
          <h1 className="text-[1.8rem] font-bold leading-tight tracking-[-0.025em] text-slate-950 md:text-4xl">{job.role}</h1>
          <p className="mt-2 text-base font-semibold text-blue-700">{job.company}</p>
          <p className="mt-3 flex items-center gap-2 text-sm text-slate-600"><MapPin size={17} /> {job.loc}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="neutral-chip">{job.type}</span>
            <span className="neutral-chip">{job.sector || 'Tous secteurs'}</span>
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Briefcase size={17} /> {job.salary || 'Salaire à discuter'}
          </p>
        </header>

        <div className="space-y-8 py-7">
          <section>
            <h2 className="text-lg font-bold text-slate-950">Description du poste</h2>
            <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-slate-700">{job.description}</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-slate-950">Profil recherché</h2>
            <ul className="mt-3 space-y-3">
              {(job.requirements || []).map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px] leading-6 text-slate-700">
                  <Check size={17} className="mt-1 shrink-0 text-blue-700" /> {item}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </article>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] md:static md:mt-3 md:border-0 md:p-0">
        <div className="mx-auto flex max-w-3xl gap-2">
          <button onClick={() => setScreen('apply')} className="primary-button flex-1">
            Postuler
          </button>
          <button onClick={() => toggleSave(job)} aria-label={saved ? 'Retirer des favoris' : 'Sauvegarder'} className={classNames('secondary-icon-button h-12 w-14', saved ? 'border-blue-200 bg-blue-50 text-blue-700' : '')}>
            <Bookmark size={21} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ApplyScreen({ job, form, setForm, submitApplication, submitting, setScreen, openLogin, isLoggedIn, profile, notify }) {
  const trackingEnabled = form.mode === 'tracked';
  const contactReady = Boolean((form.nom || profile.nom || profile.prenom) && (form.email || profile.email) && (form.phone || profile.phone));
  const notifyInvalid = useInvalidNotice(notify, 'Complétez les champs obligatoires avant d’envoyer.');
  const notifySubmitBlocker = () => {
    if (!form.nom.trim() || !form.email.trim() || !form.phone.trim()) {
      notifyInvalid();
      return;
    }
    if (!form.cvName) notify(`Ajoute un CV PDF de ${MAX_CV_LABEL} maximum.`);
  };
  const fillFromProfile = () => {
    setForm({
      ...form,
      nom: `${profile.prenom} ${profile.nom}`.trim(),
      email: profile.email,
      phone: profile.phone,
    });
    notify('Profil ajouté à la candidature');
  };
  const handleCvChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      event.target.value = '';
      setForm({ ...form, cvName: '', cvSize: 0, cvType: '', cvFile: null });
      notify('Le CV doit être un fichier PDF.');
      return;
    }
    if (file.size > MAX_CV_BYTES) {
      event.target.value = '';
      setForm({ ...form, cvName: '', cvSize: 0, cvType: '', cvFile: null });
      notify(`Le CV ne doit pas dépasser ${MAX_CV_LABEL}.`);
      return;
    }
    setForm({ ...form, cvName: file.name, cvSize: file.size, cvType: file.type || 'application/pdf', cvFile: file });
    notify('CV PDF ajouté');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <BackButton onClick={() => setScreen('job')} label="Retour" />
      <PageHeader title="Postuler" subtitle={`${job.role} · ${job.company}`} />
      <div className="grid grid-cols-3 gap-2">
        <StepPill active done label="Mode" />
        <StepPill active={contactReady} done={contactReady} label="Contact" />
        <StepPill active={Boolean(form.cvName)} done={Boolean(form.cvName)} label="CV" />
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setForm({ ...form, mode: 'tracked' })}
          className={classNames('rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-600', trackingEnabled ? 'border-blue-700 bg-blue-50' : 'border-slate-200 bg-white')}
        >
          <div className="flex items-center gap-2 font-bold text-slate-950">
            <ShieldCheck size={19} className="text-blue-700" /> Candidature suivie
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">Connexion requise. Vous voyez si l’employeur ouvre votre demande ou votre CV.</p>
        </button>
        <button
          type="button"
          onClick={() => setForm({ ...form, mode: 'quick' })}
          className={classNames('rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-600', !trackingEnabled ? 'border-blue-700 bg-blue-50' : 'border-slate-200 bg-white')}
        >
          <div className="flex items-center gap-2 font-bold text-slate-950">
            <Send size={19} className="text-blue-700" /> Candidature rapide
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">Votre CV est reçu par le recruteur, sans suivi en temps réel du dossier.</p>
        </button>
      </div>
      {trackingEnabled && !isLoggedIn && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-semibold leading-6 text-blue-950">Connectez-vous pour activer le suivi de candidature.</p>
          <button onClick={() => openLogin('candidat')} className="primary-button mt-3">
            Se connecter
          </button>
        </div>
      )}
      <form onSubmit={submitApplication} onInvalidCapture={notifyInvalid} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        {isLoggedIn && (
          <button type="button" onClick={fillFromProfile} className="secondary-button">
            Utiliser mon profil
          </button>
        )}
        <TextField label="Nom complet" value={form.nom} onChange={(nom) => setForm({ ...form, nom })} required placeholder="Ex: Grace Moungala" />
        <TextField label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} required placeholder="nom@email.com" />
        <TextField label="Telephone" type="tel" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} required placeholder="+242 06 ..." />
        <TextArea label="Message au recruteur" value={form.message} onChange={(message) => setForm({ ...form, message })} placeholder="Disponibilité, expérience, motivation…" />
        <CvUpload cvName={form.cvName} cvSize={form.cvSize} onChange={handleCvChange} />
        <button type="submit" onClick={notifySubmitBlocker} disabled={submitting} className="primary-button sticky bottom-3 w-full md:static">
          {submitting ? 'Envoi en cours...' : trackingEnabled ? 'Envoyer et suivre' : 'Envoyer rapidement'} <Send size={18} />
        </button>
      </form>
    </div>
  );
}

function SavedScreen({ jobs, openJob }) {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader title="Offres sauvegardées" subtitle={`${jobs.length} offre${jobs.length === 1 ? '' : 's'} enregistrée${jobs.length === 1 ? '' : 's'}`} />
      <div className="grid gap-3">
        {jobs.map((job) => <JobCard key={job.id} job={job} onClick={() => openJob(job)} />)}
      </div>
      {jobs.length === 0 && <EmptyState title="Aucun favori" body="Sauvegardez les offres intéressantes pour les retrouver ici." />}
    </div>
  );
}

function TrackingScreen({ applications, setScreen, openLogin, isLoggedIn, authLoading }) {
  const [expandedId, setExpandedId] = useState(null);
  const ongoingCount = applications.filter((item) => item.applicationOpened || item.status === 'reviewed').length;
  const cvOpenedCount = applications.filter((item) => item.cvOpened).length;

  if (!isLoggedIn && !authLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <PageHeader title="Mes candidatures" subtitle="Suivez chaque étape depuis votre espace candidat" />
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-950">Connectez-vous pour activer le suivi</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Vous pourrez voir quand une candidature ou un CV est consulté par le recruteur.</p>
          <button onClick={() => openLogin('candidat')} className="primary-button mt-5 w-full sm:w-auto">Connexion candidat</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Mes candidatures" subtitle="Retrouvez l’avancement de vos demandes" />

      <section className="grid grid-cols-3 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-white py-4">
        <Metric value={applications.length} label="Candidatures" />
        <Metric value={ongoingCount} label="En cours" />
        <Metric value={cvOpenedCount} label="CV ouverts" />
      </section>

      <div>
        <SectionTitle title="Mon suivi" action="Voir les offres" onAction={() => setScreen('jobs')} />
        <div className="mt-3 grid gap-3">
          {applications.map((item) => {
            const status = getApplicationStatus(item);
            const expanded = expandedId === item.id;
            return (
              <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 md:p-5">
                <div className="flex items-start gap-3">
                  <div className="company-mark">
                    <Building2 size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold leading-6 text-slate-950">{item.jobRole}</h3>
                    <p className="mt-0.5 text-sm text-slate-600">{item.company}</p>
                  </div>
                </div>

                <p className={classNames('mt-4 flex items-center gap-2 text-sm font-semibold', status.tone === 'success' ? 'text-emerald-700' : 'text-blue-700')}>
                  <span className={classNames('h-2 w-2 rounded-full', status.tone === 'success' ? 'bg-emerald-600' : 'bg-blue-600')} />
                  {status.label}
                </p>

                <dl className="mt-4 grid gap-3 border-t border-slate-200 pt-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate-500">Référence</dt>
                    <dd className="text-right font-medium text-slate-800">{item.trackingNumber || 'Non suivie'}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate-500">Date de candidature</dt>
                    <dd className="font-medium text-slate-800">{item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : 'Date non disponible'}</dd>
                  </div>
                </dl>

                {expanded && (
                  <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                    <p>{item.applicationOpened ? 'La candidature a été consultée.' : 'La candidature attend encore sa première consultation.'}</p>
                    <p>{item.cvOpened ? 'Le CV a été ouvert par le recruteur.' : 'Le CV n’a pas encore été ouvert.'}</p>
                  </div>
                )}

                <button type="button" onClick={() => setExpandedId(expanded ? null : item.id)} className="mt-4 flex min-h-10 w-full items-center justify-between border-t border-slate-200 pt-3 text-sm font-semibold text-blue-700">
                  {expanded ? 'Masquer le détail' : 'Voir le détail'}
                  <ChevronRight size={18} className={classNames('transition-transform', expanded ? 'rotate-90' : '')} />
                </button>
              </article>
            );
          })}
          {applications.length === 0 && <EmptyState title="Aucune candidature" body="Postulez à une offre pour commencer votre suivi." action="Voir les offres" onAction={() => setScreen('jobs')} />}
        </div>
      </div>
    </div>
  );
}

function ProfileScreen({ profile, setProfile, applications, updateProfile, setScreen, openLogin, openRecruiterSpace, isLoggedIn, authLoading, handleLogout, hasPublishedOffer }) {
  const isRecruiter = profile.role === 'recruteur';
  const displayName = `${profile.prenom || ''} ${profile.nom || ''}`.trim() || 'Profil candidat';
  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 1.5 * 1024 * 1024) {
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProfile({ ...profile, avatarDataUrl: reader.result });
    reader.readAsDataURL(file);
  };

  if (!isLoggedIn && !authLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <PageHeader title="Mon profil" subtitle="Connectez-vous pour retrouver votre espace personnel" />
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-950">Votre recherche d’emploi au même endroit</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Retrouvez votre profil, vos favoris, vos CV et le suivi de vos candidatures.</p>
          <button onClick={() => openLogin('candidat')} className="primary-button mt-5 w-full sm:w-auto">
            Connexion candidat
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <ProfileInfoCard icon={FileText} title="CV et profil" body="Garde tes informations pretes pour postuler plus vite." />
          <ProfileInfoCard icon={Bell} title="Suivi de dossier" body="Retrouve les ouvertures de demande et de CV dans ton espace." />
          <ProfileInfoCard icon={Briefcase} title="Offres sauvegardees" body="Conserve les offres importantes pour y revenir plus tard." />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <PageHeader title="Mon profil" subtitle={authLoading ? 'Vérification de la session…' : isRecruiter ? 'Compte recruteur' : 'Compte candidat'} />
        {isLoggedIn && (
          <button onClick={handleLogout} aria-label="Se déconnecter" className="secondary-icon-button shrink-0 hover:border-red-300 hover:text-red-700">
            <LogOut size={18} />
          </button>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 md:p-5">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-blue-700 text-white">
            {profile.avatarDataUrl ? (
              <img src={profile.avatarDataUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-bold">{getInitials(profile)}</div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{isRecruiter ? 'Recruteur' : 'Candidat'}</p>
            <h2 className="mt-1 truncate text-xl font-bold text-slate-950">{displayName}</h2>
            <p className="mt-1 truncate text-sm text-slate-500">{profile.title || 'Titre à compléter'} · {profile.city}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:border-blue-700 hover:text-blue-700 focus-within:ring-2 focus-within:ring-blue-600">
                Modifier la photo
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="sr-only" />
              </label>
              {profile.avatarDataUrl && (
                <button type="button" onClick={() => setProfile({ ...profile, avatarDataUrl: '' })} className="min-h-9 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700 transition hover:border-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-600">
                  Retirer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {isRecruiter ? (
        <button onClick={openRecruiterSpace} className="primary-button w-full">
          <LayoutDashboard size={18} /> {hasPublishedOffer ? 'Ouvrir mon espace recruteur' : 'Publier ma première offre'}
        </button>
      ) : (
        <button onClick={() => setScreen('tracking')} className="secondary-button w-full justify-between">
          <span className="flex items-center gap-2"><ClipboardList size={18} /> Mes candidatures</span>
          <span className="text-blue-700">{applications.length}</span>
        </button>
      )}

      <form onSubmit={updateProfile} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-2">
        <TextField label="Nom" value={profile.nom} onChange={(nom) => setProfile({ ...profile, nom })} />
        <TextField label="Prénom" value={profile.prenom} onChange={(prenom) => setProfile({ ...profile, prenom })} />
        <TextField label="Email" type="email" value={profile.email} onChange={(email) => setProfile({ ...profile, email })} disabled={isLoggedIn} />
        <TextField label="Téléphone" type="tel" value={profile.phone} onChange={(phone) => setProfile({ ...profile, phone })} />
        <SelectField label="Ville" value={profile.city} onChange={(city) => setProfile({ ...profile, city })} options={CONGO_CITIES} />
        <TextField label="Titre professionnel" value={profile.title} onChange={(title) => setProfile({ ...profile, title })} />
        <SelectField label="Type de compte" value={profile.role} onChange={(role) => setProfile({ ...profile, role })} options={['candidat', 'recruteur']} />
        <button type="submit" className="primary-button md:col-span-2">
          Enregistrer
        </button>
      </form>
    </div>
  );
}

function ProfileInfoCard({ icon: Icon, title, body }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
        <Icon size={18} />
      </div>
      <h3 className="mt-3 font-semibold text-slate-950">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-500">{body}</p>
    </div>
  );
}

function LoginScreen({ authMode, setAuthMode, loginRole, setLoginRole, loginEmail, setLoginEmail, loginPassword, setLoginPassword, handleAuth, serviceStatus, setScreen, notify }) {
  const isSignup = authMode === 'signup';
  const [showPassword, setShowPassword] = useState(false);
  const notifyInvalid = useInvalidNotice(notify, 'Renseignez votre email et votre mot de passe pour continuer.');
  const notifySubmitBlocker = () => {
    if (!loginEmail.trim() || !loginPassword.trim()) notifyInvalid();
  };
  const isRecruiterLogin = loginRole === 'recruteur';
  const loginTitle = `${isSignup ? 'Inscription' : 'Connexion'} ${isRecruiterLogin ? 'recruteur' : 'candidat'}`;
  const loginSubtitle = isRecruiterLogin ? 'Publiez vos offres et gérez les candidatures reçues' : 'Postulez et suivez vos candidatures';
  const authStatusText = serviceStatus === 'checking'
    ? 'Vérification du service en cours. Réessayez dans quelques secondes.'
    : 'Connexion temporairement indisponible. Réessayez un peu plus tard.';

  return (
    <div className="mx-auto max-w-md space-y-5">
      <BackButton onClick={() => setScreen('home')} label="Accueil" />
      <PageHeader title={loginTitle} subtitle={loginSubtitle} />
      <div className="grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
        <button type="button" onClick={() => setLoginRole('candidat')} className={classNames('min-h-11 rounded-md text-sm font-semibold transition-colors', !isRecruiterLogin ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600')}>
          Candidat
        </button>
        <button type="button" onClick={() => setLoginRole('recruteur')} className={classNames('min-h-11 rounded-md text-sm font-semibold transition-colors', isRecruiterLogin ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600')}>
          Recruteur
        </button>
      </div>
      {serviceStatus !== 'online' && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-800">
          {authStatusText}
        </p>
      )}
      <div className="grid grid-cols-2 border-b border-slate-200">
        <button type="button" onClick={() => setAuthMode('signin')} className={classNames('min-h-11 border-b-2 text-sm font-semibold', !isSignup ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500')}>
          Connexion
        </button>
        <button type="button" onClick={() => setAuthMode('signup')} className={classNames('min-h-11 border-b-2 text-sm font-semibold', isSignup ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500')}>
          Inscription
        </button>
      </div>
      <form onSubmit={handleAuth} onInvalidCapture={notifyInvalid} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <TextField label="Email" type="email" value={loginEmail} onChange={setLoginEmail} required />
        <PasswordField
          label="Mot de passe"
          value={loginPassword}
          onChange={setLoginPassword}
          required
          placeholder="Minimum 6 caractères"
          visible={showPassword}
          onToggle={() => setShowPassword((visible) => !visible)}
        />
        <button type="submit" onClick={notifySubmitBlocker} className="primary-button w-full">
          {isSignup ? `Créer mon compte ${isRecruiterLogin ? 'recruteur' : 'candidat'}` : `Me connecter comme ${isRecruiterLogin ? 'recruteur' : 'candidat'}`}
        </button>
        <p className="text-xs font-semibold leading-5 text-slate-500">
          {isSignup
            ? `Ce compte sera créé comme ${isRecruiterLogin ? 'recruteur' : 'candidat'}. Si une validation email est demandée, confirmez le lien reçu avant de vous reconnecter.`
            : isRecruiterLogin
              ? 'Utilisez votre compte recruteur pour voir vos offres, vos candidats et leurs CV.'
              : 'Utilisez votre compte candidat pour postuler et suivre vos candidatures.'}
        </p>
      </form>
    </div>
  );
}

function RecruiterScreen({ jobs, applications, stats, boostRequests, setScreen, openLogin, markApplicationActivity, downloadApplicationCv, startEditJob, deleteJob, requestJobBoost, isLoggedIn, role }) {
  const [selectedJobId, setSelectedJobId] = useState('all');
  const ownJobs = jobs;
  const canRecruit = isLoggedIn && (role === 'recruteur' || ownJobs.length > 0);
  const reviewedCount = applications.filter((item) => item.status === 'reviewed' || item.applicationOpened || item.cvOpened).length;
  const applicationsByJobId = useMemo(() => {
    return applications.reduce((groups, item) => {
      const key = item.jobId || 'unknown';
      groups[key] = groups[key] ? [...groups[key], item] : [item];
      return groups;
    }, {});
  }, [applications]);
  const selectedJobExists = selectedJobId === 'all' || ownJobs.some((job) => job.id === selectedJobId);
  const activeJobId = selectedJobExists ? selectedJobId : 'all';
  const visibleApplications = activeJobId === 'all' ? applications : applications.filter((item) => item.jobId === activeJobId);
  const selectedJob = ownJobs.find((job) => job.id === activeJobId);

  return (
    <div className="space-y-5">
      <PageHeader title="Recruteur" subtitle="Publier et suivre les candidatures" />
      {!isLoggedIn && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-bold leading-6 text-blue-950">Connecte-toi pour publier une offre et garder un tableau de bord recruteur fiable.</p>
          <button onClick={() => openLogin('recruteur')} className="mt-3 min-h-11 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-600">
            Connexion recruteur
          </button>
        </div>
      )}
      {isLoggedIn && !canRecruit && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold leading-6 text-amber-900">Ton compte candidat reste dans son espace candidat. Passe en compte recruteur pour publier une offre et ouvrir un vrai espace recruteur.</p>
          <button onClick={() => setScreen('profile')} className="mt-3 min-h-11 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-600">
            Modifier mon profil
          </button>
        </div>
      )}
      {canRecruit && ownJobs.length === 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-700 text-white">
            <PlusCircle size={24} />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-950">Publie ta premiere offre</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-blue-950">
            Ton tableau recruteur s'ouvrira avec les candidatures, les CV et les KPI apres la premiere offre publiee. Avant cela, aucun espace admin inutile n'est affiche.
          </p>
          <button onClick={() => setScreen('post-job')} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 font-bold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600">
            Publier ma premiere offre <PlusCircle size={18} />
          </button>
        </div>
      )}
      {(!isLoggedIn || !canRecruit || ownJobs.length === 0) && (
        <button onClick={() => setScreen('jobs')} className="flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-700 transition hover:border-blue-700 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
          Retour aux offres
        </button>
      )}
      {canRecruit && ownJobs.length > 0 && (
        <>
      <div className="grid grid-cols-3 gap-2">
        <StatCard value={ownJobs.length} label="Mes offres" />
        <StatCard value={applications.length} label="Candidats" />
        <StatCard value={reviewedCount} label="Dossiers vus" />
      </div>
      <button onClick={() => setScreen('post-job')} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 font-bold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600">
        Publier une offre <PlusCircle size={18} />
      </button>

      <SectionTitle title="Mes offres" />
      <div className="grid gap-2">
        <button
          type="button"
          onClick={() => setSelectedJobId('all')}
          className={classNames(
            'flex min-h-12 items-center justify-between gap-3 rounded-lg border px-4 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-600',
            activeJobId === 'all' ? 'border-blue-700 bg-blue-50 text-blue-900' : 'border-slate-200 bg-white text-slate-700',
          )}
        >
          <span className="text-sm font-bold">Toutes les offres</span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">{applications.length} candidat(s)</span>
        </button>
        {ownJobs.map((job) => {
          const count = applicationsByJobId[job.id]?.length || 0;
          const jobStats = stats[job.id] || { views: 0, saves: 0 };
          const boostRequest = boostRequests.find((request) => request.jobId === job.id);
          return (
            <article
              key={job.id}
              className={classNames(
                'rounded-lg border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-600',
                activeJobId === job.id ? 'border-blue-700 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300',
              )}
            >
              <button type="button" onClick={() => setSelectedJobId(job.id)} className="w-full text-left focus:outline-none">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-950">{job.role}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{job.company} - {job.loc}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{count} candidat(s)</span>
                </div>
              </button>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <StatCard value={jobStats.views} label="Vues" />
                <StatCard value={jobStats.saves} label="Signets" />
                <StatCard value={count} label="Postules" />
              </div>
              {boostRequest && (
                <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-800">
                  Boost {boostRequest.status === 'approved' ? 'valide' : boostRequest.status === 'rejected' ? 'rejete' : 'en attente'}
                </p>
              )}
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <button type="button" onClick={() => requestJobBoost(job)} disabled={Boolean(boostRequest)} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-800 transition hover:border-blue-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500">
                  Booster
                </button>
                <button type="button" onClick={() => startEditJob(job)} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-700 transition hover:border-blue-700 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
                  <Edit3 size={16} /> Modifier
                </button>
                <button type="button" onClick={() => deleteJob(job)} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-bold text-red-700 transition hover:border-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-600">
                  <Trash2 size={16} /> Supprimer
                </button>
              </div>
            </article>
          );
        })}
        {ownJobs.length === 0 && <EmptyState title="Aucune offre publiee" body="Publie une offre pour recevoir des candidatures." />}
      </div>

      <SectionTitle title={selectedJob ? `Candidats - ${selectedJob.role}` : 'Toutes les candidatures'} />
      <div className="grid gap-3">
        {visibleApplications.map((item) => (
          <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase text-blue-700">{item.jobRole}</p>
                <h3 className="mt-1 text-lg font-bold text-slate-950">{item.nom}</h3>
                <div className="mt-2 grid gap-1 text-sm font-semibold text-slate-600">
                  <span>{item.email}</span>
                  <span>{item.phone || 'Telephone non renseigne'}</span>
                </div>
              </div>
              <span className={classNames('w-fit rounded-full px-3 py-1 text-xs font-bold', item.status === 'reviewed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-50 text-blue-700')}>
                {item.status === 'reviewed' ? 'Vu' : 'Nouveau'}
              </span>
            </div>
            {item.message && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase text-slate-500">Message</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{item.message}</p>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
              <span className="rounded-full bg-slate-100 px-3 py-1">{item.cvName ? `CV: ${item.cvName}` : 'Aucun CV'}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">{item.trackingEnabled ? 'Candidature suivie' : 'Candidature rapide'}</span>
              {item.trackingNumber && <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{item.trackingNumber}</span>}
              <span className="rounded-full bg-slate-100 px-3 py-1">{item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : 'Date locale'}</span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_1fr]">
              <button onClick={() => markApplicationActivity(item.id, 'applicationOpened')} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-700 transition hover:border-blue-700 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
                Marquer la demande vue
              </button>
              <button
                onClick={() => markApplicationActivity(item.id, 'cvOpened', true)}
                disabled={!item.cvPath}
                className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                Ouvrir le CV <ExternalLink size={16} />
              </button>
              <button
                onClick={() => downloadApplicationCv(item.id)}
                disabled={!item.cvPath}
                className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 text-sm font-bold text-blue-800 transition hover:border-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500"
              >
                Telecharger le CV <Download size={16} />
              </button>
            </div>
          </article>
        ))}
        {visibleApplications.length === 0 && <EmptyState title="Aucune candidature recue" body="Les candidats apparaitront ici avec leurs messages et leurs CV PDF." />}
      </div>
        </>
      )}
    </div>
  );
}

function AdminScreen({ boostRequests, reviewBoostRequest, role, setScreen }) {
  if (role !== 'admin') {
    return (
      <div className="space-y-5">
        <PageHeader title="Admin" subtitle="Acces reserve" />
        <EmptyState title="Espace reserve" body="Ton compte n'a pas les droits admin." />
        <button onClick={() => setScreen('profile')} className="min-h-11 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-600">
          Retour au profil
        </button>
      </div>
    );
  }

  const pendingCount = boostRequests.filter((request) => request.status === 'pending').length;

  return (
    <div className="space-y-5">
      <PageHeader title="Admin" subtitle="Demandes de boost et controles plateforme" />
      <div className="grid grid-cols-3 gap-2">
        <StatCard value={boostRequests.length} label="Boosts" />
        <StatCard value={pendingCount} label="En attente" />
        <StatCard value={boostRequests.filter((request) => request.status === 'approved').length} label="Valides" />
      </div>
      <SectionTitle title="Demandes de boost" />
      <div className="grid gap-3">
        {boostRequests.map((request) => (
          <article key={request.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-blue-700">{request.company}</p>
                <h3 className="mt-1 text-lg font-bold text-slate-950">{request.jobTitle}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Plan {request.plan} - {request.createdAt ? new Date(request.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
                </p>
              </div>
              <span className={classNames('w-fit rounded-full px-3 py-1 text-xs font-bold', request.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : request.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800')}>
                {request.status === 'approved' ? 'Valide' : request.status === 'rejected' ? 'Rejete' : 'En attente'}
              </span>
            </div>
            {request.message && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-700">{request.message}</p>}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => reviewBoostRequest(request.id, 'approved')} disabled={request.status === 'approved'} className="min-h-11 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">
                Valider
              </button>
              <button type="button" onClick={() => reviewBoostRequest(request.id, 'rejected')} disabled={request.status === 'rejected'} className="min-h-11 rounded-lg border border-red-200 px-4 text-sm font-bold text-red-700 transition hover:border-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500">
                Rejeter
              </button>
            </div>
          </article>
        ))}
        {boostRequests.length === 0 && <EmptyState title="Aucune demande" body="Les demandes de boost apparaitront ici quand un recruteur enverra une demande." />}
      </div>
    </div>
  );
}

function PostJobScreen({ form, setForm, onSubmit, setScreen, editing, cancelEdit, notify }) {
  const notifyInvalid = useInvalidNotice(notify, 'Complete le titre, l entreprise et la description avant d envoyer.');
  const notifySubmitBlocker = () => {
    if (!form.role.trim() || !form.company.trim() || !form.description.trim()) notifyInvalid();
  };
  return (
    <div className="space-y-4">
      <BackButton onClick={editing ? cancelEdit : () => setScreen('recruiter')} label="Recruteur" />
      <PageHeader title={editing ? 'Modifier' : 'Publier'} subtitle={editing ? "Modifier l'offre d'emploi" : "Nouvelle offre d'emploi"} />
      <form onSubmit={onSubmit} onInvalidCapture={notifyInvalid} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        <TextField label="Titre du poste" value={form.role} onChange={(role) => setForm({ ...form, role })} required />
        <TextField label="Entreprise" value={form.company} onChange={(company) => setForm({ ...form, company })} required />
        <SelectField label="Ville" value={form.loc} onChange={(loc) => setForm({ ...form, loc })} options={CONGO_CITIES} />
        <SelectField label="Contrat" value={form.type} onChange={(type) => setForm({ ...form, type })} options={CONTRACT_TYPES} />
        <TextField label="Salaire" value={form.salary} onChange={(salary) => setForm({ ...form, salary })} placeholder="Attractif, 500k XAF, Negociable..." />
        <TextField label="Secteur" value={form.sector} onChange={(sector) => setForm({ ...form, sector })} />
        <TextArea label="Description" value={form.description} onChange={(description) => setForm({ ...form, description })} required />
        <div className="grid gap-2 sm:grid-cols-2">
          {editing && (
            <button type="button" onClick={cancelEdit} className="min-h-12 rounded-lg border border-slate-300 px-5 font-bold text-slate-700 transition hover:border-blue-700 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
              Annuler
            </button>
          )}
          <button type="submit" onClick={notifySubmitBlocker} className={classNames('min-h-12 rounded-lg bg-blue-700 px-5 font-bold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600', editing ? '' : 'sm:col-span-2')}>
            {editing ? "Enregistrer l'offre" : "Publier l'offre"}
          </button>
        </div>
      </form>
    </div>
  );
}

function NotificationsScreen({ notifications, setNotifications }) {
  return (
    <div className="space-y-5">
      <PageHeader title="Notifications" subtitle={`${notifications.length} message(s)`} />
      <button onClick={() => setNotifications((items) => items.map((item) => ({ ...item, read: true })))} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-700">
        Tout marquer comme lu
      </button>
      <div className="grid gap-3">
        {notifications.map((item) => (
          <div key={item.id} className={classNames('rounded-lg border p-4', item.read ? 'border-slate-200 bg-white' : 'border-blue-200 bg-blue-50')}>
            <h3 className="font-bold">{item.title}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-600">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsScreen({ serviceStatus }) {
  const statusCopy = {
    online: {
      title: 'Service operationnel',
      body: 'Les comptes, offres, candidatures et CV sont geres de facon securisee.',
      tone: 'bg-emerald-600',
    },
    checking: {
      title: 'Verification en cours',
      body: 'Le service verifie la connexion aux comptes, offres, candidatures et CV.',
      tone: 'bg-blue-700',
    },
    degraded: {
      title: 'Service a verifier',
      body: "Les donnees peuvent prendre du retard. L'equipe projet doit verifier la connexion de production.",
      tone: 'bg-amber-500',
    },
    offline: {
      title: 'Configuration requise',
      body: "La connexion de production doit etre configuree avant d'utiliser les comptes et les CV.",
      tone: 'bg-slate-700',
    },
  };
  const copy = statusCopy[serviceStatus] || statusCopy.checking;
  return (
    <div className="space-y-5">
      <PageHeader title="Parametres" subtitle="Gestion du compte et de la plateforme" />
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className={classNames('flex h-11 w-11 items-center justify-center rounded-lg text-white', copy.tone)}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="font-bold">{copy.title}</h2>
            <p className="text-sm font-semibold text-slate-500">{copy.body}</p>
          </div>
        </div>
        <div className="mt-5 rounded-lg bg-slate-100 p-4 text-sm font-semibold leading-7 text-slate-700">
          Tu peux utiliser le site normalement. Les informations techniques restent reservees a l'equipe projet.
        </div>
      </div>
    </div>
  );
}

function SearchPanel({ query, setQuery, city, setCity, clearSearch, showCity = true, onSubmit }) {
  const cityOptions = ['Toutes', ...CONGO_CITIES];
  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit?.(); }}>
      <div className={classNames('grid gap-2', showCity ? 'md:grid-cols-[1fr_220px]' : '')}>
        <label className="search-field">
          <Search size={19} className="shrink-0 text-slate-700" />
          <span className="sr-only">Métier ou mot-clé</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Métier ou mot-clé" aria-label="Métier ou mot-clé" className="min-w-0 flex-1 bg-transparent text-base text-slate-950 outline-none placeholder:text-slate-500" />
          {query && (
            <button type="button" onClick={clearSearch} aria-label="Effacer la recherche" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
              <X size={18} />
            </button>
          )}
        </label>
        {showCity && (
        <label className="search-field">
          <MapPin size={18} className="text-slate-400" />
          <span className="sr-only">Ville</span>
          <select value={city} onChange={(event) => setCity(event.target.value)} aria-label="Ville" className="w-full bg-transparent text-base text-slate-950 outline-none">
            {cityOptions.map((option) => <option key={option} value={option}>{option === 'Toutes' ? 'Toutes les villes' : option}</option>)}
          </select>
        </label>
        )}
      </div>
    </form>
  );
}

function JobCard({ job, onClick, saved, onSave }) {
  return (
    <article className="job-card">
      <div className="flex items-start gap-3">
        <button onClick={onClick} className="flex min-w-0 flex-1 items-start gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
          <span className="company-mark">
            <Building2 size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-bold leading-6 text-slate-950 md:text-[17px]">{job.role}</span>
            <span className="mt-0.5 block text-sm text-slate-700">{job.company}</span>
            <span className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
              <MapPin size={15} /> {job.loc}
            </span>
            <span className="mt-3 flex flex-wrap gap-2">
              <span className="neutral-chip">{job.type}</span>
              <span className="neutral-chip">{job.sector || 'Tous secteurs'}</span>
            </span>
            <span className="mt-3 block text-xs text-slate-500">{formatRelativeDate(job.createdAt)}</span>
          </span>
        </button>
        {onSave && (
          <button onClick={onSave} aria-label={saved ? 'Retirer des favoris' : 'Sauvegarder'} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
            <Bookmark size={20} fill={saved ? 'currentColor' : 'none'} className={saved ? 'text-blue-700' : ''} />
          </button>
        )}
      </div>
    </article>
  );
}

function TextField({ label, value, onChange, type = 'text', required, placeholder, disabled = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-800">{label}</span>
      <input type={type} required={required} disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base outline-none transition-colors placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-500 focus:border-blue-700 focus:ring-2 focus:ring-blue-600/20" />
    </label>
  );
}

function PasswordField({ label, value, onChange, required, placeholder, visible, onToggle }) {
  const inputId = useId();

  return (
    <div className="block">
      <label htmlFor={inputId} className="mb-2 block text-sm font-semibold text-slate-800">{label}</label>
      <span className="flex min-h-12 w-full items-center rounded-lg border border-slate-300 bg-white pr-2 transition-colors focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-600/20">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-h-12 min-w-0 flex-1 rounded-lg bg-transparent px-3 text-base outline-none"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          aria-pressed={visible}
          className={classNames(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600',
            visible ? 'text-blue-700 hover:bg-blue-50' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
          )}
        >
          {visible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </span>
    </div>
  );
}

function TextArea({ label, value, onChange, required, placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-800">{label}</span>
      <textarea required={required} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={4} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base outline-none transition-colors placeholder:text-slate-400 focus:border-blue-700 focus:ring-2 focus:ring-blue-600/20" />
    </label>
  );
}

function CvUpload({ cvName, cvSize, onChange }) {
  const readableSize = cvSize ? `${(cvSize / 1024 / 1024).toFixed(2)} Mo` : '';
  return (
    <div>
      <span className="mb-2 block text-sm font-semibold text-slate-800">CV PDF</span>
      <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition-colors hover:border-blue-500 hover:bg-blue-50 focus-within:ring-2 focus-within:ring-blue-600">
        <FileText size={26} className="text-blue-700" />
        <span className="mt-2 text-sm font-semibold text-slate-900">{cvName || 'Ajouter mon CV'}</span>
        <span className="mt-1 text-xs text-slate-500">{cvName ? readableSize : `PDF uniquement, ${MAX_CV_LABEL} maximum`}</span>
        <input type="file" accept="application/pdf,.pdf" onChange={onChange} className="sr-only" />
      </label>
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-800">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base outline-none transition-colors focus:border-blue-700 focus:ring-2 focus:ring-blue-600/20">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function StepPill({ label, active, done }) {
  return (
    <div className={classNames('rounded-lg border px-3 py-2 text-center text-xs font-semibold transition', done ? 'border-blue-200 bg-blue-50 text-blue-700' : active ? 'border-blue-200 bg-white text-blue-700' : 'border-slate-200 bg-white text-slate-500')}>
      {label}
    </div>
  );
}

function BrandLogo() {
  return (
    <span className="text-[19px] font-bold tracking-[-0.03em] text-blue-700">NZELA JOBS</span>
  );
}

function BackButton({ onClick, label }) {
  return (
    <button onClick={onClick} className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600">
      <ArrowLeft size={18} /> {label}
    </button>
  );
}

function PageHeader({ title, subtitle }) {
  return (
    <div>
      <h1 className="text-[1.75rem] font-bold tracking-[-0.025em] text-slate-950 md:text-4xl">{title}</h1>
      <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function SectionTitle({ title, action, onAction }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      {action && <button onClick={onAction} className="flex min-h-11 items-center gap-1 rounded-lg px-1 text-sm font-semibold text-blue-700">{action}<ChevronRight size={16} /></button>}
    </div>
  );
}

function EmptyState({ title, body, action, onAction }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-7 text-center">
      <ClipboardList className="mx-auto text-slate-400" size={34} />
      <h3 className="mt-3 font-bold text-slate-950">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-500">{body}</p>
      {action && onAction && <button onClick={onAction} className="secondary-button mt-4">{action}</button>}
    </div>
  );
}

function Metric({ value, label }) {
  return (
    <div className="px-2 text-center">
      <p className="text-2xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-[11px] text-slate-600 sm:text-xs">{label}</p>
    </div>
  );
}

function StatCard({ value, label }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
      <p className="text-xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}
