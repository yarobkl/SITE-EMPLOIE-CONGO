import { Bookmark, Check, Send } from 'lucide-react';
import { BackButton, EmptyState, InfoPill } from '../components/ui';
import { classNames } from '../lib/format';

export default function JobScreen({ job, saved, toggleSave, setScreen }) {
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
        <button onClick={() => setScreen('apply')} className="sticky bottom-20 mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 font-black text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 md:static">
          Postuler maintenant <Send size={18} />
        </button>
      </article>
    </div>
  );
}
