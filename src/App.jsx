import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Bookmark,
  Briefcase,
  Building2,
  Check,
  ChevronRight,
  ClipboardList,
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

const initialProfile = {
  nom: '',
  prenom: '',
  email: '',
  phone: '',
  city: 'Brazzaville',
  role: 'candidat',
  title: '',
};

const MAX_CV_BYTES = 2 * 1024 * 1024;
const MAX_CV_LABEL = '2 Mo';

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

function normalizeJob(row) {
  return {
    id: row.id,
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
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(hasSupabaseConfig);
  const [applicationForm, setApplicationForm] = useState(emptyApplication);
  const [jobForm, setJobForm] = useState(emptyJob);
  const [dataSource, setDataSource] = useState(hasSupabaseConfig ? 'Connexion en cours' : 'Hors ligne');

  const [jobs, setJobs] = useStoredState('congoemploi.v2.jobs', initialJobs);
  const [profile, setProfile] = useStoredState('congoemploi.v2.profile', initialProfile);
  const [savedIds, setSavedIds] = useStoredState('congoemploi.v2.savedIds', []);
  const [applications, setApplications] = useStoredState('congoemploi.v2.applications', []);
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
        .select('id,title,description,location,contract_type,salary_range,sector,requirements,status,companies(name)')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (error) {
        setDataSource('Hors ligne');
        return;
      }
      if (data?.length) {
        setJobs(data.map(normalizeJob));
      }
      setDataSource('Supabase');
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
          setProfile((current) => ({ ...current, email: authUser.email || current.email }));
        }
      }

      const { data: userApplications } = await supabase
        .from('applications')
        .select('id,job_id,nom,email,phone,message,cv_url,cv_name,cv_size,tracking_enabled,application_opened,cv_opened,status,created_at,jobs(title,companies(name))')
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
    }

    loadUserData();
    return () => {
      cancelled = true;
    };
  }, [authUser?.id]);

  const publishedJobs = jobs.filter((job) => job.status === 'published');
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

  const openJob = (job) => {
    setSelectedJob(job);
    setScreen('job');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      notify('Supabase doit etre configure pour la connexion reelle.');
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
            role: profile.role || 'candidat',
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
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          role: profile.role || 'candidat',
          nom: profile.nom,
          prenom: profile.prenom,
          phone: profile.phone,
          city: profile.city,
          title: profile.title,
        });
      }
      setLoginPassword('');
      setScreen('profile');
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
    setAuthUser(data.user);
    setProfile((current) => ({ ...current, email: data.user.email || current.email }));
    setLoginEmail('');
    setLoginPassword('');
    setScreen('profile');
    notify('Connexion reussie');
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
      setScreen('login');
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
        notify('CV garde localement, stockage indisponible.');
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

  const markApplicationActivity = (applicationId, field) => {
    let changedApplication;
    setApplications((current) => current.map((item) => {
      if (item.id !== applicationId || item[field]) return item;
      changedApplication = { ...item, [field]: true, status: 'reviewed' };
      return changedApplication;
    }));
    if (!changedApplication) return;
    if (changedApplication.trackingEnabled) {
      const title = field === 'cvOpened' ? 'CV ouvert' : 'Demande consultee';
      const body = `${changedApplication.company} a ${field === 'cvOpened' ? 'ouvert ton CV' : 'ouvert ta candidature'}.`;
      setNotifications((current) => [{ id: Date.now(), title, body, read: false }, ...current]);
      notify(title);
    } else {
      notify('Action recruteur enregistree, pas de notification pour candidature rapide.');
    }
  };

  const publishJob = async (event) => {
    event.preventDefault();
    if (!isLoggedIn) {
      notify('Connecte-toi pour publier une offre.');
      setScreen('login');
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
        .insert({ name: nextJob.company, city: nextJob.loc, sector: nextJob.sector })
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
          .select('id,title,description,location,contract_type,salary_range,sector,requirements,status,companies(name)')
          .single();
        if (!jobError && savedJob) {
          nextJob.id = savedJob.id;
        }
      }
    }
    setJobs((current) => [nextJob, ...current]);
    setJobForm(emptyJob);
    setNotifications((current) => [
      { id: Date.now(), title: 'Offre publiee', body: `${nextJob.role} est maintenant visible`, read: false },
      ...current,
    ]);
    setScreen('recruiter');
    notify('Offre publiee');
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

  const navItems = [
    { id: 'home', label: 'Accueil', icon: Home },
    { id: 'jobs', label: 'Offres', icon: Briefcase },
    { id: 'saved', label: 'Favoris', icon: Bookmark },
    { id: 'profile', label: 'Profil', icon: User },
  ];

  const renderScreen = () => {
    if (screen === 'jobs') return <JobsScreen jobs={filteredJobs} query={query} setQuery={setQuery} city={city} setCity={setCity} openJob={openJob} savedIds={savedIds} toggleSave={toggleSave} />;
    if (screen === 'job') return <JobScreen job={activeJob} saved={savedIds.includes(activeJob?.id)} toggleSave={toggleSave} setScreen={setScreen} />;
    if (screen === 'apply') return <ApplyScreen job={activeJob} form={applicationForm} setForm={setApplicationForm} submitApplication={submitApplication} setScreen={setScreen} isLoggedIn={isLoggedIn} profile={profile} notify={notify} />;
    if (screen === 'saved') return <SavedScreen jobs={savedJobs} openJob={openJob} />;
    if (screen === 'profile') return <ProfileScreen profile={profile} setProfile={setProfile} applications={applications} updateProfile={updateProfile} setScreen={setScreen} isLoggedIn={isLoggedIn} authLoading={authLoading} handleLogout={handleLogout} />;
    if (screen === 'login') return <LoginScreen authMode={authMode} setAuthMode={setAuthMode} loginEmail={loginEmail} setLoginEmail={setLoginEmail} loginPassword={loginPassword} setLoginPassword={setLoginPassword} handleAuth={handleAuth} setScreen={setScreen} />;
    if (screen === 'recruiter') return <RecruiterScreen jobs={jobs} applications={applications} setScreen={setScreen} markApplicationActivity={markApplicationActivity} isLoggedIn={isLoggedIn} />;
    if (screen === 'post-job') return <PostJobScreen form={jobForm} setForm={setJobForm} publishJob={publishJob} setScreen={setScreen} />;
    if (screen === 'notifications') return <NotificationsScreen notifications={notifications} setNotifications={setNotifications} />;
    if (screen === 'settings') return <SettingsScreen />;
    return <HomeScreen jobs={filteredJobs.slice(0, 3)} query={query} setQuery={setQuery} city={city} setCity={setCity} openJob={openJob} setScreen={setScreen} hasSupabaseConfig={hasSupabaseConfig} dataSource={dataSource} />;
  };

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <button onClick={() => setScreen('home')} className="flex min-h-11 items-center gap-2 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-600">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700 text-white">
              <Briefcase size={20} />
            </div>
            <div>
              <p className="text-base font-black leading-none text-slate-950">CONGO<span className="text-blue-700">EMPLOI</span></p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Mobile first</p>
            </div>
          </button>

          <div className="flex items-center gap-1">
            <IconButton label="Notifications" onClick={() => setScreen('notifications')} badge={unreadCount}>
              <Bell size={20} />
            </IconButton>
            <IconButton label="Recruteur" onClick={() => setScreen('recruiter')}>
              <LayoutDashboard size={20} />
            </IconButton>
            <IconButton label="Parametres" onClick={() => setScreen('settings')}>
              <Settings size={20} />
            </IconButton>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 md:pb-10">
        {renderScreen()}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = screen === item.id || (item.id === 'jobs' && ['job', 'apply'].includes(screen));
            return (
              <button
                key={item.id}
                onClick={() => setScreen(item.id)}
                className={classNames('flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-blue-600', active ? 'text-blue-700' : 'text-slate-500')}
              >
                <Icon size={21} fill={active ? 'currentColor' : 'none'} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {toast && (
        <div className="fixed bottom-24 left-4 right-4 z-[60] mx-auto max-w-sm rounded-lg border border-blue-100 bg-white px-4 py-3 text-center text-sm font-bold text-slate-900 shadow-lg md:bottom-6">
          {toast}
        </div>
      )}
    </div>
  );
}

