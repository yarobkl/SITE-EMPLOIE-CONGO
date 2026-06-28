import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Bookmark,
  Briefcase,
  Home,
  LayoutDashboard,
  Settings,
  User,
} from 'lucide-react';
import { hasSupabaseConfig, supabase } from './lib/supabase';
import { getVisitorKey, readStorage, useStoredState } from './lib/storage';
import { classNames, normalizeApplication, normalizeJob, normalizeNotification } from './lib/format';
import {
  emptyApplication,
  emptyJob,
  initialJobs,
  initialProfile,
  MAX_CV_LABEL,
} from './constants';
import { BrandLogo, IconButton } from './components/ui';
import HomeScreen from './screens/HomeScreen';
import JobsScreen from './screens/JobsScreen';
import JobScreen from './screens/JobScreen';
import ApplyScreen from './screens/ApplyScreen';
import SavedScreen from './screens/SavedScreen';
import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from './screens/LoginScreen';
import RecruiterScreen from './screens/RecruiterScreen';
import PostJobScreen from './screens/PostJobScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import SettingsScreen from './screens/SettingsScreen';

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
      }, { onConflict: 'job_id,session_key', ignoreDuplicates: true });
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
    if (loginPassword.length < 8) {
      notify('Mot de passe: 8 caracteres minimum.');
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
