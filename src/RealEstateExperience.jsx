import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
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
  Clock,
  Droplets,
  Eye,
  Flag,
  Heart,
  Home,
  KeyRound,
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
  X,
  Zap,
} from 'lucide-react';
import { hasSupabaseConfig, supabase } from './lib/supabase';
import {
  CONGO_CITIES,
  PROPERTY_SELECT,
  PROPERTY_TYPES,
  fetchOwnedProperties,
  fetchPropertyStats,
  fetchPublishedProperties,
  formatPrice,
  formatRelativeDate,
  normalizeProperty,
  propertyTypeLabel,
  recordPropertyView,
  safeFileExtension,
  validatePropertyImages,
} from './realEstateApi';
import './real-estate-experience.css';

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

function textNodeWithLabel(button) {
  return Array.from(button?.childNodes || []).find((node) => node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim());
}

function updateHash(open) {
  const clean = `${window.location.pathname}${window.location.search}`;
  if (open) {
    if (window.location.hash !== '#immobilier') window.history.pushState({ nzelaImmo: true }, '', `${clean}#immobilier`);
  } else if (window.location.hash === '#immobilier') {
    window.history.replaceState(window.history.state, '', clean);
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

function PropertyCard({ property, stats, saved, onOpen, onSave, ownerMode = false, onEdit, onClose, onRenew, onDelete }) {
  return (
    <article className="nz-immo-card">
      {property.cover ? <img className="nz-immo-card-media" src={property.cover} alt={property.title} /> : (
        <div className="nz-immo-card-placeholder"><Building2 size={48} /></div>
      )}
      {!ownerMode && (
        <button type="button" className={`nz-immo-heart ${saved ? 'is-saved' : ''}`} onClick={() => onSave(property)} aria-label={saved ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
          <Heart size={20} fill={saved ? 'currentColor' : 'none'} />
        </button>
      )}
      <div className="nz-immo-card-body">
        <div className="nz-immo-card-top">
          <div>
            <span className="nz-immo-badge">{propertyTypeLabel(property.property_type)} · {property.listing_type === 'rent' ? 'Location' : 'Vente'}</span>
            <h3 className="nz-immo-card-title" style={{ marginTop: 9 }}>{property.title}</h3>
          </div>
          {ownerMode && <span className="nz-immo-badge">{STATUS_LABELS[property.status] || property.status}</span>}
        </div>
        <p className="nz-immo-price">{formatPrice(property.price, property.listing_type)}</p>
        <p className="nz-immo-location"><MapPin size={15} /> {property.district}, {property.city}</p>
        <div className="nz-immo-meta">
          <span><Eye size={15} /> {stats?.views || 0} consultations</span>
          <span><Heart size={15} /> {stats?.favorites || 0}</span>
          <span><Clock size={15} /> {formatRelativeDate(property.created_at)}</span>
        </div>
        {ownerMode && (
          <div className="nz-immo-stat-row">
            <div className="nz-immo-stat"><strong>{stats?.views || 0}</strong><span>Vues</span></div>
            <div className="nz-immo-stat"><strong>{stats?.favorites || 0}</strong><span>Favoris</span></div>
            <div className="nz-immo-stat"><strong>{stats?.inquiries || 0}</strong><span>Contacts</span></div>
          </div>
        )}
        <div className="nz-immo-card-actions">
          <button type="button" className="nz-immo-primary" onClick={() => onOpen(property)}>Voir l’annonce</button>
          {ownerMode && (
            <>
              <button type="button" className="nz-immo-icon-button" onClick={() => onEdit(property)} aria-label="Modifier"><Pencil size={18} /></button>
              {property.status === 'published' ? (
                <button type="button" className="nz-immo-icon-button" onClick={() => onClose(property)} aria-label="Marquer comme indisponible"><Check size={18} /></button>
              ) : (
                <button type="button" className="nz-immo-icon-button" onClick={() => onRenew(property)} aria-label="Republier"><RefreshCw size={18} /></button>
              )}
              <button type="button" className="nz-immo-icon-button nz-immo-danger" onClick={() => onDelete(property)} aria-label="Supprimer"><Trash2 size={18} /></button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function EmptyState({ title, body, action, onAction }) {
  return (
    <div className="nz-immo-empty">
      <Building2 size={42} />
      <strong>{title}</strong>
      <p>{body}</p>
      {action && <button type="button" className="nz-immo-primary" onClick={onAction}>{action}</button>}
    </div>
  );
}

export default function RealEstateExperience() {
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
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('Toutes');
  const [type, setType] = useState('Tous');
  const [listingType, setListingType] = useState('Tous');
  const [maxPrice, setMaxPrice] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [contact, setContact] = useState({ fullName: '', email: '', phone: '', message: '', requestVisit: false, preferredVisitAt: '' });
  const [report, setReport] = useState({ open: false, reason: 'fraud', details: '', email: '' });
  const toastTimer = useRef(null);

  const notify = useCallback((message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 3600);
  }, []);

  const openModule = useCallback(() => {
    setOpen(true);
    setView('browse');
    updateHash(true);
  }, []);

  const closeModule = useCallback(() => {
    setOpen(false);
    setSelected(null);
    setView('browse');
    updateHash(false);
  }, []);

  const exitTo = useCallback((label) => {
    closeModule();
    window.setTimeout(() => findNativeButton(label)?.click(), 30);
  }, [closeModule]);

  useEffect(() => {
    const onHash = () => setOpen(window.location.hash === '#immobilier');
    window.addEventListener('hashchange', onHash);
    window.addEventListener('popstate', onHash);
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('popstate', onHash);
    };
  }, []);

  useEffect(() => {
    const syncNavigation = () => {
      const mobileNav = document.querySelector('nav[aria-label="Navigation mobile"]');
      const mobileButtons = mobileNav?.querySelectorAll('button');
      if (mobileButtons?.length >= 4) {
        const target = mobileButtons[2];
        target.classList.add('nzela-immo-nav-button');
        target.dataset.nzImmoNav = 'true';
        target.setAttribute('aria-label', 'Navigation Immobilier');
        const textNode = textNodeWithLabel(target);
        if (textNode) textNode.nodeValue = 'Immobilier';
      }
      const desktopNav = document.querySelector('header nav[aria-label="Navigation principale"]');
      if (desktopNav && !desktopNav.querySelector('[data-nz-immo-nav]')) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'header-link';
        button.dataset.nzImmoNav = 'true';
        button.textContent = 'Immobilier';
        const first = desktopNav.querySelector('button');
        first?.insertAdjacentElement('afterend', button);
      }
    };
    const capture = (event) => {
      const target = event.target instanceof Element ? event.target.closest('[data-nz-immo-nav],.nzela-immo-nav-button') : null;
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openModule();
    };
    const observer = new MutationObserver(syncNavigation);
    const root = document.getElementById('root');
    if (root) observer.observe(root, { childList: true, subtree: true });
    document.addEventListener('click', capture, true);
    syncNavigation();
    return () => {
      observer.disconnect();
      document.removeEventListener('click', capture, true);
    };
  }, [openModule]);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) return undefined;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session || null);
    });
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
    supabase.from('profiles').select('nom,prenom,email,phone,city').eq('id', session.user.id).maybeSingle().then(({ data }) => {
      setProfile(data || null);
      setContact((current) => ({
        ...current,
        fullName: current.fullName || `${data?.prenom || ''} ${data?.nom || ''}`.trim(),
        email: current.email || data?.email || session.user.email || '',
        phone: current.phone || data?.phone || '',
      }));
      setForm((current) => ({ ...current, contactPhone: current.contactPhone || data?.phone || '' }));
    });
  }, [session]);

  const loadData = useCallback(async () => {
    if (!open || !hasSupabaseConfig || !supabase) return;
    setLoading(true);
    try {
      const [publicRows, ownerRows] = await Promise.all([
        fetchPublishedProperties(),
        session?.user ? fetchOwnedProperties(session.user.id) : Promise.resolve([]),
      ]);
      setProperties(publicRows);
      setOwnedProperties(ownerRows);
      const allIds = [...new Set([...publicRows, ...ownerRows].map((item) => item.id))];
      setStats(await fetchPropertyStats(allIds));
      if (session?.user) {
        const [{ data: savedRows }, { data: inquiryRows }] = await Promise.all([
          supabase.from('saved_properties').select('property_id').eq('user_id', session.user.id),
          supabase.from('property_inquiries').select('id,property_id,sender_id,full_name,email,phone,message,request_visit,preferred_visit_at,status,created_at,properties(id,title,owner_id)').order('created_at', { ascending: false }),
        ]);
        setSavedIds((savedRows || []).map((item) => item.property_id));
        setInquiries((inquiryRows || []).filter((item) => item.properties?.owner_id === session.user.id));
      } else {
        setSavedIds([]);
        setInquiries([]);
      }
    } catch (error) {
      notify(`Immobilier indisponible : ${error.message || 'erreur de chargement'}`);
    } finally {
      setLoading(false);
    }
  }, [notify, open, session]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

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

  const openProperty = useCallback(async (property) => {
    setSelected(property);
    setActiveImage(0);
    setView('detail');
    window.scrollTo({ top: 0 });
    try {
      const views = await recordPropertyView(property.id);
      setStats((current) => ({ ...current, [property.id]: { ...(current[property.id] || {}), views } }));
    } catch {
      // The listing remains usable if the anonymous counter is unavailable.
    }
  }, []);

  const requireAccount = useCallback((message) => {
    notify(message);
    window.setTimeout(() => exitTo('Profil'), 700);
  }, [exitTo, notify]);

  const toggleSave = useCallback(async (property) => {
    if (!session?.user || !supabase) {
      requireAccount('Connectez-vous pour sauvegarder cette annonce.');
      return;
    }
    const saved = savedIds.includes(property.id);
    const result = saved
      ? await supabase.from('saved_properties').delete().eq('property_id', property.id).eq('user_id', session.user.id)
      : await supabase.from('saved_properties').insert({ property_id: property.id, user_id: session.user.id });
    if (result.error) {
      notify(`Favori non modifié : ${result.error.message}`);
      return;
    }
    setSavedIds((current) => saved ? current.filter((id) => id !== property.id) : [...current, property.id]);
    setStats((current) => ({
      ...current,
      [property.id]: {
        ...(current[property.id] || {}),
        favorites: Math.max(0, Number(current[property.id]?.favorites || 0) + (saved ? -1 : 1)),
      },
    }));
    notify(saved ? 'Annonce retirée des favoris.' : 'Annonce sauvegardée.');
  }, [notify, requireAccount, savedIds, session]);

  const selectFiles = useCallback((event) => {
    const validation = validatePropertyImages(event.target.files, editingId ? (ownedProperties.find((item) => item.id === editingId)?.images.length || 0) : 0);
    if (!validation.ok) {
      notify(validation.message);
      event.target.value = '';
      return;
    }
    previews.forEach((url) => URL.revokeObjectURL(url));
    setFiles(validation.files);
    setPreviews(validation.files.map((file) => URL.createObjectURL(file)));
  }, [editingId, notify, ownedProperties, previews]);

  const resetForm = useCallback(() => {
    previews.forEach((url) => URL.revokeObjectURL(url));
    setForm({ ...EMPTY_FORM, contactPhone: profile?.phone || '' });
    setFiles([]);
    setPreviews([]);
    setEditingId('');
  }, [previews, profile]);

  const startPublish = useCallback(() => {
    if (!session?.user) {
      requireAccount('Connectez-vous pour publier gratuitement un logement.');
      return;
    }
    resetForm();
    setView('publish');
    window.scrollTo({ top: 0 });
  }, [requireAccount, resetForm, session]);

  const startEdit = useCallback((property) => {
    setEditingId(property.id);
    setFiles([]);
    setPreviews([]);
    setForm({
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
      contactPhone: property.contact_phone || '',
      whatsappAvailable: Boolean(property.whatsapp_available),
      showPhone: Boolean(property.show_phone),
    });
    setView('publish');
    window.scrollTo({ top: 0 });
  }, []);

  const submitProperty = useCallback(async (event) => {
    event.preventDefault();
    if (!session?.user || !supabase || submitting) return;
    const existingImages = editingId ? (ownedProperties.find((item) => item.id === editingId)?.images.length || 0) : 0;
    if (!editingId && files.length === 0) {
      notify('Ajoutez au moins une vraie photo du logement.');
      return;
    }
    if (existingImages + files.length > 8) {
      notify('Maximum 8 photos par annonce.');
      return;
    }
    setSubmitting(true);
    const propertyId = editingId || crypto.randomUUID();
    const payload = {
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
      status: 'published',
    };
    try {
      const saved = editingId
        ? await supabase.from('properties').update(payload).eq('id', propertyId).eq('owner_id', session.user.id).select('id').single()
        : await supabase.from('properties').insert({ id: propertyId, ...payload }).select('id').single();
      if (saved.error) throw saved.error;

      const imageRows = [];
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const extension = safeFileExtension(file);
        const path = `${session.user.id}/${propertyId}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from('property-images').upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        imageRows.push({
          property_id: propertyId,
          owner_id: session.user.id,
          storage_path: path,
          alt_text: `${form.title.trim()} - photo ${existingImages + index + 1}`,
          sort_order: existingImages + index,
          is_cover: existingImages === 0 && index === 0,
        });
      }
      if (imageRows.length) {
        const { error: imageError } = await supabase.from('property_images').insert(imageRows);
        if (imageError) throw imageError;
      }
      notify(editingId ? 'Annonce immobilière mise à jour.' : 'Annonce publiée pour 30 jours.');
      resetForm();
      setView('mine');
      await loadData();
    } catch (error) {
      notify(`Publication impossible : ${error.message || 'service indisponible'}`);
    } finally {
      setSubmitting(false);
    }
  }, [editingId, files, form, loadData, notify, ownedProperties, resetForm, session, submitting]);

  const closeProperty = useCallback(async (property) => {
    const nextStatus = property.listing_type === 'sale' ? 'sold' : 'rented';
    const { error } = await supabase.from('properties').update({ status: nextStatus }).eq('id', property.id).eq('owner_id', session.user.id);
    if (error) return notify(`Statut non modifié : ${error.message}`);
    notify(nextStatus === 'sold' ? 'Annonce marquée comme vendue.' : 'Annonce marquée comme louée.');
    loadData();
  }, [loadData, notify, session]);

  const renewProperty = useCallback(async (property) => {
    const { error } = await supabase.from('properties').update({ status: 'published', expires_at: new Date(Date.now() + 30 * 86400000).toISOString() }).eq('id', property.id).eq('owner_id', session.user.id);
    if (error) return notify(`Annonce non republiée : ${error.message}`);
    notify('Annonce republiée pour 30 jours.');
    loadData();
  }, [loadData, notify, session]);

  const deleteProperty = useCallback(async (property) => {
    if (!window.confirm(`Supprimer définitivement « ${property.title} » ?`)) return;
    const paths = property.images.map((image) => image.storage_path).filter(Boolean);
    if (paths.length) await supabase.storage.from('property-images').remove(paths);
    const { error } = await supabase.from('properties').delete().eq('id', property.id).eq('owner_id', session.user.id);
    if (error) return notify(`Suppression impossible : ${error.message}`);
    notify('Annonce supprimée.');
    if (selected?.id === property.id) setSelected(null);
    loadData();
  }, [loadData, notify, selected, session]);

  const submitInquiry = useCallback(async (event) => {
    event.preventDefault();
    if (!selected || !supabase) return;
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
    if (error) return notify(`Demande non envoyée : ${error.message}`);
    setContact((current) => ({ ...current, message: '', requestVisit: false, preferredVisitAt: '' }));
    setStats((current) => ({ ...current, [selected.id]: { ...(current[selected.id] || {}), inquiries: Number(current[selected.id]?.inquiries || 0) + 1 } }));
    notify('Votre demande a été envoyée directement au propriétaire.');
  }, [contact, notify, selected, session]);

  const submitReport = useCallback(async (event) => {
    event.preventDefault();
    if (!selected || !supabase) return;
    const { error } = await supabase.from('property_reports').insert({
      property_id: selected.id,
      reporter_id: session?.user?.id || null,
      reporter_email: report.email.trim() || session?.user?.email || null,
      reason: report.reason,
      details: report.details.trim() || null,
    });
    if (error) return notify(`Signalement non envoyé : ${error.message}`);
    setReport({ open: false, reason: 'fraud', details: '', email: '' });
    notify('Signalement transmis à la modération.');
  }, [notify, report, selected, session]);

  const updateInquiry = useCallback(async (inquiry, status) => {
    const { error } = await supabase.from('property_inquiries').update({ status }).eq('id', inquiry.id);
    if (error) return notify(`Demande non mise à jour : ${error.message}`);
    setInquiries((current) => current.map((item) => item.id === inquiry.id ? { ...item, status } : item));
    notify('Demande mise à jour.');
  }, [notify]);

  if (!open) return null;

  const renderBrowse = () => (
    <>
      <section className="nz-immo-hero">
        <p className="nz-immo-kicker">Nzela Immobilier</p>
        <h1>Trouvez ou publiez un logement simplement</h1>
        <p>Particulier ou professionnel : publiez directement une chambre, un studio, un appartement ou une maison. Aucun passage obligatoire par une agence.</p>
        <div className="nz-immo-quick-actions">
          <button type="button" className="nz-immo-primary" onClick={startPublish}><Plus size={18} /> Publier gratuitement</button>
          <button type="button" className="nz-immo-secondary" onClick={() => setView('mine')}><Building2 size={18} /> Mes annonces</button>
          <button type="button" className="nz-immo-secondary" onClick={() => setView('saved')}><Bookmark size={18} /> Mes favoris</button>
        </div>
      </section>

      <section className="nz-immo-filter-card">
        <div className="nz-immo-search"><Search size={19} /><input className="nz-immo-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Quartier, ville, type de logement…" /></div>
        <div className="nz-immo-filter-grid">
          <select className="nz-immo-select" value={city} onChange={(event) => setCity(event.target.value)}><option>Toutes</option>{CONGO_CITIES.map((item) => <option key={item}>{item}</option>)}</select>
          <select className="nz-immo-select" value={type} onChange={(event) => setType(event.target.value)}><option value="Tous">Tous les biens</option>{PROPERTY_TYPES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
          <select className="nz-immo-select" value={listingType} onChange={(event) => setListingType(event.target.value)}><option value="Tous">Location et vente</option><option value="rent">Location</option><option value="sale">Vente</option></select>
          <input className="nz-immo-input" inputMode="numeric" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value.replace(/\D/g, ''))} placeholder="Budget maximum FCFA" />
        </div>
      </section>

      <div className="nz-immo-section-head"><div><h2>Annonces disponibles</h2><p>{filteredProperties.length} annonce{filteredProperties.length > 1 ? 's' : ''} active{filteredProperties.length > 1 ? 's' : ''}</p></div><SlidersHorizontal size={20} /></div>
      {loading ? <EmptyState title="Chargement des logements" body="Connexion aux annonces en cours…" /> : filteredProperties.length ? (
        <div className="nz-immo-grid">{filteredProperties.map((property) => <PropertyCard key={property.id} property={property} stats={stats[property.id]} saved={savedIds.includes(property.id)} onOpen={openProperty} onSave={toggleSave} />)}</div>
      ) : <EmptyState title="Aucun logement trouvé" body="Modifiez les filtres ou publiez la première annonce de ce quartier." action="Publier une annonce" onAction={startPublish} />}
    </>
  );

  const renderDetail = () => {
    if (!selected) return <EmptyState title="Annonce introuvable" body="Retournez à la liste immobilière." action="Voir les annonces" onAction={() => setView('browse')} />;
    const currentImage = selected.images[activeImage]?.url || selected.cover;
    const features = [
      [BedDouble, `${selected.rooms} pièce${selected.rooms > 1 ? 's' : ''}`],
      [BedDouble, `${selected.bedrooms} chambre${selected.bedrooms > 1 ? 's' : ''}`],
      [Bath, `${selected.bathrooms} salle${selected.bathrooms > 1 ? 's' : ''} d’eau`],
      [Ruler, selected.area_sqm ? `${selected.area_sqm} m²` : 'Surface non précisée'],
      [Droplets, selected.water_available ? 'Eau disponible' : 'Eau non précisée'],
      [Zap, selected.electricity_available ? 'Électricité disponible' : 'Électricité non précisée'],
      [Car, selected.parking ? 'Parking' : 'Sans parking précisé'],
      [ShieldCheck, selected.security_available ? 'Sécurité / gardiennage' : 'Sécurité non précisée'],
    ];
    return (
      <>
        <button type="button" className="nz-immo-secondary" onClick={() => setView('browse')}><ArrowLeft size={18} /> Retour aux annonces</button>
        <div className="nz-immo-detail" style={{ marginTop: 16 }}>
          <div>
            <div className="nz-immo-gallery">
              {currentImage ? <img className="nz-immo-gallery-main" src={currentImage} alt={selected.title} /> : <div className="nz-immo-card-placeholder nz-immo-gallery-main"><Building2 size={60} /></div>}
              {selected.images.length > 1 && <div className="nz-immo-thumbs">{selected.images.map((image, index) => <img key={image.id} src={image.url} alt={image.alt_text || selected.title} className={`nz-immo-thumb ${index === activeImage ? 'is-active' : ''}`} onClick={() => setActiveImage(index)} />)}</div>}
            </div>
            <article className="nz-immo-detail-card" style={{ marginTop: 14 }}>
              <span className="nz-immo-badge">{propertyTypeLabel(selected.property_type)} · {selected.listing_type === 'rent' ? 'Location' : 'Vente'}</span>
              <h1 className="nz-immo-detail-title" style={{ marginTop: 12 }}>{selected.title}</h1>
              <p className="nz-immo-location" style={{ marginTop: 10 }}><MapPin size={17} /> {selected.district}, {selected.city}</p>
              <p className="nz-immo-detail-price">{formatPrice(selected.price, selected.listing_type)}</p>
              <div className="nz-immo-meta"><span><Eye size={16} /> {stats[selected.id]?.views || 0} consultations</span><span><Heart size={16} /> {stats[selected.id]?.favorites || 0} favoris</span><span><CalendarDays size={16} /> {formatRelativeDate(selected.created_at)}</span></div>
              <div className="nz-immo-feature-grid">{features.map(([Icon, label]) => <div key={label} className="nz-immo-feature"><Icon size={19} /> {label}</div>)}</div>
              <h2 style={{ marginTop: 26 }}>Description</h2><p className="nz-immo-description">{selected.description}</p>
              {selected.deposit_amount > 0 && <p><strong>Caution / avance :</strong> {Number(selected.deposit_amount).toLocaleString('fr-FR')} FCFA</p>}
              {selected.monthly_charges > 0 && <p><strong>Charges :</strong> {Number(selected.monthly_charges).toLocaleString('fr-FR')} FCFA</p>}
              {selected.available_from && <p><strong>Disponible à partir du :</strong> {new Date(selected.available_from).toLocaleDateString('fr-FR')}</p>}
              <div className="nz-immo-quick-actions">
                <button type="button" className="nz-immo-secondary" onClick={() => toggleSave(selected)}><Heart size={18} fill={savedIds.includes(selected.id) ? 'currentColor' : 'none'} /> {savedIds.includes(selected.id) ? 'Sauvegardée' : 'Sauvegarder'}</button>
                <button type="button" className="nz-immo-secondary" onClick={() => setReport((current) => ({ ...current, open: true }))}><Flag size={18} /> Signaler</button>
              </div>
            </article>
          </div>
          <aside className="nz-immo-detail-card nz-immo-contact-box">
            <h2 style={{ marginTop: 0 }}>Contacter directement</h2>
            <p style={{ color: '#64748b', lineHeight: 1.6 }}>Votre demande est envoyée au propriétaire ou à l’auteur de l’annonce, sans agence obligatoire.</p>
            {selected.show_phone && selected.contact_phone && <a className="nz-immo-secondary" style={{ width: '100%', textDecoration: 'none', marginBottom: 12 }} href={`tel:${selected.contact_phone}`}><Phone size={18} /> {selected.contact_phone}</a>}
            <form className="nz-immo-form" onSubmit={submitInquiry}>
              <input className="nz-immo-input" required value={contact.fullName} onChange={(event) => setContact({ ...contact, fullName: event.target.value })} placeholder="Nom complet" />
              <input className="nz-immo-input" type="email" value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} placeholder="Adresse e-mail" />
              <input className="nz-immo-input" type="tel" value={contact.phone} onChange={(event) => setContact({ ...contact, phone: event.target.value })} placeholder="Téléphone" />
              <textarea className="nz-immo-textarea" required value={contact.message} onChange={(event) => setContact({ ...contact, message: event.target.value })} placeholder="Bonjour, ce logement est-il toujours disponible ?" />
              <label className="nz-immo-check"><input type="checkbox" checked={contact.requestVisit} onChange={(event) => setContact({ ...contact, requestVisit: event.target.checked })} /> Demander une visite</label>
              {contact.requestVisit && <input className="nz-immo-input" type="datetime-local" value={contact.preferredVisitAt} onChange={(event) => setContact({ ...contact, preferredVisitAt: event.target.value })} />}
              <button className="nz-immo-primary" type="submit"><MessageCircle size={18} /> Envoyer la demande</button>
            </form>
          </aside>
        </div>
      </>
    );
  };

  const renderPublish = () => (
    <>
      <button type="button" className="nz-immo-secondary" onClick={() => { resetForm(); setView('mine'); }}><ArrowLeft size={18} /> Annuler</button>
      <div className="nz-immo-section-head"><div><h2>{editingId ? 'Modifier le logement' : 'Publier un logement'}</h2><p>Annonce en libre-service, visible pendant 30 jours.</p></div><Camera size={22} /></div>
      <form className="nz-immo-form nz-immo-detail-card" onSubmit={submitProperty}>
        <div className="nz-immo-form-grid">
          <div className="nz-immo-field"><label>Titre de l’annonce</label><input className="nz-immo-input" required minLength={5} maxLength={140} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Appartement 2 chambres à Moungali" /></div>
          <div className="nz-immo-field"><label>Type de publication</label><select className="nz-immo-select" value={form.listingType} onChange={(event) => setForm({ ...form, listingType: event.target.value })}><option value="rent">Location</option><option value="sale">Vente</option></select></div>
          <div className="nz-immo-field"><label>Type de bien</label><select className="nz-immo-select" value={form.propertyType} onChange={(event) => setForm({ ...form, propertyType: event.target.value })}>{PROPERTY_TYPES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
          <div className="nz-immo-field"><label>Ville</label><select className="nz-immo-select" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })}>{CONGO_CITIES.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="nz-immo-field"><label>Quartier</label><input className="nz-immo-input" required value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value })} placeholder="Ex. Moungali" /></div>
          <div className="nz-immo-field"><label>Adresse ou repère facultatif</label><input className="nz-immo-input" value={form.addressDetails} onChange={(event) => setForm({ ...form, addressDetails: event.target.value })} placeholder="À proximité de…" /></div>
        </div>
        <div className="nz-immo-form-grid three">
          <div className="nz-immo-field"><label>Prix en FCFA</label><input className="nz-immo-input" required min="1" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></div>
          <div className="nz-immo-field"><label>Caution / avance</label><input className="nz-immo-input" min="0" type="number" value={form.depositAmount} onChange={(event) => setForm({ ...form, depositAmount: event.target.value })} /></div>
          <div className="nz-immo-field"><label>Charges mensuelles</label><input className="nz-immo-input" min="0" type="number" value={form.monthlyCharges} onChange={(event) => setForm({ ...form, monthlyCharges: event.target.value })} /></div>
          <div className="nz-immo-field"><label>Nombre de pièces</label><input className="nz-immo-input" min="1" max="50" type="number" value={form.rooms} onChange={(event) => setForm({ ...form, rooms: event.target.value })} /></div>
          <div className="nz-immo-field"><label>Chambres</label><input className="nz-immo-input" min="0" max="30" type="number" value={form.bedrooms} onChange={(event) => setForm({ ...form, bedrooms: event.target.value })} /></div>
          <div className="nz-immo-field"><label>Salles d’eau</label><input className="nz-immo-input" min="0" max="20" type="number" value={form.bathrooms} onChange={(event) => setForm({ ...form, bathrooms: event.target.value })} /></div>
          <div className="nz-immo-field"><label>Surface en m²</label><input className="nz-immo-input" min="1" type="number" value={form.areaSqm} onChange={(event) => setForm({ ...form, areaSqm: event.target.value })} /></div>
          <div className="nz-immo-field"><label>Disponible à partir du</label><input className="nz-immo-input" type="date" value={form.availableFrom} onChange={(event) => setForm({ ...form, availableFrom: event.target.value })} /></div>
          <div className="nz-immo-field"><label>Téléphone de contact</label><input className="nz-immo-input" type="tel" value={form.contactPhone} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} /></div>
        </div>
        <div><span className="nz-immo-label">Équipements et conditions</span><div className="nz-immo-checks">
          {[
            ['furnished', 'Meublé'], ['waterAvailable', 'Eau disponible'], ['electricityAvailable', 'Électricité'], ['parking', 'Parking'], ['fenced', 'Parcelle clôturée'], ['securityAvailable', 'Gardiennage'], ['whatsappAvailable', 'WhatsApp'], ['showPhone', 'Afficher mon numéro'],
          ].map(([key, label]) => <label key={key} className="nz-immo-check"><input type="checkbox" checked={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.checked })} /> {label}</label>)}
        </div></div>
        <div className="nz-immo-field"><label>Description complète</label><textarea className="nz-immo-textarea" required minLength={20} maxLength={5000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Décrivez l’état du logement, l’accès, les conditions et les équipements…" /></div>
        <label className="nz-immo-upload"><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectFiles} /><Upload size={27} /><strong style={{ display: 'block', marginTop: 8 }}>Ajouter des photos réelles</strong><span style={{ color: '#64748b', fontSize: 13 }}>Jusqu’à 8 photos, 8 Mo maximum chacune.</span></label>
        {previews.length > 0 && <div className="nz-immo-preview-grid">{previews.map((url) => <img key={url} className="nz-immo-preview" src={url} alt="Aperçu du logement" />)}</div>}
        {editingId && <p style={{ color: '#64748b', fontSize: 13 }}>Les nouvelles photos s’ajoutent aux photos déjà publiées.</p>}
        <label className="nz-immo-check"><input type="checkbox" required /> Je confirme que l’annonce est exacte, que j’ai le droit de publier ces photos et qu’aucun paiement anticipé trompeur n’est demandé.</label>
        <button className="nz-immo-primary" type="submit" disabled={submitting}>{submitting ? 'Publication en cours…' : editingId ? 'Enregistrer les modifications' : 'Publier pendant 30 jours'}</button>
      </form>
    </>
  );

  const renderMine = () => (
    <>
      <div className="nz-immo-section-head"><div><h2>Mes annonces immobilières</h2><p>Vues, favoris, contacts et disponibilité.</p></div><button type="button" className="nz-immo-primary" onClick={startPublish}><Plus size={18} /> Publier</button></div>
      {!session?.user ? <EmptyState title="Connectez-vous" body="Votre compte Nzela permet de publier et gérer vos logements." action="Ouvrir mon profil" onAction={() => exitTo('Profil')} /> : ownedProperties.length ? (
        <div className="nz-immo-dashboard-grid">{ownedProperties.map((property) => <PropertyCard key={property.id} property={property} stats={stats[property.id]} ownerMode onOpen={openProperty} onEdit={startEdit} onClose={closeProperty} onRenew={renewProperty} onDelete={deleteProperty} />)}</div>
      ) : <EmptyState title="Aucune annonce publiée" body="Une chambre, un studio ou une maison disponible peut être mis en ligne en quelques minutes." action="Publier un logement" onAction={startPublish} />}
      {session?.user && <><div className="nz-immo-section-head"><div><h2>Demandes reçues</h2><p>{inquiries.length} contact{inquiries.length > 1 ? 's' : ''} reçu{inquiries.length > 1 ? 's' : ''}</p></div><MessageCircle size={21} /></div>{inquiries.length ? <div className="nz-immo-dashboard-grid">{inquiries.map((item) => <article key={item.id} className="nz-immo-inquiry"><span className="nz-immo-badge">{item.status === 'new' ? 'Nouvelle demande' : item.status}</span><h3>{item.full_name} · {item.properties?.title}</h3><p>{item.message}</p><div className="nz-immo-meta">{item.phone && <span><Phone size={15} /> {item.phone}</span>}{item.email && <span>{item.email}</span>}{item.request_visit && <span><CalendarDays size={15} /> Visite demandée</span>}</div><div className="nz-immo-card-actions"><button type="button" className="nz-immo-secondary" onClick={() => updateInquiry(item, 'contacted')}>Marquer contactée</button><button type="button" className="nz-immo-secondary" onClick={() => updateInquiry(item, 'closed')}>Clôturer</button></div></article>)}</div> : <EmptyState title="Aucune demande reçue" body="Les messages envoyés depuis vos annonces apparaîtront ici." />}</>}
    </>
  );

  const renderSaved = () => (
    <><div className="nz-immo-section-head"><div><h2>Logements sauvegardés</h2><p>Retrouvez rapidement vos annonces préférées.</p></div><Heart size={21} /></div>{!session?.user ? <EmptyState title="Connectez-vous" body="La sauvegarde des logements est liée à votre compte Nzela." action="Ouvrir mon profil" onAction={() => exitTo('Profil')} /> : savedProperties.length ? <div className="nz-immo-grid">{savedProperties.map((property) => <PropertyCard key={property.id} property={property} stats={stats[property.id]} saved onOpen={openProperty} onSave={toggleSave} />)}</div> : <EmptyState title="Aucun logement sauvegardé" body="Appuyez sur le cœur d’une annonce pour la retrouver ici." action="Voir les annonces" onAction={() => setView('browse')} />}</>
  );

  return (
    <div className="nz-immo-root" role="dialog" aria-modal="true" aria-label="Nzela Immobilier">
      <div className="nz-immo-shell">
        <header className="nz-immo-header"><div className="nz-immo-header-inner">
          <button type="button" className="nz-immo-brand" style={{ border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left' }} onClick={() => setView('browse')}><span className="nz-immo-brand-mark"><Building2 size={23} /></span><span><strong>Nzela Immobilier</strong><span>Publiez. Cherchez. Contactez.</span></span></button>
          <div className="nz-immo-header-actions"><button type="button" className="nz-immo-secondary" onClick={startPublish}><Plus size={18} /> Publier une annonce</button><button type="button" className="nz-immo-icon-button" onClick={closeModule} aria-label="Fermer l’immobilier"><X size={21} /></button></div>
        </div></header>
        <main className="nz-immo-main">
          <nav className="nz-immo-tabs" aria-label="Navigation immobilier">
            <button type="button" className={`nz-immo-tab ${view === 'browse' || view === 'detail' ? 'is-active' : ''}`} onClick={() => setView('browse')}><Search size={16} /> Rechercher</button>
            <button type="button" className={`nz-immo-tab ${view === 'publish' ? 'is-active' : ''}`} onClick={startPublish}><Plus size={16} /> Publier</button>
            <button type="button" className={`nz-immo-tab ${view === 'mine' ? 'is-active' : ''}`} onClick={() => setView('mine')}><Building2 size={16} /> Mes annonces</button>
            <button type="button" className={`nz-immo-tab ${view === 'saved' ? 'is-active' : ''}`} onClick={() => setView('saved')}><Heart size={16} /> Favoris</button>
          </nav>
          {view === 'browse' && renderBrowse()}
          {view === 'detail' && renderDetail()}
          {view === 'publish' && renderPublish()}
          {view === 'mine' && renderMine()}
          {view === 'saved' && renderSaved()}
        </main>
      </div>
      <nav className="nz-immo-bottom-nav" aria-label="Navigation principale Nzela">
        <button type="button" onClick={() => exitTo('Accueil')}><Home size={21} />Accueil</button>
        <button type="button" onClick={() => exitTo('Offres')}><Briefcase size={21} />Offres</button>
        <button type="button" className="is-active" onClick={() => setView('browse')}><Building2 size={21} />Immobilier</button>
        <button type="button" onClick={() => exitTo('Profil')}><User size={21} />Profil</button>
      </nav>
      {report.open && <div className="nz-immo-modal-backdrop"><form className="nz-immo-modal nz-immo-form" onSubmit={submitReport}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 style={{ margin: 0 }}>Signaler l’annonce</h2><button type="button" className="nz-immo-icon-button" onClick={() => setReport({ ...report, open: false })}><X size={20} /></button></div><select className="nz-immo-select" value={report.reason} onChange={(event) => setReport({ ...report, reason: event.target.value })}><option value="fraud">Suspicion d’arnaque</option><option value="already_unavailable">Logement déjà indisponible</option><option value="wrong_price">Prix trompeur</option><option value="stolen_photos">Photos volées</option><option value="prohibited">Contenu interdit</option><option value="other">Autre</option></select>{!session?.user && <input className="nz-immo-input" type="email" value={report.email} onChange={(event) => setReport({ ...report, email: event.target.value })} placeholder="Votre e-mail facultatif" />}<textarea className="nz-immo-textarea" value={report.details} onChange={(event) => setReport({ ...report, details: event.target.value })} placeholder="Précisez le problème…" /><button className="nz-immo-primary" type="submit"><Flag size={18} /> Envoyer le signalement</button></form></div>}
      {toast && <div className="nz-immo-toast" role="status">{toast}</div>}
    </div>
  );
}
