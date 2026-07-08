import { hasSupabaseConfig, supabase } from './lib/supabase';

const PLANS = [
  ['A la une', '5 000 FCFA', '7 jours', 'Badge A la une et meilleure visibilite', 5000],
  ['Sponsorisee', '25 000 FCFA', '30 jours', 'Priorite dans les offres', 25000],
  ['Pack PME', '75 000 FCFA', '1 mois', 'Jusqu a 5 offres avec suivi', 75000],
];

function textOf(node) {
  return (node?.textContent || '').trim();
}

function addPricingStyles() {
  if (document.getElementById('nzela-pricing-style')) return;
  const style = document.createElement('style');
  style.id = 'nzela-pricing-style';
  style.textContent = '.nzela-pricing{border:1px solid rgba(15,59,119,.12);border-radius:20px;background:linear-gradient(135deg,#fff,#f8fafc);padding:18px;box-shadow:0 18px 44px rgba(15,23,42,.07)}.nzela-pricing-kicker,.nzela-pricing-private{display:inline-flex;border-radius:999px;background:#eef6ff;color:#0f3b77;font-size:11px;font-weight:950;text-transform:uppercase;padding:6px 10px}.nzela-pricing-private{margin-bottom:10px;background:#0f3b77;color:#fff}.nzela-pricing h2{margin-top:10px;color:#0f172a;font-size:26px;line-height:1.1;font-weight:950;letter-spacing:-.02em}.nzela-pricing p{margin-top:8px;color:#64748b;font-size:14px;font-weight:700;line-height:1.6}.nzela-pricing-grid{display:grid;gap:12px;margin-top:16px}.nzela-plan{border:1px solid #e2e8f0;border-radius:16px;background:#fff;padding:16px;box-shadow:0 12px 30px rgba(15,23,42,.05)}.nzela-plan:nth-child(2){border-color:#fde68a;background:linear-gradient(135deg,#fffbeb,#fff)}.nzela-plan small{display:inline-flex;border-radius:999px;background:#f1f5f9;color:#334155;font-size:11px;font-weight:950;text-transform:uppercase;padding:5px 9px}.nzela-plan h3{margin-top:10px;color:#0f172a;font-size:16px;font-weight:950}.nzela-plan strong{display:block;margin-top:6px;color:#0f3b77;font-size:24px;font-weight:950}.nzela-plan span{display:block;margin-top:8px;color:#64748b;font-size:13px;font-weight:750;line-height:1.5}.nzela-plan button{margin-top:12px;min-height:42px;width:100%;border:0;border-radius:12px;background:#0f3b77;color:#fff;font-weight:950}.nzela-payment{display:grid;gap:5px;margin-top:16px;border:1px solid #bbf7d0;border-radius:16px;background:#ecfdf5;padding:14px}.nzela-payment strong{color:#047857;font-weight:950}.nzela-payment span{color:#065f46;font-size:13px;font-weight:750;line-height:1.55}.nzela-boost-ref{margin-top:12px;border:1px solid #fde68a;border-radius:16px;background:#fffbeb;padding:14px;color:#92400e;font-size:13px;font-weight:800;line-height:1.55}@media(min-width:768px){.nzela-pricing{padding:22px}.nzela-pricing-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.nzela-pricing h2{font-size:32px}}';
  document.head.appendChild(style);
}

function removePublicPricing() {
  document.querySelectorAll('#nzela-pricing, [data-pricing-button], .nzela-pricing-button, [data-go="pricing"]').forEach((node) => node.remove());
  document.querySelectorAll('[data-nzela-helpbar]').forEach((bar) => {
    bar.style.gridTemplateColumns = 'repeat(3,minmax(0,1fr))';
  });
}

function isPublicHome() {
  return Array.from(document.querySelectorAll('h1')).some((node) => textOf(node).includes('emploi fiable au Congo'));
}

function isRecruiterContext() {
  if (isPublicHome()) return false;
  const title = Array.from(document.querySelectorAll('h1')).find((node) => textOf(node) === 'Recruteur');
  if (!title) return false;
  const body = document.body.textContent || '';
  if (body.includes('Connecte-toi pour publier une offre')) return false;
  if (body.includes('Ton compte candidat reste dans son espace candidat')) return false;
  return body.includes('Publier ma premiere offre') || body.includes('Mes offres') || body.includes('Publier une offre');
}

