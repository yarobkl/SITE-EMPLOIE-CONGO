function textOf(node) {
  return (node?.textContent || '').trim();
}

function getHomeWrapper() {
  const title = Array.from(document.querySelectorAll('h1')).find((node) => textOf(node).includes('emploi fiable au Congo'));
  return title?.closest('.space-y-6') || null;
}

function addJourneySection() {
  const wrapper = getHomeWrapper();
  if (!wrapper || wrapper.querySelector('[data-nzela-journey]')) return;

  const section = document.createElement('section');
  section.dataset.nzelaJourney = 'true';
  section.className = 'nzela-journey';
  section.innerHTML = `
    <div class="nzela-journey-head">
      <span>Experience simple</span>
      <h2>Un parcours clair pour chaque utilisateur.</h2>
      <p>Le site doit guider vite: chercher, postuler, suivre; ou publier, recevoir et selectionner.</p>
    </div>
    <div class="nzela-journey-grid">
      <article>
        <small>Candidat</small>
        <h3>Je cherche une opportunite</h3>
        <ol><li>Je trouve une offre claire</li><li>Je depose mon CV PDF</li><li>Je suis ma candidature</li></ol>
      </article>
      <article>
        <small>Employeur / recruteur</small>
        <h3>Je recrute simplement</h3>
        <ol><li>Je cree mon compte recruteur</li><li>Je publie une offre structuree</li><li>Je recois les candidatures</li></ol>
      </article>
    </div>
  `;

  const pricing = wrapper.querySelector('#nzela-pricing');
  const trust = wrapper.querySelector('[data-nzela-trust-strip]');
  (pricing || trust || wrapper.firstElementChild)?.insertAdjacentElement('afterend', section);
}

function addFormComfort() {
  document.querySelectorAll('input, select, textarea').forEach((field) => {
    field.classList.add('nzela-field-comfort');
  });

  const cvInput = Array.from(document.querySelectorAll('input[type="file"]')).find((input) => !input.closest('[data-nzela-cv-note]'));
  if (cvInput) {
    const label = cvInput.closest('label') || cvInput.parentElement;
    if (label && !label.querySelector('[data-nzela-cv-note]')) {
      const note = document.createElement('small');
      note.dataset.nzelaCvNote = 'true';
      note.className = 'nzela-form-note';
      note.textContent = 'CV au format PDF, 2 Mo maximum. Ton fichier reste rattache a ta candidature.';
      label.appendChild(note);
    }
  }
}

function improveEmptyScreens() {
  const texts = ['Aucune offre', 'Aucune candidature', 'Aucun favori'];
  Array.from(document.querySelectorAll('p, div')).forEach((node) => {
    if (node.dataset.nzelaEmpty === 'true') return;
    const content = textOf(node);
    if (!texts.some((value) => content.includes(value))) return;
    node.dataset.nzelaEmpty = 'true';
    node.classList.add('nzela-empty-state');
  });
}

function addExperienceStyles() {
  if (document.getElementById('nzela-experience-style')) return;
  const style = document.createElement('style');
  style.id = 'nzela-experience-style';
  style.textContent = `
    .nzela-journey{border:1px solid rgba(15,59,119,.12);border-radius:20px;background:#fff;padding:18px;box-shadow:0 18px 44px rgba(15,23,42,.06)}
    .nzela-journey-head span{display:inline-flex;border-radius:999px;background:#ecfdf5;color:#047857;font-size:11px;font-weight:950;text-transform:uppercase;padding:6px 10px}
    .nzela-journey-head h2{margin-top:10px;color:#0f172a;font-size:26px;line-height:1.1;font-weight:950;letter-spacing:-.02em}
    .nzela-journey-head p{margin-top:8px;color:#64748b;font-size:14px;font-weight:750;line-height:1.6}
    .nzela-journey-grid{display:grid;gap:12px;margin-top:16px}
    .nzela-journey article{border:1px solid #e2e8f0;border-radius:16px;background:linear-gradient(135deg,#fff,#f8fafc);padding:16px}
    .nzela-journey small{display:inline-flex;border-radius:999px;background:#eef6ff;color:#0f3b77;font-size:11px;font-weight:950;text-transform:uppercase;padding:5px 9px}
    .nzela-journey h3{margin-top:10px;color:#0f172a;font-size:17px;font-weight:950}
    .nzela-journey ol{display:grid;gap:8px;margin:12px 0 0;padding-left:20px;color:#475569;font-size:14px;font-weight:750;line-height:1.45}
    .nzela-field-comfort:focus{box-shadow:0 0 0 4px rgba(15,59,119,.12)!important}
    .nzela-form-note{display:block;margin-top:6px;color:#64748b;font-size:12px;font-weight:700;line-height:1.45}
    .nzela-empty-state{border:1px dashed #cbd5e1;border-radius:16px;background:#f8fafc;padding:14px!important;color:#64748b!important;font-weight:750!important;text-align:center}
    @media(min-width:768px){.nzela-journey{padding:22px}.nzela-journey-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.nzela-journey-head h2{font-size:32px}}
  `;
  document.head.appendChild(style);
}

function runExperiencePass() {
  addExperienceStyles();
  addJourneySection();
  addFormComfort();
  improveEmptyScreens();
}

export function applyExperiencePolish() {
  const run = () => window.requestAnimationFrame(runExperiencePass);
  run();
  const root = document.getElementById('root') || document.body;
  const observer = new MutationObserver(run);
  observer.observe(root, { childList: true, subtree: true, characterData: true });
  return () => observer.disconnect();
}
