import { LayoutDashboard } from 'lucide-react';
import { EmptyState, JobCard, PageHeader, SearchPanel } from '../components/ui';

export default function JobsScreen({ jobs, query, setQuery, city, setCity, clearSearch, openJob, setScreen, savedIds, toggleSave }) {
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
      {jobs.length === 0 && <EmptyState title="Aucune offre trouvee" body="Modifie la ville ou le mot cle pour relancer la recherche." />}
    </div>
  );
}
