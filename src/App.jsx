import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Briefcase,
  Users,
  PlusCircle,
  ArrowRight,
  Menu,
  X,
  CheckCircle,
  Building2,
  TrendingUp,
  LayoutDashboard,
  FileText,
  Bell,
  Star,
  Globe,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

const App = () => {
  const [view, setView] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('Toute la République');
  const [savedJobs, setSavedJobs] = useState([]);
  const [formData, setFormData] = useState({ nom: '', email: '', phone: '', message: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: '', phone: '' });
  const [signupForm, setSignupForm] = useState({ nom: '', prenom: '', email: '', phone: '', userType: 'candidat' });
  const [jobs] = useState([
    { id: 1, company: "TotalEnergies EP Congo", role: "Ingénieur HSE Sénior", loc: "Pointe-Noire", type: "CDI", salary: "Top Range", description: "Nous recherchons un Ingénieur HSE sénior expérimenté pour rejoindre notre équipe.", requirements: ["5+ ans d'expérience", "Certification HSE", "Anglais courant"] },
    { id: 2, company: "MTN Congo", role: "Chef de Projet Digital", loc: "Brazzaville", type: "CDD", salary: "Négociable", description: "Pilotage de projets digitaux innovants avec une équipe dynamique.", requirements: ["3+ ans en gestion de projet", "Maîtrise des outils agile", "Gestion de budget"] },
    { id: 3, company: "BGFIBank Congo", role: "Auditeur Interne", loc: "Brazzaville", type: "CDI", salary: "Attractif", description: "Audit interne et conformité des processus bancaires.", requirements: ["Expertise en audit", "Connaissance bancaire", "rigueur"] },
    { id: 4, company: "Airtel Congo", role: "Développeur Backend", loc: "Pointe-Noire", type: "Remote/Hybride", salary: "Expert", description: "Développement d'infrastructure backend robuste pour nos services.", requirements: ["Maîtrise Node.js ou Python", "APIs REST", "Databases SQL/NoSQL"] }
  ]);

  const colors = {
    primary: '#0A2540',
    accent: '#0061FF',
    surface: '#FFFFFF',
    background: '#F6F9FC',
    text: '#1A1F36'
  };

  const Navbar = () => (
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
            <div className="w-10 h-10 bg-[#0A2540] rounded-lg flex items-center justify-center text-white shadow-xl shadow-blue-900/20">
              <Globe size={22} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-[#0A2540]">CONGO<span className="text-[#0061FF]">EMPLOI</span></span>
              <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-slate-400">Excellence & Carrière</span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {isLoggedIn ? (
              <>
                <button onClick={() => setView('jobs')} className="text-sm font-bold text-slate-600 hover:text-[#0061FF] transition-colors">Explorer</button>
                <button onClick={() => setView('candidate')} className="text-sm font-bold text-slate-600 hover:text-[#0061FF] transition-colors">Mon Profil</button>
                {userData?.userType === 'recruteur' && (
                  <button onClick={() => setView('recruiter')} className="text-sm font-bold text-slate-600 hover:text-[#0061FF] transition-colors">Recruteur</button>
                )}
                <button
                  onClick={() => { setIsLoggedIn(false); setUserData(null); setView('home'); }}
                  className="bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-red-700 transition-all shadow-lg"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setView('login')} className="text-sm font-bold text-slate-600 hover:text-[#0061FF] transition-colors">Connexion</button>
                <button
                  onClick={() => setView('signup')}
                  className="bg-[#0A2540] text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-[#0061FF] transition-all shadow-lg"
                >
                  S'inscrire
                </button>
              </>
            )}
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-900">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 p-6 space-y-4 animate-in fade-in slide-in-from-top-2">
          {isLoggedIn ? (
            <>
              <button onClick={() => {setView('jobs'); setIsMenuOpen(false)}} className="block w-full text-left font-bold text-slate-700">Explorer</button>
              <button onClick={() => {setView('candidate'); setIsMenuOpen(false)}} className="block w-full text-left font-bold text-slate-700">Mon Profil</button>
              {userData?.userType === 'recruteur' && (
                <button onClick={() => {setView('recruiter'); setIsMenuOpen(false)}} className="block w-full text-left font-bold text-slate-700">Espace Recruteur</button>
              )}
              <button onClick={() => { setIsLoggedIn(false); setUserData(null); setView('home'); setIsMenuOpen(false); }} className="block w-full text-center py-3 bg-red-600 text-white rounded-lg font-bold">Déconnexion</button>
            </>
          ) : (
            <>
              <button onClick={() => {setView('login'); setIsMenuOpen(false)}} className="block w-full text-center py-3 bg-[#0061FF] text-white rounded-lg font-bold">Connexion</button>
              <button onClick={() => {setView('signup'); setIsMenuOpen(false)}} className="block w-full text-center py-3 border-2 border-[#0061FF] text-[#0061FF] rounded-lg font-bold">S'inscrire</button>
            </>
          )}
        </div>
      )}
    </nav>
  );

  const Hero = () => (
    <section className="relative pt-16 pb-28 overflow-hidden bg-[#F6F9FC]">
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(#0A2540 1px, transparent 1px)', size: '20px 20px' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#0061FF] font-bold text-[11px] uppercase tracking-widest mb-6 border border-blue-100/50">
            <ShieldCheck size={14} /> Plateforme Certifiée Congo-Brazzaville
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-[#0A2540] mb-6 leading-tight tracking-tight">
            Recrutez l'élite à <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0061FF] to-[#60EFFF]">Brazzaville & Pointe-Noire</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl font-medium leading-relaxed">
            L'interface moderne connectant les entreprises majeures du Congo aux talents les plus qualifiés de la sous-région.
          </p>
        </div>

        <div className="bg-white p-2 rounded-2xl shadow-[0_20px_50px_rgba(10,37,64,0.1)] flex flex-col md:row gap-2 max-w-5xl mx-auto border border-white/50">
          <div className="flex flex-col md:flex-row w-full gap-2">
            <div className="flex-1 flex items-center px-5 py-4 gap-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <Search className="text-slate-400" size={20} />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Poste, domaine (ex: Pétrole, IT)..." className="w-full bg-transparent outline-none font-semibold text-slate-700" />
            </div>
            <div className="flex-1 flex items-center px-5 py-4 gap-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <MapPin className="text-slate-400" size={20} />
              <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="w-full bg-transparent outline-none font-semibold text-slate-700 appearance-none">
                <option>Toute la République</option>
                <option>Brazzaville</option>
                <option>Pointe-Noire</option>
                <option>Dolisie</option>
              </select>
            </div>
            <button onClick={() => setView('jobs')} className="bg-[#0061FF] text-white px-10 py-4 rounded-xl font-bold hover:bg-[#0A2540] transition-all shadow-lg flex items-center justify-center gap-2">
              Rechercher <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-x-12 gap-y-6">
          {['120+ Recrutements /mois', 'Données sécurisées', 'Support 24/7 Congo'].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
              <CheckCircle size={16} className="text-green-500" /> {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const RecruiterPortal = () => (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="bg-[#0A2540] rounded-[2.5rem] p-8 md:p-16 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-black mb-6 leading-tight">Optimisez vos recrutements au Congo.</h2>
            <p className="text-blue-100/70 text-lg mb-10 leading-relaxed">
              Accédez à une base de données de candidats triés par compétences, localisés à Pointe-Noire et Brazzaville.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => setView('post-job')} className="bg-[#0061FF] px-8 py-4 rounded-xl font-bold hover:scale-105 transition-all shadow-xl flex items-center gap-2">
                <PlusCircle size={20} /> Publier une offre
              </button>
              <button className="bg-white/10 backdrop-blur-md border border-white/20 px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition-all cursor-pointer">
                Consulter les CV
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
              <Users className="text-[#0061FF] mb-4" size={24} />
              <p className="text-3xl font-black">2.4k</p>
              <p className="text-xs font-bold text-blue-200/50 uppercase tracking-widest mt-1">Nouveaux Talents</p>
            </div>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
              <TrendingUp className="text-[#0061FF] mb-4" size={24} />
              <p className="text-3xl font-black">94%</p>
              <p className="text-xs font-bold text-blue-200/50 uppercase tracking-widest mt-1">Taux de Match</p>
            </div>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
              <Briefcase className="text-[#0061FF] mb-4" size={24} />
              <p className="text-3xl font-black">580</p>
              <p className="text-xs font-bold text-blue-200/50 uppercase tracking-widest mt-1">Offres Live</p>
            </div>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
              <Star className="text-[#0061FF] mb-4" size={24} />
              <p className="text-3xl font-black">4.9</p>
              <p className="text-xs font-bold text-blue-200/50 uppercase tracking-widest mt-1">Avis Entreprises</p>
            </div>
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#0061FF]/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );

  const RecruiterView = () => <RecruiterPortal />;

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = locationFilter === 'Toute la République' || job.loc === locationFilter;
    return matchesSearch && matchesLocation;
  });

  const JobsList = () => (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#0A2540] tracking-tight">Opportunités à la une</h2>
          <p className="text-slate-500 font-semibold mt-1">Postes disponibles à Brazzaville et Pointe-Noire</p>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
          <button className="px-6 py-2 bg-white rounded-lg shadow-sm text-sm font-bold text-[#0A2540]">Récent</button>
          <button className="px-6 py-2 text-sm font-bold text-slate-500">Pertinence</button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredJobs.map((job) => (
          <div key={job.id} className="group bg-white p-6 md:p-8 rounded-2xl border border-slate-100 hover:border-[#0061FF]/30 hover:shadow-[0_15px_40px_rgba(0,97,255,0.05)] transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6 flex-1">
              <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-[#0061FF] transition-colors">
                <Building2 size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-[#0A2540] mb-1 group-hover:text-[#0061FF] transition-colors">{job.role}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-slate-400">
                  <span className="text-slate-600">{job.company}</span>
                  <span className="flex items-center gap-1"><MapPin size={14}/> {job.loc}</span>
                  <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">{job.type}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <span className="text-sm font-bold text-blue-600/60 hidden lg:block">{job.salary}</span>
              <button onClick={() => isLoggedIn ? setSelectedJob(job) : setView('login')} className="flex-1 md:flex-none px-6 py-3 bg-[#0A2540] text-white rounded-xl text-sm font-bold hover:bg-[#0061FF] transition-all">
                Voir l'offre
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <button className="inline-flex items-center gap-2 text-sm font-bold text-[#0061FF] hover:underline">
          Voir toutes les 450 offres <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  const JobDetail = () => (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <button onClick={() => setSelectedJob(null)} className="flex items-center gap-2 text-[#0061FF] font-bold mb-8 hover:underline">
        <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> Retour aux offres
      </button>
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-lg">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-black text-[#0A2540] mb-2">{selectedJob.role}</h1>
            <p className="text-slate-500 font-semibold text-lg">{selectedJob.company}</p>
          </div>
          <button onClick={() => {
            setSavedJobs(savedJobs.find(j => j.id === selectedJob.id) ? savedJobs.filter(j => j.id !== selectedJob.id) : [...savedJobs, selectedJob]);
          }} className={`px-6 py-3 rounded-xl font-bold transition-all ${savedJobs.find(j => j.id === selectedJob.id) ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
            {savedJobs.find(j => j.id === selectedJob.id) ? '✓ Sauvegardée' : 'Sauvegarder'}
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Localisation</p>
            <p className="text-lg font-bold text-[#0A2540]">{selectedJob.loc}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Type de contrat</p>
            <p className="text-lg font-bold text-[#0A2540]">{selectedJob.type}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Salaire</p>
            <p className="text-lg font-bold text-[#0A2540]">{selectedJob.salary}</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#0A2540] mb-4">Description du poste</h2>
          <p className="text-slate-600 leading-relaxed">{selectedJob.description}</p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#0A2540] mb-4">Ce que nous cherchons</h2>
          <div className="bg-blue-50 p-4 rounded-xl mb-4 border border-blue-100">
            <p className="text-slate-700 font-semibold text-sm">✨ N'hésitez pas à postuler même si vous n'avez pas tous les critères! Nous valorisons l'apprentissage et la motivation.</p>
          </div>
          <ul className="space-y-2">
            {selectedJob.requirements.map((req, i) => (
              <li key={i} className="flex items-center gap-3 text-slate-600">
                <CheckCircle size={18} className="text-[#0061FF] flex-shrink-0" /> {req}
              </li>
            ))}
          </ul>
        </div>

        <button onClick={() => setView('apply')} className="w-full bg-[#0061FF] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#0A2540] transition-all">
          Postuler maintenant
        </button>
      </div>
    </div>
  );

  const ApplyForm = () => (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <button onClick={() => { setView('jobs'); setSelectedJob(null); }} className="flex items-center gap-2 text-[#0061FF] font-bold mb-8 hover:underline">
        <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> Retour
      </button>
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-lg">
        <h1 className="text-3xl font-black text-[#0A2540] mb-2">Postuler à cette offre</h1>
        <p className="text-slate-500 font-semibold mb-8">{selectedJob.role} - {selectedJob.company}</p>

        <div className="bg-blue-50 p-6 rounded-xl mb-8 border border-blue-100">
          <p className="text-slate-700 font-semibold">📝 Remplissez simplement vos informations de contact. Pas besoin de CV ! Postulez maintenant et commencez votre nouvelle carrière.</p>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          alert(`Candidature soumise avec succès!\n\nNom: ${formData.nom}\nEmail: ${formData.email}\nTéléphone: ${formData.phone}\n\nUn recruteur vous contactera bientôt.`);
          setFormData({ nom: '', email: '', phone: '', message: '' });
          setView('home');
          setSelectedJob(null);
        }} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-[#0A2540] mb-2">Nom complet</label>
            <input type="text" required value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-[#0061FF]" placeholder="Jean Dupont" />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#0A2540] mb-2">Email</label>
            <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-[#0061FF]" placeholder="votre@email.com" />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#0A2540] mb-2">Numéro de téléphone</label>
            <input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-[#0061FF]" placeholder="+242 06 xxx xxxx" />
          </div>
          <button type="submit" className="w-full bg-[#0061FF] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#0A2540] transition-all">
            Soumettre ma candidature
          </button>
        </form>
      </div>
    </div>
  );

  const LoginPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F9FC] to-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-[#0A2540] rounded-lg flex items-center justify-center text-white shadow-lg mx-auto mb-4">
              <Globe size={24} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black text-[#0A2540] mb-2">CONGO<span className="text-[#0061FF]">EMPLOI</span></h1>
            <p className="text-slate-500 font-semibold">Connectez-vous à votre compte</p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (loginForm.email && loginForm.phone) {
              setIsLoggedIn(true);
              setUserData({ email: loginForm.email, phone: loginForm.phone, nom: 'Utilisateur' });
              setLoginForm({ email: '', phone: '' });
              setView('home');
              alert('Connexion réussie!');
            }
          }} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#0A2540] mb-2">Email</label>
              <input
                type="email"
                required
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-[#0061FF]"
                placeholder="votre@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#0A2540] mb-2">Numéro de téléphone</label>
              <input
                type="tel"
                required
                value={loginForm.phone}
                onChange={(e) => setLoginForm({...loginForm, phone: e.target.value})}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-[#0061FF]"
                placeholder="+242 06 xxx xxxx"
              />
            </div>
            <button type="submit" className="w-full bg-[#0061FF] text-white py-3 rounded-xl font-bold text-lg hover:bg-[#0A2540] transition-all">
              Se connecter
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-slate-600 text-center font-semibold mb-4">Pas encore de compte?</p>
            <button onClick={() => setView('signup')} className="w-full border-2 border-[#0061FF] text-[#0061FF] py-3 rounded-xl font-bold hover:bg-blue-50 transition-all">
              Créer un compte
            </button>
          </div>

          <button onClick={() => setView('home')} className="w-full mt-4 text-slate-500 font-semibold hover:text-slate-700 transition-colors">
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );

  const SignupPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F9FC] to-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-[#0061FF] rounded-lg flex items-center justify-center text-white shadow-lg mx-auto mb-4">
              <Users size={24} />
            </div>
            <h1 className="text-3xl font-black text-[#0A2540] mb-2">Créer un compte</h1>
            <p className="text-slate-500 font-semibold">Rejoignez CONGOEMPLOI aujourd'hui</p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (signupForm.email && signupForm.phone && signupForm.nom && signupForm.prenom) {
              setIsLoggedIn(true);
              setUserData({ email: signupForm.email, phone: signupForm.phone, nom: signupForm.prenom + ' ' + signupForm.nom, userType: signupForm.userType });
              setSignupForm({ nom: '', prenom: '', email: '', phone: '', userType: 'candidat' });
              setView('home');
              alert('Compte créé avec succès!');
            }
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-[#0A2540] mb-1">Prénom</label>
                <input
                  type="text"
                  required
                  value={signupForm.prenom}
                  onChange={(e) => setSignupForm({...signupForm, prenom: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold focus:outline-none focus:border-[#0061FF] text-sm"
                  placeholder="Jean"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#0A2540] mb-1">Nom</label>
                <input
                  type="text"
                  required
                  value={signupForm.nom}
                  onChange={(e) => setSignupForm({...signupForm, nom: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold focus:outline-none focus:border-[#0061FF] text-sm"
                  placeholder="Dupont"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#0A2540] mb-2">Email</label>
              <input
                type="email"
                required
                value={signupForm.email}
                onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg font-semibold focus:outline-none focus:border-[#0061FF] text-sm"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#0A2540] mb-2">Numéro de téléphone</label>
              <input
                type="tel"
                required
                value={signupForm.phone}
                onChange={(e) => setSignupForm({...signupForm, phone: e.target.value})}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg font-semibold focus:outline-none focus:border-[#0061FF] text-sm"
                placeholder="+242 06 xxx xxxx"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#0A2540] mb-2">Je suis</label>
              <select
                value={signupForm.userType}
                onChange={(e) => setSignupForm({...signupForm, userType: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg font-semibold focus:outline-none focus:border-[#0061FF] text-sm"
              >
                <option value="candidat">Un candidat à la recherche d'emploi</option>
                <option value="recruteur">Un recruteur / Entreprise</option>
              </select>
            </div>

            <button type="submit" className="w-full bg-[#0061FF] text-white py-3 rounded-xl font-bold hover:bg-[#0A2540] transition-all mt-6">
              Créer mon compte
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-slate-600 text-center font-semibold mb-4">Vous avez déjà un compte?</p>
            <button onClick={() => setView('login')} className="w-full border-2 border-[#0061FF] text-[#0061FF] py-3 rounded-xl font-bold hover:bg-blue-50 transition-all">
              Se connecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const ProfilePage = () => (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-black text-[#0A2540] mb-4">Mon Profil</h1>
      <p className="text-slate-500 font-semibold mb-8">Bienvenue sur votre espace candidat</p>

      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-lg mb-8">
        <h2 className="text-2xl font-bold text-[#0A2540] mb-6">Offres sauvegardées ({savedJobs.length})</h2>
        {savedJobs.length === 0 ? (
          <p className="text-slate-500 font-semibold">Aucune offre sauvegardée pour le moment.</p>
        ) : (
          <div className="grid gap-4">
            {savedJobs.map(job => (
              <div key={job.id} className="group bg-slate-50 p-6 rounded-xl border border-slate-100 hover:border-[#0061FF]/30 transition-all flex justify-between items-start md:items-center gap-6">
                <div>
                  <h3 className="text-lg font-bold text-[#0A2540] mb-1">{job.role}</h3>
                  <p className="text-sm text-slate-500 font-semibold">{job.company} • {job.loc}</p>
                </div>
                <button onClick={() => { setSelectedJob(job); setView('apply'); }} className="px-6 py-3 bg-[#0061FF] text-white rounded-xl text-sm font-bold hover:bg-[#0A2540] transition-all">
                  Postuler
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const CandidateView = () => <JobsList />;

  const PostJobForm = () => (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-black text-[#0A2540] mb-4">Publier une offre d'emploi</h1>
      <p className="text-slate-500 font-semibold mb-8">Déposez votre annonce pour trouver les meilleurs talents</p>

      <form onSubmit={(e) => {
        e.preventDefault();
        alert('Offre publiée avec succès! Elle sera visible dans quelques minutes.');
        setView('home');
      }} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-lg space-y-6">
        <div>
          <label className="block text-sm font-bold text-[#0A2540] mb-2">Titre du poste</label>
          <input type="text" required className="w-full px-4 py-3 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-[#0061FF]" placeholder="Ex: Développeur Senior" />
        </div>
        <div>
          <label className="block text-sm font-bold text-[#0A2540] mb-2">Localisation</label>
          <select required className="w-full px-4 py-3 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-[#0061FF]">
            <option>Brazzaville</option>
            <option>Pointe-Noire</option>
            <option>Dolisie</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-[#0A2540] mb-2">Type de contrat</label>
          <select required className="w-full px-4 py-3 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-[#0061FF]">
            <option>CDI</option>
            <option>CDD</option>
            <option>Stage</option>
            <option>Freelance</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-[#0A2540] mb-2">Description</label>
          <textarea required className="w-full px-4 py-3 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-[#0061FF] h-32 resize-none" placeholder="Décrivez le poste et les responsabilités..." />
        </div>
        <button type="submit" className="w-full bg-[#0061FF] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#0A2540] transition-all">
          Publier l'offre
        </button>
      </form>
    </div>
  );

  const Footer = () => (
    <footer className="bg-white border-t border-slate-100 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-[#0A2540] rounded-lg flex items-center justify-center text-white font-bold text-sm">C</div>
              <span className="text-xl font-black tracking-tight text-[#0A2540]">CONGO<span className="text-[#0061FF]">EMPLOI</span></span>
            </div>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              Le standard de recrutement moderne en République du Congo. Développé par le Cabinet Tech Brazza.
            </p>
          </div>
          <div>
            <h4 className="text-slate-900 font-bold mb-6">Plateforme</h4>
            <ul className="space-y-4 text-slate-500 text-sm font-semibold">
              <li className="hover:text-[#0061FF] cursor-pointer">Recherche d'emploi</li>
              <li className="hover:text-[#0061FF] cursor-pointer">Espace Recruteur</li>
              <li className="hover:text-[#0061FF] cursor-pointer">Formation & Coaching</li>
              <li className="hover:text-[#0061FF] cursor-pointer">Salaires au Congo</li>
            </ul>
          </div>
          <div>
            <h4 className="text-slate-900 font-bold mb-6">Entreprise</h4>
            <ul className="space-y-4 text-slate-500 text-sm font-semibold">
              <li className="hover:text-[#0061FF] cursor-pointer">À propos</li>
              <li className="hover:text-[#0061FF] cursor-pointer">Nos Partenaires</li>
              <li className="hover:text-[#0061FF] cursor-pointer">Contact</li>
              <li className="hover:text-[#0061FF] cursor-pointer">Carrières interne</li>
            </ul>
          </div>
          <div>
            <h4 className="text-slate-900 font-bold mb-6">S'abonner</h4>
            <div className="space-y-4">
              <p className="text-slate-400 text-sm font-medium">Alertes emails quotidiennes.</p>
              <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100">
                <input type="email" placeholder="Email" className="bg-transparent px-3 py-2 text-sm outline-none w-full font-semibold" />
                <button className="bg-[#0A2540] text-white px-4 py-2 rounded-lg text-xs font-bold">Go</button>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-50 flex flex-col md:row justify-between items-center gap-4">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">© 2024 CONGOEMPLOI SARL • Brazzaville • Pointe-Noire</p>
          <div className="flex gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="hover:text-[#0061FF] cursor-pointer">Confidentialité</span>
            <span className="hover:text-[#0061FF] cursor-pointer">Conditions</span>
          </div>
        </div>
      </div>
    </footer>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Navbar />
      <main className="animate-in fade-in duration-500">
        {view === 'home' && (
          <>
            <Hero />
            <div className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-8">
               <div onClick={() => setView('jobs')} className="group bg-white p-10 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all cursor-pointer">
                  <div className="w-12 h-12 bg-blue-50 text-[#0061FF] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Users size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-[#0A2540] mb-3">Je cherche un poste</h3>
                  <p className="text-slate-500 font-medium mb-6">Plus de 200 nouvelles offres chaque semaine dans tous les secteurs.</p>
                  <span className="flex items-center gap-2 font-bold text-[#0061FF] text-sm">Découvrir les offres <ArrowRight size={16} /></span>
               </div>
               <div onClick={() => setView('recruiter')} className="group bg-[#F6F9FC] p-10 rounded-[2rem] border border-blue-100 shadow-sm hover:shadow-2xl transition-all cursor-pointer">
                  <div className="w-12 h-12 bg-[#0A2540] text-white rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Building2 size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-[#0A2540] mb-3">Je suis recruteur</h3>
                  <p className="text-slate-500 font-medium mb-6">Identifiez les meilleurs profils à Brazzaville et Pointe-Noire en un clic.</p>
                  <span className="flex items-center gap-2 font-bold text-[#0A2540] text-sm">Espace entreprise <ArrowRight size={16} /></span>
               </div>
            </div>
            <CandidateView />
            <RecruiterView />
          </>
        )}

        {view === 'login' && <LoginPage />}
        {view === 'signup' && <SignupPage />}
        {view === 'jobs' && !selectedJob && isLoggedIn && <CandidateView />}
        {view === 'jobs' && selectedJob && isLoggedIn && <JobDetail />}
        {view === 'apply' && isLoggedIn && <ApplyForm />}
        {view === 'recruiter' && isLoggedIn && <RecruiterView />}
        {view === 'post-job' && isLoggedIn && <PostJobForm />}
        {view === 'candidate' && isLoggedIn && <ProfilePage />}
        {view === 'jobs' && !isLoggedIn && <div className="max-w-4xl mx-auto px-4 py-16 text-center"><p className="text-xl text-slate-600 font-semibold mb-6">Vous devez être connecté pour voir les offres d'emploi</p><button onClick={() => setView('login')} className="bg-[#0061FF] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#0A2540] transition-all">Se connecter</button></div>}
        {view === 'recruiter' && !isLoggedIn && <div className="max-w-4xl mx-auto px-4 py-16 text-center"><p className="text-xl text-slate-600 font-semibold mb-6">Créez un compte recruteur pour accéder à cet espace</p><button onClick={() => setView('signup')} className="bg-[#0061FF] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#0A2540] transition-all">S'inscrire</button></div>}
      </main>
      <Footer />
    </div>
  );
};

export default App;