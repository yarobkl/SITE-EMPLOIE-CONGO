import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, MapPin, Phone, RefreshCw } from 'lucide-react';
import { hasSupabaseConfig, supabase } from './lib/supabase';

const COUNTRIES = [
  { iso: 'CG', name: 'Congo', flag: '🇨🇬', dial: '+242', inputLength: 9, e164Length: 9, trunkZero: false, placeholder: '060000000' },
  { iso: 'CD', name: 'RDC', flag: '🇨🇩', dial: '+243', inputLength: 9, e164Length: 9, trunkZero: false, placeholder: '812345678' },
  { iso: 'CM', name: 'Cameroun', flag: '🇨🇲', dial: '+237', inputLength: 9, e164Length: 9, trunkZero: false, placeholder: '612345678' },
  { iso: 'CI', name: 'Côte d’Ivoire', flag: '🇨🇮', dial: '+225', inputLength: 10, e164Length: 10, trunkZero: false, placeholder: '0701234567' },
  { iso: 'SN', name: 'Sénégal', flag: '🇸🇳', dial: '+221', inputLength: 9, e164Length: 9, trunkZero: false, placeholder: '771234567' },
  { iso: 'ML', name: 'Mali', flag: '🇲🇱', dial: '+223', inputLength: 8, e164Length: 8, trunkZero: false, placeholder: '70123456' },
  { iso: 'BF', name: 'Burkina Faso', flag: '🇧🇫', dial: '+226', inputLength: 8, e164Length: 8, trunkZero: false, placeholder: '70123456' },
  { iso: 'TG', name: 'Togo', flag: '🇹🇬', dial: '+228', inputLength: 8, e164Length: 8, trunkZero: false, placeholder: '90123456' },
  { iso: 'BJ', name: 'Bénin', flag: '🇧🇯', dial: '+229', inputLength: 10, e164Length: 10, trunkZero: false, placeholder: '0197123456' },
  { iso: 'AO', name: 'Angola', flag: '🇦🇴', dial: '+244', inputLength: 9, e164Length: 9, trunkZero: false, placeholder: '923123456' },
  { iso: 'RW', name: 'Rwanda', flag: '🇷🇼', dial: '+250', inputLength: 9, e164Length: 9, trunkZero: false, placeholder: '781234567' },
  { iso: 'KE', name: 'Kenya', flag: '🇰🇪', dial: '+254', inputLength: 10, e164Length: 9, trunkZero: true, placeholder: '0712345678' },
  { iso: 'GH', name: 'Ghana', flag: '🇬🇭', dial: '+233', inputLength: 10, e164Length: 9, trunkZero: true, placeholder: '0241234567' },
  { iso: 'NG', name: 'Nigeria', flag: '🇳🇬', dial: '+234', inputLength: 11, e164Length: 10, trunkZero: true, placeholder: '08012345678' },
  { iso: 'ZA', name: 'Afrique du Sud', flag: '🇿🇦', dial: '+27', inputLength: 10, e164Length: 9, trunkZero: true, placeholder: '0821234567' },
  { iso: 'MA', name: 'Maroc', flag: '🇲🇦', dial: '+212', inputLength: 10, e164Length: 9, trunkZero: true, placeholder: '0612345678' },
  { iso: 'DZ', name: 'Algérie', flag: '🇩🇿', dial: '+213', inputLength: 10, e164Length: 9, trunkZero: true, placeholder: '0550123456' },
  { iso: 'TN', name: 'Tunisie', flag: '🇹🇳', dial: '+216', inputLength: 8, e164Length: 8, trunkZero: false, placeholder: '20123456' },
  { iso: 'FR', name: 'France', flag: '🇫🇷', dial: '+33', inputLength: 10, e164Length: 9, trunkZero: true, placeholder: '0612345678' },
  { iso: 'BE', name: 'Belgique', flag: '🇧🇪', dial: '+32', inputLength: 10, e164Length: 9, trunkZero: true, placeholder: '0470123456' },
  { iso: 'PT', name: 'Portugal', flag: '🇵🇹', dial: '+351', inputLength: 9, e164Length: 9, trunkZero: false, placeholder: '912345678' },
  { iso: 'ES', name: 'Espagne', flag: '🇪🇸', dial: '+34', inputLength: 9, e164Length: 9, trunkZero: false, placeholder: '612345678' },
  { iso: 'GB', name: 'Royaume-Uni', flag: '🇬🇧', dial: '+44', inputLength: 11, e164Length: 10, trunkZero: true, placeholder: '07123456789' },
  { iso: 'US', name: 'États-Unis', flag: '🇺🇸', dial: '+1', inputLength: 10, e164Length: 10, trunkZero: false, placeholder: '2025550123' },
  { iso: 'CA', name: 'Canada', flag: '🇨🇦', dial: '+1', inputLength: 10, e164Length: 10, trunkZero: false, placeholder: '5145550123' },
];

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function profileLocalNumber(phone, country) {
  const raw = String(phone || '').trim();
  if (!raw) return '';
  const dialDigits = onlyDigits(country.dial);
  let digits = onlyDigits(raw);
  if (raw.startsWith('+') && digits.startsWith(dialDigits)) digits = digits.slice(dialDigits.length);
  if (country.trunkZero && digits.length === country.e164Length && !digits.startsWith('0')) digits = `0${digits}`;
  return digits.slice(0, country.inputLength);
}

