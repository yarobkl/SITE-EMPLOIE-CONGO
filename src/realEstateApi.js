import { hasSupabaseConfig, supabase } from './lib/supabase';
import { getViewerKey } from './viewerIdentity';

export { getViewerKey } from './viewerIdentity';

export const PROPERTY_TYPES = [
  ['room', 'Chambre'],
  ['studio', 'Studio'],
  ['apartment', 'Appartement'],
  ['house', 'Maison'],
  ['villa', 'Villa'],
  ['commercial', 'Local commercial'],
];

export const CONGO_CITIES = ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Nkayi', 'Ouesso', 'Oyo'];

export const PUBLIC_PROPERTY_SELECT = [
  'id',
  'owner_id',
  'title',
  'description',
  'listing_type',
  'property_type',
  'city',
  'district',
  'price',
  'currency',
  'deposit_amount',
  'monthly_charges',
  'rooms',
  'bedrooms',
  'bathrooms',
  'area_sqm',
  'furnished',
  'water_available',
  'electricity_available',
  'parking',
  'fenced',
  'security_available',
  'available_from',
  'whatsapp_available',
  'show_phone',
  'status',
  'moderation_status',
  'published_at',
  'expires_at',
  'created_at',
  'updated_at',
  'property_images(id,storage_path,alt_text,sort_order,is_cover,created_at)',
].join(',');

// Backward-compatible export for the first immobilier implementation.
export const PROPERTY_SELECT = PUBLIC_PROPERTY_SELECT;

export function propertyTypeLabel(value) {
  return PROPERTY_TYPES.find(([key]) => key === value)?.[1] || 'Logement';
}

export function formatPrice(value, listingType = 'rent') {
  const numericValue = Number(value || 0);
  const amount = Number.isFinite(numericValue) ? numericValue.toLocaleString('fr-FR') : '0';
  return `${amount} FCFA${listingType === 'rent' ? '/mois' : ''}`;
}

export function formatRelativeDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diffDays = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
  if (diffDays === 0) return 'Aujourd’hui';
  if (diffDays === 1) return 'Hier';
  if (diffDays < 30) return `Il y a ${diffDays} jours`;
  return date.toLocaleDateString('fr-FR');
}

export function publicImageUrl(path) {
  if (!path || !hasSupabaseConfig || !supabase) return '';
  return supabase.storage.from('property-images').getPublicUrl(path).data.publicUrl || '';
}

export function normalizeProperty(row) {
  const rawImages = Array.isArray(row?.property_images) ? row.property_images : [];
  const images = [...rawImages]
    .sort((a, b) => Number(Boolean(b.is_cover)) - Number(Boolean(a.is_cover)) || Number(a.sort_order || 0) - Number(b.sort_order || 0))
    .map((image) => ({ ...image, url: publicImageUrl(image.storage_path) }));
  const isExpired = row?.status === 'published' && row?.expires_at && new Date(row.expires_at).getTime() <= Date.now();
  return {
    ...row,
    images,
    cover: images[0]?.url || '',
    effective_status: isExpired ? 'expired' : row?.status,
  };
}

export function friendlyError(error, fallback = 'Le service est momentanément indisponible.') {
  const message = String(error?.message || error || '').trim();
  if (!message) return fallback;
  if (/failed to fetch|network|load failed|connexion/i.test(message)) return 'Connexion instable. Vérifiez le réseau puis réessayez.';
  if (/duplicate|unique/i.test(message)) return 'Cette action a déjà été prise en compte.';
  if (/row-level security|permission|not allowed|unauthorized/i.test(message)) return 'Vous n’avez pas l’autorisation d’effectuer cette action.';
  if (/jwt|session|token/i.test(message)) return 'Votre session a expiré. Reconnectez-vous puis réessayez.';
  if (/payload|too large|maximum|size/i.test(message)) return 'Un fichier est trop volumineux pour être envoyé.';
  return message.length > 180 ? fallback : message;
}

export async function fetchPublishedProperties({ limit = 60 } = {}) {
  if (!hasSupabaseConfig || !supabase) return [];
  const safeLimit = Math.max(1, Math.min(Number(limit) || 60, 100));
  const { data, error } = await supabase
    .from('properties')
    .select(PUBLIC_PROPERTY_SELECT)
    .eq('status', 'published')
    .neq('moderation_status', 'blocked')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(safeLimit);
  if (error) throw error;
  return (data || []).map(normalizeProperty);
}

export async function fetchOwnedProperties(ownerId) {
  if (!ownerId || !hasSupabaseConfig || !supabase) return [];
  const { data, error } = await supabase.rpc('get_owned_properties');
  if (error) throw error;
  return (data || []).map(normalizeProperty);
}

