import { hasSupabaseConfig, supabase } from './lib/supabase.js';

const DONE_PREFIX = 'nzela.account_setup_done.';
const RECENT_PROFILE_WINDOW_MS = 15 * 60 * 1000;

function text(node) {
  return (node?.textContent || '').trim().toLowerCase();
}

function getStoredProfile() {
  try {
    return JSON.parse(localStorage.getItem('congoemploi.v2.profile') || '{}');
  } catch {
    return {};
  }
}

function setStoredProfile(next) {
  const current = getStoredProfile();
  localStorage.setItem('congoemploi.v2.profile', JSON.stringify({ ...current, ...next }));
}

async function getAccountState() {
  if (!hasSupabaseConfig || !supabase) return null;
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id,email,role,nom,prenom,phone,city,title,created_at')
    .eq('id', user.id)
    .maybeSingle();

  const { data: companies } = await supabase
    .from('companies')
    .select('id,name,sector,city')
    .eq('owner_id', user.id)
    .limit(1);

  return { user, profile, company: companies?.[0] || null };
}

function shouldShowSetup(state) {
  if (!state?.user) return false;
  if (localStorage.getItem(`${DONE_PREFIX}${state.user.id}`) === 'true') return false;
  if (state.company) return false;
  if (!state.profile?.created_at) return false;
  const createdAt = new Date(state.profile.created_at).getTime();
  return Number.isFinite(createdAt) && Date.now() - createdAt < RECENT_PROFILE_WINDOW_MS;
}

function field(name, label, value = '', type = 'text') {
  return `<label><span>${label}</span><input name="${name}" type="${type}" value="${value || ''}" /></label>`;
}

function selectCity(value = 'Brazzaville') {
  const cities = ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Nkayi', 'Ouesso', 'Oyo'];
  return `<label><span>Ville</span><select name="city">${cities.map((city) => `<option ${city === value ? 'selected' : ''}>${city}</option>`).join('')}</select></label>`;
}