function getRecruiterContainer() {
  const title = Array.from(document.querySelectorAll('h1')).find((node) => textOf(node) === 'Recruteur');
  return title?.closest('.space-y-5') || title?.parentElement?.parentElement || null;
}

async function saveBoostRequest(request) {
  try {
    const items = JSON.parse(localStorage.getItem('nzela.boostRequests') || '[]');
    localStorage.setItem('nzela.boostRequests', JSON.stringify([request, ...items].slice(0, 50)));
  } catch {}
  if (!hasSupabaseConfig || !supabase) return;
  try {
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from('boost_requests').insert({
      recruiter_id: userData?.user?.id || null,
      reference: request.ref,
      plan: request.plan,
      amount: request.amount,
      status: 'pending',
    });
  } catch {}
}

function showReference(plan) {
  const selected = PLANS.find((item) => item[0] === plan);
  const amount = selected?.[4] || 0;
  const ref = `NZJ-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  let box = document.getElementById('nzela-boost-ref');
  if (!box) {
    box = document.createElement('div');
    box.id = 'nzela-boost-ref';
    box.className = 'nzela-boost-ref';
    document.getElementById('nzela-recruiter-pricing')?.appendChild(box);
  }
  box.textContent = `Reference creee: ${ref}. Option choisie: ${plan}. Statut: en attente de validation.`;
  saveBoostRequest({ ref, plan, amount, status: 'pending', createdAt: new Date().toISOString() });
}

function addRecruiterPricing() {
  if (!isRecruiterContext()) return;
  const container = getRecruiterContainer();
  if (!container || container.querySelector('#nzela-recruiter-pricing')) return;
  const section = document.createElement('section');
  section.id = 'nzela-recruiter-pricing';
  section.className = 'nzela-pricing';
  section.innerHTML = `<span class="nzela-pricing-private">Visible recruteurs uniquement</span><span class="nzela-pricing-kicker">Booster mes offres</span><h2>Augmentez la visibilite de vos annonces.</h2><p>Ces options concernent uniquement les employeurs et recruteurs connectes. Les candidats continuent d utiliser la plateforme gratuitement.</p><div class="nzela-pricing-grid">${PLANS.map(([name, price, period, detail]) => `<article class="nzela-plan"><small>${period}</small><h3>${name}</h3><strong>${price}</strong><span>${detail}</span><button type="button" data-plan="${name}">Choisir</button></article>`).join('')}</div><div class="nzela-payment"><strong>Paiement adapte au Congo</strong><span>Validation manuelle au demarrage: Mobile Money, Airtel Money, MTN Mobile Money ou virement. Le recruteur transmet la reference, puis l equipe active la mise en avant.</span></div>`;
  const anchor = Array.from(container.children).find((node) => node.tagName === 'SECTION' || node.tagName === 'DIV');
  anchor?.insertAdjacentElement('afterend', section);
  section.querySelectorAll('[data-plan]').forEach((button) => button.addEventListener('click', () => showReference(button.dataset.plan)));
}

function runPricingPass() {
  addPricingStyles();
  removePublicPricing();
  if (!isRecruiterContext()) {
    document.getElementById('nzela-recruiter-pricing')?.remove();
    return;
  }
  addRecruiterPricing();
}

export function applyPricingPolish() {
  const run = () => window.requestAnimationFrame(runPricingPass);
  run();
  import('./adminPilot.js').then((module) => module.applyAdminPilot?.());
  import('./candidateStatusPolish.js').then((module) => module.applyCandidateStatusPolish?.());
  import('./applicationTrackingPolish.js').then((module) => module.applyApplicationTrackingPolish?.());
  import('./applyRescuePolish.js').then((module) => module.applyApplyRescuePolish?.());
  import('./signupCodePolish.js').then((module) => module.applySignupCodePolish?.());
  const root = document.getElementById('root') || document.body;
  const observer = new MutationObserver(run);
  observer.observe(root, { childList: true, subtree: true, characterData: true });
  return () => observer.disconnect();
}