function IconButton({ label, children, onClick, badge }) {
  return (
    <button onClick={onClick} aria-label={label} className="relative flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
      {children}
      {badge > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />}
    </button>
  );
}

function HomeScreen({ jobs, query, setQuery, city, setCity, openJob, setScreen, hasSupabaseConfig, dataSource }) {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid md:grid-cols-[1.2fr_0.8fr] md:gap-8 md:p-8">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            <ShieldCheck size={14} /> Brazzaville, Pointe-Noire, Dolisie
          </div>
          <h1 className="max-w-2xl text-3xl font-black leading-tight text-slate-950 md:text-5xl">
            Trouver un emploi ou recruter au Congo, depuis ton telephone.
          </h1>
          <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-slate-600">
            Une experience mobile simple pour chercher, sauvegarder, postuler et publier une offre.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-2">
            <Metric value="580" label="Offres" />
            <Metric value="2.4k" label="Talents" />
            <Metric value="94%" label="Match" />
          </div>
        </div>
        <div className="mt-6 rounded-lg bg-slate-50 p-3 text-slate-950 md:mt-0">
          <SearchPanel query={query} setQuery={setQuery} city={city} setCity={setCity} onSubmit={() => setScreen('jobs')} />
          <button onClick={() => setScreen('jobs')} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 font-black text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600">
            Rechercher <Search size={18} />
          </button>
          <button onClick={() => setScreen('post-job')} className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 font-black text-slate-950 transition hover:border-blue-700 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
            Publier une offre <PlusCircle size={18} />
          </button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <ActionCard icon={User} title="Candidat" body="Postule en moins d'une minute." onClick={() => setScreen('jobs')} />
        <ActionCard icon={Building2} title="Recruteur" body="Publie une offre et suis les candidatures." onClick={() => setScreen('recruiter')} />
        <ActionCard icon={Sparkles} title={hasSupabaseConfig ? 'Base connectee' : 'Configuration requise'} body={hasSupabaseConfig ? `Source: ${dataSource}` : 'Ajoute les variables Supabase pour activer la production.'} onClick={() => setScreen('settings')} />
      </section>

      <SectionTitle title="Offres recentes" action="Tout voir" onAction={() => setScreen('jobs')} />
      <div className="grid gap-3">
        {jobs.map((job) => <JobCard key={job.id} job={job} onClick={() => openJob(job)} />)}
      </div>
    </div>
  );
}

