export const PLATFORM_PATHS = Object.freeze({
  home: '/',
  jobs: '/offres',
  immobilier: '/immobilier',
  profile: '/profil',
});

export const SCREEN_PATHS = Object.freeze({
  ...PLATFORM_PATHS,
  saved: '/favoris',
  tracking: '/candidatures',
  recruiter: '/recruteur',
  notifications: '/notifications',
  settings: '/parametres',
});

export function getPlatformSectionFromPath(pathname = '/') {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  return Object.entries(PLATFORM_PATHS)
    .find(([, path]) => path === normalizedPath)?.[0] || 'home';
}

export function getScreenFromPath(pathname = '/') {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  return Object.entries(SCREEN_PATHS)
    .find(([, path]) => path === normalizedPath)?.[0] || 'home';
}
