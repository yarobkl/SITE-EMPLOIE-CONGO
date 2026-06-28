export function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

export function getInitials(profile) {
  const letters = [profile.prenom, profile.nom]
    .filter(Boolean)
    .map((value) => value.trim().charAt(0))
    .join('');
  return (letters || profile.email?.charAt(0) || 'U').slice(0, 2).toUpperCase();
}

export function normalizeJob(row) {
  return {
    id: row.id,
    companyId: row.company_id,
    company: row.companies?.name || row.company || 'Entreprise',
    role: row.title || row.role,
    loc: row.location || row.loc,
    type: row.contract_type || row.type,
    salary: row.salary_range || row.salary,
    sector: row.sector || 'General',
    description: row.description,
    requirements: row.requirements?.length ? row.requirements : ['Experience pertinente', 'Disponibilite', 'Motivation'],
    status: row.status || 'published',
  };
}

export function normalizeApplication(row) {
  return {
    id: row.id,
    jobId: row.job_id,
    jobRole: row.jobs?.title || 'Offre',
    company: row.jobs?.companies?.name || 'Entreprise',
    status: row.status,
    trackingEnabled: row.tracking_enabled,
    applicationOpened: row.application_opened,
    cvOpened: row.cv_opened,
    createdAt: row.created_at,
    cvPath: row.cv_url,
    cvName: row.cv_name,
    cvSize: row.cv_size,
    candidateId: row.candidate_id,
    nom: row.nom,
    email: row.email,
    phone: row.phone,
    message: row.message || '',
  };
}

export function normalizeNotification(row) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    read: row.read,
    createdAt: row.created_at,
  };
}
