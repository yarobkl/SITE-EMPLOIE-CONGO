import { useEffect } from 'react';

function normalize(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function appendSection(main, key, title, body) {
  if (!main || main.querySelector(`[data-nzela-legal-extension="${key}"]`)) return;
  const section = document.createElement('section');
  section.dataset.nzelaLegalExtension = key;
  section.style.marginTop = '24px';
  const heading = document.createElement('h3');
  heading.textContent = title;
  heading.style.color = '#0f172a';
  heading.style.marginBottom = '6px';
  const paragraph = document.createElement('p');
  paragraph.textContent = body;
  paragraph.style.margin = '0';
  section.append(heading, paragraph);
  const versionLine = Array.from(main.querySelectorAll('p')).find((item) => normalize(item.textContent).startsWith('Version juridique'));
  if (versionLine) main.insertBefore(section, versionLine);
  else main.appendChild(section);
}

export default function RealEstatePrivacyExtension() {
  useEffect(() => {
    const sync = () => {
      const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
      if (!dialog) return;
      const title = normalize(dialog.querySelector('h2')?.textContent);
      const main = dialog.querySelector('main');
      if (title === 'Politique de confidentialité') {
        appendSection(
          main,
          'real-estate-privacy',
          'Annonces immobilières',
          'Nzela traite les informations des logements publiés, leurs photos, ville, quartier, prix, équipements, durée de disponibilité, coordonnées choisies par l’auteur, favoris, signalements et demandes de contact ou de visite. Un identifiant aléatoire pseudonyme sert à compter une consultation unique sans révéler au propriétaire l’identité des visiteurs. Les photos d’annonces publiées sont accessibles publiquement ; les coordonnées non choisies comme publiques et les messages restent soumis aux contrôles d’accès.',
        );
      }
      if (title === "Conditions générales d'utilisation") {
        appendSection(
          main,
          'real-estate-terms',
          'Règles immobilières',
          'Tout particulier ou professionnel peut publier une annonce s’il dispose du droit de proposer le bien et d’utiliser les photos. L’auteur reste responsable de l’exactitude du prix, de la disponibilité et des conditions. Nzela fournit un service de publication et de mise en relation : la plateforme n’est pas l’agence du propriétaire, ne garantit pas le bien et n’encaisse aucun loyer, caution ou acompte dans cette version. Les annonces frauduleuses, dupliquées, discriminatoires ou exigeant un paiement trompeur peuvent être suspendues.',
        );
      }
      if (title === 'Mentions légales') {
        appendSection(
          main,
          'real-estate-notice',
          'Nzela Immobilier',
          'Nzela Immobilier est un module de petites annonces en libre-service permettant aux particuliers et aux professionnels de publier et consulter des logements, puis de se contacter directement. Il ne constitue pas, dans cette version, un service d’encaissement, de séquestre ou de gestion locative.',
        );
      }
    };
    const root = document.getElementById('root');
    const observer = new MutationObserver(sync);
    if (root) observer.observe(root, { childList: true, subtree: true });
    sync();
    return () => observer.disconnect();
  }, []);
  return null;
}
