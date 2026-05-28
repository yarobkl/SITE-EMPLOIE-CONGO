import React, { useEffect, useId, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Bookmark,
  Briefcase,
  Building2,
  Check,
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
  LogOut,
  MapPin,
  PlusCircle,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import { hasSupabaseConfig, supabase } from './lib/supabase';

const initialJobs = [
  {
    id: 1,
    company: 'TotalEnergies EP Congo',
    role: 'Ingenieur HSE Senior',
    loc: 'Pointe-Noire',
    type: 'CDI',
    salary: 'Top Range',
    sector: 'Energie',
    description: "Nous recherchons un profil HSE experimente pour accompagner les operations terrain et renforcer la culture securite.",
    requirements: ['5+ ans experience', 'Certification HSE', 'Anglais professionnel'],
    status: 'published',
  },
  {
    id: 2,
    company: 'MTN Congo',
    role: 'Chef de Projet Digital',
    loc: 'Brazzaville',
    type: 'CDD',
    salary: 'Negociable',
    sector: 'Telecom',
    description: 'Pilotage de projets digitaux, coordination produit et suivi des livraisons avec les equipes metier.',
    requirements: ['Gestion agile', 'Budget projet', 'Reporting executif'],
    status: 'published',
  },
  {
    id: 3,
    company: 'BGFIBank Congo',
    role: 'Auditeur Interne',
    loc: 'Brazzaville',
    type: 'CDI',
    salary: 'Attractif',
    sector: 'Banque',
    description: 'Audit des processus, controle interne et accompagnement des plans de remediation.',
    requirements: ['Audit bancaire', 'Rigueur', 'Maitrise Excel'],
    status: 'published',
  },
  {
    id: 4,
    company: 'Airtel Congo',
    role: 'Developpeur Backend',
    loc: 'Pointe-Noire',
    type: 'Hybride',
    salary: 'Expert',
    sector: 'Tech',
    description: 'Developpement et maintenance d APIs pour les services digitaux et les integrations internes.',
    requirements: ['Node.js ou Python', 'APIs REST', 'SQL/NoSQL'],
    status: 'published',
  },
  {
    id: 5,
    company: 'Congo Logistique',
    role: 'Responsable Logistique',
    loc: 'Dolisie',
    type: 'CDI',
    salary: 'Competitif',
    sector: 'Transport',
    description: 'Optimisation des flux, gestion entrepot et coordination transport national.',
    requirements: ['4+ ans logistique', 'WMS', 'Leadership terrain'],
    status: 'published',
  },
];

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

const MAX_CV_BYTES = 2 * 1024 * 1024;
const MAX_CV_LABEL = '2 Mo';
const OAUTH_PROVIDERS = [
  { provider: 'google', label: 'Google' },
  { provider: 'facebook', label: 'Facebook' },
];

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

export default function App() {
  const [screen, setScreen] = useState('home');
  const [selectedJob, setSelectedJob] = useState(null);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('Toutes');
  const [toast, setToast] = useState('');
  const [authMode, setAuthMode] = useState('signin');
  const [loginRole, setLoginRole] = useState('candidat');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(hasSupabaseConfig);
  const [applicationForm, setApplicationForm] = useState(emptyApplication);
  const [jobForm, setJobForm] = useState(emptyJob);
  const [editingJob, setEditingJob] = useState(null);

  const [jobs, setJobs] = useStoredState('congoemploi.v2.jobs', initialJobs);
  const [profile, setProfile] = useStoredState('congoemploi.v2.profile', initialProfile);
  const [savedIds, setSavedIds] = useStoredState('congoemploi.v2.savedIds', []);
  const [applications, setApplications] = useStoredState('congoemploi.v2.applications', []);
  const [recruiterJobs, setRecruiterJobs] = useState([]);
  const [recruiterApplications, setRecruiterApplications] = useState([]);
  const [recruiterJobStats, setRecruiterJobStats] = useState({});
  const [notifications, setNotifications] = useStoredState('congoemploi.v2.notifications', [
    { id: 1, title: 'Bienvenue sur CONGOEMPLOI', body: 'Votre espace mobile est pret.', read: false },
  ]);
  const isLoggedIn = Boolean(authUser);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) return;
    let cancelled = false;
    async function loadJobs() {
      const { data, error } = await supabase
        .from('jobs')
        .select('id,company_id,title,description,location,contract_type,salary_range,sector,requirements,status,companies(name)')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (error) {
        return;
      }
      if (data?.length) {
        setJobs(data.map(normalizeJob));
      }
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
      const { data } = await supabase.auth.getSession();
      if (!active) return;
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
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('nom,prenom,email,phone,city,role,title')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!cancelled) {
        if (profileRow) {
          setProfile((current) => ({ ...current, ...profileRow, email: profileRow.email || authUser.email || current.email }));
        } else {
          const metadata = authUser.user_metadata || {};
          const pendingRole = readStorage('congoemploi.pendingLoginRole', 'candidat');
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
          await supabase.from('profiles').upsert(nextProfile);
          localStorage.removeItem('congoemploi.pendingLoginRole');
          setProfile((current) => ({ ...current, ...nextProfile }));
        }
      }

      const { data: userApplications } = await supabase
        .from('applications')
        .select('id,job_id,candidate_id,nom,email,phone,message,cv_url,cv_name,cv_size,tracking_enabled,application_opened,cv_opened,status,created_at,jobs(title,companies(name))')
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
      if (!companyIds.length) {
        if (!cancelled) {
          setRecruiterJobs([]);
          setRecruiterApplications([]);
        }
        return;
      }

      const { data: ownedJobs } = await supabase
        .from('jobs')
        .select('id,company_id,title,description,location,contract_type,salary_range,sector,requirements,status,companies(name)')
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
        .select('id,job_id,candidate_id,nom,email,phone,message,cv_url,cv_name,cv_size,tracking_enabled,application_opened,cv_opened,status,created_at,jobs(title,companies(name))')
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
    return publishedJobs.filter((job) => {
      const matchesQuery = !needle || [job.role, job.company, job.sector].some((value) => value.toLowerCase().includes(needle));
      const matchesCity = city === 'Toutes' || job.loc === city;
      return matchesQuery && matchesCity;
    });
  }, [publishedJobs, query, city]);

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
    if (loginPassword.length < 6) {
      notify('Mot de passe: 6 caracteres minimum.');
      return;
    }

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
        notify(error.message);
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
      notify(error.message);
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
  };

  const handleOAuthSignIn = async (provider) => {
    if (!hasSupabaseConfig || !supabase) {
      notify('Connexion indisponible pour le moment.');
      return;
    }
    localStorage.setItem('congoemploi.pendingLoginRole', JSON.stringify(loginRole));
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) notify(error.message);
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
    if (!applicationForm.cvName) {
      notify(`Ajoute un CV PDF de ${MAX_CV_LABEL} maximum.`);
      return;
    }
    if (applicationForm.mode === 'tracked' && !isLoggedIn) {
      notify('Connecte-toi pour suivre cette candidature.');
      openLogin('candidat');
      return;
    }
    const trackingEnabled = applicationForm.mode === 'tracked' && isLoggedIn;
    let cvPath = '';
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
        return;
      }
    }
    const { cvFile, ...applicationValues } = applicationForm;
    const application = {
      id: Date.now(),
      jobId: activeJob.id,
      jobRole: activeJob.role,
      company: activeJob.company,
      status: 'pending',
      trackingEnabled,
      applicationOpened: false,
      cvOpened: false,
      createdAt: new Date().toISOString(),
      cvPath,
      ...applicationValues,
      nom: applicationForm.nom || `${profile.prenom} ${profile.nom}`.trim(),
      email: applicationForm.email || profile.email,
      phone: applicationForm.phone || profile.phone,
    };
    setApplications((current) => [application, ...current]);
    if (hasSupabaseConfig && supabase) {
      const { error } = await supabase.from('applications').insert({
        job_id: typeof activeJob.id === 'string' ? activeJob.id : null,
        candidate_id: trackingEnabled && authUser ? authUser.id : null,
        nom: application.nom,
        email: application.email,
        phone: application.phone,
        message: application.message,
        cv_url: cvPath,
        cv_name: application.cvName,
        cv_size: application.cvSize || 0,
        tracking_enabled: application.trackingEnabled,
        application_opened: false,
        cv_opened: false,
        status: 'pending',
      });
      if (error) notify('Candidature gardee localement, base indisponible.');
    }
    const nextNotification = {
      id: Date.now(),
      title: trackingEnabled ? 'Candidature suivie envoyee' : 'Candidature rapide envoyee',
      body: trackingEnabled ? `${activeJob.role}: le suivi temps reel est actif.` : `${activeJob.role}: CV recu, sans suivi temps reel.`,
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
    notify('Candidature envoyee au recruteur');
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
      const opened = await openCvFile(currentApplication, 'open');
      if (!opened) return;
    }

    const wasAlreadyOpened = Boolean(currentApplication[field]);
    const changedApplication = wasAlreadyOpened
      ? currentApplication
      : { ...currentApplication, [field]: true, status: 'reviewed' };
    const updateItem = (item) => {
      if (item.id !== applicationId) return item;
      return item[field] ? item : { ...item, [field]: true, status: 'reviewed' };
    };
    setApplications((current) => current.map(updateItem));
    setRecruiterApplications((current) => current.map(updateItem));

    if (!wasAlreadyOpened && hasSupabaseConfig && supabase && typeof applicationId === 'string') {
      await supabase
        .from('applications')
        .update({
          [field === 'cvOpened' ? 'cv_opened' : 'application_opened']: true,
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
      if (!companyError && company?.id) {
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
          .select('id,company_id,title,description,location,contract_type,salary_range,sector,requirements,status,companies(name)')
          .single();
        if (!jobError && savedJob) {
          nextJob.id = savedJob.id;
          nextJob.companyId = savedJob.company_id;
        }
      }
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

  const navItems = [
    { id: 'home', label: 'Accueil', icon: Home },
    { id: 'jobs', label: 'Offres', icon: Briefcase },
    { id: 'recruiter', label: 'Recruteur', icon: LayoutDashboard },
    { id: 'saved', label: 'Favoris', icon: Bookmark },
    { id: 'profile', label: 'Profil', icon: User },
  ];

  const renderScreen = () => {
    if (screen === 'jobs') return <JobsScreen jobs={filteredJobs} query={query} setQuery={setQuery} city={city} setCity={setCity} clearSearch={clearSearch} openJob={openJob} setScreen={setScreen} savedIds={savedIds} toggleSave={toggleSave} />;
    if (screen === 'job') return <JobScreen job={activeJob} saved={savedIds.includes(activeJob?.id)} toggleSave={toggleSave} setScreen={setScreen} />;
    if (screen === 'apply') return <ApplyScreen job={activeJob} form={applicationForm} setForm={setApplicationForm} submitApplication={submitApplication} setScreen={setScreen} openLogin={openLogin} isLoggedIn={isLoggedIn} profile={profile} notify={notify} />;
    if (screen === 'saved') return <SavedScreen jobs={savedJobs} openJob={openJob} />;
    if (screen === 'profile') return <ProfileScreen profile={profile} setProfile={setProfile} applications={applications} updateProfile={updateProfile} setScreen={setScreen} openLogin={openLogin} openRecruiterSpace={openRecruiterSpace} isLoggedIn={isLoggedIn} authLoading={authLoading} handleLogout={handleLogout} hasPublishedOffer={hasPublishedOffer} />;
    if (screen === 'login') return <LoginScreen authMode={authMode} setAuthMode={setAuthMode} loginRole={loginRole} setLoginRole={setLoginRole} loginEmail={loginEmail} setLoginEmail={setLoginEmail} loginPassword={loginPassword} setLoginPassword={setLoginPassword} handleAuth={handleAuth} handleOAuthSignIn={handleOAuthSignIn} setScreen={setScreen} />;
    if (screen === 'recruiter') return <RecruiterScreen jobs={recruiterJobs} applications={recruiterApplications} stats={recruiterJobStats} setScreen={setScreen} openLogin={openLogin} markApplicationActivity={markApplicationActivity} downloadApplicationCv={downloadApplicationCv} startEditJob={startEditJob} deleteJob={deleteJob} isLoggedIn={isLoggedIn} role={profile.role} />;
    if (screen === 'post-job') return <PostJobScreen form={jobForm} setForm={setJobForm} onSubmit={editingJob ? saveJobEdit : publishJob} setScreen={setScreen} editing={Boolean(editingJob)} cancelEdit={() => { setEditingJob(null); setJobForm(emptyJob); setScreen('recruiter'); }} />;
    if (screen === 'notifications') return <NotificationsScreen notifications={notifications} setNotifications={setNotifications} />;
    if (screen === 'settings') return <SettingsScreen />;
    return <HomeScreen jobs={filteredJobs.slice(0, 3)} totalJobs={publishedJobs.length} query={query} setQuery={setQuery} city={city} setCity={setCity} clearSearch={clearSearch} openJob={openJob} setScreen={setScreen} openLogin={openLogin} />;
  };

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm shadow-slate-200/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <button onClick={() => setScreen('home')} className="smooth-button flex min-h-11 items-center gap-3 rounded-lg px-1 text-left hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600">
            <BrandLogo />
            <div>
              <p className="text-[15px] font-black leading-none text-slate-950">CONGO<span className="text-blue-700">EMPLOI</span></p>
            </div>
          </button>

          <div className="flex items-center gap-1">
            <IconButton label="Notifications" onClick={() => setScreen('notifications')} badge={unreadCount}>
              <Bell size={20} />
            </IconButton>
            <IconButton label="Profil" onClick={() => setScreen('profile')}>
              <User size={20} />
            </IconButton>
            <IconButton label="Recruteur" onClick={openRecruiterSpace}>
              <LayoutDashboard size={20} />
            </IconButton>
            <IconButton label="Parametres" onClick={() => setScreen('settings')}>
              <Settings size={20} />
            </IconButton>
          </div>
        </div>
      </header>

      <main key={screen} className="soft-enter mx-auto max-w-6xl px-4 pb-28 pt-5 md:pb-10">
        {renderScreen()}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = screen === item.id || (item.id === 'jobs' && ['job', 'apply'].includes(screen));
            return (
              <button
                key={item.id}
                onClick={() => (item.id === 'recruiter' ? openRecruiterSpace() : setScreen(item.id))}
                className={classNames('smooth-button flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600', active ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800')}
              >
                <Icon size={21} fill={active ? 'currentColor' : 'none'} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {toast && (
        <div className="soft-enter fixed bottom-24 left-4 right-4 z-[60] mx-auto max-w-sm rounded-lg border border-blue-100 bg-white px-4 py-3 text-center text-sm font-bold text-slate-900 shadow-lg shadow-blue-900/10 md:bottom-6">
          {toast}
        </div>
      )}
    </div>
  );
}

function IconButton({ label, children, onClick, badge }) {
  return (
    <button onClick={onClick} aria-label={label} className="smooth-button relative flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
      {children}
      {badge > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />}
    </button>
  );
}

function HomeScreen({ jobs, totalJobs, query, setQuery, city, setCity, clearSearch, openJob, setScreen, openLogin }) {
  return (
    <div className="space-y-6">
      <section className="app-surface p-5 md:grid md:grid-cols-[1.2fr_0.8fr] md:gap-8 md:p-8">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            <ShieldCheck size={14} /> Brazzaville, Pointe-Noire et les departements
          </div>
          <h1 className="max-w-2xl text-3xl font-black leading-tight text-slate-950 md:text-5xl">
            Trouver un emploi ou recruter au Congo, depuis ton telephone.
          </h1>
          <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-slate-600">
            Une experience mobile simple pour chercher, sauvegarder, postuler et publier une offre.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-2">
            <Metric value={totalJobs} label="Offres" />
            <Metric value="PDF" label="CV requis" />
            <Metric value="Suivi" label="Candidatures" />
          </div>
        </div>
        <div className="rounded-lg mt-6 bg-slate-50 p-3 text-slate-950 ring-1 ring-slate-100 md:mt-0">
          <SearchPanel query={query} setQuery={setQuery} city={city} setCity={setCity} clearSearch={clearSearch} compact onSubmit={() => setScreen('jobs')} />
          <button onClick={() => setScreen('jobs')} className="smooth-button mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 font-black text-white shadow-sm shadow-blue-900/20 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600">
            Rechercher <Search size={18} />
          </button>
          <button onClick={() => openLogin('recruteur')} className="smooth-button mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 font-black text-slate-950 hover:border-blue-700 hover:bg-white hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
            Publier une offre <PlusCircle size={18} />
          </button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <ActionCard icon={User} title="Candidat" body="Postule en moins d'une minute." onClick={() => openLogin('candidat')} />
        <ActionCard icon={Building2} title="Recruteur" body="Publie une offre et suis les candidatures." onClick={() => openLogin('recruteur')} />
        <ActionCard icon={Sparkles} title="Plateforme fiable" body="Comptes, candidatures et CV restent disponibles dans ton espace." onClick={() => setScreen('settings')} />
      </section>

      <SectionTitle title="Offres recentes" action="Tout voir" onAction={() => setScreen('jobs')} />
      <div className="grid gap-3">
        {jobs.map((job) => <JobCard key={job.id} job={job} onClick={() => openJob(job)} onApply={() => openJob(job, 'apply')} />)}
      </div>
    </div>
  );
}

function JobsScreen({ jobs, query, setQuery, city, setCity, clearSearch, openJob, setScreen, savedIds, toggleSave }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader title="Offres" subtitle={`${jobs.length} resultat(s) disponible(s)`} />
        <button onClick={() => setScreen('recruiter')} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-black text-blue-700 transition hover:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
          <LayoutDashboard size={17} /> Espace recruteur
        </button>
      </div>
      <SearchPanel query={query} setQuery={setQuery} city={city} setCity={setCity} clearSearch={clearSearch} />
      <div className="grid gap-3 lg:grid-cols-2">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} onClick={() => openJob(job)} onApply={() => openJob(job, 'apply')} saved={savedIds.includes(job.id)} onSave={() => toggleSave(job)} />
        ))}
      </div>
      {jobs.length === 0 && <EmptyState title="Aucune offre trouvee" body="Modifie la ville ou le mot cle pour relancer la recherche." action="Reinitialiser" onAction={clearSearch} />}
    </div>
  );
}

