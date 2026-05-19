import React, { useMemo, useState } from 'react';
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
import { hasSupabaseConfig } from './lib/supabase';

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
  nom: 'Yaro',
  prenom: 'B',
  email: 'demo@congoemploi.cg',
  phone: '+242 06 000 0000',
  city: 'Brazzaville',
  role: 'candidat',
  title: 'Candidat mobile',
};

const emptyApplication = { nom: '', email: '', phone: '', message: '' };
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

export default function App() {
  const [screen, setScreen] = useState('home');
  const [selectedJob, setSelectedJob] = useState(null);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('Toutes');
  const [toast, setToast] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [applicationForm, setApplicationForm] = useState(emptyApplication);
  const [jobForm, setJobForm] = useState(emptyJob);

  const [jobs, setJobs] = useStoredState('congoemploi.v2.jobs', initialJobs);
  const [profile, setProfile] = useStoredState('congoemploi.v2.profile', initialProfile);
  const [savedIds, setSavedIds] = useStoredState('congoemploi.v2.savedIds', []);
  const [applications, setApplications] = useStoredState('congoemploi.v2.applications', []);
  const [notifications, setNotifications] = useStoredState('congoemploi.v2.notifications', [
    { id: 1, title: 'Bienvenue sur CONGOEMPLOI', body: 'Votre espace mobile est pret.', read: false },
  ]);

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

  const toggleSave = (job) => {
    setSavedIds((current) => {
      const exists = current.includes(job.id);
      return exists ? current.filter((id) => id !== job.id) : [...current, job.id];
    });
    notify(savedIds.includes(job.id) ? 'Offre retiree des favoris' : 'Offre sauvegardee');
  };

  const handleLogin = (event) => {
    event.preventDefault();
    setOtpSent(true);
    setOtp('246810');
    notify('Code demo envoye: 246810');
  };

  const verifyOtp = (event) => {
    event.preventDefault();
    if (otp === '246810') {
      setProfile((current) => ({ ...current, email: loginEmail || current.email }));
      setOtpSent(false);
      setLoginEmail('');
      setOtp('');
      setScreen('profile');
      notify('Connexion reussie');
      return;
    }
    notify('Code invalide. Essaie 246810 pour la demo.');
  };

  const submitApplication = (event) => {
    event.preventDefault();
    const application = {
      id: Date.now(),
      jobId: activeJob.id,
      jobRole: activeJob.role,
      company: activeJob.company,
      status: 'pending',
      createdAt: new Date().toISOString(),
      ...applicationForm,
    };
    setApplications((current) => [application, ...current]);
    setNotifications((current) => [
      { id: Date.now(), title: 'Candidature envoyee', body: `${activeJob.role} chez ${activeJob.company}`, read: false },
      ...current,
    ]);
    setApplicationForm(emptyApplication);
    setScreen('profile');
    notify('Candidature envoyee au recruteur');
  };

  const publishJob = (event) => {
    event.preventDefault();
    const nextJob = {
      id: Date.now(),
      requirements: ['Experience pertinente', 'Disponibilite', 'Motivation'],
      status: 'published',
      ...jobForm,
    };
    setJobs((current) => [nextJob, ...current]);
    setJobForm(emptyJob);
    setNotifications((current) => [
      { id: Date.now(), title: 'Offre publiee', body: `${nextJob.role} est maintenant visible`, read: false },
      ...current,
    ]);
    setScreen('recruiter');
    notify('Offre publiee');
  };

  const updateProfile = (event) => {
    event.preventDefault();
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
    if (screen === 'apply') return <ApplyScreen job={activeJob} form={applicationForm} setForm={setApplicationForm} submitApplication={submitApplication} setScreen={setScreen} />;
    if (screen === 'saved') return <SavedScreen jobs={savedJobs} openJob={openJob} />;
    if (screen === 'profile') return <ProfileScreen profile={profile} setProfile={setProfile} applications={applications} updateProfile={updateProfile} setScreen={setScreen} />;
    if (screen === 'login') return <LoginScreen otpSent={otpSent} loginEmail={loginEmail} setLoginEmail={setLoginEmail} otp={otp} setOtp={setOtp} handleLogin={handleLogin} verifyOtp={verifyOtp} setScreen={setScreen} />;
    if (screen === 'recruiter') return <RecruiterScreen jobs={jobs} applications={applications} setScreen={setScreen} />;
    if (screen === 'post-job') return <PostJobScreen form={jobForm} setForm={setJobForm} publishJob={publishJob} setScreen={setScreen} />;
    if (screen === 'notifications') return <NotificationsScreen notifications={notifications} setNotifications={setNotifications} />;
    if (screen === 'settings') return <SettingsScreen />;
    return <HomeScreen jobs={filteredJobs.slice(0, 3)} query={query} setQuery={setQuery} city={city} setCity={setCity} openJob={openJob} setScreen={setScreen} hasSupabaseConfig={hasSupabaseConfig} />;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
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
        <div className="fixed bottom-24 left-4 right-4 z-[60] mx-auto max-w-sm rounded-lg bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white shadow-lg md:bottom-6">
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

function HomeScreen({ jobs, query, setQuery, city, setCity, openJob, setScreen, hasSupabaseConfig }) {
  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-slate-950 p-5 text-white md:grid md:grid-cols-[1.2fr_0.8fr] md:gap-8 md:p-8">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-blue-100">
            <ShieldCheck size={14} /> Brazzaville, Pointe-Noire, Dolisie
          </div>
          <h1 className="max-w-2xl text-3xl font-black leading-tight md:text-5xl">
            Trouver un emploi ou recruter au Congo, depuis ton telephone.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            Une experience mobile simple pour chercher, sauvegarder, postuler et publier une offre.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-2">
            <Metric value="580" label="Offres" />
            <Metric value="2.4k" label="Talents" />
            <Metric value="94%" label="Match" />
          </div>
        </div>
        <div className="mt-6 rounded-lg bg-white p-3 text-slate-950 md:mt-0">
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
        <ActionCard icon={Sparkles} title={hasSupabaseConfig ? 'Base connectee' : 'Base a connecter'} body={hasSupabaseConfig ? 'Supabase est configure.' : 'Supabase est pret des que les variables Vercel sont ajoutees.'} onClick={() => setScreen('settings')} />
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

function ApplyScreen({ job, form, setForm, submitApplication, setScreen }) {
  return (
    <div className="space-y-4">
      <BackButton onClick={() => setScreen('job')} label="Retour" />
      <PageHeader title="Postuler" subtitle={`${job.role} - ${job.company}`} />
      <form onSubmit={submitApplication} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        <TextField label="Nom complet" value={form.nom} onChange={(nom) => setForm({ ...form, nom })} required />
        <TextField label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} required />
        <TextField label="Telephone" type="tel" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} required />
        <TextArea label="Message au recruteur" value={form.message} onChange={(message) => setForm({ ...form, message })} placeholder="Disponibilite, experience, motivation..." />
        <button type="submit" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 font-black text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600">
          Envoyer ma candidature <Send size={18} />
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

function ProfileScreen({ profile, setProfile, applications, updateProfile, setScreen }) {
  return (
    <div className="space-y-5">
      <PageHeader title="Profil" subtitle="Candidat et suivi des candidatures" />
      <form onSubmit={updateProfile} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-2">
        <TextField label="Nom" value={profile.nom} onChange={(nom) => setProfile({ ...profile, nom })} />
        <TextField label="Prenom" value={profile.prenom} onChange={(prenom) => setProfile({ ...profile, prenom })} />
        <TextField label="Email" type="email" value={profile.email} onChange={(email) => setProfile({ ...profile, email })} />
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
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">En revue</span>
            </div>
          </div>
        ))}
        {applications.length === 0 && <EmptyState title="Aucune candidature" body="Postule a une offre pour suivre ton dossier ici." />}
      </div>
    </div>
  );
}