export async function fetchPropertyPublicContact(propertyId) {
  if (!propertyId || !hasSupabaseConfig || !supabase) return { contactPhone: '', whatsappAvailable: false };
  const { data, error } = await supabase.rpc('get_property_public_contact', { p_property_id: propertyId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    contactPhone: row?.contact_phone || '',
    whatsappAvailable: Boolean(row?.whatsapp_available),
  };
}

export async function fetchPropertyStats(ids) {
  if (!ids?.length || !hasSupabaseConfig || !supabase) return {};
  const uniqueIds = [...new Set(ids.filter(Boolean))].slice(0, 100);
  if (!uniqueIds.length) return {};
  const { data, error } = await supabase.rpc('get_property_public_stats', { p_property_ids: uniqueIds });
  if (error) throw error;
  return Object.fromEntries((data || []).map((row) => [row.property_id, {
    views: Number(row.view_count || 0),
    favorites: Number(row.favorite_count || 0),
    inquiries: Number(row.inquiry_count || 0),
  }]));
}

export async function recordPropertyView(propertyId) {
  if (!propertyId || !hasSupabaseConfig || !supabase) return 0;
  const { data, error } = await supabase.rpc('record_property_view', {
    p_property_id: propertyId,
    p_session_key: getViewerKey(),
  });
  if (error) throw error;
  return Number(data || 0);
}

export function safeFileExtension(file) {
  const mimeMap = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  return mimeMap[file?.type] || '';
}

export function validatePropertyImages(files, existingCount = 0) {
  const list = Array.from(files || []);
  if (existingCount + list.length > 8) return { ok: false, message: 'Maximum 8 photos par annonce.' };
  for (const file of list) {
    if (!safeFileExtension(file)) return { ok: false, message: 'Formats acceptés : JPG, PNG ou WebP.' };
    if (file.size > 8 * 1024 * 1024) return { ok: false, message: 'Chaque photo doit faire moins de 8 Mo.' };
    if (file.size < 1024) return { ok: false, message: 'Une photo semble vide ou endommagée.' };
  }
  return { ok: true, files: list };
}

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve({ source: image, width: image.naturalWidth, height: image.naturalHeight, cleanup: () => URL.revokeObjectURL(url) });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Photo illisible'));
    };
    image.src = url;
  });
}

async function loadImageSource(file) {
  if (globalThis.createImageBitmap) {
    try {
      const bitmap = await globalThis.createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, cleanup: () => bitmap.close?.() };
    } catch {
      // Safari and older browsers can reject imageOrientation. Fall back to an Image element.
    }
  }
  return loadImageElement(file);
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function optimizePropertyImage(file, { maxDimension = 1800, maxPixels = 12000000, quality = 0.82 } = {}) {
  if (!file || !safeFileExtension(file)) return file;
  let loaded;
  try {
    loaded = await loadImageSource(file);
    const dimensionScale = Math.min(1, maxDimension / Math.max(loaded.width, loaded.height));
    const pixelScale = Math.min(1, Math.sqrt(maxPixels / Math.max(1, loaded.width * loaded.height)));
    const scale = Math.min(dimensionScale, pixelScale);
    if (scale === 1 && file.size <= 1500000) return file;

    const width = Math.max(1, Math.round(loaded.width * scale));
    const height = Math.max(1, Math.round(loaded.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return file;
    context.drawImage(loaded.source, 0, 0, width, height);

    const preferredType = 'image/webp';
    const blob = await canvasToBlob(canvas, preferredType, quality) || await canvasToBlob(canvas, 'image/jpeg', quality);
    if (!blob || (scale === 1 && blob.size >= file.size)) return file;
    const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
    const baseName = String(file.name || 'logement').replace(/\.[^.]+$/, '').slice(0, 80) || 'logement';
    return new File([blob], `${baseName}.${extension}`, { type: blob.type, lastModified: Date.now() });
  } catch {
    return file;
  } finally {
    loaded?.cleanup?.();
  }
}

export async function preparePropertyImages(files, onProgress) {
  const source = Array.from(files || []);
  const prepared = [];
  for (let index = 0; index < source.length; index += 1) {
    prepared.push(await optimizePropertyImage(source[index]));
    onProgress?.(index + 1, source.length);
  }
  return prepared;
}

export function telephoneHref(value) {
  const cleaned = String(value || '').replace(/[^+\d]/g, '');
  return cleaned ? `tel:${cleaned}` : '';
}