function buildSetupModal(state) {
  if (document.getElementById('nzela-account-setup')) return;
  const profile = state.profile || {};
  const overlay = document.createElement('div');
  overlay.id = 'nzela-account-setup';
  overlay.innerHTML = `
    <div class="nzela-setup-card">
      <div class="nzela-setup-head">
        <span>Première connexion</span>
        <h2>Tu utilises Nzela Jobs comme quoi ?</h2>
        <p>Un seul compte, mais des informations différentes selon ton rôle. Ce choix permet de reconnaître automatiquement ton espace.</p>
      </div>
      <div class="nzela-setup-choice" role="tablist">
        <button type="button" data-role="candidat" class="is-active">Candidat</button>
        <button type="button" data-role="recruteur">Employeur / recruteur</button>
      </div>
      <form class="nzela-setup-form" data-active-role="candidat">
        <div data-panel="candidat" class="nzela-setup-panel">
          ${field('prenom', 'Prénom', profile.prenom || '')}
          ${field('nom', 'Nom', profile.nom || '')}
          ${field('phone', 'Téléphone', profile.phone || '', 'tel')}
          ${selectCity(profile.city || 'Brazzaville')}
          ${field('title', 'Titre ou métier recherché', profile.title || '')}
        </div>
        <div data-panel="recruteur" class="nzela-setup-panel is-hidden">
          ${field('companyName', 'Nom de l entreprise')}
          ${field('sector', 'Secteur d activité')}
          ${selectCity(profile.city || 'Brazzaville')}
          ${field('phone', 'Téléphone professionnel', profile.phone || '', 'tel')}
          ${field('title', 'Fonction du contact', profile.title || 'Responsable recrutement')}
        </div>
        <button type="submit">Valider mon compte</button>
        <small>Tu pourras compléter tes informations ensuite dans Mon espace.</small>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  const form = overlay.querySelector('form');
  overlay.querySelectorAll('[data-role]').forEach((button) => {
    button.addEventListener('click', () => {
      const role = button.dataset.role;
      form.dataset.activeRole = role;
      overlay.querySelectorAll('[data-role]').forEach((item) => item.classList.toggle('is-active', item === button));
      overlay.querySelectorAll('[data-panel]').forEach((panel) => panel.classList.toggle('is-hidden', panel.dataset.panel !== role));
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const role = form.dataset.activeRole || 'candidat';
    const data = new FormData(form);
    const profileUpdate = {
      id: state.user.id,
      email: state.user.email,
      role,
      nom: data.get('nom') || profile.nom || '',
      prenom: data.get('prenom') || profile.prenom || '',
      phone: data.get('phone') || '',
      city: data.get('city') || 'Brazzaville',
      title: data.get('title') || '',
    };

    await supabase.from('profiles').upsert(profileUpdate);

    if (role === 'recruteur') {
      const companyName = String(data.get('companyName') || '').trim();
      if (companyName) {
        await supabase.from('companies').insert({
          owner_id: state.user.id,
          name: companyName,
          sector: data.get('sector') || 'Recrutement',
          city: data.get('city') || 'Brazzaville',
        });
      }
    }

    setStoredProfile(profileUpdate);
    localStorage.setItem(`${DONE_PREFIX}${state.user.id}`, 'true');
    window.location.reload();
  });
}

function addSetupStyle() {
  if (document.getElementById('nzela-account-setup-style')) return;
  const style = document.createElement('style');
  style.id = 'nzela-account-setup-style';
  style.textContent = `#nzela-account-setup{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:rgba(15,23,42,.55);padding:18px;backdrop-filter:blur(12px)}.nzela-setup-card{width:min(100%,560px);max-height:92vh;overflow:auto;border-radius:24px;background:#fff;padding:20px;box-shadow:0 30px 90px rgba(15,23,42,.32)}.nzela-setup-head span{display:inline-flex;border-radius:999px;background:#eef6ff;color:#0f3b77;font-size:11px;font-weight:950;text-transform:uppercase;padding:6px 10px}.nzela-setup-head h2{margin-top:12px;color:#0f172a;font-size:28px;line-height:1.08;font-weight:950;letter-spacing:-.03em}.nzela-setup-head p{margin-top:8px;color:#64748b;font-size:14px;font-weight:750;line-height:1.55}.nzela-setup-choice{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px;border:1px solid #e2e8f0;border-radius:16px;background:#f8fafc;padding:6px}.nzela-setup-choice button{min-height:46px;border-radius:12px;color:#475569;font-weight:950}.nzela-setup-choice button.is-active{background:#0f3b77;color:#fff;box-shadow:0 10px 24px rgba(15,59,119,.2)}.nzela-setup-form{display:grid;gap:12px;margin-top:16px}.nzela-setup-panel{display:grid;gap:12px}.nzela-setup-panel.is-hidden{display:none}.nzela-setup-form label span{display:block;margin-bottom:7px;color:#0f172a;font-size:13px;font-weight:950}.nzela-setup-form input,.nzela-setup-form select{min-height:48px;width:100%;border:1px solid #cbd5e1;border-radius:12px;background:#fff;padding:0 12px;color:#0f172a;font-weight:750;outline:none}.nzela-setup-form input:focus,.nzela-setup-form select:focus{border-color:#0f3b77;box-shadow:0 0 0 4px rgba(15,59,119,.12)}.nzela-setup-form button[type=submit]{min-height:50px;border-radius:14px;background:#0f3b77;color:#fff;font-weight:950}.nzela-setup-form small{color:#64748b;font-size:12px;font-weight:700;text-align:center}`;
  document.head.appendChild(style);
}

async function runSetupPass() {
  addSetupStyle();
  const state = await getAccountState();
  if (shouldShowSetup(state)) buildSetupModal(state);
}

export function applyAccountOnboarding() {
  const run = () => window.requestAnimationFrame(() => { runSetupPass(); });
  run();
  const observer = new MutationObserver(run);
  observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true, attributes: true });
  return () => observer.disconnect();
}