function LoginScreen({ otpSent, loginEmail, setLoginEmail, otp, setOtp, handleLogin, verifyOtp, setScreen }) {
  return (
    <div className="mx-auto max-w-md space-y-5">
      <BackButton onClick={() => setScreen('home')} label="Accueil" />
      <PageHeader title="Connexion" subtitle="Code OTP de demonstration" />
      <form onSubmit={otpSent ? verifyOtp : handleLogin} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        {!otpSent ? (
          <TextField label="Email" type="email" value={loginEmail} onChange={setLoginEmail} required />
        ) : (
          <TextField label="Code OTP" value={otp} onChange={setOtp} required placeholder="246810" />
        )}
        <button type="submit" className="min-h-12 w-full rounded-lg bg-blue-700 px-5 font-black text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600">
          {otpSent ? 'Valider le code' : 'Recevoir le code'}
        </button>
      </form>
    </div>
  );
}

function RecruiterScreen({ jobs, applications, setScreen }) {
  const ownJobs = jobs.slice(0, 4);
  return (
    <div className="space-y-5">
      <PageHeader title="Recruteur" subtitle="Publier et suivre les candidatures" />
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
      <PageHeader title="Base de donnees" subtitle="Supabase est prepare pour Vercel" />
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className={classNames('flex h-11 w-11 items-center justify-center rounded-lg text-white', hasSupabaseConfig ? 'bg-emerald-600' : 'bg-slate-700')}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="font-black">{hasSupabaseConfig ? 'Supabase connecte' : 'Mode local actif'}</h2>
            <p className="text-sm font-semibold text-slate-500">
              {hasSupabaseConfig ? 'Les variables Vercel sont presentes.' : 'Ajoute VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sur Vercel pour brancher la base.'}
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

function TextField({ label, value, onChange, type = 'text', required, placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-800">{label}</span>
      <input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base font-semibold outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-600" />
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
    <div className="rounded-lg bg-white/10 p-3">
      <p className="text-xl font-black">{value}</p>
      <p className="text-xs font-bold text-slate-300">{label}</p>
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
