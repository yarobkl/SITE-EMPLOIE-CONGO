import { LayoutDashboard, LogOut } from 'lucide-react';
import { EmptyState, PageHeader, SectionTitle, SelectField, StatCard, TextField } from '../components/ui';
import { classNames, getInitials } from '../lib/format';
import { CONGO_CITIES } from '../constants';

export default function ProfileScreen({ profile, setProfile, applications, updateProfile, setScreen, openLogin, openRecruiterSpace, isLoggedIn, authLoading, handleLogout, hasPublishedOffer }) {
  const trackedApplications = applications.filter((item) => item.trackingEnabled);
  const cvOpenedCount = trackedApplications.filter((item) => item.cvOpened).length;
  const applicationOpenedCount = trackedApplications.filter((item) => item.applicationOpened).length;
  const isRecruiter = profile.role === 'recruteur';
  const displayName = `${profile.prenom || ''} ${profile.nom || ''}`.trim() || 'Profil candidat';
  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 1.5 * 1024 * 1024) {
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProfile({ ...profile, avatarDataUrl: reader.result });
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <PageHeader title="Profil" subtitle={authLoading ? 'Verification de la session...' : isLoggedIn ? (isRecruiter ? 'Compte recruteur et informations du compte' : 'Candidat et suivi des candidatures') : 'Connecte-toi pour activer le suivi temps reel'} />
        {isLoggedIn && (
          <button onClick={handleLogout} className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700 transition hover:border-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-600">
            <LogOut size={17} /> Deconnexion
          </button>
        )}
      </div>
      {!isLoggedIn && !authLoading && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-bold leading-6 text-blue-950">Cree ton compte ou connecte-toi pour retrouver ton profil, tes favoris, tes CV et le suivi de tes candidatures.</p>
          <button onClick={() => openLogin('candidat')} className="mt-3 min-h-11 rounded-lg bg-blue-700 px-4 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-blue-600">
            Connexion candidat
          </button>
        </div>
      )}
      {isLoggedIn && isRecruiter && (
        <button onClick={openRecruiterSpace} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 font-black text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600">
          <LayoutDashboard size={18} /> {hasPublishedOffer ? 'Aller a mon espace recruteur' : 'Publier ma premiere offre'}
        </button>
      )}

      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[0.9fr_1.1fr] md:p-5">
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-blue-700 text-white">
            {profile.avatarDataUrl ? (
              <img src={profile.avatarDataUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-black">{getInitials(profile)}</div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-blue-700">{isRecruiter ? 'Recruteur' : 'Candidat'}</p>
            <h2 className="mt-1 truncate text-xl font-black text-slate-950">{displayName}</h2>
            <p className="mt-1 truncate text-sm font-semibold text-slate-500">{profile.title || 'Titre a completer'} - {profile.city}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-slate-300 px-3 text-xs font-black text-slate-700 transition hover:border-blue-700 hover:text-blue-700 focus-within:ring-2 focus-within:ring-blue-600">
                Ajouter une photo
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="sr-only" />
              </label>
              {profile.avatarDataUrl && (
                <button type="button" onClick={() => setProfile({ ...profile, avatarDataUrl: '' })} className="min-h-10 rounded-lg border border-red-200 px-3 text-xs font-black text-red-700 transition hover:border-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-600">
                  Retirer
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <StatCard value={trackedApplications.length} label="Suivies" />
          <StatCard value={applicationOpenedCount} label="Demandes vues" />
          <StatCard value={cvOpenedCount} label="CV ouverts" />
        </div>
      </div>

      <form onSubmit={updateProfile} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-2">
        <TextField label="Nom" value={profile.nom} onChange={(nom) => setProfile({ ...profile, nom })} />
        <TextField label="Prenom" value={profile.prenom} onChange={(prenom) => setProfile({ ...profile, prenom })} />
        <TextField label="Email" type="email" value={profile.email} onChange={(email) => setProfile({ ...profile, email })} disabled={isLoggedIn} />
        <TextField label="Telephone" type="tel" value={profile.phone} onChange={(phone) => setProfile({ ...profile, phone })} />
        <SelectField label="Ville" value={profile.city} onChange={(city) => setProfile({ ...profile, city })} options={CONGO_CITIES} />
        <TextField label="Titre" value={profile.title} onChange={(title) => setProfile({ ...profile, title })} />
        <SelectField label="Type de compte" value={profile.role} onChange={(role) => setProfile({ ...profile, role })} options={['candidat', 'recruteur']} />
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
                <p className="mt-2 text-xs font-black text-slate-500">
                  {item.cvName ? `CV: ${item.cvName}` : 'CV non joint'} - {item.trackingEnabled ? 'Suivi actif' : 'Candidature rapide'}
                </p>
                {item.trackingEnabled && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                    <span className={classNames('rounded-full px-3 py-1', item.applicationOpened ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600')}>
                      {item.applicationOpened ? 'Demande ouverte' : 'Demande en attente'}
                    </span>
                    <span className={classNames('rounded-full px-3 py-1', item.cvOpened ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600')}>
                      {item.cvOpened ? 'CV ouvert' : 'CV non ouvert'}
                    </span>
                  </div>
                )}
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">{item.status === 'reviewed' ? 'Vu' : 'En revue'}</span>
            </div>
          </div>
        ))}
        {applications.length === 0 && <EmptyState title="Aucune candidature" body="Postule a une offre pour suivre ton dossier ici." />}
      </div>
    </div>
  );
}
