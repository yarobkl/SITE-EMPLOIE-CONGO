import { EmptyState, JobCard, PageHeader } from '../components/ui';

export default function SavedScreen({ jobs, openJob }) {
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
