const numberFormatter = new Intl.NumberFormat('fr-FR');

export function pluralize(count, singular, plural = `${singular}s`) {
  return Number(count) === 1 ? singular : plural;
}

export function formatCount(count, singular, plural = `${singular}s`) {
  const value = Number(count) || 0;
  return `${numberFormatter.format(value)} ${pluralize(value, singular, plural)}`;
}

export function formatSalary(value) {
  const rawValue = String(value || '').trim();
  if (!rawValue) return 'Salaire à discuter';
  if (/^\d+$/.test(rawValue)) return `${numberFormatter.format(Number(rawValue))} FCFA`;
  return rawValue;
}
