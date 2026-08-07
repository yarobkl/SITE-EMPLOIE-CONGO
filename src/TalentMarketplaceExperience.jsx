import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Edit3,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserRoundSearch,
  Users,
  X,
} from 'lucide-react';
import { hasSupabaseConfig, supabase } from './lib/supabase';
import { formatCount } from './editorial';

const CONTRACT_TYPES = ['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance', 'Intérim'];
const EMPTY_POST = {
  desiredJobTitle: '',
  sector: '',
  description: '',
  locationId: '',
  otherQuarterName: '',
  contractTypes: ['CDI'],
  skillsText: '',
  experienceYears: 0,
  educationLevel: '',
  availability: 'Immédiatement',
  mobility: 'Brazzaville',
  salaryMin: '',
  salaryMax: '',
  contactVisibility: 'request',
};

const EMPTY_SNAPSHOT = {
  profiles_completed: 0,
  active_job_seekers: 0,
  posts_published_30d: 0,
  posts_expired: 0,
  verified_recruiters: 0,
  matches_generated: 0,
  invitations_sent: 0,
  invitations_accepted: 0,
};

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function formatDate(value, withTime = false) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', withTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' }).format(date);
}

function parseList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function friendlyError(error) {
  const message = String(error?.message || error || '');
  if (message.includes('ONE_POST_EVERY_30_DAYS')) return 'Vous avez déjà publié une demande durant les 30 derniers jours.';
  if (message.includes('PROFILE_INCOMPLETE')) return 'Complétez votre téléphone et votre quartier avant de publier.';
  if (message.includes('VERIFIED_RECRUITER_REQUIRED')) return 'L’accès aux talents est réservé aux recruteurs vérifiés.';
  if (message.includes('ACTIVE_POST_NOT_FOUND')) return 'Votre demande active est introuvable ou a expiré.';
  if (message.includes('duplicate key')) return 'Cette action a déjà été enregistrée.';
  return 'Une erreur est survenue. Vérifiez les informations puis réessayez.';
}

function groupLocations(locations) {
  return locations.reduce((groups, location) => {
    const key = location.arrondissement || 'Autres zones';
    if (!groups[key]) groups[key] = [];
    groups[key].push(location);
    return groups;
  }, {});
}

function Field({ label, required, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-800">
        {label}{required && <span className="ml-1 text-red-600">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs leading-5 text-slate-500">{hint}</span>}
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={classNames(
        'min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100',
        props.className,
      )}
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className={classNames(
        'min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100',
        props.className,
      )}
    />
  );
}

function Textarea(props) {
  return (
    <textarea
      {...props}
      className={classNames(
        'min-h-28 w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100',
        props.className,
      )}
    />
  );
}

function StatusPill({ status }) {
  const settings = {
    active: ['Active', 'bg-emerald-50 text-emerald-700'],
    expired: ['Expirée', 'bg-slate-100 text-slate-700'],
    archived: ['Archivée', 'bg-slate-100 text-slate-700'],
    hired: ['Emploi trouvé', 'bg-blue-50 text-blue-700'],
    suspended: ['Suspendue', 'bg-red-50 text-red-700'],
    sent: ['Envoyée', 'bg-blue-50 text-blue-700'],
    viewed: ['Consultée', 'bg-violet-50 text-violet-700'],
    accepted: ['Acceptée', 'bg-emerald-50 text-emerald-700'],
    declined: ['Refusée', 'bg-slate-100 text-slate-700'],
    pending: ['En vérification', 'bg-amber-50 text-amber-800'],
    approved: ['Approuvée', 'bg-emerald-50 text-emerald-700'],
    rejected: ['Refusée', 'bg-red-50 text-red-700'],
  };
  const [label, tone] = settings[status] || ['Statut inconnu', 'bg-slate-100 text-slate-700'];
  return <span className={classNames('inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold', tone)}>{label}</span>;
}

function EmptyState({ icon: Icon = BriefcaseBusiness, title, body }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-center">
      <Icon className="mx-auto text-slate-400" size={34} />
      <h3 className="mt-3 font-bold text-slate-950">{title}</h3>
      <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-slate-500">{body}</p>
    </div>
  );
}