function JobsScreen({ jobs, query, setQuery, city, setCity, openJob, savedIds, toggleSave }) {
  return (
    <div className="space-y-5">
      <PageHeader title="Offres" subtitle={`${jobs.length} resultat(s) disponible(s)`} />
      <SearchPanel query={query} setQuery={setQuery} city={city} setCity={setCity} />
      <div className="grid gap-3 lg:grid-cols-2">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} onClick={() => openJob(job)} saved={savedIds.includes(job.id)} onSave={() => toggleSave(job)} />
        ))}
      </div>
      {jobs.length === 0 && <EmptyState title="Aucune offre trouvee" body="Essaie une autre ville ou un autre mot cle." />}
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
        <button onClick={() => setScreen('apply')} className="mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 font-black text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600">
          Postuler maintenant <Send size={18} />
        </button>
      </article>
    </div>
  );
}

function ApplyScreen({ job, form, setForm, submitApplication, setScreen, isLoggedIn, profile, notify }) {
  const trackingEnabled = form.mode === 'tracked';
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
          <button onClick={() => setScreen('login')} className="mt-3 min-h-11 rounded-lg bg-blue-700 px-4 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-blue-600">
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
        <TextField label="Nom complet" value={form.nom} onChange={(nom) => setForm({ ...form, nom })} required />
        <TextField label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} required />
        <TextField label="Telephone" type="tel" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} required />
        <TextArea label="Message au recruteur" value={form.message} onChange={(message) => setForm({ ...form, message })} placeholder="Disponibilite, experience, motivation..." />
        <CvUpload cvName={form.cvName} cvSize={form.cvSize} onChange={handleCvChange} />
        <button type="submit" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 font-black text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600">
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

