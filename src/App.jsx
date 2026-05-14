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
  Star,
  Globe,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  Calendar,
  Heart,
  Share2,
  ArrowLeft,
  Mail,
  Phone,
  AlertCircle
} from 'lucide-react';

const App = () => {
  const [view, setView] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [savedJobs, setSavedJobs] = useState([]);
  const [formData, setFormData] = useState({ nom: '', email: '', phone: '', message: '' });

  const jobs = [
    { id: 1, company: "TotalEnergies EP Congo", role: "Ingénieur HSE Sénior", loc: "Pointe-Noire", type: "CDI", salary: "5-7M CFA", desc: "Nous recherchons un Ingénieur HSE expérimenté pour rejoindre notre équipe à Pointe-Noire." },
    { id: 2, company: "MTN Congo", role: "Chef de Projet Digital", loc: "Brazzaville", type: "CDD", salary: "2-3M CFA", desc: "Pilotez nos projets digitaux les plus importants au Congo." },
    { id: 3, company: "BGFIBank Congo", role: "Auditeur Interne", loc: "Brazzaville", type: "CDI", salary: "1.5-2M CFA", desc: "Rejoignez notre département d'audit interne pour renforcer nos contrôles." },
    { id: 4, company: "Airtel Congo", role: "Développeur Backend", loc: "Pointe-Noire", type: "Remote/Hybride", salary: "2.5-3.5M CFA", desc: "Développez nos services backend avec les dernières technologies." }
  ];

  const toggleSaveJob = (jobId) => {
    setSavedJobs(saved => 
      saved.includes(jobId) 
        ? saved.filter(id => id !== jobId)
        : [...saved, jobId]
    );
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Candidature soumise avec succès! Nous vous contactons bientôt.');
    setFormData({ nom: '', email: '', phone: '', message: '' });
    setView('home');
  };

  const Navbar = () => (
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setView('home'); setSelectedJob(null); }}>
            <div className="w-10 h-10 bg-[#0A2540] rounded-lg flex items-center justify-center text-white shadow-xl shadow-blue-900/20">
              <Globe size={22} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-[#0A2540]">CONGO<span className="text-[#0061FF]">EMPLOI</span></span>
              <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-slate-400">Excellence & Carrière</span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => { setView('jobs'); setSelectedJob(null); }} className="text-sm font-bold text-slate-600 hover:text-[#0061FF] transition-colors">Explorer</button>
            <button onClick={() => setView('profile')} className="text-sm font-bold text-slate-600 hover:text-[#0061FF] transition-colors">Mon Profil</button>
            <button onClick={() => setView('recruiter-portal')} className="bg-[#0A2540] text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-[#0061FF] transition-all shadow-lg">Recruteurs</button>
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
          <button onClick={() => { setView('jobs'); setSelectedJob(null); setIsMenuOpen(false); }} className="block w-full text-left font-bold text-slate-700">Offres d'emploi</button>
          <button onClick={() => { setView('profile'); setIsMenuOpen(false); }} className="block w-full text-left font-bold text-slate-700">Mon Profil</button>
          <button onClick={() => { setView('recruiter-portal'); setIsMenuOpen(false); }} className="block w-full text-center py-3 bg-[#0A2540] text-white rounded-lg font-bold">Espace Recruteur</button>
        </div>
      )}
    </nav>
  );

  const Hero = () => (
    <section className="relative pt-16 pb-28 overflow-hidden bg-[#F6F9FC]">
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
              <input 
                type="text" 
                placeholder="Poste, domaine (ex: Pétrole, IT)..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent outline-none font-semibold text-slate-700" 
              />
            </div>
            <div className="flex-1 flex items-center px-5 py-4 gap-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <MapPin className="text-slate-400" size={20} />
              <select 
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full bg-transparent outline-none font-semibold text-slate-700 appearance-none">
                <option value="">Toute la République</option>
                <option value="Brazzaville">Brazzaville</option>
                <option value="Pointe-Noire">Pointe-Noire</option>
                <option value="Dolisie">Dolisie</option>
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

  const JobDetail = ({ job }) => (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <button onClick={() => setSelectedJob(null)} className="flex items-center gap-2 text-[#0061FF] font-bold mb-6 hover:underline">
        <ArrowLeft size={18} /> Retour aux offres
      </button>

      <div className="bg-white rounded-2xl border border-slate-100 p-8 md:p-12">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-black text-[#0A2540] mb-2">{job.role}</h1>
            <p className="text-xl text-slate-500 font-semibold">{job.company}</p>
          </div>
          <button 
            onClick={() => toggleSaveJob(job.id)}
            className={`p-3 rounded-xl transition-all ${savedJobs.includes(job.id) ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
            <Heart size={24} fill={savedJobs.includes(job.id) ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8 pb-8 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <MapPin className="text-[#0061FF]" size={20} />
            <div><p className="text-xs text-slate-500 uppercase font-bold">Localisation</p><p className="font-bold text-slate-900">{job.loc}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <Briefcase className="text-[#0061FF]" size={20} />
            <div><p className="text-xs text-slate-500 uppercase font-bold">Type</p><p className="font-bold text-slate-900">{job.type}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <DollarSign className="text-[#0061FF]" size={20} />
            <div><p className="text-xs text-slate-500 uppercase font-bold">Salaire</p><p className="font-bold text-slate-900">{job.salary}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="text-[#0061FF]" size={20} />
            <div><p className="text-xs text-slate-500 uppercase font-bold">Posté</p><p className="font-bold text-slate-900">Récemment</p></div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-black text-[#0A2540] mb-4">À propos du poste</h2>
          <p className="text-slate-600 leading-relaxed mb-6">{job.desc}</p>
          <p className="text-slate-600 leading-relaxed mb-4">
            Nous recherchons un professionnel passionné avec au minimum 5 ans d'expérience. Vous serez responsable de contribuer à nos objectifs stratégiques et de travailler en étroite collaboration avec une équipe dynamique.
          </p>
        </div>

        <div className="flex gap-4">
          <button onClick={() => setView('apply')} className="flex-1 bg-[#0061FF] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#0A2540] transition-all text-lg">
            Postuler maintenant
          </button>
          <button className="px-8 py-4 border-2 border-[#0061FF] text-[#0061FF] rounded-xl font-bold hover:bg-blue-50 transition-all flex items-center gap-2">
            <Share2 size={20} /> Partager
          </button>
        </div>
      </div>
    </div>
  );

  const JobsList = () => {
    const filteredJobs = jobs.filter(job => {
      const matchesSearch = job.role.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.company.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = !locationFilter || job.loc === locationFilter;
      return matchesSearch && matchesLocation;
    });

    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-black text-[#0A2540] tracking-tight mb-12">Offres d'emploi</h2>

        {filteredJobs.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="mx-auto mb-4 text-slate-400" size={48} />
            <p className="text-slate-500 font-semibold">Aucune offre ne correspond à vos critères</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredJobs.map((job) => (
              <div key={job.id} className="group bg-white p-6 md:p-8 rounded-2xl border border-slate-100 hover:border-[#0061FF]/30 hover:shadow-[0_15px_40px_rgba(0,97,255,0.05)] transition-all">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[#0A2540] mb-1 cursor-pointer hover:text-[#0061FF]" onClick={() => setSelectedJob(job)}>{job.role}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-slate-500 mb-3">
                      <span>{job.company}</span>
                      <span className="flex items-center gap-1"><MapPin size={14}/> {job.loc}</span>
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">{job.type}</span>
                    </div>
                    <p className="text-slate-600 text-sm">{job.salary}</p>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                      onClick={() => toggleSaveJob(job.id)}
                      className={`p-2 rounded-lg transition-all ${savedJobs.includes(job.id) ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                      <Heart size={20} fill={savedJobs.includes(job.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button 
                      onClick={() => setSelectedJob(job)}
                      className="flex-1 md:flex-none px-6 py-3 bg-[#0A2540] text-white rounded-xl text-sm font-bold hover:bg-[#0061FF] transition-all">
                      Voir l'offre
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const ApplyForm = () => (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <button onClick={() => { setView('jobs'); setSelectedJob(null); }} className="flex items-center gap-2 text-[#0061FF] font-bold mb-6 hover:underline">
        <ArrowLeft size={18} /> Retour aux offres
      </button>

      <div className="bg-white rounded-2xl border border-slate-100 p-8 md:p-12">
        <h1 className="text-3xl font-black text-[#0A2540] mb-8">Postulez maintenant</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Prénom *</label>
              <input type="text" name="nom" value={formData.nom} onChange={handleFormChange} required className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#0061FF] outline-none" placeholder="Jean" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Nom *</label>
              <input type="text" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#0061FF] outline-none" placeholder="Dupont" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">Email *</label>
            <input type="email" name="email" value={formData.email} onChange={handleFormChange} required className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#0061FF] outline-none" placeholder="jean@example.com" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">Téléphone *</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleFormChange} required className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#0061FF] outline-none" placeholder="+242 6XX XXX XXX" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">Lettre de motivation</label>
            <textarea name="message" value={formData.message} onChange={handleFormChange} className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#0061FF] outline-none h-32" placeholder="Dites-nous pourquoi vous êtes intéressé..."></textarea>
          </div>

          <button type="submit" className="w-full bg-[#0061FF] text-white py-3 rounded-xl font-bold hover:bg-[#0A2540] transition-all text-lg">
            Soumettre ma candidature
          </button>
        </form>
      </div>
    </div>
  );

  const RecruiterPortal = () => (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="bg-[#0A2540] rounded-[2.5rem] p-8 md:p-16 text-white relative overflow-hidden shadow-2xl mb-16">
        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-black mb-6 leading-tight">Optimisez vos recrutements.</h2>
            <p className="text-blue-100/70 text-lg mb-10 leading-relaxed">
              Accédez à une base de données de candidats triés par compétences.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => setView('post-job')} className="bg-[#0061FF] px-8 py-4 rounded-xl font-bold hover:scale-105 transition-all shadow-xl flex items-center gap-2">
                <PlusCircle size={20} /> Publier une offre
              </button>
              <button className="bg-white/10 backdrop-blur-md border border-white/20 px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition-all">
                Consulter les CV
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
              <Users className="text-[#0061FF] mb-4" size={24} />
              <p className="text-3xl font-black">2.4k</p>
              <p className="text-xs font-bold text-blue-200/50 uppercase tracking-widest mt-1">Talents</p>
            </div>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
              <TrendingUp className="text-[#0061FF] mb-4" size={24} />
              <p className="text-3xl font-black">94%</p>
              <p className="text-xs font-bold text-blue-200/50 uppercase tracking-widest mt-1">Taux Match</p>
            </div>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
              <Briefcase className="text-[#0061FF] mb-4" size={24} />
              <p className="text-3xl font-black">580</p>
              <p className="text-xs font-bold text-blue-200/50 uppercase tracking-widest mt-1">Offres Live</p>
            </div>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
              <Star className="text-[#0061FF] mb-4" size={24} />
              <p className="text-3xl font-black">4.9</p>
              <p className="text-xs font-bold text-blue-200/50 uppercase tracking-widest mt-1">Avis</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const PostJobForm = () => (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <button onClick={() => setView('recruiter-portal')} className="flex items-center gap-2 text-[#0061FF] font-bold mb-6 hover:underline">
        <ArrowLeft size={18} /> Retour
      </button>

      <div className="bg-white rounded-2xl border border-slate-100 p-8 md:p-12">
        <h1 className="text-3xl font-black text-[#0A2540] mb-8">Publier une offre d'emploi</h1>

        <form onSubmit={(e) => { e.preventDefault(); alert('Offre publiée!'); setView('recruiter-portal'); }} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">Titre du poste *</label>
            <input type="text" required className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#0061FF] outline-none" placeholder="ex: Développeur Senior" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">Description *</label>
            <textarea required className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#0061FF] outline-none h-32" placeholder="Décrivez le poste..."></textarea>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Localisation *</label>
              <select required className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#0061FF] outline-none appearance-none">
                <option>Brazzaville</option>
                <option>Pointe-Noire</option>
                <option>Dolisie</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Type de contrat *</label>
              <select required className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#0061FF] outline-none appearance-none">
                <option>CDI</option>
                <option>CDD</option>
                <option>Stage</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">Salaire</label>
            <input type="text" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#0061FF] outline-none" placeholder="ex: 2-3M CFA" />
          </div>

          <button type="submit" className="w-full bg-[#0061FF] text-white py-3 rounded-xl font-bold hover:bg-[#0A2540] transition-all text-lg">
            Publier l'offre
          </button>
        </form>
      </div>
    </div>
  );

  const ProfilePage = () => (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-[#0A2540] mb-8">Mon Profil</h1>
      
      <div className="bg-white rounded-2xl border border-slate-100 p-8 space-y-6">
        <div>
          <h2 className="text-xl font-black text-[#0A2540] mb-4">Informations</h2>
          <div className="space-y-3 text-slate-600">
            <p><strong>Nom:</strong> Jean Dupont</p>
            <p><strong>Email:</strong> jean@example.com</p>
            <p><strong>Téléphone:</strong> +242 6XX XXX XXX</p>
            <p><strong>Localisation:</strong> Brazzaville</p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200">
          <h2 className="text-xl font-black text-[#0A2540] mb-4">Offres sauvegardées ({savedJobs.length})</h2>
          {savedJobs.length === 0 ? (
            <p className="text-slate-500">Aucune offre sauvegardée.</p>
          ) : (
            <div className="space-y-3">
              {jobs.filter(j => savedJobs.includes(j.id)).map(job => (
                <div key={job.id} className="p-4 bg-slate-50 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900">{job.role}</p>
                    <p className="text-sm text-slate-500">{job.company}</p>
                  </div>
                  <button onClick={() => setSelectedJob(job); setView('apply');} className="text-[#0061FF] font-bold">Postuler</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-slate-200">
          <button onClick={() => setView('home')} className="w-full bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 transition-all">
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );

  const Footer = () => (
    <footer className="bg-white border-t border-slate-100 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-[#0A2540] rounded-lg flex items-center justify-center text-white font-bold text-sm">C</div>
              <span className="text-xl font-black tracking-tight text-[#0A2540]">CONGO<span className="text-[#0061FF]">EMPLOI</span></span>
            </div>
            <p className="text-slate-400 text-sm font-medium">Le standard de recrutement moderne au Congo.</p>
          </div>
          <div>
            <h4 className="text-slate-900 font-bold mb-6">Plateforme</h4>
            <ul className="space-y-4 text-slate-500 text-sm font-semibold">
              <li className="hover:text-[#0061FF] cursor-pointer">Recherche d'emploi</li>
              <li className="hover:text-[#0061FF] cursor-pointer">Espace Recruteur</li>
              <li className="hover:text-[#0061FF] cursor-pointer">Formation</li>
            </ul>
          </div>
          <div>
            <h4 className="text-slate-900 font-bold mb-6">Entreprise</h4>
            <ul className="space-y-4 text-slate-500 text-sm font-semibold">
              <li className="hover:text-[#0061FF] cursor-pointer">À propos</li>
              <li className="hover:text-[#0061FF] cursor-pointer">Partenaires</li>
              <li className="hover:text-[#0061FF] cursor-pointer">Contact</li>
            </ul>
          </div>
          <div>
            <h4 className="text-slate-900 font-bold mb-6">S'abonner</h4>
            <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100">
              <input type="email" placeholder="Email" className="bg-transparent px-3 py-2 text-sm outline-none w-full font-semibold" />
              <button className="bg-[#0A2540] text-white px-4 py-2 rounded-lg text-xs font-bold">Go</button>
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-50 text-center">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">© 2024 CONGOEMPLOI SARL</p>
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
              <div onClick={() => { setView('jobs'); setSelectedJob(null); }} className="group bg-white p-10 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all cursor-pointer">
                <div className="w-12 h-12 bg-blue-50 text-[#0061FF] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users size={24} />
                </div>
                <h3 className="text-2xl font-black text-[#0A2540] mb-3">Je cherche un poste</h3>
                <p className="text-slate-500 font-medium mb-6">Plus de 200 offres chaque semaine.</p>
                <span className="flex items-center gap-2 font-bold text-[#0061FF] text-sm">Découvrir <ArrowRight size={16} /></span>
              </div>
              <div onClick={() => setView('recruiter-portal')} className="group bg-[#F6F9FC] p-10 rounded-[2rem] border border-blue-100 shadow-sm hover:shadow-2xl transition-all cursor-pointer">
                <div className="w-12 h-12 bg-[#0A2540] text-white rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Building2 size={24} />
                </div>
                <h3 className="text-2xl font-black text-[#0A2540] mb-3">Je suis recruteur</h3>
                <p className="text-slate-500 font-medium mb-6">Trouvez les meilleurs profils.</p>
                <span className="flex items-center gap-2 font-bold text-[#0A2540] text-sm">Espace <ArrowRight size={16} /></span>
              </div>
            </div>
            <JobsList />
            <RecruiterPortal />
          </>
        )}
        
        {view === 'jobs' && !selectedJob && <JobsList />}
        {view === 'jobs' && selectedJob && <JobDetail job={selectedJob} />}
        {view === 'apply' && <ApplyForm />}
        {view === 'recruiter-portal' && <RecruiterPortal />}
        {view === 'post-job' && <PostJobForm />}
        {view === 'profile' && <ProfilePage />}
      </main>
      <Footer />
    </div>
  );
};

export default App;