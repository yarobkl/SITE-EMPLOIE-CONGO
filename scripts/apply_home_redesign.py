from pathlib import Path
import re

app_path = Path('src/App.jsx')
s = app_path.read_text()

replacement = r'''function HomeScreen({ jobs, totalJobs, query, setQuery, city, setCity, clearSearch, openJob, setScreen, openLogin, savedIds, toggleSave, isLoggedIn, profileRole }) {
  const cityOptions = ['Toutes', ...CONGO_CITIES];
  const goToJobs = () => {
    setScreen('jobs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goToRealEstate = () => {
    setScreen('immobilier');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goToTalents = () => {
    if (isLoggedIn && (profileRole === 'recruteur' || profileRole === 'admin')) {
      setScreen('recruiter');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    openLogin('recruteur');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-4 md:space-y-10">
      <section className="pt-2 md:pt-6">
        <div className="grid items-center gap-5 md:grid-cols-[1fr_230px] md:gap-8">
          <div>
            <div className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-50 px-3.5 text-sm font-black text-blue-700">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100"><Briefcase size={16} /></span>
              {totalJobs > 0 ? `${formatCount(totalJobs, 'offre disponible', 'offres disponibles')} au Congo` : 'La plateforme d’emploi du Congo'}
            </div>
            <h1 className="mt-5 max-w-2xl text-[2.25rem] font-black leading-[1.08] tracking-[-0.045em] text-slate-950 sm:text-5xl">
              Trouvez l’emploi qui vous correspond
            </h1>
            <p className="mt-4 max-w-xl text-[15px] font-medium leading-7 text-slate-600 sm:text-base">
              Recherchez un poste, postulez avec votre CV et suivez vos candidatures simplement.
            </p>
          </div>

          <div className="hidden md:flex md:justify-end" aria-hidden="true">
            <div className="relative flex h-44 w-44 items-center justify-center rounded-[2.5rem] bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="absolute h-24 w-24 rounded-full border-[10px] border-blue-500/80" />
              <Briefcase className="relative z-10 text-blue-700" size={42} strokeWidth={1.9} />
              <Search className="absolute bottom-7 right-5 rotate-45 text-blue-600" size={56} strokeWidth={2.4} />
            </div>
          </div>
        </div>

        <form
          className="mt-7 rounded-[1.6rem] border border-slate-200 bg-white p-3.5 shadow-[0_14px_40px_rgba(15,23,42,0.07)] sm:p-5"
          onSubmit={(event) => { event.preventDefault(); goToJobs(); }}
        >
          <label className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50">
            <Search size={21} className="shrink-0 text-slate-700" />
            <span className="sr-only">Métier ou mot-clé</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Métier ou mot-clé"
              aria-label="Métier ou mot-clé"
              className="min-w-0 flex-1 bg-transparent text-base font-semibold text-slate-950 outline-none placeholder:font-medium placeholder:text-slate-400"
            />
            {query && (
              <button type="button" onClick={clearSearch} aria-label="Effacer la recherche" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X size={17} />
              </button>
            )}
          </label>

          <label className="mt-2.5 flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50">
            <MapPin size={20} className="shrink-0 text-slate-700" />
            <span className="sr-only">Ville</span>
            <select value={city} onChange={(event) => setCity(event.target.value)} aria-label="Ville" className="min-w-0 flex-1 appearance-none bg-transparent text-base font-bold text-slate-900 outline-none">
              {cityOptions.map((option) => <option key={option} value={option}>{option === 'Toutes' ? 'Toutes les villes' : option}</option>)}
            </select>
            <ChevronDown size={19} className="pointer-events-none text-slate-800" />
          </label>

          <button type="submit" className="mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-base font-black text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-blue-100">
            <Search size={20} /> Rechercher
          </button>
        </form>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-black tracking-tight text-slate-950">Accès rapides</h2>
          <button type="button" onClick={goToJobs} className="inline-flex min-h-10 items-center gap-1 text-sm font-black text-blue-700">Voir tout <ChevronRight size={18} /></button>
        </div>
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          <button type="button" onClick={goToJobs} className="group rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Briefcase size={21} /></span>
            <span className="mt-3 block text-[13px] font-black leading-5 text-slate-950 sm:text-base">Offres d’emploi</span>
            <span className="mt-1 hidden text-xs font-medium leading-5 text-slate-500 sm:block">Parcourez les offres</span>
          </button>
          <button type="button" onClick={goToRealEstate} className="group rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md sm:p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><Building2 size={21} /></span>
            <span className="mt-3 block text-[13px] font-black leading-5 text-slate-950 sm:text-base">Immobilier</span>
            <span className="mt-1 hidden text-xs font-medium leading-5 text-slate-500 sm:block">Maisons, appartements</span>
          </button>
          <button type="button" onClick={goToTalents} className="group rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><User size={21} /></span>
            <span className="mt-3 block text-[13px] font-black leading-5 text-slate-950 sm:text-base">Talents</span>
            <span className="mt-1 hidden text-xs font-medium leading-5 text-slate-500 sm:block">Espace recruteur</span>
          </button>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-black tracking-tight text-slate-950">Offres récentes</h2>
          <button type="button" onClick={goToJobs} className="inline-flex min-h-10 items-center gap-1 text-sm font-black text-blue-700">Voir tout <ChevronRight size={18} /></button>
        </div>

        {jobs.length ? (
          <div className="grid gap-3">
            {jobs.map((job) => {
              const saved = savedIds.includes(job.id);
              return (
                <article key={job.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-5">
                  <div className="flex items-start gap-3.5">
                    <button type="button" onClick={() => openJob(job)} className="flex min-w-0 flex-1 items-start gap-3.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white"><Building2 size={22} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-black leading-6 text-slate-950 sm:text-base">{job.role}</span>
                        <span className="mt-0.5 block truncate text-sm font-semibold text-slate-600">{job.company}</span>
                        <span className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500"><MapPin size={14} /> {job.loc}</span>
                        <span className="mt-2 inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">{job.type}</span>
                      </span>
                    </button>
                    <div className="flex shrink-0 flex-col items-end gap-3">
                      <span className="text-[11px] font-semibold text-slate-400">{formatRelativeDate(job.createdAt).replace('Publiée ', '')}</span>
                      <button type="button" onClick={() => toggleSave(job)} aria-label={saved ? 'Retirer des favoris' : 'Ajouter aux favoris'} className={classNames('flex h-10 w-10 items-center justify-center rounded-xl border transition', saved ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50')}>
                        <Bookmark size={19} fill={saved ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-center">
            <Briefcase className="mx-auto text-slate-400" size={32} />
            <h3 className="mt-3 font-black text-slate-950">Les prochaines offres arrivent</h3>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-500">Revenez bientôt pour découvrir de nouvelles opportunités.</p>
          </div>
        )}
      </section>
    </div>
  );
}
'''