function ProfileScreen({ profile, setProfile, applications, updateProfile, setScreen, isLoggedIn, authLoading, handleLogout }) {
  const trackedApplications = applications.filter((item) => item.trackingEnabled);
  const cvOpenedCount = trackedApplications.filter((item) => item.cvOpened).length;
  const applicationOpenedCount = trackedApplications.filter((item) => item.applicationOpened).length;
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <PageHeader title="Profil" subtitle={authLoading ? 'Verification de la session...' : isLoggedIn ? 'Candidat et suivi des candidatures' : 'Connecte-toi pour activer le suivi temps reel'} />
        {isLoggedIn && (
          <button onClick={handleLogout} className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700 transition hover:border-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-600">
            <LogOut size={17} /> Sortir
          </button>
        )}
      </div>
      {!isLoggedIn && !authLoading && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-bold leading-6 text-blue-950">Connexion reelle Supabase active. Cree ton compte ou connecte-toi pour synchroniser ton profil, tes favoris, tes CV et tes candidatures.</p>
          <button onClick={() => setScreen('login')} className="mt-3 min-h-11 rounded-lg bg-blue-700 px-4 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-blue-600">
            Se connecter
          </button>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        <StatCard value={trackedApplications.length} label="Suivies" />
        <StatCard value={applicationOpenedCount} label="Demandes vues" />
        <StatCard value={cvOpenedCount} label="CV ouverts" />
      </div>
      <form onSubmit={updateProfile} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-2">
        <TextField label="Nom" value={profile.nom} onChange={(nom) => setProfile({ ...profile, nom })} />
        <TextField label="Prenom" value={profile.prenom} onChange={(prenom) => setProfile({ ...profile, prenom })} />
        <TextField label="Email" type="email" value={profile.email} onChange={(email) => setProfile({ ...profile, email })} disabled={isLoggedIn} />
        <TextField label="Telephone" type="tel" value={profile.phone} onChange={(phone) => setProfile({ ...profile, phone })} />
        <TextField label="Ville" value={profile.city} onChange={(city) => setProfile({ ...profile, city })} />
        <TextField label="Titre" value={profile.title} onChange={(title) => setProfile({ ...profile, title })} />
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

function LoginScreen({ authMode, setAuthMode, loginEmail, setLoginEmail, loginPassword, setLoginPassword, handleAuth, setScreen }) {
  const isSignup = authMode === 'signup';
  return (
    <div className="mx-auto max-w-md space-y-5">
      <BackButton onClick={() => setScreen('home')} label="Accueil" />
      <PageHeader title={isSignup ? 'Creer un compte' : 'Connexion'} subtitle="Compte reel securise avec Supabase" />
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
        <TextField label="Mot de passe" type="password" value={loginPassword} onChange={setLoginPassword} required placeholder="Minimum 6 caracteres" />
        <button type="submit" className="min-h-12 w-full rounded-lg bg-blue-700 px-5 font-black text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600">
          {isSignup ? 'Creer mon compte' : 'Me connecter'}
        </button>
        <p className="text-xs font-semibold leading-5 text-slate-500">
          {isSignup ? 'Si la confirmation email est active sur Supabase, tu devras valider le lien recu avant la premiere connexion.' : 'Tes candidatures suivies seront reliees a ce compte.'}
        </p>
      </form>
    </div>
  );
}

function RecruiterScreen({ jobs, applications, setScreen, markApplicationActivity, isLoggedIn }) {
  const ownJobs = jobs.slice(0, 4);
  return (
    <div className="space-y-5">
      <PageHeader title="Recruteur" subtitle="Publier et suivre les candidatures" />
      {!isLoggedIn && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-bold leading-6 text-blue-950">Connecte-toi pour publier une offre et garder un tableau de bord recruteur fiable.</p>
          <button onClick={() => setScreen('login')} className="mt-3 min-h-11 rounded-lg bg-blue-700 px-4 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-blue-600">
            Se connecter
          </button>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        <StatCard value={jobs.length} label="Offres" />
        <StatCard value={applications.length} label="Candidats" />
        <StatCard value="94%" label="Match" />
      </div>
      <button onClick={() => setScreen('post-job')} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 font-black text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600">
        Publier une offre <PlusCircle size={18} />
      </button>
      <SectionTitle title="Dernieres offres" />
      <div className="grid gap-3">
        {ownJobs.map((job) => (
          <div key={job.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="font-black">{job.role}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{job.company} - {job.loc}</p>
          </div>
        ))}
      </div>
      <SectionTitle title="Candidatures recues" />
      <div className="grid gap-3">
        {applications.map((item) => (
          <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-black">{item.jobRole}</h3>
                <p className="text-sm font-semibold text-slate-500">{item.nom} - {item.email}</p>
                <p className="mt-2 text-xs font-black text-slate-500">
                  {item.cvName ? `CV PDF: ${item.cvName}` : 'Aucun CV'} - {item.trackingEnabled ? 'suivi candidat actif' : 'candidature rapide'}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{item.status === 'reviewed' ? 'Vu' : 'Nouveau'}</span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button onClick={() => markApplicationActivity(item.id, 'applicationOpened')} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700 transition hover:border-blue-700 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
                Ouvrir la demande
              </button>
              <button onClick={() => markApplicationActivity(item.id, 'cvOpened')} className="min-h-11 rounded-lg bg-blue-700 px-4 text-sm font-black text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600">
                Ouvrir le CV
              </button>
            </div>
          </div>
        ))}
        {applications.length === 0 && <EmptyState title="Aucune candidature recue" body="Les candidatures apparaitront ici avec leur CV PDF." />}
      </div>
    </div>
  );
}

function PostJobScreen({ form, setForm, publishJob, setScreen }) {
  return (
    <div className="space-y-4">
      <BackButton onClick={() => setScreen('recruiter')} label="Recruteur" />
      <PageHeader title="Publier" subtitle="Nouvelle offre d'emploi" />
      <form onSubmit={publishJob} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        <TextField label="Titre du poste" value={form.role} onChange={(role) => setForm({ ...form, role })} required />
        <TextField label="Entreprise" value={form.company} onChange={(company) => setForm({ ...form, company })} required />
        <SelectField label="Ville" value={form.loc} onChange={(loc) => setForm({ ...form, loc })} options={['Brazzaville', 'Pointe-Noire', 'Dolisie']} />
        <SelectField label="Contrat" value={form.type} onChange={(type) => setForm({ ...form, type })} options={['CDI', 'CDD', 'Stage', 'Freelance', 'Hybride']} />
        <TextField label="Salaire" value={form.salary} onChange={(salary) => setForm({ ...form, salary })} placeholder="Attractif, 500k XAF, Negociable..." />
        <TextField label="Secteur" value={form.sector} onChange={(sector) => setForm({ ...form, sector })} />
        <TextArea label="Description" value={form.description} onChange={(description) => setForm({ ...form, description })} required />
        <button type="submit" className="min-h-12 w-full rounded-lg bg-blue-700 px-5 font-black text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600">
          Publier l'offre
        </button>
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
      <PageHeader title="Base de donnees" subtitle="Supabase est connecte a la production" />
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className={classNames('flex h-11 w-11 items-center justify-center rounded-lg text-white', hasSupabaseConfig ? 'bg-emerald-600' : 'bg-blue-700')}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="font-black">{hasSupabaseConfig ? 'Supabase connecte' : 'Configuration requise'}</h2>
            <p className="text-sm font-semibold text-slate-500">
              {hasSupabaseConfig ? 'Les offres, candidatures, comptes et CV sont relies a Supabase.' : 'Ajoute les variables Supabase sur Vercel pour activer la production.'}
            </p>
          </div>
        </div>
        <div className="mt-5 rounded-lg bg-slate-100 p-4 text-sm font-semibold leading-7 text-slate-700">
          Tables prevues: profiles, companies, jobs, applications, saved_jobs, notifications.
        </div>
      </div>
    </div>
  );
}

function SearchPanel({ query, setQuery, city, setCity, onSubmit }) {
  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit?.(); }} className="grid gap-2 md:grid-cols-[1fr_220px]">
      <label className="flex min-h-12 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:ring-2 focus-within:ring-blue-600">
        <Search size={18} className="text-slate-400" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Poste, entreprise, secteur..." className="w-full bg-transparent text-base font-semibold outline-none" />
      </label>
      <label className="flex min-h-12 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:ring-2 focus-within:ring-blue-600">
        <MapPin size={18} className="text-slate-400" />
        <select value={city} onChange={(event) => setCity(event.target.value)} className="w-full bg-transparent text-base font-semibold outline-none">
          {['Toutes', 'Brazzaville', 'Pointe-Noire', 'Dolisie'].map((option) => <option key={option}>{option}</option>)}
        </select>
      </label>
    </form>
  );
}

function JobCard({ job, onClick, saved, onSave }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-blue-300">
      <div className="flex items-start gap-3">
        <button onClick={onClick} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
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
          <button onClick={onSave} aria-label="Sauvegarder" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600">
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
      <span className="mb-2 block text-sm font-black text-slate-800">{label}</span>
      <input type={type} required={required} disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base font-semibold outline-none transition disabled:bg-slate-100 disabled:text-slate-500 focus:border-blue-700 focus:ring-2 focus:ring-blue-600" />
    </label>
  );
}

function TextArea({ label, value, onChange, required, placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-800">{label}</span>
      <textarea required={required} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={4} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base font-semibold outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-600" />
    </label>
  );
}

function CvUpload({ cvName, cvSize, onChange }) {
  const readableSize = cvSize ? `${(cvSize / 1024 / 1024).toFixed(2)} Mo` : '';
  return (
    <div>
      <span className="mb-2 block text-sm font-black text-slate-800">CV PDF</span>
      <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:border-blue-700 hover:bg-blue-50 focus-within:ring-2 focus-within:ring-blue-600">
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
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base font-semibold outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-600">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
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
    <button onClick={onClick} className="rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-600">
      <Icon className="text-blue-700" size={24} />
      <h3 className="mt-3 font-black">{title}</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{body}</p>
    </button>
  );
}

function Metric({ value, label }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xl font-black text-slate-950">{value}</p>
      <p className="text-xs font-bold text-slate-500">{label}</p>
    </div>
  );
}

function StatCard({ value, label }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
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