function toE164(localDigits, country) {
  let digits = onlyDigits(localDigits);
  if (country.trunkZero && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length !== country.e164Length) return '';
  return `${country.dial}${digits}`;
}

function friendlyError(error) {
  const value = String(error?.message || error || '');
  if (/PHONE/i.test(value)) return 'Vérifiez le numéro de téléphone et le pays sélectionné.';
  if (/QUARTER|LOCATION/i.test(value)) return 'Sélectionnez votre quartier de résidence.';
  if (/AUTH|JWT|SESSION/i.test(value)) return 'Votre session a expiré. Reconnectez-vous puis réessayez.';
  return 'Impossible d’enregistrer le profil. Réessayez.';
}

export default function OnboardingReliabilityExperience() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [countryIso, setCountryIso] = useState('CG');
  const [phone, setPhone] = useState('');
  const [locationId, setLocationId] = useState('');
  const [otherQuarter, setOtherQuarter] = useState('');
  const [role, setRole] = useState('candidat');

  const country = useMemo(() => COUNTRIES.find((item) => item.iso === countryIso) || COUNTRIES[0], [countryIso]);
  const groupedLocations = useMemo(() => locations.reduce((groups, location) => {
    const key = location.arrondissement || 'Autres zones';
    if (!groups[key]) groups[key] = [];
    groups[key].push(location);
    return groups;
  }, {}), [locations]);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setLoading(false);
      return undefined;
    }
    let alive = true;
    const load = async (sessionUser) => {
      if (!sessionUser) {
        if (alive) { setUser(null); setProfile(null); setLoading(false); }
        return;
      }
      const [profileResult, locationsResult] = await Promise.all([
        supabase.from('profiles').select('id,role,phone,phone_country,city,location_id,other_quarter_name,profile_completed,role_confirmed_at').eq('id', sessionUser.id).maybeSingle(),
        supabase.from('locations').select('id,city,arrondissement,name').eq('city', 'Brazzaville').eq('active', true).order('arrondissement').order('name'),
      ]);
      if (!alive) return;
      setUser(sessionUser);
      if (!locationsResult.error) setLocations(locationsResult.data || []);
      if (!profileResult.error) setProfile(profileResult.data || null);
      setLoading(false);
    };
    supabase.auth.getSession().then(({ data }) => load(data.session?.user || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => load(session?.user || null));
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!profile || profile.profile_completed) return;
    const nextIso = COUNTRIES.some((item) => item.iso === profile.phone_country) ? profile.phone_country : 'CG';
    const nextCountry = COUNTRIES.find((item) => item.iso === nextIso) || COUNTRIES[0];
    setCountryIso(nextIso);
    setPhone(profileLocalNumber(profile.phone, nextCountry));
    setLocationId(profile.location_id ? String(profile.location_id) : profile.other_quarter_name ? 'other' : '');
    setOtherQuarter(profile.other_quarter_name || '');
    setRole(profile.role === 'recruteur' ? 'recruteur' : 'candidat');
  }, [profile]);

  useEffect(() => {
    if (!profile || profile.profile_completed) return;
    setPhone((current) => profileLocalNumber(current, country));
  }, [country, profile]);

  if (loading || !user || !profile || profile.profile_completed) return null;

  const expected = country.inputLength;
  const validPhone = onlyDigits(phone).length === expected && Boolean(toE164(phone, country));
  const validQuarter = Boolean(locationId && (locationId !== 'other' || otherQuarter.trim().length >= 2));

  async function submit(event) {
    event.preventDefault();
    if (!validPhone) {
      setError(`Le numéro ${country.name} doit contenir ${expected} chiffres dans son format national.`);
      return;
    }
    if (!validQuarter) {
      setError('Sélectionnez votre quartier de résidence.');
      return;
    }
    setSaving(true);
    setError('');
    const e164 = toE164(phone, country);
    const { data, error: rpcError } = await supabase.rpc('complete_nzela_profile', {
      p_phone: e164,
      p_phone_country: country.iso,
      p_city: 'Brazzaville',
      p_location_id: locationId !== 'other' ? Number(locationId) : null,
      p_other_quarter_name: locationId === 'other' ? otherQuarter.trim() : null,
      p_role: role,
    });
    if (rpcError) {
      setError(friendlyError(rpcError));
      setSaving(false);
      return;
    }
    setProfile(data || { ...profile, profile_completed: true });
    await supabase.auth.refreshSession().catch(() => null);
    window.setTimeout(() => window.location.reload(), 180);
  }

  return (
    <div className="fixed inset-0 z-[260] overflow-y-auto bg-slate-950/75 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Activation du profil Nzela Jobs">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-5 shadow-2xl md:p-7">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white"><MapPin size={23} /></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Première connexion</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Activez votre profil une seule fois</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Ces informations sont enregistrées dans votre profil. Nzela Jobs ne vous les redemandera pas à chaque connexion.</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-5">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

          <fieldset>
            <legend className="mb-2 text-sm font-bold text-slate-800">Votre usage principal <span className="text-red-600">*</span></legend>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setRole('candidat')} className={`min-h-12 rounded-xl border px-3 text-sm font-bold ${role === 'candidat' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-300 text-slate-700'}`}>Je cherche un emploi</button>
              <button type="button" onClick={() => setRole('recruteur')} className={`min-h-12 rounded-xl border px-3 text-sm font-bold ${role === 'recruteur' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-300 text-slate-700'}`}>Je recrute</button>
            </div>
          </fieldset>

          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-800">Numéro de téléphone <span className="text-red-600">*</span></span>
            <div className="grid grid-cols-[minmax(145px,0.8fr)_minmax(0,1.2fr)] gap-2">
              <select value={countryIso} onChange={(event) => { setCountryIso(event.target.value); setPhone(''); setError(''); }} className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" aria-label="Pays du numéro">
                {COUNTRIES.map((item) => <option key={item.iso} value={item.iso}>{item.flag} {item.name} {item.dial}</option>)}
              </select>
              <div className="flex min-h-12 overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
                <span className="flex items-center gap-1 border-r border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700"><Phone size={16} /> {country.dial}</span>
                <input inputMode="numeric" autoComplete="tel-national" value={phone} onChange={(event) => setPhone(onlyDigits(event.target.value).slice(0, expected))} placeholder={country.placeholder} maxLength={expected} className="min-w-0 flex-1 px-3 text-sm outline-none" required />
              </div>
            </div>
            <span className={`mt-1 block text-xs ${phone && !validPhone ? 'text-red-600' : 'text-slate-500'}`}>{onlyDigits(phone).length}/{expected} chiffres · {country.dial} sera ajouté automatiquement.</span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-800">Quartier de résidence à Brazzaville <span className="text-red-600">*</span></span>
            <select value={locationId} onChange={(event) => setLocationId(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" required>
              <option value="">Sélectionnez votre quartier</option>
              {Object.entries(groupedLocations).map(([arrondissement, items]) => <optgroup key={arrondissement} label={arrondissement}>{items.map((item) => <option key={item.id} value={String(item.id)}>{item.name}</option>)}</optgroup>)}
              <option value="other">Autre quartier</option>
            </select>
            {locationId === 'other' && <input value={otherQuarter} onChange={(event) => setOtherQuarter(event.target.value)} placeholder="Saisissez le nom exact du quartier" className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" required />}
          </label>

          <button type="submit" disabled={saving || !validPhone || !validQuarter} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
            {saving ? 'Enregistrement…' : 'Activer mon profil'}
          </button>
        </form>
      </div>
    </div>
  );
}
