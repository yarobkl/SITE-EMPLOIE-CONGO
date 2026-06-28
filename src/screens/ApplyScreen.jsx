import { Send, ShieldCheck } from 'lucide-react';
import { BackButton, CvUpload, PageHeader, StepPill, TextArea, TextField } from '../components/ui';
import { classNames } from '../lib/format';
import { MAX_CV_BYTES, MAX_CV_LABEL } from '../constants';

export default function ApplyScreen({ job, form, setForm, submitApplication, setScreen, openLogin, isLoggedIn, profile, notify }) {
  const trackingEnabled = form.mode === 'tracked';
  const contactReady = Boolean((form.nom || profile.nom || profile.prenom) && (form.email || profile.email) && (form.phone || profile.phone));
  const fillFromProfile = () => {
    setForm({
      ...form,
      nom: `${profile.prenom} ${profile.nom}`.trim(),
      email: profile.email,
      phone: profile.phone,
    });
    notify('Profil ajoute a la candidature');
  };
  const handleCvChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      event.target.value = '';
      setForm({ ...form, cvName: '', cvSize: 0, cvType: '', cvFile: null });
      notify('Le CV doit etre un fichier PDF.');
      return;
    }
    if (file.size > MAX_CV_BYTES) {
      event.target.value = '';
      setForm({ ...form, cvName: '', cvSize: 0, cvType: '', cvFile: null });
      notify(`Le CV ne doit pas depasser ${MAX_CV_LABEL}.`);
      return;
    }
    setForm({ ...form, cvName: file.name, cvSize: file.size, cvType: file.type || 'application/pdf', cvFile: file });
    notify('CV PDF ajoute');
  };

  return (
    <div className="space-y-4">
      <BackButton onClick={() => setScreen('job')} label="Retour" />
      <PageHeader title="Postuler" subtitle={`${job.role} - ${job.company}`} />
      <div className="grid grid-cols-3 gap-2">
        <StepPill active done label="Mode" />
        <StepPill active={contactReady} done={contactReady} label="Contact" />
        <StepPill active={Boolean(form.cvName)} done={Boolean(form.cvName)} label="CV" />
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setForm({ ...form, mode: 'tracked' })}
          className={classNames('rounded-lg border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-600', trackingEnabled ? 'border-blue-700 bg-blue-50' : 'border-slate-200 bg-white')}
        >
          <div className="flex items-center gap-2 font-black text-slate-950">
            <ShieldCheck size={19} className="text-blue-700" /> Candidature suivie
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Connexion requise. Tu vois si l'employeur ouvre ta demande ou ton CV, avec notifications et KPI.</p>
        </button>
        <button
          type="button"
          onClick={() => setForm({ ...form, mode: 'quick' })}
          className={classNames('rounded-lg border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-600', !trackingEnabled ? 'border-blue-700 bg-blue-50' : 'border-slate-200 bg-white')}
        >
          <div className="flex items-center gap-2 font-black text-slate-950">
            <Send size={19} className="text-blue-700" /> Candidature rapide
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Ton CV est recu par le recruteur, mais tu n'as pas de suivi temps reel du dossier.</p>
        </button>
      </div>
      {trackingEnabled && !isLoggedIn && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold leading-6 text-amber-900">Connecte-toi pour activer le suivi de candidature.</p>
          <button onClick={() => openLogin('candidat')} className="mt-3 min-h-11 rounded-lg bg-blue-700 px-4 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-blue-600">
            Se connecter
          </button>
        </div>
      )}
      <form onSubmit={submitApplication} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        {isLoggedIn && (
          <button type="button" onClick={fillFromProfile} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700 transition hover:border-blue-700 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
            Utiliser mon profil
          </button>
        )}
        <TextField label="Nom complet" value={form.nom} onChange={(nom) => setForm({ ...form, nom })} required placeholder="Ex: Grace Moungala" />
        <TextField label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} required placeholder="nom@email.com" />
        <TextField label="Telephone" type="tel" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} required placeholder="+242 06 ..." />
        <TextArea label="Message au recruteur" value={form.message} onChange={(message) => setForm({ ...form, message })} placeholder="Disponibilite, experience, motivation..." />
        <CvUpload cvName={form.cvName} cvSize={form.cvSize} onChange={handleCvChange} />
        <button type="submit" className="sticky bottom-20 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 font-black text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 md:static">
          {trackingEnabled ? 'Envoyer et suivre' : 'Envoyer rapidement'} <Send size={18} />
        </button>
      </form>
    </div>
  );
}
