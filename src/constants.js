export const initialJobs = [
  {
    id: 1,
    company: 'TotalEnergies EP Congo',
    role: 'Ingenieur HSE Senior',
    loc: 'Pointe-Noire',
    type: 'CDI',
    salary: 'Top Range',
    sector: 'Energie',
    description: "Nous recherchons un profil HSE experimente pour accompagner les operations terrain et renforcer la culture securite.",
    requirements: ['5+ ans experience', 'Certification HSE', 'Anglais professionnel'],
    status: 'published',
  },
  {
    id: 2,
    company: 'MTN Congo',
    role: 'Chef de Projet Digital',
    loc: 'Brazzaville',
    type: 'CDD',
    salary: 'Negociable',
    sector: 'Telecom',
    description: 'Pilotage de projets digitaux, coordination produit et suivi des livraisons avec les equipes metier.',
    requirements: ['Gestion agile', 'Budget projet', 'Reporting executif'],
    status: 'published',
  },
  {
    id: 3,
    company: 'BGFIBank Congo',
    role: 'Auditeur Interne',
    loc: 'Brazzaville',
    type: 'CDI',
    salary: 'Attractif',
    sector: 'Banque',
    description: 'Audit des processus, controle interne et accompagnement des plans de remediation.',
    requirements: ['Audit bancaire', 'Rigueur', 'Maitrise Excel'],
    status: 'published',
  },
  {
    id: 4,
    company: 'Airtel Congo',
    role: 'Developpeur Backend',
    loc: 'Pointe-Noire',
    type: 'Hybride',
    salary: 'Expert',
    sector: 'Tech',
    description: 'Developpement et maintenance d APIs pour les services digitaux et les integrations internes.',
    requirements: ['Node.js ou Python', 'APIs REST', 'SQL/NoSQL'],
    status: 'published',
  },
  {
    id: 5,
    company: 'Congo Logistique',
    role: 'Responsable Logistique',
    loc: 'Dolisie',
    type: 'CDI',
    salary: 'Competitif',
    sector: 'Transport',
    description: 'Optimisation des flux, gestion entrepot et coordination transport national.',
    requirements: ['4+ ans logistique', 'WMS', 'Leadership terrain'],
    status: 'published',
  },
];

export const CONGO_CITIES = [
  'Brazzaville',
  'Pointe-Noire',
  'Dolisie',
  'Nkayi',
  'Ouesso',
  'Owando',
  'Oyo',
  'Impfondo',
  'Madingou',
  'Sibiti',
  'Kinkala',
  'Djambala',
  'Gamboma',
  'Mossendjo',
];

export const CONTRACT_TYPES = ['CDI', 'CDD', 'Stage', 'Freelance', 'Hybride'];

export const initialProfile = {
  nom: '',
  prenom: '',
  email: '',
  phone: '',
  city: 'Brazzaville',
  role: 'candidat',
  title: '',
  avatarDataUrl: '',
};

export const MAX_CV_BYTES = 2 * 1024 * 1024;
export const MAX_CV_LABEL = '2 Mo';

export const OAUTH_PROVIDERS = [
  { provider: 'google', label: 'Google' },
  { provider: 'facebook', label: 'Facebook' },
];

export const emptyApplication = {
  nom: '',
  email: '',
  phone: '',
  message: '',
  mode: 'tracked',
  cvName: '',
  cvSize: 0,
  cvType: '',
  cvFile: null,
};

export const emptyJob = { role: '', company: '', loc: 'Brazzaville', type: 'CDI', salary: '', sector: '', description: '' };