function LocationSelect({ locations, value, otherValue, onChange, onOtherChange, required = true }) {
  const grouped = useMemo(() => groupLocations(locations), [locations]);
  return (
    <div className="space-y-2">
      <Select value={value} onChange={(event) => onChange(event.target.value)} required={required}>
        <option value="">Sélectionnez votre quartier</option>
        {Object.entries(grouped).map(([arrondissement, items]) => (
          <optgroup key={arrondissement} label={arrondissement}>
            {items.map((location) => (
              <option key={location.id} value={String(location.id)}>{location.name}</option>
            ))}
          </optgroup>
        ))}
        <option value="other">Autre quartier</option>
      </Select>
      {value === 'other' && (
        <Input
          value={otherValue}
          onChange={(event) => onOtherChange(event.target.value)}
          placeholder="Saisissez le nom exact du quartier"
          required
        />
      )}
    </div>
  );
}

function useTalentCore() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [locations, setLocations] = useState([]);
  const [schemaReady, setSchemaReady] = useState(false);
  const [loading, setLoading] = useState(hasSupabaseConfig);

  const loadProfile = useCallback(async (currentUser) => {
    if (!supabase || !currentUser) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('id,email,role,nom,prenom,phone,city,location_id,other_quarter_name,profile_completed,profile_completed_at')
      .eq('id', currentUser.id)
      .maybeSingle();
    if (!error) setProfile(data || null);
  }, []);

  const reload = useCallback(async () => {
    if (!supabase) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const nextUser = sessionData.session?.user || null;
    setUser(nextUser);
    await loadProfile(nextUser);
  }, [loadProfile]);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    async function bootstrap() {
      const locationsResult = await supabase
        .from('locations')
        .select('id,city,arrondissement,name')
        .eq('city', 'Brazzaville')
        .eq('active', true)
        .order('arrondissement')
        .order('name');
      if (!active) return;
      if (locationsResult.error) {
        setSchemaReady(false);
        setLoading(false);
        return;
      }
      setLocations(locationsResult.data || []);
      setSchemaReady(true);
      await reload();
      if (active) setLoading(false);
    }

    bootstrap();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user || null;
      setUser(nextUser);
      loadProfile(nextUser);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile, reload]);

  return { user, profile, locations, schemaReady, loading, reload };
}

function OnboardingGate({ user, profile, locations, onCompleted }) {
  const [phone, setPhone] = useState(profile?.phone || '');
  const [city] = useState(profile?.city || 'Brazzaville');
  const [locationId, setLocationId] = useState(profile?.location_id ? String(profile.location_id) : profile?.other_quarter_name ? 'other' : '');
  const [otherQuarterName, setOtherQuarterName] = useState(profile?.other_quarter_name || '');
  const [role, setRole] = useState(profile?.role === 'recruteur' ? 'recruteur' : 'candidat');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setPhone(profile?.phone || '');
    setLocationId(profile?.location_id ? String(profile.location_id) : profile?.other_quarter_name ? 'other' : '');
    setOtherQuarterName(profile?.other_quarter_name || '');
    setRole(profile?.role === 'recruteur' ? 'recruteur' : 'candidat');
  }, [profile]);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const { error: rpcError } = await supabase.rpc('complete_nzela_profile', {
      p_phone: phone,
      p_city: city,
      p_location_id: locationId && locationId !== 'other' ? Number(locationId) : null,
      p_other_quarter_name: locationId === 'other' ? otherQuarterName : null,
      p_role: role,
    });
    if (rpcError) {
      setError(friendlyError(rpcError));
    } else {
      await onCompleted();
    }
    setSaving(false);
  }

  if (!user || !profile || profile.profile_completed) return null;

  return (
    <div className="fixed inset-0 z-[220] overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-5 shadow-2xl md:p-7">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white"><MapPin size={23} /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Activation du profil</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Complétez votre profil Nzela Jobs</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Le téléphone et le quartier sont obligatoires pour sécuriser les comptes et produire des statistiques fiables sur l’emploi.</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-5">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
          <Field label="Votre usage principal" required>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['candidat', 'Je cherche un emploi'],
                ['recruteur', 'Je recrute'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className={classNames(
                    'min-h-12 rounded-xl border px-3 text-sm font-bold transition',
                    role === value ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-300 bg-white text-slate-700',
                  )}
                >{label}</button>
              ))}
            </div>
          </Field>
          <Field label="Numéro de téléphone" required hint="Il ne sera pas affiché publiquement sans votre accord.">
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3.5 top-3 text-slate-400" size={18} />
              <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Ex. +242 06 000 00 00" className="pl-10" required />
            </div>
          </Field>
          <Field label="Quartier de résidence à Brazzaville" required>
            <LocationSelect
              locations={locations}
              value={locationId}
              otherValue={otherQuarterName}
              onChange={setLocationId}
              onOtherChange={setOtherQuarterName}
            />
          </Field>
          <button
            type="submit"
            disabled={saving}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
            Activer mon profil
          </button>
        </form>
      </div>
    </div>
  );
}

