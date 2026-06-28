import { Building2, PlusCircle, Search, ShieldCheck, Sparkles, User } from 'lucide-react';
import { ActionCard, JobCard, Metric, SearchPanel, SectionTitle } from '../components/ui';

export default function HomeScreen({ jobs, totalJobs, query, setQuery, city, setCity, clearSearch, openJob, setScreen, openLogin }) {
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
