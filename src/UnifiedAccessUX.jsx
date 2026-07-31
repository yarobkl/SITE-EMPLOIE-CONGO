import { useEffect } from 'react';

function cleanText(element) {
  return element?.textContent?.replace(/\s+/g, ' ').trim() || '';
}

export default function UnifiedAccessUX() {
  useEffect(() => {
    let animationFrame = 0;

    const applyUnifiedAccess = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        // L'accès recruteur n'est plus affiché comme une navigation séparée.
        document.querySelectorAll('header nav button').forEach((button) => {
          if (cleanText(button) === 'Espace recruteur') {
            button.hidden = true;
            button.setAttribute('aria-hidden', 'true');
            button.tabIndex = -1;
          }
        });

        // Une seule interface de connexion, quel que soit le parcours d'entrée.
        const buttons = Array.from(document.querySelectorAll('main button'));
        const candidateButton = buttons.find((button) => cleanText(button) === 'Candidat');
        const recruiterButton = buttons.find((button) => cleanText(button) === 'Recruteur');

        if (
          candidateButton
          && recruiterButton
          && candidateButton.parentElement === recruiterButton.parentElement
        ) {
          const roleSwitcher = candidateButton.parentElement;
          roleSwitcher.hidden = true;
          roleSwitcher.setAttribute('aria-hidden', 'true');

          const loginContainer = roleSwitcher.closest('main > div') || roleSwitcher.parentElement;
          const heading = Array.from(loginContainer.querySelectorAll('h1, h2')).find((element) =>
            /^(Connexion|Inscription)/i.test(cleanText(element)),
          );

          if (heading) {
            const isSignup = cleanText(heading).toLowerCase().startsWith('inscription');
            heading.textContent = isSignup ? 'Créer votre compte' : 'Connexion';

            const subtitle = heading.parentElement?.querySelector('p');
            if (subtitle) {
              subtitle.textContent = isSignup
                ? 'Créez votre compte Nzela Jobs pour postuler ou publier une offre.'
                : 'Connectez-vous à votre espace Nzela Jobs.';
            }
          }
        }

        // Le bloc recruteur devient une notification promotionnelle compacte.
        Array.from(document.querySelectorAll('main h2')).forEach((heading) => {
          if (!['Vous recrutez au Congo ?', 'Vous êtes recruteur au Congo ?'].includes(cleanText(heading))) return;

          const section = heading.closest('section');
          if (!section) return;

          heading.textContent = 'Vous êtes recruteur au Congo ?';
          section.className = 'flex flex-col gap-4 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between';
          section.setAttribute('aria-label', 'Information pour les recruteurs');

          const textBlock = heading.parentElement;
          const description = textBlock?.querySelector('p');
          if (description) {
            description.textContent = "Publiez votre offre d’emploi et recevez directement les candidatures sur Nzela Jobs.";
            description.className = 'mt-1 text-sm leading-6 text-slate-600';
          }

          if (textBlock && !textBlock.querySelector('[data-recruiter-promo-label]')) {
            const label = document.createElement('span');
            label.dataset.recruiterPromoLabel = 'true';
            label.className = 'mb-2 inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-200';
            label.textContent = 'Espace entreprises';
            textBlock.insertBefore(label, heading);
          }

          const button = section.querySelector('button');
          if (button) {
            button.textContent = 'Publier une offre';
            button.className = 'primary-button shrink-0';
          }
        });
      });
    };

    applyUnifiedAccess();

    const observer = new MutationObserver(applyUnifiedAccess);
    const root = document.getElementById('root');
    if (root) observer.observe(root, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return null;
}
