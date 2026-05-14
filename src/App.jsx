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

  // Palette Bleu Moderne : Deep Blue, Electric Blue et Soft Slate
  const colors = {
    primary: '#0A2540', // Bleu nuit très profond (Premium)
    accent: '#0061FF',  // Bleu électrique
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
            <button onClick={() => setView('jobs')} className="text-sm font-bold text-slate-600 hover:text-[#0061FF] transition-colors">Explorer</button>
            <button onClick={() => setView('candidate')} className="text-sm font-bold text-slate-600 hover:text-[#0061FF] transition-colors">Mon Profil</button>
            <button
              onClick={() => setView('recruiter')}
              className="bg-[#0A2540] text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-[#0061FF] transition-all shadow-lg active:scale-95"
            >
              Recruteurs
            </button>
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
          <button onClick={() => {setView('jobs'); setIsMenuOpen(false)}} className="block w-full text-left font-bold text-slate-700">Offres d'emploi</button>
          <button onClick={() => {setView('candidate'); setIsMenuOpen(false)}} className="block w-full text-left font-bold text-slate-700">Candidature spontanée</button>
          <button onClick={() => {setView('recruiter'); setIsMenuOpen(false)}} className="block w-full text-center py-3 bg-[#0A2540] text-white rounded-lg font-bold">Publier une offre</button>
        </div>
      )}
    </nav>
  );

  const Hero = () => (
    <section className="relative pt-16 pb-28 overflow-hidden bg-[#F6F9FC]">
      {/* Background patterns */}
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

        {/* Search Bar - Glassmorphism style */}
        <div className="bg-white p-2 rounded-2xl shadow-[0_20px_50px_rgba(10,37,64,0.1)] flex flex-col md:row gap-2 max-w-5xl mx-auto border border-white/50">
          <div className="flex flex-col md:flex-row w-full gap-2">
            <div className="flex-1 flex items-center px-5 py-4 gap-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <Search className="text-slate-400" size={20} />
              <input type="text" placeholder="Poste, domaine (ex: Pétrole, IT)..." className="w-full bg-transparent outline-none font-semibold text-slate-700" />
            </div>
            <div className="flex-1 flex items-center px-5 py-4 gap-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <MapPin className="text-slate-400" size={20} />
              <select className="w-full bg-transparent outline-none font-semibold text-slate-700 appearance-none">
                <option>Toute la République</option>
                <option>Brazzaville</option>
                <option>Pointe-Noire</option>
                <option>Dolisie</option>
              </select>
            </div>
            <button className="bg-[#0061FF] text-white px-10 py-4 rounded-xl font-bold hover:bg-[#0A2540] transition-all shadow-lg flex items-center justify-center gap-2">
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

  const RecruiterView = () => (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="bg-[#0A2540] rounded-[2.5rem] p-8 md:p-16 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-black mb-6 leading-tight">Optimisez vos recrutements au Congo.</h2>
            <p className="text-blue-100/70 text-lg mb-10 leading-relaxed">
              Accédez à une base de données de candidats triés par compétences, localisés à Pointe-Noire et Brazzaville.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="bg-[#0061FF] px-8 py-4 rounded-xl font-bold hover:scale-105 transition-all shadow-xl flex items-center gap-2">
                <PlusCircle size={20} /> Publier une offre
              </button>
              <button className="bg-white/10 backdrop-blur-md border border-white/20 px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition-all">
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
        {/* Abstract circles */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#0061FF]/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );

  const CandidateView = () => (
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
        {[
          { company: "TotalEnergies EP Congo", role: "Ingénieur HSE Sénior", loc: "Pointe-Noire", type: "CDI", salary: "Top Range" },
          { company: "MTN Congo", role: "Chef de Projet Digital", loc: "Brazzaville", type: "CDD", salary: "Négociable" },
          { company: "BGFIBank Congo", role: "Auditeur Interne", loc: "Brazzaville", type: "CDI", salary: "Attractif" },
          { company: "Airtel Congo", role: "Développeur Backend", loc: "Pointe-Noire", type: "Remote/Hybride", salary: "Expert" }
        ].map((job, i) => (
          <div key={i} className="group bg-white p-6 md:p-8 rounded-2xl border border-slate-100 hover:border-[#0061FF]/30 hover:shadow-[0_15px_40px_rgba(0,97,255,0.05)] transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-[#0061FF] transition-colors">
                <Building2 size={24} />
              </div>
              <div>
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
              <button className="flex-1 md:flex-none px-6 py-3 bg-[#0A2540] text-white rounded-xl text-sm font-bold hover:bg-[#0061FF] transition-all">
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

            {/* Split Sections */}
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

        {view === 'jobs' && <CandidateView />}
        {view === 'recruiter' && <RecruiterView />}
        {view === 'candidate' && <div className="p-20 text-center text-slate-400 font-bold">Chargement du profil...</div>}
      </main>
      <Footer />
    </div>
  );
};

export default App;