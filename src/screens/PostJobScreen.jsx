import { BackButton, PageHeader, SelectField, TextArea, TextField } from '../components/ui';
import { classNames } from '../lib/format';
import { CONGO_CITIES, CONTRACT_TYPES } from '../constants';

export default function PostJobScreen({ form, setForm, onSubmit, setScreen, editing, cancelEdit }) {
  return (
    <div className="space-y-4">
      <BackButton onClick={editing ? cancelEdit : () => setScreen('recruiter')} label="Recruteur" />
      <PageHeader title={editing ? 'Modifier' : 'Publier'} subtitle={editing ? "Modifier l'offre d'emploi" : "Nouvelle offre d'emploi"} />
      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        <TextField label="Titre du poste" value={form.role} onChange={(role) => setForm({ ...form, role })} required />
        <TextField label="Entreprise" value={form.company} onChange={(company) => setForm({ ...form, company })} required />
        <SelectField label="Ville" value={form.loc} onChange={(loc) => setForm({ ...form, loc })} options={CONGO_CITIES} />
        <SelectField label="Contrat" value={form.type} onChange={(type) => setForm({ ...form, type })} options={CONTRACT_TYPES} />
        <TextField label="Salaire" value={form.salary} onChange={(salary) => setForm({ ...form, salary })} placeholder="Attractif, 500k XAF, Negociable..." />
        <TextField label="Secteur" value={form.sector} onChange={(sector) => setForm({ ...form, sector })} />
        <TextArea label="Description" value={form.description} onChange={(description) => setForm({ ...form, description })} required />
        <div className="grid gap-2 sm:grid-cols-2">
          {editing && (
            <button type="button" onClick={cancelEdit} className="min-h-12 rounded-lg border border-slate-300 px-5 font-black text-slate-700 transition hover:border-blue-700 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
              Annuler
            </button>
          )}
          <button type="submit" className={classNames('min-h-12 rounded-lg bg-blue-700 px-5 font-black text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600', editing ? '' : 'sm:col-span-2')}>
            {editing ? "Enregistrer l'offre" : "Publier l'offre"}
          </button>
        </div>
      </form>
    </div>
  );
}