function JobScreen({ job, saved, toggleSave, setScreen }) {
  if (!job) return <EmptyState title="Offre introuvable" body="Retourne a la liste des offres." />;
  return (
    <div className="space-y-4">
      <BackButton onClick={() => setScreen('jobs')} label="Retour aux offres" />
      <article className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-blue-700">{job.company}</p>
            <h1 className="mt-1 text-3xl font-black leading-tight text-slate-950">{job.role}</h1>
          </div>
          <button onClick={() => toggleSave(job)} aria-label="Sauvegarder" className={classNames('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-blue-600', saved ? 'border-blue-700 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500')}>
            <Bookmark size={20} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
          <InfoPill label="Ville" value={job.loc} />
          <InfoPill label="Contrat" value={job.type} />
          <InfoPill label="Salaire" value={job.salary || 'A discuter'} />
          <InfoPill label="Secteur" value={job.sector || 'General'} />
        </div>
        <div className="mt-6 space-y-5">
          <div>
            <h2 className="text-lg font-black">Mission</h2>
            <p className="mt-2 leading-7 text-slate-600">{job.description}</p>
          </div>
          <div>
            <h2 className="text-lg font-black">Profil recherche</h2>
            <ul className="mt-2 space-y-2">
              {job.requirements.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Check size={17} className="text-emerald-600" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <button onClick={() => setScreen('apply')} className="sticky bottom-20 mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 font-black text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 md:static">
          Postuler maintenant <Send size={18} />
        </button>
      </article>
    </div>
  );
}

function ApplyScreen({ job, form, setForm, submitApplication, setScreen, openLogin, isLoggedIn, profile, notify }) {
  const trackingEnabled = form.mode === 'tracked';
  const contactReady = Boolean((form.nom || profile.nom || profile.prenom) && (form.email || profile.email) && (form.phone || profile.phone));
  const fillFromProfile = () => {
    setForm({
      ...form,
      nom: `${profile.prenom} ${profile.nom}`.trim(),
      email: profile.email,
      phone: profile.phone,
    });
    notify('Profil ajoute a la candidature');
  };
  const handleCvChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      event.target.value = '';
      setForm({ ...form, cvName: '', cvSize: 0, cvType: '', cvFile: null });
      notify('Le CV doit etre un fichier PDF.');
      return;
    }
    if (file.size > MAX_CV_BYTES) {
      event.target.value = '';
      setForm({ ...form, cvName: '', cvSize: 0, cvType: '', cvFile: null });
      notify(`Le CV ne doit pas depasser ${MAX_CV_LABEL}.`);
      return;
    }
    setForm({ ...form, cvName: file.name, cvSize: file.size, cvType: file.type || 'application/pdf', cvFile: file });
    notify('CV PDF ajoute');
  };

  return (
    <div className="space-y-4">
      <BackButton onClick={() => setScreen('job')} label="Retour" />
      <PageHeader title="Postuler" subtitle={`${job.role} - ${job.company}`} />
      <div className="grid grid-cols-3 gap-2">
        <StepPill active done label="Mode" />
        <StepPill active={contactReady} done={contactReady} label="Contact" />
        <StepPill active={Boolean(form.cvName)} done={Boolean(form.cvName)} label="CV" />
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setForm({ ...form, mode: 'tracked' })}
          className={classNames('rounded-lg border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-600', trackingEnabled ? 'border-blue-700 bg-blue-50' : 'border-slate-200 bg-white')}
        >
          <div className="flex items-center gap-2 font-black text-slate-950">
            <ShieldCheck size={19} className="text-blue-700" /> Candidature suivie
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Connexion requise. Tu vois si l'employeur ouvre ta demande ou ton CV, avec notifications et KPI.</p>
        </button>
        <button
          type="button"
          onClick={() => setForm({ ...form, mode: 'quick' })}
          className={classNames('rounded-lg border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-600', !trackingEnabled ? 'border-blue-700 bg-blue-50' : 'border-slate-200 bg-white')}
        >
          <div className="flex items-center gap-2 font-black text-slate-950">
            <Send size={19} className="text-blue-700" /> Candidature rapide
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Ton CV est recu par le recruteur, mais tu n'as pas de suivi temps reel du dossier.</p>
        </button>
      </div>
      {trackingEnabled && !isLoggedIn && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold leading-6 text-amber-900">Connecte-toi pour activer le suivi de candidature.</p>
          <button onClick={() => openLogin('candidat')} className="mt-3 min-h-11 rounded-lg bg-blue-700 px-4 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-blue-600">
            Se connecter
          </button>
        </div>
      )}
      <form onSubmit={submitApplication} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        {isLoggedIn && (
          <button type="button" onClick={fillFromProfile} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700 transition hover:border-blue-700 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
            Utiliser mon profil
          </button>
        )}
        <TextField label="Nom complet" value={form.nom} onChange={(nom) => setForm({ ...form, nom })} required placeholder="Ex: Grace Moungala" />
        <TextField label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} required placeholder="nom@email.com" />
        <TextField label="Telephone" type="tel" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} required placeholder="+242 06 ..." />
        <TextArea label="Message au recruteur" value={form.message} onChange={(message) => setForm({ ...form, message })} placeholder="Disponibilite, experience, motivation..." />
        <CvUpload cvName={form.cvName} cvSize={form.cvSize} onChange={handleCvChange} />
        <button type="submit" className="sticky bottom-20 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 font-black text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 md:static">
          {trackingEnabled ? 'Envoyer et suivre' : 'Envoyer rapidement'} <Send size={18} />
        </button>
      </form>
    </div>
  );
}

