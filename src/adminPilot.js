const STORE = 'nzela.boostRequests';

function readItems() {
  try { return JSON.parse(localStorage.getItem(STORE) || '[]'); } catch { return []; }
}

function writeItems(items) {
  localStorage.setItem(STORE, JSON.stringify(items));
}

function textOf(node) {
  return (node?.textContent || '').trim();
}

function addStyle() {
  if (document.getElementById('nzela-admin-pilot-style')) return;
  const style = document.createElement('style');
  style.id = 'nzela-admin-pilot-style';
  style.textContent = '.nzela-admin-pilot{border:1px solid #e2e8f0;border-radius:18px;background:#fff;padding:16px;box-shadow:0 16px 40px rgba(15,23,42,.06)}.nzela-admin-pilot h2{font-size:22px;font-weight:950;color:#0f172a}.nzela-admin-pilot p{margin-top:6px;color:#64748b;font-size:13px;font-weight:750;line-height:1.55}.nzela-admin-item{margin-top:10px;border:1px solid #e2e8f0;border-radius:14px;background:#f8fafc;padding:12px}.nzela-admin-item strong{display:block;color:#0f172a;font-weight:950}.nzela-admin-item span{display:block;margin-top:4px;color:#64748b;font-size:12px;font-weight:750}.nzela-admin-actions{display:flex;gap:8px;margin-top:10px}.nzela-admin-actions button{min-height:36px;border-radius:10px;padding:0 12px;font-size:12px;font-weight:950}.nzela-admin-actions button:first-child{background:#047857;color:white}.nzela-admin-actions button:last-child{background:#fee2e2;color:#b91c1c}';
  document.head.appendChild(style);
}

function updateItem(index, status) {
  const items = readItems();
  if (!items[index]) return;
  items[index].status = status;
  writeItems(items);
  render();
}

function render() {
  const title = Array.from(document.querySelectorAll('h1')).find((node) => textOf(node) === 'Parametres');
  const container = title?.closest('.space-y-5');
  if (!container) return;
  let panel = document.getElementById('nzela-admin-pilot');
  if (!panel) {
    panel = document.createElement('section');
    panel.id = 'nzela-admin-pilot';
    panel.className = 'nzela-admin-pilot';
    container.appendChild(panel);
  }
  const items = readItems();
  panel.innerHTML = `<h2>Admin pilote</h2><p>Demandes de mise en avant en attente de validation.</p>${items.length ? items.map((item, index) => `<article class="nzela-admin-item"><strong>${item.ref || 'Reference'} - ${item.plan || 'Option'}</strong><span>Statut: ${item.status || 'pending'}</span><div class="nzela-admin-actions"><button type="button" data-ok="${index}">Valider</button><button type="button" data-ko="${index}">Rejeter</button></div></article>`).join('') : '<article class="nzela-admin-item"><strong>Aucune demande</strong><span>Les demandes apparaitront ici apres choix d une formule recruteur.</span></article>'}`;
  panel.querySelectorAll('[data-ok]').forEach((button) => button.addEventListener('click', () => updateItem(Number(button.dataset.ok), 'validated')));
  panel.querySelectorAll('[data-ko]').forEach((button) => button.addEventListener('click', () => updateItem(Number(button.dataset.ko), 'rejected')));
}

export function applyAdminPilot() {
  const run = () => requestAnimationFrame(() => { addStyle(); render(); });
  run();
  const observer = new MutationObserver(run);
  observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true, characterData: true });
  return () => observer.disconnect();
}
