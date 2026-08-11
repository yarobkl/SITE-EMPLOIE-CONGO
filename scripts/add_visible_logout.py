from pathlib import Path
import re

p = Path('src/App.jsx')
s = p.read_text()

old_call = '<SettingsScreen serviceStatus={serviceStatus} />'
new_call = '<SettingsScreen serviceStatus={serviceStatus} isLoggedIn={isLoggedIn} handleLogout={handleLogout} />'
if old_call not in s:
    raise SystemExit('SettingsScreen invocation not found')
s = s.replace(old_call, new_call, 1)

pattern = re.compile(r"function SettingsScreen\(\{ serviceStatus \}\) \{[\s\S]*?\n}\n\n(?=function SearchPanel)", re.M)
replacement = r'''function SettingsScreen({ serviceStatus, isLoggedIn, handleLogout }) {
  const statusCopy = {
    online: {
      title: 'Service opérationnel',
      body: 'Les comptes, les offres, les candidatures et les CV sont gérés de façon sécurisée.',
      tone: 'bg-emerald-600',
    },
    checking: {
      title: 'Vérification en cours',
      body: 'Le service vérifie la connexion aux comptes, aux offres, aux candidatures et aux CV.',
      tone: 'bg-blue-700',
    },
    degraded: {
      title: 'Service à vérifier',
      body: 'Certaines données peuvent être temporairement indisponibles. Réessayez un peu plus tard.',
      tone: 'bg-amber-500',
    },
    offline: {
      title: 'Service temporairement indisponible',
      body: 'Les comptes et les CV sont momentanément inaccessibles. Réessayez un peu plus tard.',
      tone: 'bg-slate-700',
    },
  };
  const copy = statusCopy[serviceStatus] || statusCopy.checking;
  return (
    <div className="space-y-5">
      <PageHeader title="Paramètres" subtitle="Gestion du compte et de la plateforme." />
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className={classNames('flex h-11 w-11 items-center justify-center rounded-lg text-white', copy.tone)}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="font-bold">{copy.title}</h2>
            <p className="text-sm font-semibold text-slate-500">{copy.body}</p>
          </div>
        </div>
        <div className="mt-5 rounded-lg bg-slate-100 p-4 text-sm font-semibold leading-7 text-slate-700">
          Vous pouvez utiliser le site normalement. Les informations techniques restent réservées à l’équipe projet.
        </div>
      </div>

      {isLoggedIn && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-base font-black text-slate-950">Compte</h2>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-500">Gérez votre session Nzela sur cet appareil.</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-black text-red-700 transition hover:border-red-300 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Se déconnecter
          </button>
        </section>
      )}
    </div>
  );
}
'''
s, count = pattern.subn(replacement + '\n', s, count=1)
if count != 1:
    raise SystemExit('SettingsScreen function not found')

p.write_text(s)