function SavedScreen({ jobs, openJob }) {
  return (
    <div className="space-y-5">
      <PageHeader title="Favoris" subtitle={`${jobs.length} offre(s) sauvegardee(s)`} />
      <div className="grid gap-3">
        {jobs.map((job) => <JobCard key={job.id} job={job} onClick={() => openJob(job)} />)}
      </div>
      {jobs.length === 0 && <EmptyState title="Aucun favori" body="Sauvegarde les offres interessantes pour les retrouver ici." />}
    </div>
  );
}

function ProfileScreen({ profile, setProfile, applications, updateProfile, setScreen, openLogin, openRecruiterSpace, isLoggedIn, authLoading, handleLogout, hasPublishedOffer }) {
  const trackedApplications = applications.filter((item) => item.trackingEnabled);
  const cvOpenedCount = trackedApplications.filter((item) => item.cvOpened).length;
  const applicationOpenedCount = trackedApplications.filter((item) => item.applicationOpened).length;
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

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <PageHeader title="Profil" subtitle={authLoading ? 'Verification de la session...' : isLoggedIn ? (isRecruiter ? 'Compte recruteur et informations du compte' : 'Candidat et suivi des candidatures') : 'Connecte-toi pour activer le suivi temps reel'} />
        {isLoggedIn && (
          <button onClick={handleLogout} className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700 transition hover:border-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-600">
            <LogOut size={17} /> Deconnexion
          </button>
        )}
      </div>
      {!isLoggedIn && !authLoading && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-bold leading-6 text-blue-950">Cree ton compte ou connecte-toi pour retrouver ton profil, tes favoris, tes CV et le suivi de tes candidatures.</p>
          <button onClick={() => openLogin('candidat')} className="mt-3 min-h-11 rounded-lg bg-blue-700 px-4 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-blue-600">
            Connexion candidat
          </button>
        </div>
      )}
      {isLoggedIn && isRecruiter && (
        <button onClick={openRecruiterSpace} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 font-black text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600">
          <LayoutDashboard size={18} /> {hasPublishedOffer ? 'Aller a mon espace recruteur' : 'Publier ma premiere offre'}
        </button>
      )}

      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[0.9fr_1.1fr] md:p-5">
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-blue-700 text-white">
            {profile.avatarDataUrl ? (
              <img src={profile.avatarDataUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-black">{getInitials(profile)}</div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-blue-700">{isRecruiter ? 'Recruteur' : 'Candidat'}</p>
            <h2 className="mt-1 truncate text-xl font-black text-slate-950">{displayName}</h2>
            <p className="mt-1 truncate text-sm font-semibold text-slate-500">{profile.title || 'Titre a completer'} - {profile.city}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-slate-300 px-3 text-xs font-black text-slate-700 transition hover:border-blue-700 hover:text-blue-700 focus-within:ring-2 focus-within:ring-blue-600">
                Ajouter une photo
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="sr-only" />
              </label>
              {profile.avatarDataUrl && (
                <button type="button" onClick={() => setProfile({ ...profile, avatarDataUrl: '' })} className="min-h-10 rounded-lg border border-red-200 px-3 text-xs font-black text-red-700 transition hover:border-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-600">
                  Retirer
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <StatCard value={trackedApplications.length} label="Suivies" />
          <StatCard value={applicationOpenedCount} label="Demandes vues" />
          <StatCard value={cvOpenedCount} label="CV ouverts" />
        </div>
      </div>

      <form onSubmit={updateProfile} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-2">
        <TextField label="Nom" value={profile.nom} onChange={(nom) => setProfile({ ...profile, nom })} />
        <TextField label="Prenom" value={profile.prenom} onChange={(prenom) => setProfile({ ...profile, prenom })} />
        <TextField label="Email" type="email" value={profile.email} onChange={(email) => setProfile({ ...profile, email })} disabled={isLoggedIn} />
        <TextField label="Telephone" type="tel" value={profile.phone} onChange={(phone) => setProfile({ ...profile, phone })} />
        <SelectField label="Ville" value={profile.city} onChange={(city) => setProfile({ ...profile, city })} options={CONGO_CITIES} />
        <TextField label="Titre" value={profile.title} onChange={(title) => setProfile({ ...profile, title })} />
        <SelectField label="Type de compte" value={profile.role} onChange={(role) => setProfile({ ...profile, role })} options={['candidat', 'recruteur']} />
        <button type="submit" className="min-h-12 rounded-lg bg-blue-700 px-5 font-black text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 md:col-span-2">
          Enregistrer
        </button>
      </form>

      <SectionTitle title="Mes candidatures" action="Chercher" onAction={() => setScreen('jobs')} />
      <div className="grid gap-3">
        {applications.map((item) => (
          <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-black">{item.jobRole}</h3>
                <p className="text-sm font-semibold text-slate-500">{item.company}</p>
                <p className="mt-2 text-xs font-black text-slate-500">
                  {item.cvName ? `CV: ${item.cvName}` : 'CV non joint'} - {item.trackingEnabled ? 'Suivi actif' : 'Candidature rapide'}
                </p>
                {item.trackingEnabled && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                    <span className={classNames('rounded-full px-3 py-1', item.applicationOpened ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600')}>
                      {item.applicationOpened ? 'Demande ouverte' : 'Demande en attente'}
                    </span>
                    <span className={classNames('rounded-full px-3 py-1', item.cvOpened ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600')}>
                      {item.cvOpened ? 'CV ouvert' : 'CV non ouvert'}
                    </span>
                  </div>
                )}
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">{item.status === 'reviewed' ? 'Vu' : 'En revue'}</span>
            </div>
          </div>
        ))}
        {applications.length === 0 && <EmptyState title="Aucune candidature" body="Postule a une offre pour suivre ton dossier ici." />}
      </div>
    </div>
  );
}

function LoginScreen({ authMode, setAuthMode, loginRole, setLoginRole, loginEmail, setLoginEmail, loginPassword, setLoginPassword, handleAuth, handleOAuthSignIn, setScreen }) {
  const isSignup = authMode === 'signup';
  const [showPassword, setShowPassword] = useState(false);
  const isRecruiterLogin = loginRole === 'recruteur';
  const loginTitle = `${isSignup ? 'Inscription' : 'Connexion'} ${isRecruiterLogin ? 'recruteur' : 'candidat'}`;
  const loginSubtitle = isRecruiterLogin ? 'Espace employeur pour publier les offres et voir les CV' : 'Espace candidat pour postuler et suivre tes candidatures';

  return (
    <div className="mx-auto max-w-md space-y-5">
      <BackButton onClick={() => setScreen('home')} label="Accueil" />
      <PageHeader title={loginTitle} subtitle={loginSubtitle} />
      <div className="grid grid-cols-2 rounded-lg border border-slate-200 bg-white p-1">
        <button type="button" onClick={() => setLoginRole('candidat')} className={classNames('min-h-11 rounded-md text-sm font-black', !isRecruiterLogin ? 'bg-blue-700 text-white' : 'text-slate-600')}>
          Candidat
        </button>
        <button type="button" onClick={() => setLoginRole('recruteur')} className={classNames('min-h-11 rounded-md text-sm font-black', isRecruiterLogin ? 'bg-blue-700 text-white' : 'text-slate-600')}>
          Recruteur
        </button>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm font-black text-slate-900">Continuer avec</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {OAUTH_PROVIDERS.map((item) => (
            <SocialLoginButton key={item.provider} item={item} onClick={() => handleOAuthSignIn(item.provider)} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 rounded-lg border border-slate-200 bg-white p-1">
        <button type="button" onClick={() => setAuthMode('signin')} className={classNames('min-h-11 rounded-md text-sm font-black', !isSignup ? 'bg-blue-700 text-white' : 'text-slate-600')}>
          Connexion
        </button>
        <button type="button" onClick={() => setAuthMode('signup')} className={classNames('min-h-11 rounded-md text-sm font-black', isSignup ? 'bg-blue-700 text-white' : 'text-slate-600')}>
          Inscription
        </button>
      </div>
      <form onSubmit={handleAuth} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        <TextField label="Email" type="email" value={loginEmail} onChange={setLoginEmail} required />
        <PasswordField
          label="Mot de passe"
          value={loginPassword}
          onChange={setLoginPassword}
          required
          placeholder="Minimum 6 caracteres"
          visible={showPassword}
          onToggle={() => setShowPassword((visible) => !visible)}
        />
        <button type="submit" className="min-h-12 w-full rounded-lg bg-blue-700 px-5 font-black text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600">
          {isSignup ? `Creer mon compte ${isRecruiterLogin ? 'recruteur' : 'candidat'}` : `Me connecter comme ${isRecruiterLogin ? 'recruteur' : 'candidat'}`}
        </button>
        <p className="text-xs font-semibold leading-5 text-slate-500">
          {isSignup
            ? `Ce compte sera cree comme ${isRecruiterLogin ? 'recruteur' : 'candidat'}. Si une validation email est demandee, confirme le lien recu avant de te reconnecter.`
            : isRecruiterLogin
              ? 'Utilise ici ton compte recruteur pour voir tes offres, tes candidats et leurs CV.'
              : 'Utilise ici ton compte candidat pour postuler et suivre tes candidatures.'}
        </p>
      </form>
    </div>
  );
}

function SocialLoginButton({ item, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-800 transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600">
      <OAuthProviderLogo provider={item.provider} />
      {item.label}
    </button>
  );
}

function OAuthProviderLogo({ provider }) {
  if (provider === 'google') {
    return (
      <span className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white">
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9c-.3 1.3-1 2.4-2.1 3.2v2.6h3.4c2-1.8 3.4-4.5 3.4-7.8Z" />
          <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.9l-3.4-2.6c-.9.6-2.2 1-3.9 1-3 0-5.5-2-6.4-4.8H2.1v2.7C3.9 20.3 7.7 23 12 23Z" />
          <path fill="#FBBC05" d="M5.6 13.7c-.2-.6-.4-1.2-.4-1.9s.1-1.3.4-1.9V7.2H2.1C1.4 8.6 1 10.1 1 11.8s.4 3.2 1.1 4.6l3.5-2.7Z" />
          <path fill="#EA4335" d="M12 5.1c1.6 0 3.1.6 4.2 1.7l3.1-3.1C17.5 2 15 1 12 1 7.7 1 3.9 3.7 2.1 7.2l3.5 2.7C6.5 7.1 9 5.1 12 5.1Z" />
        </svg>
      </span>
    );
  }

  if (provider === 'apple') {
    return (
      <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-950">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" aria-hidden="true">
          <path fill="currentColor" d="M16.8 12.7c0-2.7 2.2-4 2.3-4.1-1.3-1.9-3.2-2.1-3.9-2.2-1.7-.2-3.2 1-4.1 1-.8 0-2.1-1-3.5-.9-1.8 0-3.4 1-4.3 2.6-1.8 3.1-.5 7.8 1.3 10.3.9 1.2 1.9 2.6 3.3 2.6 1.3-.1 1.8-.8 3.4-.8s2.1.8 3.5.8 2.4-1.3 3.2-2.5c1-1.4 1.4-2.8 1.4-2.9-.1-.1-2.6-1.1-2.6-3.9ZM14.1 4.7c.7-.9 1.2-2.1 1.1-3.3-1.1 0-2.4.7-3.1 1.6-.7.8-1.3 2-1.1 3.2 1.1.1 2.3-.6 3.1-1.5Z" />
        </svg>
      </span>
    );
  }

  if (provider === 'facebook') {
    return (
      <span className="grid h-7 w-7 place-items-center rounded-full bg-[#1877F2]">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" aria-hidden="true">
          <path fill="currentColor" d="M14.2 8.1h2.3V4.3c-.4-.1-1.8-.2-3.4-.2-3.4 0-5.7 2.1-5.7 6v3.4H3.7v4.2h3.7V24h4.5v-6.3h3.6l.6-4.2h-4.2v-3c0-1.2.3-2.4 2.3-2.4Z" />
        </svg>
      </span>
    );
  }

  return (
    <span className="grid h-7 w-7 place-items-center rounded-full bg-[#0A66C2]">
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" aria-hidden="true">
        <path fill="currentColor" d="M5.4 7.9H1.7V22h3.7V7.9ZM3.5 6C2.3 6 1.4 5.1 1.4 3.9S2.3 1.8 3.5 1.8s2.1.9 2.1 2.1S4.7 6 3.5 6ZM22.6 22h-3.7v-7.3c0-1.7 0-3.9-2.4-3.9s-2.8 1.9-2.8 3.8V22H10V7.9h3.5v1.9h.1c.5-.9 1.7-2.3 3.8-2.3 4 0 5.2 2.6 5.2 6.1V22Z" />
      </svg>
    </span>
  );
}

function RecruiterScreen({ jobs, applications, stats, setScreen, openLogin, markApplicationActivity, downloadApplicationCv, startEditJob, deleteJob, isLoggedIn, role }) {
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
          <button onClick={() => openLogin('recruteur')} className="mt-3 min-h-11 rounded-lg bg-blue-700 px-4 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-blue-600">
            Connexion recruteur
          </button>
        </div>
      )}
      {isLoggedIn && !canRecruit && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold leading-6 text-amber-900">Ton compte candidat reste dans son espace candidat. Passe en compte recruteur pour publier une offre et ouvrir un vrai espace recruteur.</p>
          <button onClick={() => setScreen('profile')} className="mt-3 min-h-11 rounded-lg bg-blue-700 px-4 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-blue-600">
            Modifier mon profil
          </button>
        </div>
      )}
      {canRecruit && ownJobs.length === 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-700 text-white">
            <PlusCircle size={24} />
          </div>
          <h2 className="mt-4 text-xl font-black text-slate-950">Publie ta premiere offre</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-blue-950">
            Ton tableau recruteur s'ouvrira avec les candidatures, les CV et les KPI apres la premiere offre publiee. Avant cela, aucun espace admin inutile n'est affiche.
          </p>
          <button onClick={() => setScreen('post-job')} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 font-black text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600">
            Publier ma premiere offre <PlusCircle size={18} />
          </button>
        </div>
      )}
      {(!isLoggedIn || !canRecruit || ownJobs.length === 0) && (
        <button onClick={() => setScreen('jobs')} className="flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700 transition hover:border-blue-700 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
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
      <button onClick={() => setScreen('post-job')} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 font-black text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600">
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
          <span className="text-sm font-black">Toutes les offres</span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">{applications.length} candidat(s)</span>
        </button>
        {ownJobs.map((job) => {
          const count = applicationsByJobId[job.id]?.length || 0;
          const jobStats = stats[job.id] || { views: 0, saves: 0 };
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
                    <h3 className="font-black text-slate-950">{job.role}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{job.company} - {job.loc}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{count} candidat(s)</span>
                </div>
              </button>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <StatCard value={jobStats.views} label="Vues" />
                <StatCard value={jobStats.saves} label="Signets" />
                <StatCard value={count} label="Postules" />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={() => startEditJob(job)} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700 transition hover:border-blue-700 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
                  <Edit3 size={16} /> Modifier
                </button>
                <button type="button" onClick={() => deleteJob(job)} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-black text-red-700 transition hover:border-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-600">
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
                <p className="text-xs font-black uppercase text-blue-700">{item.jobRole}</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">{item.nom}</h3>
                <div className="mt-2 grid gap-1 text-sm font-semibold text-slate-600">
                  <span>{item.email}</span>
                  <span>{item.phone || 'Telephone non renseigne'}</span>
                </div>
              </div>
              <span className={classNames('w-fit rounded-full px-3 py-1 text-xs font-black', item.status === 'reviewed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-50 text-blue-700')}>
                {item.status === 'reviewed' ? 'Vu' : 'Nouveau'}
              </span>
            </div>
            {item.message && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-black uppercase text-slate-500">Message</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{item.message}</p>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-slate-600">
              <span className="rounded-full bg-slate-100 px-3 py-1">{item.cvName ? `CV: ${item.cvName}` : 'Aucun CV'}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">{item.trackingEnabled ? 'Candidature suivie' : 'Candidature rapide'}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">{item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : 'Date locale'}</span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_1fr]">
              <button onClick={() => markApplicationActivity(item.id, 'applicationOpened')} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700 transition hover:border-blue-700 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
                Marquer la demande vue
              </button>
              <button
                onClick={() => markApplicationActivity(item.id, 'cvOpened', true)}
                disabled={!item.cvPath}
                className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-black text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                Ouvrir le CV <ExternalLink size={16} />
              </button>
              <button
                onClick={() => downloadApplicationCv(item.id)}
                disabled={!item.cvPath}
                className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 text-sm font-black text-blue-800 transition hover:border-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500"
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

function PostJobScreen({ form, setForm, onSubmit, setScreen, editing, cancelEdit }) {
  return (
    <div className="space-y-4">
      <BackButton onClick={editing ? cancelEdit : () => setScreen('recruiter')} label="Recruteur" />
      <PageHeader title={editing ? 'Modifier' : 'Publier'} subtitle={editing ? "Modifier l'offre d'emploi" : "Nouvelle offre d'emploi"} />
      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        <TextField label="Titre du poste" value={form.role} onChange={(role) => setForm({ ...form, role })} required />
        <TextField label="Entreprise" value={form.company} onChange={(company) => setForm({ ...form, company })} required />
        <SelectField label="Ville" value={form.loc} onChange={(loc) => setForm({ ...form, loc })} options={CONGO_CITIES} />
        <SelectField label="Contrat" value={form.type} onChange={(type) => setForm({ ...form, type })} options={CONTRACT_TYPES} />
        <TextField label="Salaire" value={form.salary} onChange={(salary) => setForm({ ...form, salary })} placeholder="Attractif, 500k XAF, Negociable..." />
        <TextField label="Secteur" value={form.sector} onChange={(sector) => setForm({ ...form, sector })} />
        <TextArea label="Description" value={form.description} onChange={(description) => setForm({ ...form, description })} required />
        <div className="grid gap-2 sm:grid-cols-2">
          {editing && (
            <button type="button" onClick={cancelEdit} className="min-h-12 rounded-lg border border-slate-300 px-5 font-black text-slate-700 transition hover:border-blue-700 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
              Annuler
            </button>
          )}
          <button type="submit" className={classNames('min-h-12 rounded-lg bg-blue-700 px-5 font-black text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600', editing ? '' : 'sm:col-span-2')}>
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
      <button onClick={() => setNotifications((items) => items.map((item) => ({ ...item, read: true })))} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700">
        Tout marquer comme lu
      </button>
      <div className="grid gap-3">
        {notifications.map((item) => (
          <div key={item.id} className={classNames('rounded-lg border p-4', item.read ? 'border-slate-200 bg-white' : 'border-blue-200 bg-blue-50')}>
            <h3 className="font-black">{item.title}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-600">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsScreen() {
  return (
    <div className="space-y-5">
      <PageHeader title="Parametres" subtitle="Gestion du compte et de la plateforme" />
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="font-black">Service operationnel</h2>
            <p className="text-sm font-semibold text-slate-500">Les comptes, offres, candidatures et CV sont geres de facon securisee.</p>
          </div>
        </div>
        <div className="mt-5 rounded-lg bg-slate-100 p-4 text-sm font-semibold leading-7 text-slate-700">
          Tu peux utiliser le site normalement. Les informations techniques restent reservees a l'equipe projet.
        </div>
      </div>
    </div>
  );
}

function SearchPanel({ query, setQuery, city, setCity, clearSearch, compact = false, onSubmit }) {
  const cityOptions = ['Toutes', ...CONGO_CITIES];
  const featuredCities = ['Toutes', 'Brazzaville', 'Pointe-Noire', 'Dolisie', 'Nkayi', 'Ouesso'];
  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit?.(); }} className="space-y-3">
      <div className="grid gap-2 md:grid-cols-[1fr_220px]">
        <label className="smooth-button flex min-h-12 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-600">
          <Search size={18} className="text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Poste, entreprise, secteur..." className="w-full bg-transparent text-base font-semibold outline-none" />
          {(query || city !== 'Toutes') && (
            <button type="button" onClick={clearSearch} aria-label="Effacer la recherche" className="smooth-button flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
              <X size={18} />
            </button>
          )}
        </label>
        <label className="smooth-button flex min-h-12 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-600">
          <MapPin size={18} className="text-slate-400" />
          <select value={city} onChange={(event) => setCity(event.target.value)} className="w-full bg-transparent text-base font-semibold outline-none">
            {cityOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      </div>
      {!compact && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {featuredCities.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setCity(option)}
              className={classNames('smooth-button min-h-10 shrink-0 rounded-full border px-4 text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-600', city === option ? 'border-blue-700 bg-blue-700 text-white shadow-sm shadow-blue-900/20' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700')}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}

function JobCard({ job, onClick, onApply, saved, onSave }) {
  return (
    <article className="smooth-card p-4 hover:border-blue-300">
      <div className="flex items-start gap-3">
        <button onClick={onClick} className="smooth-button flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600">
          <Building2 size={22} />
        </button>
        <button onClick={onClick} className="min-w-0 flex-1 text-left focus:outline-none focus:ring-2 focus:ring-blue-600">
          <h3 className="text-lg font-black leading-tight text-slate-950">{job.role}</h3>
          <p className="mt-1 text-sm font-bold text-slate-600">{job.company}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{job.loc}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{job.type}</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">{job.salary || 'A discuter'}</span>
          </div>
        </button>
        {onSave && (
          <button onClick={onSave} aria-label="Sauvegarder" className="smooth-button flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
            <Bookmark size={20} fill={saved ? 'currentColor' : 'none'} className={saved ? 'text-blue-700' : ''} />
          </button>
        )}
      </div>
      {onApply && (
        <button onClick={onApply} className="smooth-button mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-black text-white shadow-sm shadow-blue-900/20 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600">
          Postuler <Send size={16} />
        </button>
      )}
    </article>
  );
}

function TextField({ label, value, onChange, type = 'text', required, placeholder, disabled = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-800">{label}</span>
      <input type={type} required={required} disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="smooth-button min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base font-semibold outline-none disabled:bg-slate-100 disabled:text-slate-500 focus:border-blue-700 focus:ring-2 focus:ring-blue-600" />
    </label>
  );
}

function PasswordField({ label, value, onChange, required, placeholder, visible, onToggle }) {
  const inputId = useId();

  return (
    <div className="block">
      <label htmlFor={inputId} className="mb-2 block text-sm font-black text-slate-800">{label}</label>
      <span className="smooth-button flex min-h-12 w-full items-center rounded-lg border border-slate-300 bg-white pr-2 focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-600">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-h-12 min-w-0 flex-1 rounded-lg bg-transparent px-3 text-base font-semibold outline-none"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          aria-pressed={visible}
          className={classNames(
            'smooth-button flex h-10 w-10 shrink-0 items-center justify-center rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600',
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
      <span className="mb-2 block text-sm font-black text-slate-800">{label}</span>
      <textarea required={required} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={4} className="smooth-button w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base font-semibold outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-600" />
    </label>
  );
}

function CvUpload({ cvName, cvSize, onChange }) {
  const readableSize = cvSize ? `${(cvSize / 1024 / 1024).toFixed(2)} Mo` : '';
  return (
    <div>
      <span className="mb-2 block text-sm font-black text-slate-800">CV PDF</span>
      <label className="smooth-card flex min-h-24 cursor-pointer flex-col items-center justify-center border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center hover:border-blue-700 hover:bg-blue-50 focus-within:ring-2 focus-within:ring-blue-600">
        <FileText size={26} className="text-blue-700" />
        <span className="mt-2 text-sm font-black text-slate-900">{cvName || 'Ajouter mon CV'}</span>
        <span className="mt-1 text-xs font-bold text-slate-500">{cvName ? readableSize : `PDF uniquement, ${MAX_CV_LABEL} maximum`}</span>
        <input type="file" accept="application/pdf,.pdf" onChange={onChange} className="sr-only" />
      </label>
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-800">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="smooth-button min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base font-semibold outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-600">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function StepPill({ label, active, done }) {
  return (
    <div className={classNames('rounded-lg border px-3 py-2 text-center text-xs font-black transition', done ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : active ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500')}>
      {label}
    </div>
  );
}

function BrandLogo() {
  return (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
      <img src="/logo-congoemploi.svg" alt="" className="h-full w-full object-contain" />
    </div>
  );
}

function BackButton({ onClick, label }) {
  return (
    <button onClick={onClick} className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-black text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
      <ArrowLeft size={18} /> {label}
    </button>
  );
}

function PageHeader({ title, subtitle }) {
  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{title}</h1>
      <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
    </div>
  );
}

function SectionTitle({ title, action, onAction }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      {action && <button onClick={onAction} className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-black text-blue-700">{action}<ChevronRight size={16} /></button>}
    </div>
  );
}

function EmptyState({ title, body }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
      <ClipboardList className="mx-auto text-slate-400" size={34} />
      <h3 className="mt-3 font-black text-slate-950">{title}</h3>
      <p className="mt-1 text-sm font-semibold text-slate-500">{body}</p>
    </div>
  );
}

function ActionCard({ icon: Icon, title, body, onClick }) {
  return (
    <button onClick={onClick} className="smooth-card p-4 text-left hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-600">
      <Icon className="text-blue-700" size={24} />
      <h3 className="mt-3 font-black">{title}</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{body}</p>
    </button>
  );
}

function Metric({ value, label }) {
  return (
    <div className="app-surface p-3">
      <p className="text-xl font-black text-slate-950">{value}</p>
      <p className="text-xs font-bold text-slate-500">{label}</p>
    </div>
  );
}

function StatCard({ value, label }) {
  return (
    <div className="app-surface p-4 text-center">
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
    </div>
  );
}

function InfoPill({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-100 p-3">
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}
