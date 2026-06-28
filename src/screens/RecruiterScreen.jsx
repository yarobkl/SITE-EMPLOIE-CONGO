import { useMemo, useState } from 'react';
import { Download, Edit3, ExternalLink, PlusCircle, Trash2 } from 'lucide-react';
import { EmptyState, PageHeader, SectionTitle, StatCard } from '../components/ui';
import { classNames } from '../lib/format';

export default function RecruiterScreen({ jobs, applications, stats, setScreen, openLogin, markApplicationActivity, downloadApplicationCv, startEditJob, deleteJob, isLoggedIn, role }) {
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
