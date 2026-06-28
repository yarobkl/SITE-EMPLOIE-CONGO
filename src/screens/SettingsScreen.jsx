import { ShieldCheck } from 'lucide-react';
import { PageHeader } from '../components/ui';

export default function SettingsScreen() {
  return (
    <div className="space-y-5">
      <PageHeader title="Parametres" subtitle="Gestion du compte et de la plateforme" />
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="font-black">Service operationnel</h2>
            <p className="text-sm font-semibold text-slate-500">Les comptes, offres, candidatures et CV sont geres de facon securisee.</p>
          </div>
        </div>
        <div className="mt-5 rounded-lg bg-slate-100 p-4 text-sm font-semibold leading-7 text-slate-700">
          Tu peux utiliser le site normalement. Les informations techniques restent reservees a l'equipe projet.
        </div>
      </div>
    </div>
  );
}
