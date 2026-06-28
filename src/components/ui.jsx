import { useId } from 'react';
import {
  ArrowLeft,
  Bookmark,
  Building2,
  ChevronRight,
  ClipboardList,
  Eye,
  EyeOff,
  FileText,
  MapPin,
  Search,
  Send,
  X,
} from 'lucide-react';
import { classNames } from '../lib/format';
import { CONGO_CITIES, MAX_CV_LABEL } from '../constants';

export function IconButton({ label, children, onClick, badge }) {
  return (
    <button onClick={onClick} aria-label={label} className="smooth-button relative flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
      {children}
      {badge > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />}
    </button>
  );
}

export function SearchPanel({ query, setQuery, city, setCity, clearSearch, compact = false, onSubmit }) {
  const cityOptions = ['Toutes', ...CONGO_CITIES];
  const featuredCities = ['Toutes', 'Brazzaville', 'Pointe-Noire', 'Dolisie', 'Nkayi', 'Ouesso'];
  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit?.(); }} className="space-y-3">
      <div className="grid gap-2 md:grid-cols-[1fr_220px]">
        <label className="smooth-button flex min-h-12 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-600">
          <Search size={18} className="text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Poste, entreprise, secteur..." className="w-full bg-transparent text-base font-semibold outline-none" />
          {(query || city !== 'Toutes') && (
            <button type="button" onClick={clearSearch} aria-label="Effacer la recherche" className="smooth-button flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
              <X size={18} />
            </button>
          )}
        </label>
        <label className="smooth-button flex min-h-12 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-600">
          <MapPin size={18} className="text-slate-400" />
          <select value={city} onChange={(event) => setCity(event.target.value)} className="w-full bg-transparent text-base font-semibold outline-none">
            {cityOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      </div>
      {!compact && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {featuredCities.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setCity(option)}
              className={classNames('smooth-button min-h-10 shrink-0 rounded-full border px-4 text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-600', city === option ? 'border-blue-700 bg-blue-700 text-white shadow-sm shadow-blue-900/20' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700')}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}

export function JobCard({ job, onClick, onApply, saved, onSave }) {
  return (
    <article className="smooth-card p-4 hover:border-blue-300">
      <div className="flex items-start gap-3">
        <button onClick={onClick} className="smooth-button flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600">
          <Building2 size={22} />
        </button>
        <button onClick={onClick} className="min-w-0 flex-1 text-left focus:outline-none focus:ring-2 focus:ring-blue-600">
          <h3 className="text-lg font-black leading-tight text-slate-950">{job.role}</h3>
          <p className="mt-1 text-sm font-bold text-slate-600">{job.company}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{job.loc}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{job.type}</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">{job.salary || 'A discuter'}</span>
          </div>
        </button>
        {onSave && (
          <button onClick={onSave} aria-label="Sauvegarder" className="smooth-button flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
            <Bookmark size={20} fill={saved ? 'currentColor' : 'none'} className={saved ? 'text-blue-700' : ''} />
          </button>
        )}
      </div>
      {onApply && (
        <button onClick={onApply} className="smooth-button mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-black text-white shadow-sm shadow-blue-900/20 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600">
          Postuler <Send size={16} />
        </button>
      )}
    </article>
  );
}

export function TextField({ label, value, onChange, type = 'text', required, placeholder, disabled = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-800">{label}</span>
      <input type={type} required={required} disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="smooth-button min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base font-semibold outline-none disabled:bg-slate-100 disabled:text-slate-500 focus:border-blue-700 focus:ring-2 focus:ring-blue-600" />
    </label>
  );
}

export function PasswordField({ label, value, onChange, required, placeholder, visible, onToggle }) {
  const inputId = useId();

  return (
    <div className="block">
      <label htmlFor={inputId} className="mb-2 block text-sm font-black text-slate-800">{label}</label>
      <span className="smooth-button flex min-h-12 w-full items-center rounded-lg border border-slate-300 bg-white pr-2 focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-600">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-h-12 min-w-0 flex-1 rounded-lg bg-transparent px-3 text-base font-semibold outline-none"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          aria-pressed={visible}
          className={classNames(
            'smooth-button flex h-10 w-10 shrink-0 items-center justify-center rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600',
            visible ? 'text-blue-700 hover:bg-blue-50' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
          )}
        >
          {visible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </span>
    </div>
  );
}

export function TextArea({ label, value, onChange, required, placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-800">{label}</span>
      <textarea required={required} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={4} className="smooth-button w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base font-semibold outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-600" />
    </label>
  );
}

export function CvUpload({ cvName, cvSize, onChange }) {
  const readableSize = cvSize ? `${(cvSize / 1024 / 1024).toFixed(2)} Mo` : '';
  return (
    <div>
      <span className="mb-2 block text-sm font-black text-slate-800">CV PDF</span>
      <label className="smooth-card flex min-h-24 cursor-pointer flex-col items-center justify-center border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center hover:border-blue-700 hover:bg-blue-50 focus-within:ring-2 focus-within:ring-blue-600">
        <FileText size={26} className="text-blue-700" />
        <span className="mt-2 text-sm font-black text-slate-900">{cvName || 'Ajouter mon CV'}</span>
        <span className="mt-1 text-xs font-bold text-slate-500">{cvName ? readableSize : `PDF uniquement, ${MAX_CV_LABEL} maximum`}</span>
        <input type="file" accept="application/pdf,.pdf" onChange={onChange} className="sr-only" />
      </label>
    </div>
  );
}

export function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-800">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="smooth-button min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base font-semibold outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-600">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

export function StepPill({ label, active, done }) {
  return (
    <div className={classNames('rounded-lg border px-3 py-2 text-center text-xs font-black transition', done ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : active ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500')}>
      {label}
    </div>
  );
}

export function BrandLogo() {
  return (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
      <img src="/logo-congoemploi.svg" alt="" className="h-full w-full object-contain" />
    </div>
  );
}

export function BackButton({ onClick, label }) {
  return (
    <button onClick={onClick} className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-black text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
      <ArrowLeft size={18} /> {label}
    </button>
  );
}

export function PageHeader({ title, subtitle }) {
  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{title}</h1>
      <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
    </div>
  );
}

export function SectionTitle({ title, action, onAction }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      {action && <button onClick={onAction} className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-black text-blue-700">{action}<ChevronRight size={16} /></button>}
    </div>
  );
}

export function EmptyState({ title, body }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
      <ClipboardList className="mx-auto text-slate-400" size={34} />
      <h3 className="mt-3 font-black text-slate-950">{title}</h3>
      <p className="mt-1 text-sm font-semibold text-slate-500">{body}</p>
    </div>
  );
}

export function ActionCard({ icon: Icon, title, body, onClick }) {
  return (
    <button onClick={onClick} className="smooth-card p-4 text-left hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-600">
      <Icon className="text-blue-700" size={24} />
      <h3 className="mt-3 font-black">{title}</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{body}</p>
    </button>
  );
}

export function Metric({ value, label }) {
  return (
    <div className="app-surface p-3">
      <p className="text-xl font-black text-slate-950">{value}</p>
      <p className="text-xs font-bold text-slate-500">{label}</p>
    </div>
  );
}

export function StatCard({ value, label }) {
  return (
    <div className="app-surface p-4 text-center">
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
    </div>
  );
}

export function InfoPill({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-100 p-3">
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

export function SocialLoginButton({ item, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-800 transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600">
      <OAuthProviderLogo provider={item.provider} />
      {item.label}
    </button>
  );
}

export function OAuthProviderLogo({ provider }) {
  if (provider === 'google') {
    return (
      <span className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white">
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9c-.3 1.3-1 2.4-2.1 3.2v2.6h3.4c2-1.8 3.4-4.5 3.4-7.8Z" />
          <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.9l-3.4-2.6c-.9.6-2.2 1-3.9 1-3 0-5.5-2-6.4-4.8H2.1v2.7C3.9 20.3 7.7 23 12 23Z" />
          <path fill="#FBBC05" d="M5.6 13.7c-.2-.6-.4-1.2-.4-1.9s.1-1.3.4-1.9V7.2H2.1C1.4 8.6 1 10.1 1 11.8s.4 3.2 1.1 4.6l3.5-2.7Z" />
          <path fill="#EA4335" d="M12 5.1c1.6 0 3.1.6 4.2 1.7l3.1-3.1C17.5 2 15 1 12 1 7.7 1 3.9 3.7 2.1 7.2l3.5 2.7C6.5 7.1 9 5.1 12 5.1Z" />
        </svg>
      </span>
    );
  }

  if (provider === 'apple') {
    return (
      <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-950">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" aria-hidden="true">
          <path fill="currentColor" d="M16.8 12.7c0-2.7 2.2-4 2.3-4.1-1.3-1.9-3.2-2.1-3.9-2.2-1.7-.2-3.2 1-4.1 1-.8 0-2.1-1-3.5-.9-1.8 0-3.4 1-4.3 2.6-1.8 3.1-.5 7.8 1.3 10.3.9 1.2 1.9 2.6 3.3 2.6 1.3-.1 1.8-.8 3.4-.8s2.1.8 3.5.8 2.4-1.3 3.2-2.5c1-1.4 1.4-2.8 1.4-2.9-.1-.1-2.6-1.1-2.6-3.9ZM14.1 4.7c.7-.9 1.2-2.1 1.1-3.3-1.1 0-2.4.7-3.1 1.6-.7.8-1.3 2-1.1 3.2 1.1.1 2.3-.6 3.1-1.5Z" />
        </svg>
      </span>
    );
  }

  if (provider === 'facebook') {
    return (
      <span className="grid h-7 w-7 place-items-center rounded-full bg-[#1877F2]">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" aria-hidden="true">
          <path fill="currentColor" d="M14.2 8.1h2.3V4.3c-.4-.1-1.8-.2-3.4-.2-3.4 0-5.7 2.1-5.7 6v3.4H3.7v4.2h3.7V24h4.5v-6.3h3.6l.6-4.2h-4.2v-3c0-1.2.3-2.4 2.3-2.4Z" />
        </svg>
      </span>
    );
  }

  return (
    <span className="grid h-7 w-7 place-items-center rounded-full bg-[#0A66C2]">
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" aria-hidden="true">
        <path fill="currentColor" d="M5.4 7.9H1.7V22h3.7V7.9ZM3.5 6C2.3 6 1.4 5.1 1.4 3.9S2.3 1.8 3.5 1.8s2.1.9 2.1 2.1S4.7 6 3.5 6ZM22.6 22h-3.7v-7.3c0-1.7 0-3.9-2.4-3.9s-2.8 1.9-2.8 3.8V22H10V7.9h3.5v1.9h.1c.5-.9 1.7-2.3 3.8-2.3 4 0 5.2 2.6 5.2 6.1V22Z" />
      </svg>
    </span>
  );
}
