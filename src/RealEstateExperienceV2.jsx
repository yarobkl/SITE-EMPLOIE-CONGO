import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  ArrowLeft,
  Bath,
  BedDouble,
  Bookmark,
  Briefcase,
  Building2,
  CalendarDays,
  Camera,
  Car,
  Check,
  ChevronDown,
  Clock,
  Droplets,
  Eye,
  Flag,
  Heart,
  Home,
  Loader2,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Ruler,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Upload,
  User,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';
import { hasSupabaseConfig, supabase } from './lib/supabase';
import {
  CONGO_CITIES,
  PROPERTY_TYPES,
  fetchOwnedProperties,
  fetchPropertyPublicContact,
  fetchPropertyStats,
  fetchPublishedProperties,
  formatPrice,
  formatRelativeDate,
  friendlyError,
  preparePropertyImages,
  propertyTypeLabel,
  recordPropertyView,
  safeFileExtension,
  telephoneHref,
  validatePropertyImages,
} from './realEstateApi';
import './real-estate-v2.css';

const EMPTY_FORM = {
  title: '',
  description: '',
  listingType: 'rent',
  propertyType: 'apartment',
  city: 'Brazzaville',
  district: '',
  addressDetails: '',
  price: '',
  depositAmount: '',
  monthlyCharges: '',
  rooms: '1',
  bedrooms: '1',
  bathrooms: '1',
  areaSqm: '',
  furnished: false,
  waterAvailable: true,
  electricityAvailable: true,
  parking: false,
  fenced: false,
  securityAvailable: false,
  availableFrom: '',
  contactPhone: '',
  whatsappAvailable: false,
  showPhone: false,
};

const STATUS_LABELS = {
  draft: 'Brouillon',
  published: 'Publiée',
  rented: 'Louée',
  sold: 'Vendue',
  expired: 'Expirée',
  suspended: 'Suspendue',
  archived: 'Archivée',
};

function createEmptyForm(phone = '') {
  return { ...EMPTY_FORM, contactPhone: phone || '' };
}

function textNodeWithLabel(button) {
  return Array.from(button?.childNodes || []).find((node) => node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim());
}

function cleanLocation() {
  return `${window.location.pathname}${window.location.search}`;
}

function openHistory() {
  if (window.location.hash !== '#immobilier') {
    window.history.pushState({ ...(window.history.state || {}), nzelaImmo: true }, '', `${cleanLocation()}#immobilier`);
  }
}

function closeHistory() {
  if (window.location.hash === '#immobilier') {
    window.history.replaceState({ ...(window.history.state || {}), nzelaImmo: false }, '', cleanLocation());
  }
}

function findNativeButton(label) {
  return Array.from(document.querySelectorAll('button')).find((button) => {
    const aria = button.getAttribute('aria-label') || '';
    const text = button.textContent?.replace(/\s+/g, ' ').trim() || '';
    if (label === 'Accueil') return aria === 'Navigation Accueil' || aria === "Retour à l'accueil" || text === 'Accueil';
    if (label === 'Offres') return aria === 'Navigation Offres' || text === 'Trouver un emploi';
    if (label === 'Profil') return aria === 'Navigation Profil' || aria === 'Profil';
    return false;
  });
}

function plural(value, singular, pluralValue = `${singular}s`) {
  return Number(value) > 1 ? pluralValue : singular;
}