pattern = re.compile(r"function HomeScreen\(\{[\s\S]*?\n}\n\n(?=function JobsScreen)", re.M)
s, count = pattern.subn(replacement + '\n', s, count=1)
if count != 1:
    raise SystemExit('HomeScreen block not found')

old_call = "<HomeScreen jobs={filteredJobs.slice(0, 3)} totalJobs={publishedJobs.length} query={query} setQuery={setQuery} city={city} setCity={setCity} clearSearch={clearSearch} openJob={openJob} setScreen={setScreen} openLogin={openLogin} savedIds={savedIds} toggleSave={toggleSave} />"
new_call = "<HomeScreen jobs={filteredJobs.slice(0, 3)} totalJobs={publishedJobs.length} query={query} setQuery={setQuery} city={city} setCity={setCity} clearSearch={clearSearch} openJob={openJob} setScreen={setScreen} openLogin={openLogin} savedIds={savedIds} toggleSave={toggleSave} isLoggedIn={isLoggedIn} profileRole={profile.role} />"
occurrences = s.count(old_call)
if occurrences != 2:
    raise SystemExit(f'Expected 2 HomeScreen calls, found {occurrences}')
s = s.replace(old_call, new_call)
app_path.write_text(s)

deferred_path = Path('src/DeferredPlatformEnhancements.jsx')
d = deferred_path.read_text()
d = d.replace("      {!nativeApp && <PrivacyComplianceExperience />}\n", "")
d = d.replace("      {!nativeApp && <TalentMarketplaceExperience />}\n", "")
deferred_path.write_text(d)