function CandidateMarketplace({ user, profile, locations }) {
  const [posts, setPosts] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [form, setForm] = useState(EMPTY_POST);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    if (!supabase || !user) return;
    setLoading(true);
    await supabase.rpc('expire_job_seeker_posts');
    const [postsResult, invitationsResult] = await Promise.all([
      supabase
        .from('job_seeker_posts')
        .select('id,desired_job_title,sector,description,city,location_id,other_quarter_name,contract_types,skills,experience_years,education_level,availability,mobility,salary_min,salary_max,contact_visibility,status,published_at,expires_at,archived_at,hired_at,locations(name,arrondissement)')
        .eq('candidate_id', user.id)
        .order('published_at', { ascending: false }),
      supabase
        .from('talent_invitations')
        .select('id,status,message,created_at,jobs(title),companies(name)')
        .eq('candidate_id', user.id)
        .order('created_at', { ascending: false }),
    ]);
    if (postsResult.error) setError(friendlyError(postsResult.error));
    setPosts(postsResult.data || []);
    setInvitations(invitationsResult.data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const activePost = posts.find((post) => post.status === 'active' && new Date(post.expires_at) > new Date());
  const latestPost = posts[0];
  const nextPublicationDate = latestPost ? new Date(new Date(latestPost.published_at).getTime() + 30 * 86400000) : null;
  const publicationLocked = !activePost && nextPublicationDate && nextPublicationDate > new Date();

  useEffect(() => {
    if (!activePost || editing) return;
    setForm({
      desiredJobTitle: activePost.desired_job_title || '',
      sector: activePost.sector || '',
      description: activePost.description || '',
      locationId: activePost.location_id ? String(activePost.location_id) : activePost.other_quarter_name ? 'other' : '',
      otherQuarterName: activePost.other_quarter_name || '',
      contractTypes: activePost.contract_types || [],
      skillsText: (activePost.skills || []).join(', '),
      experienceYears: activePost.experience_years || 0,
      educationLevel: activePost.education_level || '',
      availability: activePost.availability || '',
      mobility: activePost.mobility || '',
      salaryMin: activePost.salary_min ?? '',
      salaryMax: activePost.salary_max ?? '',
      contactVisibility: activePost.contact_visibility || 'request',
    });
  }, [activePost, editing]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleContract(value) {
    setForm((current) => ({
      ...current,
      contractTypes: current.contractTypes.includes(value)
        ? current.contractTypes.filter((item) => item !== value)
        : [...current.contractTypes, value],
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    const payload = {
      p_desired_job_title: form.desiredJobTitle,
      p_sector: form.sector,
      p_description: form.description,
      p_location_id: form.locationId && form.locationId !== 'other' ? Number(form.locationId) : null,
      p_other_quarter_name: form.locationId === 'other' ? form.otherQuarterName : null,
      p_contract_types: form.contractTypes,
      p_skills: parseList(form.skillsText),
      p_experience_years: Number(form.experienceYears || 0),
      p_education_level: form.educationLevel,
      p_availability: form.availability,
      p_mobility: form.mobility,
      p_salary_min: form.salaryMin === '' ? null : Number(form.salaryMin),
      p_salary_max: form.salaryMax === '' ? null : Number(form.salaryMax),
      p_contact_visibility: form.contactVisibility,
    };

    const result = activePost
      ? await supabase.rpc('update_job_seeker_post', { p_post_id: activePost.id, ...payload })
      : await supabase.rpc('publish_job_seeker_post', { ...payload, p_city: profile.city || 'Brazzaville' });

    if (result.error) {
      setError(friendlyError(result.error));
    } else {
      setSuccess(activePost ? 'Votre demande a été mise à jour.' : 'Votre demande est publiée pour 30 jours.');
      setEditing(false);
      await load();
    }
    setSaving(false);
  }

  if (loading) return <div className="flex min-h-56 items-center justify-center"><RefreshCw className="animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3">
          <Sparkles className="mt-0.5 shrink-0 text-blue-700" size={20} />
          <div>
            <p className="font-black text-blue-950">Une demande tous les 30 jours, des candidatures illimitées</p>
            <p className="mt-1 text-sm leading-6 text-blue-800">Votre propre demande d’emploi reste unique pendant 30 jours. Cela ne limite jamais le nombre d’offres auxquelles vous pouvez postuler sur Nzela Jobs.</p>
          </div>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
      {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</div>}

      {activePost && !editing ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2"><StatusPill status="active" /><span className="text-xs font-semibold text-slate-500">Expire le {formatDate(activePost.expires_at)}</span></div>
              <h3 className="mt-3 text-xl font-black text-slate-950">{activePost.desired_job_title}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">{activePost.locations?.name || activePost.other_quarter_name || activePost.city}</p>
            </div>
            <button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"><Edit3 size={17} /> Modifier</button>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{activePost.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(activePost.skills || []).map((skill) => <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{skill}</span>)}
          </div>
        </div>
      ) : publicationLocked ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex gap-3"><Clock3 className="shrink-0 text-amber-700" /><div><h3 className="font-black text-amber-950">Nouvelle demande publiable à partir du {formatDate(nextPublicationDate)}</h3><p className="mt-1 text-sm leading-6 text-amber-800">La limite concerne uniquement votre propre demande d’emploi. Vous pouvez continuer à postuler sans limite aux offres publiées.</p></div></div>
        </div>
      ) : (
        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">Demande d’emploi</p><h3 className="mt-1 text-xl font-black text-slate-950">{activePost ? 'Modifier ma demande' : 'Publier ma demande'}</h3></div>
            {activePost && <button type="button" onClick={() => setEditing(false)} className="text-sm font-bold text-slate-500">Annuler</button>}
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Poste recherché" required><Input value={form.desiredJobTitle} onChange={(event) => updateField('desiredJobTitle', event.target.value)} placeholder="Ex. Responsable logistique" required /></Field>
            <Field label="Secteur"><Input value={form.sector} onChange={(event) => updateField('sector', event.target.value)} placeholder="Ex. Distribution, banque, BTP" /></Field>
            <Field label="Quartier" required>
              <LocationSelect locations={locations} value={form.locationId} otherValue={form.otherQuarterName} onChange={(value) => updateField('locationId', value)} onOtherChange={(value) => updateField('otherQuarterName', value)} />
            </Field>
            <Field label="Années d’expérience"><Input type="number" min="0" max="60" value={form.experienceYears} onChange={(event) => updateField('experienceYears', event.target.value)} /></Field>
            <Field label="Niveau d’études"><Input value={form.educationLevel} onChange={(event) => updateField('educationLevel', event.target.value)} placeholder="Ex. Bac+3" /></Field>
            <Field label="Disponibilité"><Input value={form.availability} onChange={(event) => updateField('availability', event.target.value)} placeholder="Ex. Immédiatement" /></Field>
            <Field label="Mobilité"><Input value={form.mobility} onChange={(event) => updateField('mobility', event.target.value)} placeholder="Ex. Brazzaville et Pointe-Noire" /></Field>
            <Field label="Compétences" hint="Séparez les compétences par des virgules."><Input value={form.skillsText} onChange={(event) => updateField('skillsText', event.target.value)} placeholder="Excel, gestion des stocks, management" /></Field>
          </div>
          <div className="mt-4"><Field label="Présentation" required><Textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Présentez votre expérience, vos points forts et le poste recherché." required /></Field></div>
          <div className="mt-4">
            <p className="mb-2 text-sm font-bold text-slate-800">Contrats recherchés</p>
            <div className="flex flex-wrap gap-2">{CONTRACT_TYPES.map((type) => <button key={type} type="button" onClick={() => toggleContract(type)} className={classNames('rounded-full border px-3 py-2 text-xs font-bold', form.contractTypes.includes(type) ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-300 text-slate-600')}>{type}</button>)}</div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Field label="Salaire minimum"><Input type="number" min="0" value={form.salaryMin} onChange={(event) => updateField('salaryMin', event.target.value)} placeholder="FCFA" /></Field>
            <Field label="Salaire maximum"><Input type="number" min="0" value={form.salaryMax} onChange={(event) => updateField('salaryMax', event.target.value)} placeholder="FCFA" /></Field>
            <Field label="Visibilité du contact">
              <Select value={form.contactVisibility} onChange={(event) => updateField('contactVisibility', event.target.value)}>
                <option value="request">Après mon accord uniquement</option>
                <option value="direct">Téléphone visible aux recruteurs vérifiés</option>
              </Select>
            </Field>
          </div>
          <button type="submit" disabled={saving} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-60">{saving ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}{activePost ? 'Enregistrer les modifications' : 'Publier pour 30 jours'}</button>
        </form>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between"><h3 className="font-black text-slate-950">Invitations reçues</h3><span className="text-xs font-bold text-slate-500">{invitations.length}</span></div>
        {invitations.length === 0 ? <EmptyState icon={Send} title="Aucune invitation pour le moment" body="Lorsqu’un recruteur estime que votre profil correspond à son offre, son invitation apparaîtra ici." /> : (
          <div className="space-y-3">{invitations.map((invitation) => <div key={invitation.id} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-black text-slate-950">{invitation.jobs?.title || 'Opportunité professionnelle'}</p><p className="mt-1 text-sm font-semibold text-slate-600">{invitation.companies?.name || 'Entreprise'}</p></div><StatusPill status={invitation.status} /></div>{invitation.message && <p className="mt-3 text-sm leading-6 text-slate-600">{invitation.message}</p>}<p className="mt-3 text-xs font-semibold text-slate-400">Reçue le {formatDate(invitation.created_at, true)}</p></div>)}</div>
        )}
      </section>

      {posts.length > 1 && <section><h3 className="mb-3 font-black text-slate-950">Historique des demandes</h3><div className="space-y-2">{posts.slice(1).map((post) => <div key={post.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"><div><p className="text-sm font-bold text-slate-900">{post.desired_job_title}</p><p className="text-xs text-slate-500">Publiée le {formatDate(post.published_at)}</p></div><StatusPill status={post.status} /></div>)}</div></section>}
    </div>
  );
}

function TalentCard({ talent, onInvite, canInvite = true }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-blue-700">{talent.candidate_name || 'Talent disponible'}</p>
          <h3 className="mt-1 text-lg font-black text-slate-950">{talent.desired_job_title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-600"><MapPin size={15} /> {talent.location_name || 'Brazzaville'}{talent.arrondissement ? ` · ${talent.arrondissement}` : ''}</p>
        </div>
        {talent.score != null && <div className="rounded-xl bg-blue-600 px-3 py-2 text-center text-white"><p className="text-lg font-black">{Math.round(Number(talent.score))}%</p><p className="text-[10px] font-bold uppercase">Compatibilité</p></div>}
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{talent.description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{formatCount(talent.experience_years || 0, 'an')} d’expérience</span>
        {talent.availability && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{talent.availability}</span>}
        {(talent.skills || []).slice(0, 4).map((skill) => <span key={skill} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{skill}</span>)}
      </div>
      {talent.score != null && <div className="mt-4 grid grid-cols-4 gap-1.5 text-center"><ScoreMini label="Métier" value={talent.title_score} max={30} /><ScoreMini label="Compétences" value={talent.skills_score} max={25} /><ScoreMini label="Expérience" value={talent.experience_score} max={15} /><ScoreMini label="Lieu" value={talent.location_score} max={10} /></div>}
      <div className="mt-4 flex gap-2">
        {talent.candidate_phone && <a href={`tel:${talent.candidate_phone}`} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-bold text-slate-700"><Phone size={16} /> Appeler</a>}
        {canInvite && <button type="button" onClick={() => onInvite(talent)} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 text-sm font-black text-white hover:bg-blue-700"><Send size={16} /> Inviter</button>}
      </div>
    </article>
  );
}

function ScoreMini({ label, value, max }) {
  const percent = Math.round((Number(value || 0) / max) * 100);
  return <div className="rounded-lg bg-slate-50 p-2"><p className="text-xs font-black text-slate-900">{percent}%</p><p className="mt-0.5 truncate text-[9px] font-bold uppercase text-slate-500">{label}</p></div>;
}

function RecruiterMarketplace({ user, profile, locations }) {
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [matches, setMatches] = useState([]);
  const [talents, setTalents] = useState([]);
  const [query, setQuery] = useState('');
  const [locationId, setLocationId] = useState('');
  const [verification, setVerification] = useState(null);
  const [professionalEmail, setProfessionalEmail] = useState(profile?.email || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const verified = companies.some((company) => company.verified) || verification?.status === 'approved' || profile?.role === 'admin';

  const loadBase = useCallback(async () => {
    if (!supabase || !user) return;
    setLoading(true);
    const [companiesResult, verificationResult] = await Promise.all([
      supabase.from('companies').select('id,name,verified').eq('owner_id', user.id).order('created_at'),
      supabase.from('recruiter_verifications').select('id,company_id,professional_email,status,submitted_at,review_note').eq('recruiter_id', user.id).order('submitted_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    const nextCompanies = companiesResult.data || [];
    setCompanies(nextCompanies);
    setVerification(verificationResult.data || null);
    if (nextCompanies.length) {
      const ids = nextCompanies.map((company) => company.id);
      const jobsResult = await supabase.from('jobs').select('id,title,status,company_id,created_at').in('company_id', ids).eq('status', 'published').order('created_at', { ascending: false });
      setJobs(jobsResult.data || []);
      if (!selectedJobId && jobsResult.data?.[0]) setSelectedJobId(jobsResult.data[0].id);
    }
    setLoading(false);
  }, [selectedJobId, user]);

  const loadMatches = useCallback(async () => {
    if (!selectedJobId || !verified) { setMatches([]); return; }
    const { data, error: matchError } = await supabase.rpc('match_job_candidates', { p_job_id: selectedJobId, p_limit: 10 });
    if (matchError) setError(friendlyError(matchError));
    else setMatches(data || []);
  }, [selectedJobId, verified]);

  const searchTalents = useCallback(async () => {
    if (!verified) { setTalents([]); return; }
    const { data, error: searchError } = await supabase.rpc('search_active_talents', {
      p_query: query || null,
      p_location_id: locationId ? Number(locationId) : null,
      p_limit: 50,
      p_offset: 0,
    });
    if (searchError) setError(friendlyError(searchError));
    else setTalents(data || []);
  }, [locationId, query, verified]);

  useEffect(() => { loadBase(); }, [loadBase]);
  useEffect(() => { loadMatches(); }, [loadMatches]);
  useEffect(() => { const timer = window.setTimeout(searchTalents, 250); return () => window.clearTimeout(timer); }, [searchTalents]);

  async function requestVerification() {
    setError('');
    setSuccess('');
    const company = companies[0];
    if (!company) { setError('Créez d’abord votre entreprise dans l’espace recruteur.'); return; }
    const { error: verificationError } = await supabase.from('recruiter_verifications').upsert({
      recruiter_id: user.id,
      company_id: company.id,
      professional_email: professionalEmail,
      status: 'pending',
      submitted_at: new Date().toISOString(),
    }, { onConflict: 'recruiter_id,company_id' });
    if (verificationError) setError(friendlyError(verificationError));
    else { setSuccess('Votre demande de vérification a été envoyée.'); await loadBase(); }
  }

  async function invite(talent) {
    if (!selectedJobId) { setError('Sélectionnez une offre avant d’inviter un candidat.'); return; }
    const message = window.prompt('Ajoutez un message facultatif pour le candidat :', 'Votre profil correspond à notre offre. Nous vous invitons à échanger avec notre équipe.');
    if (message === null) return;
    const { error: invitationError } = await supabase.rpc('invite_candidate_to_job', {
      p_job_id: selectedJobId,
      p_job_seeker_post_id: talent.job_seeker_post_id,
      p_message: message,
    });
    if (invitationError) setError(friendlyError(invitationError));
    else setSuccess('Invitation envoyée au candidat.');
  }

  if (loading) return <div className="flex min-h-56 items-center justify-center"><RefreshCw className="animate-spin text-blue-600" /></div>;

  if (!verified) {
    return (
      <div className="space-y-5">
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
        {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</div>}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex gap-3"><ShieldCheck className="shrink-0 text-amber-700" /><div><h3 className="font-black text-amber-950">Vérification du recruteur requise</h3><p className="mt-1 text-sm leading-6 text-amber-800">L’accès aux demandes d’emploi est réservé aux entreprises vérifiées afin de protéger les coordonnées et les parcours des candidats.</p></div></div>
        </div>
        {verification && <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-bold text-slate-950">Demande envoyée le {formatDate(verification.submitted_at)}</p><p className="mt-1 text-sm text-slate-500">{verification.professional_email}</p></div><StatusPill status={verification.status} /></div>{verification.review_note && <p className="mt-3 text-sm text-slate-600">{verification.review_note}</p>}</div>}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-black text-slate-950">Demander la vérification</h3>
          <div className="mt-4 space-y-4"><Field label="Entreprise"><Select value={companies[0]?.id || ''} disabled><option value="">{companies[0]?.name || 'Aucune entreprise configurée'}</option></Select></Field><Field label="Adresse e-mail professionnelle"><Input type="email" value={professionalEmail} onChange={(event) => setProfessionalEmail(event.target.value)} placeholder="nom@entreprise.cg" /></Field><button type="button" onClick={requestVerification} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-black text-white"><ShieldCheck size={18} /> Envoyer la demande</button></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
      {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</div>}
      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">Correspondances automatiques</p><h3 className="mt-1 text-xl font-black text-slate-950">Jusqu’à 10 talents compatibles</h3></div><Select value={selectedJobId} onChange={(event) => setSelectedJobId(event.target.value)} className="max-w-sm"><option value="">Sélectionnez une offre</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</Select></div>
        {!selectedJobId ? <EmptyState title="Sélectionnez une offre" body="Le moteur comparera l’offre choisie aux demandes d’emploi encore actives." /> : matches.length === 0 ? <EmptyState icon={UserRoundSearch} title="Aucun profil compatible pour le moment" body="Les nouvelles demandes actives seront automatiquement rapprochées de cette offre." /> : <div className="grid gap-4 lg:grid-cols-2">{matches.map((talent) => <TalentCard key={talent.job_seeker_post_id} talent={talent} onInvite={invite} />)}</div>}
      </section>
      <section>
        <div className="mb-3"><p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">Recherche libre</p><h3 className="mt-1 text-xl font-black text-slate-950">Tous les talents disponibles</h3></div>
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_280px]"><div className="relative"><Search className="pointer-events-none absolute left-3.5 top-3 text-slate-400" size={18} /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Métier, compétence ou secteur" className="pl-10" /></div><Select value={locationId} onChange={(event) => setLocationId(event.target.value)}><option value="">Tous les quartiers</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name} · {location.arrondissement}</option>)}</Select></div>
        {talents.length === 0 ? <EmptyState icon={Users} title="Aucun talent trouvé" body="Modifiez vos filtres ou revenez lorsque de nouvelles demandes auront été publiées." /> : <div className="grid gap-4 lg:grid-cols-2">{talents.map((talent) => <TalentCard key={talent.job_seeker_post_id} talent={talent} onInvite={invite} canInvite={Boolean(selectedJobId)} />)}</div>}
      </section>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, note }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Icon size={19} /></div><p className="mt-4 text-3xl font-black tracking-tight text-slate-950">{value}</p><p className="mt-1 text-sm font-bold text-slate-700">{label}</p>{note && <p className="mt-1 text-xs leading-5 text-slate-500">{note}</p>}</div>;
}

function AdminTalentAnalytics() {
  const [snapshot, setSnapshot] = useState(EMPTY_SNAPSHOT);
  const [locations, setLocations] = useState([]);
  const [balance, setBalance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [snapshotResult, locationsResult, balanceResult] = await Promise.all([
      supabase.rpc('admin_talent_snapshot'),
      supabase.rpc('admin_talent_by_location'),
      supabase.rpc('admin_talent_market_balance'),
    ]);
    const firstError = snapshotResult.error || locationsResult.error || balanceResult.error;
    if (firstError) setError(friendlyError(firstError));
    else {
      setSnapshot({ ...EMPTY_SNAPSHOT, ...(snapshotResult.data || {}) });
      setLocations(locationsResult.data || []);
      setBalance(balanceResult.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  const maxLocation = Math.max(1, ...locations.map((item) => Number(item.active_job_seekers || 0)));

  if (loading) return <div className="flex min-h-56 items-center justify-center"><RefreshCw className="animate-spin text-blue-600" /></div>;
  return (
    <div className="space-y-6">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
      <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">Observatoire Nzela</p><h3 className="mt-1 text-xl font-black text-slate-950">Demandes d’emploi et répartition géographique</h3></div><button type="button" onClick={load} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white"><RefreshCw size={18} /></button></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><MetricCard icon={Users} label="Demandeurs actifs" value={snapshot.active_job_seekers} note="Publications non expirées" /><MetricCard icon={CheckCircle2} label="Profils complets" value={snapshot.profiles_completed} /><MetricCard icon={ShieldCheck} label="Recruteurs vérifiés" value={snapshot.verified_recruiters} /><MetricCard icon={Send} label="Invitations envoyées" value={snapshot.invitations_sent} /></div>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h4 className="font-black text-slate-950">Demandeurs actifs par quartier</h4><p className="mt-1 text-sm text-slate-500">Données agrégées des utilisateurs Nzela Jobs.</p><div className="mt-5 space-y-3">{locations.length === 0 ? <p className="text-sm text-slate-500">Aucune donnée géographique disponible.</p> : locations.slice(0, 20).map((item) => <div key={item.location_id}><div className="mb-1 flex justify-between gap-3 text-xs"><span className="font-bold text-slate-700">{item.quartier} · {item.arrondissement}</span><span className="font-black text-slate-950">{item.active_job_seekers}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(3, (Number(item.active_job_seekers || 0) / maxLocation) * 100)}%` }} /></div></div>)}</div></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h4 className="font-black text-slate-950">Équilibre entre demandes et offres</h4><p className="mt-1 text-sm text-slate-500">Le ratio compare le nombre de demandes au nombre d’offres actives, par métier.</p><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs uppercase text-slate-500"><th className="pb-3">Métier</th><th className="pb-3 text-right">Demandes</th><th className="pb-3 text-right">Offres</th><th className="pb-3 text-right">Ratio</th></tr></thead><tbody>{balance.slice(0, 20).map((item) => <tr key={item.job_family} className="border-b border-slate-100"><td className="py-3 font-bold capitalize text-slate-800">{item.job_family}</td><td className="py-3 text-right">{item.active_demands}</td><td className="py-3 text-right">{item.active_offers}</td><td className="py-3 text-right font-black text-blue-700">{item.demand_per_offer ?? '—'}</td></tr>)}</tbody></table></div></section>
      </div>
    </div>
  );
}

export default function TalentMarketplaceExperience() {
  const { user, profile, locations, schemaReady, loading, reload } = useTalentCore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  if (!hasSupabaseConfig || loading || !schemaReady) return null;

  const label = profile?.role === 'recruteur' ? 'Talents' : profile?.role === 'admin' ? 'Données sur l’emploi' : 'Ma demande';

  return (
    <>
      <OnboardingGate user={user} profile={profile} locations={locations} onCompleted={reload} />
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-[75] inline-flex min-h-12 items-center gap-2 rounded-full bg-blue-600 px-4 text-sm font-black text-white shadow-xl transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 md:bottom-6"
        aria-label="Ouvrir Nzela Talents"
      >
        <UserRoundSearch size={19} /> {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-[180] overflow-y-auto bg-slate-50">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 md:px-6">
              <div className="min-w-0"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-blue-700"><Sparkles size={14} /> Candidats et recruteurs</div><h1 className="mt-1 truncate text-xl font-black tracking-tight text-slate-950 md:text-2xl">Nzela Talents</h1></div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer Nzela Talents" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white"><X size={20} /></button>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-7">
            {!user ? (
              <EmptyState icon={AlertCircle} title="Connexion obligatoire" body="Connectez-vous depuis l’espace compte Nzela Jobs. Après la connexion, votre téléphone et votre quartier devront être complétés pour activer le profil." />
            ) : !profile?.profile_completed ? (
              <EmptyState icon={MapPin} title="Profil à compléter" body="Fermez cette fenêtre et terminez l’étape obligatoire d’activation affichée à l’écran." />
            ) : profile.role === 'recruteur' ? (
              <RecruiterMarketplace user={user} profile={profile} locations={locations} />
            ) : profile.role === 'admin' ? (
              <AdminTalentAnalytics />
            ) : (
              <CandidateMarketplace user={user} profile={profile} locations={locations} />
            )}
          </main>
        </div>
      )}
    </>
  );
}
