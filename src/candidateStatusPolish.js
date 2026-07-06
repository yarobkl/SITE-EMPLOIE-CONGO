function textOf(node) {
  return (node?.textContent || '').trim();
}

function addStyle() {
  if (document.getElementById('nzela-candidate-status-style')) return;
  const style = document.createElement('style');
  style.id = 'nzela-candidate-status-style';
  style.textContent = '.nzela-status-panel{border:1px solid #dbeafe;border-radius:18px;background:linear-gradient(135deg,#eff6ff,#fff);padding:14px;margin-top:12px}.nzela-status-panel strong{display:block;color:#0f3b77;font-weight:950}.nzela-status-flow{display:grid;gap:8px;margin-top:10px}.nzela-status-step{display:flex;align-items:center;gap:8px;color:#475569;font-size:13px;font-weight:800}.nzela-status-dot{width:10px;height:10px;border-radius:999px;background:#bfdbfe}.nzela-status-step:first-child .nzela-status-dot{background:#047857}.nzela-status-step:first-child{color:#047857}.nzela-status-note{display:block;margin-top:10px;color:#64748b;font-size:12px;font-weight:750;line-height:1.45}';
  document.head.appendChild(style);
}

function addStatusPanel() {
  const title = Array.from(document.querySelectorAll('h1,h2,h3')).find((node) => {
    const text = textOf(node);
    return text.includes('candidature') || text.includes('Candidature') || text.includes('Mes candidatures');
  });
  const container = title?.closest('.space-y-5') || title?.parentElement;
  if (!container || container.querySelector('[data-nzela-status-panel]')) return;
  const panel = document.createElement('section');
  panel.dataset.nzelaStatusPanel = 'true';
  panel.className = 'nzela-status-panel';
  panel.innerHTML = '<strong>Suivi de candidature</strong><div class="nzela-status-flow"><span class="nzela-status-step"><i class="nzela-status-dot"></i>Envoyee</span><span class="nzela-status-step"><i class="nzela-status-dot"></i>Vue par le recruteur</span><span class="nzela-status-step"><i class="nzela-status-dot"></i>CV ouvert</span><span class="nzela-status-step"><i class="nzela-status-dot"></i>Preselectionnee</span><span class="nzela-status-step"><i class="nzela-status-dot"></i>Decision finale</span></div><span class="nzela-status-note">Au lancement, le premier statut confirme l envoi. Les autres statuts seront connectes au tableau recruteur.</span>';
  title.insertAdjacentElement('afterend', panel);
}

function improveExistingStatusText() {
  Array.from(document.querySelectorAll('p,span,small,div')).forEach((node) => {
    if (node.dataset.nzelaStatusText === 'true') return;
    const text = textOf(node);
    if (text === 'Envoyee' || text === 'Envoyé' || text === 'Envoyée') {
      node.textContent = 'Envoyee - candidature transmise au recruteur';
      node.dataset.nzelaStatusText = 'true';
    }
  });
}

function runStatusPass() {
  addStyle();
  addStatusPanel();
  improveExistingStatusText();
}

export function applyCandidateStatusPolish() {
  const run = () => requestAnimationFrame(runStatusPass);
  run();
  const observer = new MutationObserver(run);
  observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true, characterData: true });
  return () => observer.disconnect();
}
