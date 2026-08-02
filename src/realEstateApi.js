import { hasSupabaseConfig, supabase } from './lib/supabase';

export const PROPERTY_TYPES = [
  ['room', 'Chambre'],
  ['studio', 'Studio'],
  ['apartment', 'Appartement'],
  ['house', 'Maison'],
  ['villa', 'Villa'],
  ['commercial', 'Local commercial'],
];

export const CONGO_CITIES = ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Nkayi', 'Ouesso', 'Oyo'];
export const PROPERTY_SELECT = 'id,owner_id,title,description,listing_type,property_type,city,district,address_details,price,currency,deposit_amount,monthly_charges,rooms,bedrooms,bathrooms,area_sqm,furnished,water_available,electricity_available,parking,fenced,security_available,available_from,contact_phone,whatsapp_available,show_phone,status,moderation_status,published_at,expires_at,created_at,updated_at,property_images(id,storage_path,alt_text,sort_order,is_cover,created_at)';

export function getViewerKey() {
  const key = 'nzela.viewer.key';
  try {
    const existing = localStorage.getItem(key);
    if (existing && existing.length >= 16) return existing;
    const next = crypto.randomUUID();
    localStorage.setItem(key, next);
    return next;
  } catch {
    return crypto.randomUUID();
  }
}

export function propertyTypeLabel(value) {
  return PROPERTY_TYPES.find(([key]) => key === value)?.[1] || 'Logement';
}

export function formatPrice(value, listingType = 'rent') {
  const amount = Number(value || 0).toLocaleString('fr-FR');
  return `${amount} FCFA${listingType === 'rent' ? ' / mois' : ''}`;
}

export function formatRelativeDate(value) {
  if (!value) return '';
  const date = new Date(value);
  const diffDays = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
  if (diffDays === 0) return "Aujourd’hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 30) return `Il y a ${diffDays} jours`;
  return date.toLocaleDateString('fr-FR');
}

export function publicImageUrl(path) {
  if (!path || !hasSupabaseConfig || !supabase) return '';
  return supabase.storage.from('property-images').getPublicUrl(path).data.publicUrl || '';
}

export function normalizeProperty(row) {
  const images = [...(row.property_images || [])]
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order)
    .map((image) => ({ ...image, url: publicImageUrl(image.storage_path) }));
  return { ...row, images, cover: images[0]?.url || '' };
}

export async function fetchPublishedProperties() {
  if (!hasSupabaseConfig || !supabase) return [];
  const { data, error } = await supabase
    .from('properties')
    .select(PROPERTY_SELECT)
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizeProperty);
}

export async function fetchOwnedProperties(ownerId) {
  if (!ownerId || !hasSupabaseConfig || !supabase) return [];
  const { data, error } = await supabase
    .from('properties')
    .select(PROPERTY_SELECT)
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizeProperty);
}

export async function fetchPropertyStats(ids) {
  if (!ids?.length || !hasSupabaseConfig || !supabase) return {};
  const { data, error } = await supabase.rpc('get_property_public_stats', { p_property_ids: ids });
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
  }
  return { ok: true, files: list };
}