function SkeletonCards() {
  return (
    <div className="nz2-grid" aria-label="Chargement des logements">
      {[0, 1, 2].map((item) => (
        <div className="nz2-card nz2-skeleton-card" key={item} aria-hidden="true">
          <div className="nz2-skeleton nz2-skeleton-media" />
          <div className="nz2-card-body">
            <div className="nz2-skeleton nz2-skeleton-line small" />
            <div className="nz2-skeleton nz2-skeleton-line" />
            <div className="nz2-skeleton nz2-skeleton-line medium" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon = Building2, title, body, action, onAction, retry }) {
  return (
    <div className="nz2-empty">
      <span className="nz2-empty-icon"><Icon size={30} /></span>
      <strong>{title}</strong>
      <p>{body}</p>
      <div className="nz2-empty-actions">
        {action && <button type="button" className="nz2-primary" onClick={onAction}>{action}</button>}
        {retry && <button type="button" className="nz2-secondary" onClick={retry}><RefreshCw size={17} /> Réessayer</button>}
      </div>
    </div>
  );
}

function PropertyCard({ property, stats, saved, ownerMode, busy, onOpen, onSave, onEdit, onClose, onRenew, onDelete }) {
  const status = property.effective_status || property.status;
  return (
    <article className="nz2-card">
      <button type="button" className="nz2-card-open" onClick={() => onOpen(property)} aria-label={`Voir ${property.title}`}>
        <div className="nz2-card-media-wrap">
          {property.cover ? (
            <img className="nz2-card-media" src={property.cover} alt={property.title} loading="lazy" decoding="async" />
          ) : (
            <div className="nz2-card-placeholder"><Building2 size={46} /></div>
          )}
          <span className="nz2-card-type">{propertyTypeLabel(property.property_type)}</span>
          {ownerMode && <span className={`nz2-card-status is-${status}`}>{STATUS_LABELS[status] || status}</span>}
        </div>
        <div className="nz2-card-body">
          <p className="nz2-card-title">{property.title}</p>
          <p className="nz2-price">{formatPrice(property.price, property.listing_type)}</p>
          <p className="nz2-location"><MapPin size={15} /> {property.district}, {property.city}</p>
          <div className="nz2-card-meta">
            <span><Eye size={15} /> {stats?.views || 0}</span>
            <span><Heart size={15} /> {stats?.favorites || 0}</span>
            <span><Clock size={15} /> {formatRelativeDate(property.created_at)}</span>
          </div>
        </div>
      </button>
      {!ownerMode && (
        <button type="button" className={`nz2-heart ${saved ? 'is-saved' : ''}`} onClick={() => onSave(property)} disabled={busy} aria-label={saved ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
          {busy ? <Loader2 size={19} className="nz2-spin" /> : <Heart size={20} fill={saved ? 'currentColor' : 'none'} />}
        </button>
      )}
      {ownerMode && (
        <div className="nz2-owner-panel">
          <div className="nz2-stat-strip">
            <span><strong>{stats?.views || 0}</strong>Vues</span>
            <span><strong>{stats?.favorites || 0}</strong>Favoris</span>
            <span><strong>{stats?.inquiries || 0}</strong>Contacts</span>
          </div>
          <div className="nz2-owner-actions">
            <button type="button" className="nz2-owner-main" onClick={() => onOpen(property)}>Ouvrir</button>
            <button type="button" onClick={() => onEdit(property)} aria-label="Modifier l’annonce"><Pencil size={18} /></button>
            {status === 'published' ? (
              <button type="button" onClick={() => onClose(property)} aria-label="Marquer comme indisponible"><Check size={18} /></button>
            ) : (
              <button type="button" onClick={() => onRenew(property)} aria-label="Republier l’annonce"><RefreshCw size={18} /></button>
            )}
            <button type="button" className="is-danger" onClick={() => onDelete(property)} aria-label="Supprimer l’annonce"><Trash2 size={18} /></button>
          </div>
        </div>
      )}
    </article>
  );
}

function ConfirmDialog({ value, busy, onCancel, onConfirm }) {
  if (!value) return null;
  return (
    <div className="nz2-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section className="nz2-confirm" role="alertdialog" aria-modal="true" aria-labelledby="nz2-confirm-title" aria-describedby="nz2-confirm-body">
        <span className={`nz2-confirm-icon ${value.danger ? 'is-danger' : ''}`}><AlertCircle size={24} /></span>
        <h2 id="nz2-confirm-title">{value.title}</h2>
        <p id="nz2-confirm-body">{value.body}</p>
        <div className="nz2-confirm-actions">
          <button type="button" className="nz2-secondary" onClick={onCancel} disabled={busy}>Annuler</button>
          <button type="button" className={value.danger ? 'nz2-danger-button' : 'nz2-primary'} onClick={onConfirm} disabled={busy}>
            {busy && <Loader2 size={17} className="nz2-spin" />}{value.confirmLabel || 'Confirmer'}
          </button>
        </div>
      </section>
    </div>
  );
}

export default function RealEstateExperienceV2() {
  const [open, setOpen] = useState(() => window.location.hash === '#immobilier');
  const [view, setView] = useState('browse');
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [properties, setProperties] = useState([]);
  const [ownedProperties, setOwnedProperties] = useState([]);
  const [stats, setStats] = useState({});
  const [savedIds, setSavedIds] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [publicContact, setPublicContact] = useState({ contactPhone: '', whatsappAvailable: false });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [online, setOnline] = useState(() => navigator.onLine !== false);
  const [submitting, setSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState('');
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [pendingFavorites, setPendingFavorites] = useState([]);
  const [toast, setToast] = useState('');
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('Toutes');
  const [type, setType] = useState('Tous');
  const [listingType, setListingType] = useState('Tous');
  const [maxPrice, setMaxPrice] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [form, setForm] = useState(createEmptyForm());
  const [editingId, setEditingId] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [contact, setContact] = useState({ fullName: '', email: '', phone: '', message: '', requestVisit: false, preferredVisitAt: '' });
  const [report, setReport] = useState({ open: false, reason: 'fraud', details: '', email: '' });
  const [confirm, setConfirm] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const scrollRef = useRef(null);
  const toastTimer = useRef(0);
  const loadSequence = useRef(0);
  const browseScroll = useRef(0);
  const openerRef = useRef(null);
  const baselineForm = useRef(JSON.stringify(createEmptyForm()));

  const notify = useCallback((message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 3800);
  }, []);

  const scrollTop = useCallback((behavior = 'auto') => {
    scrollRef.current?.scrollTo({ top: 0, behavior });
  }, []);

  const formDirty = useMemo(() => (
    view === 'publish' && (JSON.stringify(form) !== baselineForm.current || files.length > 0)
  ), [files.length, form, view]);

  const performClose = useCallback(() => {
    setOpen(false);
    setSelected(null);
    setView('browse');
    closeHistory();
  }, []);

  const askConfirm = useCallback((value) => setConfirm(value), []);

  const requestClose = useCallback(() => {
    if (formDirty) {
      askConfirm({
        title: 'Quitter la publication ?',
        body: 'Les informations non enregistrées seront perdues.',
        confirmLabel: 'Quitter',
        danger: true,
        action: performClose,
      });
      return;
    }
    performClose();
  }, [askConfirm, formDirty, performClose]);

  const exitTo = useCallback((label) => {
    const action = () => {
      performClose();
      window.setTimeout(() => findNativeButton(label)?.click(), 80);
    };
    if (formDirty) {
      askConfirm({ title: `Aller vers ${label} ?`, body: 'La publication en cours ne sera pas enregistrée.', confirmLabel: 'Continuer', danger: true, action });
    } else action();
  }, [askConfirm, formDirty, performClose]);

  const runConfirm = useCallback(async () => {
    if (!confirm?.action || confirmBusy) return;
    setConfirmBusy(true);
    try {
      await confirm.action();
      setConfirm(null);
    } finally {
      setConfirmBusy(false);
    }
  }, [confirm, confirmBusy]);

  const goToView = useCallback((next, { restore = false } = {}) => {
    if (view === 'browse' && next !== 'browse') browseScroll.current = scrollRef.current?.scrollTop || 0;
    setView(next);
    window.requestAnimationFrame(() => {
      if (!scrollRef.current) return;
      scrollRef.current.scrollTo({ top: next === 'browse' && restore ? browseScroll.current : 0, behavior: 'auto' });
    });
  }, [view]);

  const requestView = useCallback((next, options) => {
    if (formDirty && next !== 'publish') {
      askConfirm({
        title: 'Abandonner les modifications ?',
        body: 'Les informations saisies ne seront pas enregistrées.',
        confirmLabel: 'Abandonner',
        danger: true,
        action: () => goToView(next, options),
      });
      return;
    }
    goToView(next, options);
  }, [askConfirm, formDirty, goToView]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const onHistory = () => setOpen(window.location.hash === '#immobilier');
    window.addEventListener('hashchange', onHistory);
    window.addEventListener('popstate', onHistory);
    return () => {
      window.removeEventListener('hashchange', onHistory);
      window.removeEventListener('popstate', onHistory);
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    const syncNavigation = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const mobileNav = document.querySelector('nav[aria-label="Navigation mobile"]');
        const mobileButtons = mobileNav?.querySelectorAll('button');
        if (mobileButtons?.length >= 4) {
          const target = mobileButtons[2];
          target.classList.add('nzela-immo-nav-button');
          target.dataset.nzImmoNav = 'true';
          target.setAttribute('aria-label', 'Navigation Immobilier');
          if (open) target.setAttribute('aria-current', 'page');
          else target.removeAttribute('aria-current');
          const textNode = textNodeWithLabel(target);
          if (textNode && textNode.nodeValue?.trim() !== 'Immobilier') textNode.nodeValue = 'Immobilier';
        }
        const desktopNav = document.querySelector('header nav[aria-label="Navigation principale"]');
        if (desktopNav && !desktopNav.querySelector('[data-nz-immo-nav]')) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'header-link';
          button.dataset.nzImmoNav = 'true';
          button.setAttribute('aria-label', 'Immobilier');
          button.textContent = 'Immobilier';
          const first = desktopNav.querySelector('button');
          first?.insertAdjacentElement('afterend', button);
        }
      });
    };
    const capture = (event) => {
      const target = event.target instanceof Element ? event.target.closest('[data-nz-immo-nav],.nzela-immo-nav-button') : null;
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openerRef.current = target;
      setOpen(true);
      setView('browse');
      openHistory();
    };
    const root = document.getElementById('root');
    const observer = new MutationObserver(syncNavigation);
    if (root) observer.observe(root, { childList: true, subtree: true });
    document.addEventListener('click', capture, true);
    syncNavigation();
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      document.removeEventListener('click', capture, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const appRoot = document.getElementById('root');
    const savedScroll = window.scrollY;
    const previous = {
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyWidth: document.body.style.width,
      bodyOverflow: document.body.style.overflow,
      rootAriaHidden: appRoot?.getAttribute('aria-hidden'),
      rootInert: appRoot?.inert,
    };
    document.documentElement.dataset.nzImmoOpen = 'true';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScroll}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    if (appRoot) {
      appRoot.inert = true;
      appRoot.setAttribute('aria-hidden', 'true');
    }
    window.requestAnimationFrame(() => closeButtonRef.current?.focus({ preventScroll: true }));

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (report.open) setReport((current) => ({ ...current, open: false }));
        else if (confirm) setConfirm(null);
        else requestClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      delete document.documentElement.dataset.nzImmoOpen;
      document.body.style.position = previous.bodyPosition;
      document.body.style.top = previous.bodyTop;
      document.body.style.width = previous.bodyWidth;
      document.body.style.overflow = previous.bodyOverflow;
      if (appRoot) {
        appRoot.inert = Boolean(previous.rootInert);
        if (previous.rootAriaHidden == null) appRoot.removeAttribute('aria-hidden');
        else appRoot.setAttribute('aria-hidden', previous.rootAriaHidden);
      }
      window.scrollTo(0, savedScroll);
      openerRef.current?.focus?.({ preventScroll: true });
    };
  }, [confirm, open, report.open, requestClose]);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) return undefined;
    let active = true;
    supabase.auth.getSession().then(({ data }) => active && setSession(data.session || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next || null));
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user || !supabase) {
      setProfile(null);
      return;
    }
    let active = true;
    supabase.from('profiles').select('nom,prenom,email,phone,city').eq('id', session.user.id).maybeSingle().then(({ data }) => {
      if (!active) return;
      setProfile(data || null);
      setContact((current) => ({
        ...current,
        fullName: current.fullName || `${data?.prenom || ''} ${data?.nom || ''}`.trim(),
        email: current.email || data?.email || session.user.email || '',
        phone: current.phone || data?.phone || '',
      }));
      setForm((current) => ({ ...current, contactPhone: current.contactPhone || data?.phone || '' }));
    });
    return () => { active = false; };
  }, [session]);

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!open || !hasSupabaseConfig || !supabase) return;
    const sequence = ++loadSequence.current;
    if (silent) setRefreshing(true);
    else setLoading(true);
    setLoadError('');
    const publicResult = await Promise.allSettled([
      fetchPublishedProperties({ limit: 60 }),
      session?.user ? fetchOwnedProperties(session.user.id) : Promise.resolve([]),
    ]);
    if (sequence !== loadSequence.current) return;

    const publicRows = publicResult[0].status === 'fulfilled' ? publicResult[0].value : properties;
    const ownerRows = publicResult[1].status === 'fulfilled' ? publicResult[1].value : ownedProperties;
    if (publicResult[0].status === 'fulfilled') setProperties(publicRows);
    else setLoadError(friendlyError(publicResult[0].reason, 'Impossible de charger les logements.'));
    if (publicResult[1].status === 'fulfilled') setOwnedProperties(ownerRows);

    const allIds = [...new Set([...publicRows, ...ownerRows].map((item) => item.id))];
    const supplemental = await Promise.allSettled([
      fetchPropertyStats(allIds),
      session?.user
        ? supabase.from('saved_properties').select('property_id').eq('user_id', session.user.id)
        : Promise.resolve({ data: [], error: null }),
      session?.user
        ? supabase.from('property_inquiries').select('id,property_id,sender_id,full_name,email,phone,message,request_visit,preferred_visit_at,status,created_at,properties!inner(id,title,owner_id)').eq('properties.owner_id', session.user.id).order('created_at', { ascending: false }).limit(100)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (sequence !== loadSequence.current) return;
    if (supplemental[0].status === 'fulfilled') setStats(supplemental[0].value);
    if (supplemental[1].status === 'fulfilled' && !supplemental[1].value.error) setSavedIds((supplemental[1].value.data || []).map((item) => item.property_id));
    if (supplemental[2].status === 'fulfilled' && !supplemental[2].value.error) setInquiries(supplemental[2].value.data || []);
    if (!session?.user) {
      setSavedIds([]);
      setInquiries([]);
    }
    setLoading(false);
    setRefreshing(false);
  }, [open, ownedProperties, properties, session]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (open && online) loadData({ silent: properties.length > 0 }); }, [online]);

  useEffect(() => () => previews.forEach((item) => URL.revokeObjectURL(item.url)), [previews]);

  const filteredProperties = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('fr-FR');
    const ceiling = Number(maxPrice || 0);
    return properties.filter((property) => {
      const haystack = `${property.title} ${property.description} ${property.city} ${property.district}`.toLocaleLowerCase('fr-FR');
      return (!needle || haystack.includes(needle))
        && (city === 'Toutes' || property.city === city)
        && (type === 'Tous' || property.property_type === type)
        && (listingType === 'Tous' || property.listing_type === listingType)
        && (!ceiling || Number(property.price) <= ceiling);
    });
  }, [city, listingType, maxPrice, properties, query, type]);

  const savedProperties = useMemo(() => properties.filter((property) => savedIds.includes(property.id)), [properties, savedIds]);
  const activeFilters = [city !== 'Toutes', type !== 'Tous', listingType !== 'Tous', Boolean(maxPrice)].filter(Boolean).length;

  const requireAccount = useCallback((message) => {
    notify(message);
    window.setTimeout(() => exitTo('Profil'), 650);
  }, [exitTo, notify]);

  const openProperty = useCallback(async (property) => {
    setSelected(property);
    setActiveImage(0);
    setPublicContact({ contactPhone: property.contact_phone || '', whatsappAvailable: Boolean(property.whatsapp_available) });
    goToView('detail');
    const isOwner = session?.user?.id === property.owner_id;
    const tasks = [recordPropertyView(property.id)];
    if (!isOwner && property.show_phone) tasks.push(fetchPropertyPublicContact(property.id));
    const results = await Promise.allSettled(tasks);
    if (results[0].status === 'fulfilled') {
      setStats((current) => ({ ...current, [property.id]: { ...(current[property.id] || {}), views: results[0].value } }));
    }
    if (results[1]?.status === 'fulfilled') setPublicContact(results[1].value);
  }, [goToView, session]);

  const toggleSave = useCallback(async (property) => {
    if (!session?.user || !supabase) {
      requireAccount('Connectez-vous pour sauvegarder ce logement.');
      return;
    }
    if (pendingFavorites.includes(property.id)) return;
    const saved = savedIds.includes(property.id);
    setPendingFavorites((current) => [...current, property.id]);
    setSavedIds((current) => saved ? current.filter((id) => id !== property.id) : [...current, property.id]);
    setStats((current) => ({
      ...current,
      [property.id]: { ...(current[property.id] || {}), favorites: Math.max(0, Number(current[property.id]?.favorites || 0) + (saved ? -1 : 1)) },
    }));
    const result = saved
      ? await supabase.from('saved_properties').delete().eq('property_id', property.id).eq('user_id', session.user.id)
      : await supabase.from('saved_properties').insert({ property_id: property.id, user_id: session.user.id });
    setPendingFavorites((current) => current.filter((id) => id !== property.id));
    if (result.error) {
      setSavedIds((current) => saved ? [...current, property.id] : current.filter((id) => id !== property.id));
      setStats((current) => ({
        ...current,
        [property.id]: { ...(current[property.id] || {}), favorites: Math.max(0, Number(current[property.id]?.favorites || 0) + (saved ? 1 : -1)) },
      }));
      notify(friendlyError(result.error, 'Le favori n’a pas été modifié.'));
      return;
    }
    notify(saved ? 'Logement retiré des favoris.' : 'Logement sauvegardé.');
  }, [notify, pendingFavorites, requireAccount, savedIds, session]);

  const clearPreviews = useCallback(() => {
    previews.forEach((item) => URL.revokeObjectURL(item.url));
    setFiles([]);
    setPreviews([]);
  }, [previews]);

  const resetForm = useCallback(() => {
    clearPreviews();
    const next = createEmptyForm(profile?.phone || '');
    setForm(next);
    baselineForm.current = JSON.stringify(next);
    setEditingId('');
  }, [clearPreviews, profile]);

  const startPublish = useCallback(() => {
    if (!session?.user) {
      requireAccount('Connectez-vous pour publier gratuitement un logement.');
      return;
    }
    resetForm();
    goToView('publish');
  }, [goToView, requireAccount, resetForm, session]);

  const startEdit = useCallback((property) => {
    clearPreviews();
    const next = {
      title: property.title || '',
      description: property.description || '',
      listingType: property.listing_type || 'rent',
      propertyType: property.property_type || 'apartment',
      city: property.city || 'Brazzaville',
      district: property.district || '',
      addressDetails: property.address_details || '',
      price: String(property.price || ''),
      depositAmount: String(property.deposit_amount || ''),
      monthlyCharges: String(property.monthly_charges || ''),
      rooms: String(property.rooms || 1),
      bedrooms: String(property.bedrooms || 0),
      bathrooms: String(property.bathrooms || 0),
      areaSqm: property.area_sqm ? String(property.area_sqm) : '',
      furnished: Boolean(property.furnished),
      waterAvailable: Boolean(property.water_available),
      electricityAvailable: Boolean(property.electricity_available),
      parking: Boolean(property.parking),
      fenced: Boolean(property.fenced),
      securityAvailable: Boolean(property.security_available),
      availableFrom: property.available_from || '',
      contactPhone: property.contact_phone || profile?.phone || '',
      whatsappAvailable: Boolean(property.whatsapp_available),
      showPhone: Boolean(property.show_phone),
    };
    setEditingId(property.id);
    setForm(next);
    baselineForm.current = JSON.stringify(next);
    goToView('publish');
  }, [clearPreviews, goToView, profile]);

  const selectFiles = useCallback((event) => {
    const currentProperty = editingId ? ownedProperties.find((item) => item.id === editingId) : null;
    const validation = validatePropertyImages(event.target.files, (currentProperty?.images.length || 0) + files.length);
    event.target.value = '';
    if (!validation.ok) {
      notify(validation.message);
      return;
    }
    const nextFiles = validation.files;
    setFiles((current) => [...current, ...nextFiles]);
    setPreviews((current) => [...current, ...nextFiles.map((file) => ({ id: crypto.randomUUID(), url: URL.createObjectURL(file), name: file.name }))]);
  }, [editingId, files.length, notify, ownedProperties]);

  const removePendingFile = useCallback((index) => {
    setFiles((current) => current.filter((_file, itemIndex) => itemIndex !== index));
    setPreviews((current) => {
      const removed = current[index];
      if (removed) URL.revokeObjectURL(removed.url);
      return current.filter((_preview, itemIndex) => itemIndex !== index);
    });
  }, []);

  const buildPayload = useCallback((status) => ({
    owner_id: session.user.id,
    title: form.title.trim(),
    description: form.description.trim(),
    listing_type: form.listingType,
    property_type: form.propertyType,
    city: form.city,
    district: form.district.trim(),
    address_details: form.addressDetails.trim() || null,
    price: Number(form.price),
    deposit_amount: Number(form.depositAmount || 0),
    monthly_charges: Number(form.monthlyCharges || 0),
    rooms: Number(form.rooms || 1),
    bedrooms: Number(form.bedrooms || 0),
    bathrooms: Number(form.bathrooms || 0),
    area_sqm: form.areaSqm ? Number(form.areaSqm) : null,
    furnished: form.furnished,
    water_available: form.waterAvailable,
    electricity_available: form.electricityAvailable,
    parking: form.parking,
    fenced: form.fenced,
    security_available: form.securityAvailable,
    available_from: form.availableFrom || null,
    contact_phone: form.contactPhone.trim() || null,
    whatsapp_available: form.whatsappAvailable,
    show_phone: form.showPhone,
    ...(status ? { status } : {}),
  }), [form, session]);

  const uploadImages = useCallback(async (propertyId, sourceFiles, existingCount) => {
    if (!sourceFiles.length) return { paths: [], rows: [] };
    setSubmitStage('Optimisation des photos…');
    const prepared = await preparePropertyImages(sourceFiles, (done, total) => setSubmitStage(`Optimisation des photos ${done}/${total}…`));
    setSubmitStage('Envoi sécurisé des photos…');
    const uploads = await Promise.allSettled(prepared.map(async (file, index) => {
      const extension = safeFileExtension(file);
      const path = `${session.user.id}/${propertyId}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from('property-images').upload(path, file, { contentType: file.type, upsert: false, cacheControl: '31536000' });
      if (error) throw error;
      return {
        path,
        row: {
          property_id: propertyId,
          owner_id: session.user.id,
          storage_path: path,
          alt_text: `${form.title.trim()} - photo ${existingCount + index + 1}`,
          sort_order: existingCount + index,
          is_cover: existingCount === 0 && index === 0,
        },
      };
    }));
    const successful = uploads.filter((item) => item.status === 'fulfilled').map((item) => item.value);
    const failure = uploads.find((item) => item.status === 'rejected');
    if (failure) {
      if (successful.length) await supabase.storage.from('property-images').remove(successful.map((item) => item.path));
      throw failure.reason;
    }
    return { paths: successful.map((item) => item.path), rows: successful.map((item) => item.row) };
  }, [form.title, session]);

  const submitProperty = useCallback(async (event) => {
    event.preventDefault();
    if (!session?.user || !supabase || submitting) return;
    const currentProperty = editingId ? ownedProperties.find((item) => item.id === editingId) : null;
    const existingCount = currentProperty?.images.length || 0;
    if (!editingId && files.length === 0) return notify('Ajoutez au moins une vraie photo du logement.');
    if (existingCount + files.length > 8) return notify('Maximum 8 photos par annonce.');
    setSubmitting(true);
    setSubmitStage('Préparation de l’annonce…');
    const propertyId = editingId || crypto.randomUUID();
    let createdDraft = false;
    let uploadedPaths = [];
    let insertedImageIds = [];
    try {
      if (!editingId) {
        const { error } = await supabase.from('properties').insert({ id: propertyId, ...buildPayload('draft') });
        if (error) throw error;
        createdDraft = true;
      }
      const uploaded = await uploadImages(propertyId, files, existingCount);
      uploadedPaths = uploaded.paths;
      if (uploaded.rows.length) {
        setSubmitStage('Enregistrement des photos…');
        const { data, error } = await supabase.from('property_images').insert(uploaded.rows).select('id');
        if (error) throw error;
        insertedImageIds = (data || []).map((item) => item.id);
      }
      setSubmitStage(editingId ? 'Enregistrement des modifications…' : 'Mise en ligne de l’annonce…');
      const operation = editingId
        ? supabase.from('properties').update(buildPayload()).eq('id', propertyId).eq('owner_id', session.user.id)
        : supabase.from('properties').update({ status: 'published' }).eq('id', propertyId).eq('owner_id', session.user.id);
      const { error: saveError } = await operation;
      if (saveError) throw saveError;
      notify(editingId ? 'Annonce immobilière mise à jour.' : 'Annonce publiée pour 30 jours.');
      resetForm();
      goToView('mine');
      await loadData({ silent: true });
    } catch (error) {
      if (insertedImageIds.length) await supabase.from('property_images').delete().in('id', insertedImageIds);
      if (uploadedPaths.length) await supabase.storage.from('property-images').remove(uploadedPaths);
      if (createdDraft) await supabase.from('properties').delete().eq('id', propertyId).eq('owner_id', session.user.id);
      notify(`Publication impossible : ${friendlyError(error)}`);
    } finally {
      setSubmitting(false);
      setSubmitStage('');
    }
  }, [buildPayload, editingId, files, goToView, loadData, notify, ownedProperties, resetForm, session, submitting, uploadImages]);

  const mutateProperty = useCallback(async (property, action, payload, successMessage) => {
    if (!session?.user || busyAction) return;
    setBusyAction(`${action}:${property.id}`);
    const { error } = await supabase.from('properties').update(payload).eq('id', property.id).eq('owner_id', session.user.id);
    setBusyAction('');
    if (error) return notify(friendlyError(error, 'L’annonce n’a pas été modifiée.'));
    notify(successMessage);
    await loadData({ silent: true });
  }, [busyAction, loadData, notify, session]);

  const closeProperty = useCallback((property) => {
    const nextStatus = property.listing_type === 'sale' ? 'sold' : 'rented';
    askConfirm({
      title: property.listing_type === 'sale' ? 'Marquer comme vendue ?' : 'Marquer comme louée ?',
      body: 'L’annonce disparaîtra des recherches publiques, mais restera dans votre espace.',
      confirmLabel: 'Confirmer',
      action: () => mutateProperty(property, 'close', { status: nextStatus }, property.listing_type === 'sale' ? 'Annonce marquée comme vendue.' : 'Annonce marquée comme louée.'),
    });
  }, [askConfirm, mutateProperty]);

  const renewProperty = useCallback((property) => {
    askConfirm({
      title: 'Republier cette annonce ?',
      body: 'Elle sera de nouveau visible pendant 30 jours.',
      confirmLabel: 'Republier',
      action: () => mutateProperty(property, 'renew', { status: 'published', expires_at: new Date(Date.now() + 30 * 86400000).toISOString() }, 'Annonce republiée pour 30 jours.'),
    });
  }, [askConfirm, mutateProperty]);

  const deleteProperty = useCallback((property) => {
    askConfirm({
      title: 'Supprimer définitivement ?',
      body: `« ${property.title} » ainsi que ses contacts et statistiques seront supprimés.`,
      confirmLabel: 'Supprimer',
      danger: true,
      action: async () => {
        if (!session?.user) return;
        setBusyAction(`delete:${property.id}`);
        const paths = property.images.map((image) => image.storage_path).filter(Boolean);
        const { error } = await supabase.from('properties').delete().eq('id', property.id).eq('owner_id', session.user.id);
        if (!error && paths.length) await supabase.storage.from('property-images').remove(paths);
        setBusyAction('');
        if (error) return notify(friendlyError(error, 'Suppression impossible.'));
        notify('Annonce supprimée.');
        if (selected?.id === property.id) setSelected(null);
        await loadData({ silent: true });
      },
    });
  }, [askConfirm, loadData, notify, selected, session]);

  const submitInquiry = useCallback(async (event) => {
    event.preventDefault();
    if (!selected || !supabase || inquirySubmitting) return;
    if (!contact.email.trim() && !contact.phone.trim()) {
      notify('Ajoutez un e-mail ou un numéro de téléphone pour être recontacté.');
      return;
    }
    setInquirySubmitting(true);
    const { error } = await supabase.from('property_inquiries').insert({
      property_id: selected.id,
      sender_id: session?.user?.id || null,
      full_name: contact.fullName.trim(),
      email: contact.email.trim() || null,
      phone: contact.phone.trim() || null,
      message: contact.message.trim(),
      request_visit: contact.requestVisit,
      preferred_visit_at: contact.preferredVisitAt || null,
    });
    setInquirySubmitting(false);
    if (error) return notify(`Demande non envoyée : ${friendlyError(error)}`);
    setContact((current) => ({ ...current, message: '', requestVisit: false, preferredVisitAt: '' }));
    setStats((current) => ({ ...current, [selected.id]: { ...(current[selected.id] || {}), inquiries: Number(current[selected.id]?.inquiries || 0) + 1 } }));
    notify('Votre demande a été envoyée directement à l’auteur.');
  }, [contact, inquirySubmitting, notify, selected, session]);

  const submitReport = useCallback(async (event) => {
    event.preventDefault();
    if (!selected || !supabase || reportSubmitting) return;
    setReportSubmitting(true);
    const { error } = await supabase.from('property_reports').insert({
      property_id: selected.id,
      reporter_id: session?.user?.id || null,
      reporter_email: report.email.trim() || session?.user?.email || null,
      reason: report.reason,
      details: report.details.trim() || null,
    });
    setReportSubmitting(false);
    if (error) return notify(`Signalement non envoyé : ${friendlyError(error)}`);
    setReport({ open: false, reason: 'fraud', details: '', email: '' });
    notify('Signalement transmis à la modération.');
  }, [notify, report, reportSubmitting, selected, session]);

  const updateInquiry = useCallback(async (inquiry, status) => {
    if (busyAction) return;
    setBusyAction(`inquiry:${inquiry.id}`);
    const { error } = await supabase.from('property_inquiries').update({ status }).eq('id', inquiry.id);
    setBusyAction('');
    if (error) return notify(friendlyError(error, 'La demande n’a pas été mise à jour.'));
    setInquiries((current) => current.map((item) => item.id === inquiry.id ? { ...item, status } : item));
    notify('Demande mise à jour.');
  }, [busyAction, notify]);

  if (!open) return null;

  const renderBrowse = () => (
    <>
      <section className="nz2-hero">
        <div>
          <p className="nz2-kicker">Nzela Immobilier</p>
          <h1>Un logement à trouver ou à publier, simplement.</h1>
          <p>Particuliers et professionnels publient directement leurs chambres, studios, appartements et maisons. Aucun passage obligatoire par une agence.</p>
        </div>
        <div className="nz2-hero-actions">
          <button type="button" className="nz2-primary" onClick={startPublish}><Plus size={18} /> Publier gratuitement</button>
          <button type="button" className="nz2-secondary" onClick={() => requestView('mine')}><Building2 size={18} /> Mes annonces</button>
        </div>
      </section>

      <section className="nz2-search-panel" aria-label="Filtres immobiliers">
        <div className="nz2-search-row">
          <label className="nz2-search-field"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Quartier, ville ou type de logement" aria-label="Rechercher un logement" /></label>
          <button type="button" className={`nz2-filter-toggle ${filtersOpen || activeFilters ? 'is-active' : ''}`} onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen}>
            <SlidersHorizontal size={18} /> Filtres{activeFilters ? ` (${activeFilters})` : ''}<ChevronDown size={16} />
          </button>
        </div>
        <div className={`nz2-filter-grid ${filtersOpen ? 'is-open' : ''}`}>
          <label><span>Ville</span><select value={city} onChange={(event) => setCity(event.target.value)}><option>Toutes</option>{CONGO_CITIES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Type de bien</span><select value={type} onChange={(event) => setType(event.target.value)}><option value="Tous">Tous les biens</option>{PROPERTY_TYPES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label><span>Projet</span><select value={listingType} onChange={(event) => setListingType(event.target.value)}><option value="Tous">Location et vente</option><option value="rent">Location</option><option value="sale">Vente</option></select></label>
          <label><span>Budget maximum</span><input inputMode="numeric" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value.replace(/\D/g, ''))} placeholder="Ex. 250 000" /></label>
        </div>
      </section>

      <div className="nz2-section-head">
        <div><h2>Annonces disponibles</h2><p>{filteredProperties.length} {plural(filteredProperties.length, 'annonce')} active{filteredProperties.length > 1 ? 's' : ''}</p></div>
        <button type="button" className="nz2-refresh" onClick={() => loadData({ silent: true })} disabled={refreshing} aria-label="Actualiser les annonces">{refreshing ? <Loader2 size={19} className="nz2-spin" /> : <RefreshCw size={19} />}</button>
      </div>
      {loading && !properties.length ? <SkeletonCards /> : loadError && !properties.length ? (
        <EmptyState icon={WifiOff} title="Les annonces ne répondent pas" body={loadError} retry={() => loadData()} />
      ) : filteredProperties.length ? (
        <div className="nz2-grid">{filteredProperties.map((property) => (
          <PropertyCard key={property.id} property={property} stats={stats[property.id]} saved={savedIds.includes(property.id)} busy={pendingFavorites.includes(property.id)} onOpen={openProperty} onSave={toggleSave} />
        ))}</div>
      ) : <EmptyState title="Aucun logement trouvé" body="Modifiez les filtres ou publiez la première annonce de ce quartier." action="Publier une annonce" onAction={startPublish} />}
    </>
  );

  const renderDetail = () => {
    if (!selected) return <EmptyState title="Annonce introuvable" body="Retournez à la liste immobilière." action="Voir les annonces" onAction={() => requestView('browse', { restore: true })} />;
    const isOwner = session?.user?.id === selected.owner_id;
    const currentImage = selected.images[activeImage]?.url || selected.cover;
    const phone = isOwner ? selected.contact_phone : publicContact.contactPhone;
    const features = [
      [BedDouble, `${selected.rooms} ${plural(selected.rooms, 'pièce')}`],
      [BedDouble, `${selected.bedrooms} ${plural(selected.bedrooms, 'chambre')}`],
      [Bath, `${selected.bathrooms} ${plural(selected.bathrooms, 'salle d’eau', 'salles d’eau')}`],
      [Ruler, selected.area_sqm ? `${selected.area_sqm} m²` : 'Surface non précisée'],
      [Droplets, selected.water_available ? 'Eau disponible' : 'Eau non précisée'],
      [Zap, selected.electricity_available ? 'Électricité disponible' : 'Électricité non précisée'],
      [Car, selected.parking ? 'Parking' : 'Parking non précisé'],
      [ShieldCheck, selected.security_available ? 'Gardiennage' : 'Sécurité non précisée'],
    ];
    return (
      <>
        <button type="button" className="nz2-back" onClick={() => requestView('browse', { restore: true })}><ArrowLeft size={18} /> Retour aux annonces</button>
        <div className="nz2-detail">
          <div>
            <div className="nz2-gallery">
              {currentImage ? <img className="nz2-gallery-main" src={currentImage} alt={selected.title} decoding="async" fetchPriority="high" /> : <div className="nz2-gallery-placeholder"><Building2 size={58} /></div>}
              {selected.images.length > 1 && <div className="nz2-thumbs" aria-label="Photos du logement">{selected.images.map((image, index) => <button type="button" key={image.id} className={index === activeImage ? 'is-active' : ''} onClick={() => setActiveImage(index)}><img src={image.url} alt={image.alt_text || `${selected.title}, photo ${index + 1}`} loading="lazy" decoding="async" /></button>)}</div>}
            </div>
            <article className="nz2-detail-card nz2-description-card">
              <span className="nz2-badge">{propertyTypeLabel(selected.property_type)} · {selected.listing_type === 'rent' ? 'Location' : 'Vente'}</span>
              <h1>{selected.title}</h1>
              <p className="nz2-location"><MapPin size={17} /> {selected.district}, {selected.city}</p>
              <p className="nz2-detail-price">{formatPrice(selected.price, selected.listing_type)}</p>
              <div className="nz2-detail-meta"><span><Eye size={16} /> {stats[selected.id]?.views || 0} consultations</span><span><Heart size={16} /> {stats[selected.id]?.favorites || 0} favoris</span><span><CalendarDays size={16} /> {formatRelativeDate(selected.created_at)}</span></div>
              <div className="nz2-feature-grid">{features.map(([Icon, label]) => <div key={label}><Icon size={19} /><span>{label}</span></div>)}</div>
              <h2>Description</h2><p className="nz2-description">{selected.description}</p>
              <div className="nz2-costs">
                {selected.deposit_amount > 0 && <p><span>Caution / avance</span><strong>{Number(selected.deposit_amount).toLocaleString('fr-FR')} FCFA</strong></p>}
                {selected.monthly_charges > 0 && <p><span>Charges mensuelles</span><strong>{Number(selected.monthly_charges).toLocaleString('fr-FR')} FCFA</strong></p>}
                {selected.available_from && <p><span>Disponible à partir du</span><strong>{new Date(selected.available_from).toLocaleDateString('fr-FR')}</strong></p>}
              </div>
              {!isOwner && <div className="nz2-inline-actions"><button type="button" className="nz2-secondary" onClick={() => toggleSave(selected)}><Heart size={18} fill={savedIds.includes(selected.id) ? 'currentColor' : 'none'} /> {savedIds.includes(selected.id) ? 'Sauvegardé' : 'Sauvegarder'}</button><button type="button" className="nz2-text-danger" onClick={() => setReport((current) => ({ ...current, open: true }))}><Flag size={17} /> Signaler</button></div>}
            </article>
          </div>
          <aside className="nz2-detail-card nz2-contact-card">
            {isOwner ? (
              <>
                <span className="nz2-badge">Votre annonce</span>
                <h2>Pilotez sa disponibilité</h2>
                <p>Consultez ses performances ou modifiez les informations depuis votre espace.</p>
                <button type="button" className="nz2-primary" onClick={() => startEdit(selected)}><Pencil size={18} /> Modifier l’annonce</button>
                <button type="button" className="nz2-secondary" onClick={() => requestView('mine')}>Voir mes statistiques</button>
              </>
            ) : (
              <>
                <h2>Contacter directement</h2>
                <p>Votre message est envoyé à l’auteur de l’annonce, sans agence obligatoire.</p>
                {phone && <div className="nz2-direct-contact"><a className="nz2-secondary" href={telephoneHref(phone)}><Phone size={18} /> Appeler</a>{publicContact.whatsappAvailable && <a className="nz2-secondary" href={`https://wa.me/${String(phone).replace(/\D/g, '')}`} target="_blank" rel="noreferrer"><MessageCircle size={18} /> WhatsApp</a>}</div>}
                <form className="nz2-form" onSubmit={submitInquiry}>
                  <label><span>Nom complet</span><input required minLength={2} value={contact.fullName} onChange={(event) => setContact({ ...contact, fullName: event.target.value })} autoComplete="name" /></label>
                  <div className="nz2-two-columns"><label><span>E-mail</span><input type="email" value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} autoComplete="email" /></label><label><span>Téléphone</span><input type="tel" value={contact.phone} onChange={(event) => setContact({ ...contact, phone: event.target.value })} autoComplete="tel" /></label></div>
                  <p className="nz2-field-help">Indiquez au moins un e-mail ou un téléphone.</p>
                  <label><span>Votre message</span><textarea required minLength={5} maxLength={2000} value={contact.message} onChange={(event) => setContact({ ...contact, message: event.target.value })} placeholder="Bonjour, ce logement est-il toujours disponible ?" /></label>
                  <label className="nz2-check"><input type="checkbox" checked={contact.requestVisit} onChange={(event) => setContact({ ...contact, requestVisit: event.target.checked })} /> Demander une visite</label>
                  {contact.requestVisit && <label><span>Créneau souhaité</span><input type="datetime-local" value={contact.preferredVisitAt} onChange={(event) => setContact({ ...contact, preferredVisitAt: event.target.value })} /></label>}
                  <button className="nz2-primary" type="submit" disabled={inquirySubmitting}>{inquirySubmitting ? <><Loader2 size={18} className="nz2-spin" /> Envoi en cours…</> : <><MessageCircle size={18} /> Envoyer la demande</>}</button>
                </form>
              </>
            )}
          </aside>
        </div>
      </>
    );
  };

  const renderPublish = () => (
    <>
      <button type="button" className="nz2-back" onClick={() => requestView('mine')}><ArrowLeft size={18} /> Annuler</button>
      <div className="nz2-page-title"><div><p className="nz2-kicker">Publication en libre-service</p><h1>{editingId ? 'Modifier le logement' : 'Publier un logement'}</h1><p>Votre annonce reste visible pendant 30 jours et peut être prolongée.</p></div><Camera size={28} /></div>
      <form className="nz2-form nz2-publish-card" onSubmit={submitProperty}>
        <section><h2>Informations principales</h2><div className="nz2-form-grid">
          <label className="nz2-span-2"><span>Titre de l’annonce</span><input required minLength={5} maxLength={140} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Appartement 2 chambres à Moungali" /></label>
          <label><span>Type de publication</span><select value={form.listingType} onChange={(event) => setForm({ ...form, listingType: event.target.value })}><option value="rent">Location</option><option value="sale">Vente</option></select></label>
          <label><span>Type de bien</span><select value={form.propertyType} onChange={(event) => setForm({ ...form, propertyType: event.target.value })}>{PROPERTY_TYPES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label><span>Ville</span><select value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })}>{CONGO_CITIES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Quartier</span><input required minLength={2} maxLength={120} value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value })} placeholder="Ex. Moungali" /></label>
          <label className="nz2-span-2"><span>Adresse ou repère privé, facultatif</span><input value={form.addressDetails} onChange={(event) => setForm({ ...form, addressDetails: event.target.value })} placeholder="À proximité de… Cette information n’est pas affichée publiquement." /></label>
        </div></section>
        <section><h2>Prix et caractéristiques</h2><div className="nz2-form-grid nz2-three-columns">
          <label><span>Prix en FCFA</span><input required min="1" inputMode="numeric" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
          <label><span>Caution / avance</span><input min="0" inputMode="numeric" type="number" value={form.depositAmount} onChange={(event) => setForm({ ...form, depositAmount: event.target.value })} /></label>
          <label><span>Charges mensuelles</span><input min="0" inputMode="numeric" type="number" value={form.monthlyCharges} onChange={(event) => setForm({ ...form, monthlyCharges: event.target.value })} /></label>
          <label><span>Pièces</span><input min="1" max="50" type="number" value={form.rooms} onChange={(event) => setForm({ ...form, rooms: event.target.value })} /></label>
          <label><span>Chambres</span><input min="0" max="30" type="number" value={form.bedrooms} onChange={(event) => setForm({ ...form, bedrooms: event.target.value })} /></label>
          <label><span>Salles d’eau</span><input min="0" max="20" type="number" value={form.bathrooms} onChange={(event) => setForm({ ...form, bathrooms: event.target.value })} /></label>
          <label><span>Surface en m²</span><input min="1" type="number" value={form.areaSqm} onChange={(event) => setForm({ ...form, areaSqm: event.target.value })} /></label>
          <label><span>Disponible à partir du</span><input type="date" value={form.availableFrom} onChange={(event) => setForm({ ...form, availableFrom: event.target.value })} /></label>
          <label><span>Téléphone de contact</span><input type="tel" value={form.contactPhone} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} autoComplete="tel" /></label>
        </div></section>
        <section><h2>Équipements</h2><div className="nz2-check-grid">{[
          ['furnished', 'Meublé'], ['waterAvailable', 'Eau disponible'], ['electricityAvailable', 'Électricité'], ['parking', 'Parking'], ['fenced', 'Parcelle clôturée'], ['securityAvailable', 'Gardiennage'], ['whatsappAvailable', 'WhatsApp'], ['showPhone', 'Afficher mon numéro'],
        ].map(([key, label]) => <label key={key} className="nz2-check"><input type="checkbox" checked={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.checked })} /> {label}</label>)}</div></section>
        <section><h2>Description et photos</h2><label><span>Description complète</span><textarea required minLength={20} maxLength={5000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Décrivez l’état du logement, l’accès, les conditions et les équipements…" /></label>
          {editingId && ownedProperties.find((item) => item.id === editingId)?.images.length > 0 && <div className="nz2-existing-images"><p>Photos déjà publiées</p><div>{ownedProperties.find((item) => item.id === editingId).images.map((image) => <img key={image.id} src={image.url} alt={image.alt_text || form.title} loading="lazy" />)}</div></div>}
          <label className="nz2-upload"><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectFiles} /><Upload size={28} /><strong>Ajouter des photos réelles</strong><span>Jusqu’à 8 photos. Elles sont automatiquement optimisées pour le mobile avant l’envoi.</span></label>
          {previews.length > 0 && <div className="nz2-preview-grid">{previews.map((preview, index) => <figure key={preview.id}><img src={preview.url} alt={`Nouvelle photo ${index + 1}`} /><button type="button" onClick={() => removePendingFile(index)} aria-label={`Retirer ${preview.name}`}><X size={17} /></button></figure>)}</div>}
        </section>
        <label className="nz2-check nz2-confirmation-check"><input type="checkbox" required /> Je confirme que l’annonce est exacte, que j’ai le droit d’utiliser ces photos et qu’aucun paiement anticipé trompeur n’est demandé.</label>
        <div className="nz2-publish-footer"><div>{submitting && <span><Loader2 size={17} className="nz2-spin" /> {submitStage}</span>}</div><button className="nz2-primary" type="submit" disabled={submitting}>{editingId ? 'Enregistrer les modifications' : 'Publier pendant 30 jours'}</button></div>
      </form>
    </>
  );

  const renderMine = () => (
    <>
      <div className="nz2-section-head"><div><h2>Mes annonces immobilières</h2><p>Vues, favoris, contacts et disponibilité.</p></div><button type="button" className="nz2-primary nz2-compact" onClick={startPublish}><Plus size={18} /> Publier</button></div>
      {!session?.user ? <EmptyState title="Connectez-vous" body="Votre compte Nzela permet de publier et gérer vos logements." action="Ouvrir mon profil" onAction={() => exitTo('Profil')} /> : ownedProperties.length ? (
        <div className="nz2-dashboard-grid">{ownedProperties.map((property) => <PropertyCard key={property.id} property={property} stats={stats[property.id]} ownerMode onOpen={openProperty} onEdit={startEdit} onClose={closeProperty} onRenew={renewProperty} onDelete={deleteProperty} />)}</div>
      ) : <EmptyState title="Aucune annonce publiée" body="Une chambre, un studio ou une maison peut être mis en ligne en quelques minutes." action="Publier un logement" onAction={startPublish} />}
      {session?.user && <><div className="nz2-section-head"><div><h2>Demandes reçues</h2><p>{inquiries.length} {plural(inquiries.length, 'contact')} reçu{inquiries.length > 1 ? 's' : ''}</p></div><MessageCircle size={21} /></div>{inquiries.length ? <div className="nz2-inquiry-grid">{inquiries.map((item) => <article key={item.id} className="nz2-inquiry"><div><span className="nz2-badge">{item.status === 'new' ? 'Nouvelle demande' : item.status}</span><h3>{item.full_name}</h3><p className="nz2-inquiry-property">{item.properties?.title}</p></div><p>{item.message}</p><div className="nz2-detail-meta">{item.phone && <span><Phone size={15} /> {item.phone}</span>}{item.email && <span>{item.email}</span>}{item.request_visit && <span><CalendarDays size={15} /> Visite demandée</span>}</div><div className="nz2-inline-actions"><button type="button" className="nz2-secondary" onClick={() => updateInquiry(item, 'contacted')} disabled={busyAction === `inquiry:${item.id}`}>Marquer contactée</button><button type="button" className="nz2-secondary" onClick={() => updateInquiry(item, 'closed')} disabled={busyAction === `inquiry:${item.id}`}>Clôturer</button></div></article>)}</div> : <EmptyState title="Aucune demande reçue" body="Les messages envoyés depuis vos annonces apparaîtront ici." />}</>}
    </>
  );

  const renderSaved = () => (
    <><div className="nz2-section-head"><div><h2>Logements sauvegardés</h2><p>Retrouvez rapidement vos annonces préférées.</p></div><Heart size={21} /></div>{!session?.user ? <EmptyState title="Connectez-vous" body="La sauvegarde des logements est liée à votre compte Nzela." action="Ouvrir mon profil" onAction={() => exitTo('Profil')} /> : savedProperties.length ? <div className="nz2-grid">{savedProperties.map((property) => <PropertyCard key={property.id} property={property} stats={stats[property.id]} saved busy={pendingFavorites.includes(property.id)} onOpen={openProperty} onSave={toggleSave} />)}</div> : <EmptyState title="Aucun logement sauvegardé" body="Appuyez sur le cœur d’une annonce pour la retrouver ici." action="Voir les annonces" onAction={() => requestView('browse', { restore: true })} />}</>
  );

  return createPortal(
    <div className="nz2-root" role="dialog" aria-modal="true" aria-label="Nzela Immobilier" ref={dialogRef} tabIndex={-1}>
      <header className="nz2-header"><div className="nz2-header-inner">
        <button type="button" className="nz2-brand" onClick={() => requestView('browse', { restore: true })}><span><Building2 size={22} /></span><div><strong>Nzela Immobilier</strong><small>Publiez. Cherchez. Contactez.</small></div></button>
        <div className="nz2-header-actions"><button type="button" className="nz2-secondary nz2-desktop-publish" onClick={startPublish}><Plus size={18} /> Publier une annonce</button><button type="button" className="nz2-close" onClick={requestClose} aria-label="Fermer l’immobilier" ref={closeButtonRef}><X size={21} /></button></div>
      </div></header>
      {!online && <div className="nz2-network-banner" role="status"><WifiOff size={17} /> Vous êtes hors ligne. Les annonces déjà chargées restent consultables.</div>}
      <div className="nz2-scroll" ref={scrollRef}>
        <main className="nz2-main">
          <nav className="nz2-tabs" aria-label="Navigation immobilier">
            <button type="button" className={view === 'browse' || view === 'detail' ? 'is-active' : ''} onClick={() => requestView('browse', { restore: true })}><Search size={17} /><span>Rechercher</span></button>
            <button type="button" className={view === 'publish' ? 'is-active' : ''} onClick={startPublish}><Plus size={17} /><span>Publier</span></button>
            <button type="button" className={view === 'mine' ? 'is-active' : ''} onClick={() => requestView('mine')}><Building2 size={17} /><span>Mes annonces</span></button>
            <button type="button" className={view === 'saved' ? 'is-active' : ''} onClick={() => requestView('saved')}><Heart size={17} /><span>Favoris</span></button>
          </nav>
          {view === 'browse' && renderBrowse()}
          {view === 'detail' && renderDetail()}
          {view === 'publish' && renderPublish()}
          {view === 'mine' && renderMine()}
          {view === 'saved' && renderSaved()}
        </main>
      </div>
      <nav className="nz2-bottom-nav" aria-label="Navigation principale Nzela">
        <button type="button" onClick={() => exitTo('Accueil')}><Home size={21} /><span>Accueil</span></button>
        <button type="button" onClick={() => exitTo('Offres')}><Briefcase size={21} /><span>Offres</span></button>
        <button type="button" className="is-active" onClick={() => requestView('browse', { restore: true })}><Building2 size={21} /><span>Immobilier</span></button>
        <button type="button" onClick={() => exitTo('Profil')}><User size={21} /><span>Profil</span></button>
      </nav>
      {report.open && <div className="nz2-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setReport((current) => ({ ...current, open: false }))}><form className="nz2-report-modal nz2-form" onSubmit={submitReport} role="dialog" aria-modal="true" aria-labelledby="nz2-report-title"><div className="nz2-modal-head"><h2 id="nz2-report-title">Signaler l’annonce</h2><button type="button" className="nz2-close" onClick={() => setReport((current) => ({ ...current, open: false }))} aria-label="Fermer le signalement"><X size={20} /></button></div><label><span>Motif</span><select value={report.reason} onChange={(event) => setReport({ ...report, reason: event.target.value })}><option value="fraud">Suspicion d’arnaque</option><option value="already_unavailable">Logement déjà indisponible</option><option value="wrong_price">Prix trompeur</option><option value="stolen_photos">Photos volées</option><option value="prohibited">Contenu interdit</option><option value="other">Autre</option></select></label>{!session?.user && <label><span>Votre e-mail, facultatif</span><input type="email" value={report.email} onChange={(event) => setReport({ ...report, email: event.target.value })} /></label>}<label><span>Précisions</span><textarea maxLength={2000} value={report.details} onChange={(event) => setReport({ ...report, details: event.target.value })} placeholder="Décrivez le problème constaté…" /></label><button className="nz2-primary" type="submit" disabled={reportSubmitting}>{reportSubmitting ? <><Loader2 size={18} className="nz2-spin" /> Envoi…</> : <><Flag size={18} /> Envoyer le signalement</>}</button></form></div>}
      <ConfirmDialog value={confirm} busy={confirmBusy} onCancel={() => setConfirm(null)} onConfirm={runConfirm} />
      {toast && <div className="nz2-toast" role="status" aria-live="polite">{toast}</div>}
    </div>,
    document.body,
  );
}
