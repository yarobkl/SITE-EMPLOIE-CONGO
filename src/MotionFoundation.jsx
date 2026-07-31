import { useEffect } from 'react';

const ITEM_SELECTOR = '.job-card, .smooth-card, main article, [role="dialog"] article';

function enhanceNode(node) {
  if (!(node instanceof HTMLElement)) return;

  const overlays = [];
  if (node.matches('[role="dialog"], .fixed.inset-0')) overlays.push(node);
  node.querySelectorAll?.('[role="dialog"], .fixed.inset-0').forEach((item) => overlays.push(item));

  overlays.forEach((overlay) => {
    if (overlay.dataset.motionOverlay === 'true') return;
    overlay.dataset.motionOverlay = 'true';
    overlay.classList.add('motion-dialog');

    const panel = overlay.firstElementChild;
    if (panel instanceof HTMLElement) panel.classList.add('motion-dialog-panel');
  });

  const items = [];
  if (node.matches(ITEM_SELECTOR)) items.push(node);
  node.querySelectorAll?.(ITEM_SELECTOR).forEach((item) => items.push(item));

  items.forEach((item, index) => {
    if (!(item instanceof HTMLElement) || item.dataset.motionItem === 'true') return;
    item.dataset.motionItem = 'true';
    item.style.setProperty('--motion-index', String(Math.min(index, 8)));
    item.classList.add('motion-item-enter');
  });

  const statuses = [];
  if (node.matches('[role="status"]')) statuses.push(node);
  node.querySelectorAll?.('[role="status"]').forEach((item) => statuses.push(item));
  statuses.forEach((status) => status.classList.add('motion-toast'));
}

export default function MotionFoundation() {
  useEffect(() => {
    const root = document.documentElement;
    let readyFrame = 0;
    let secondFrame = 0;

    readyFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        root.dataset.motion = 'ready';
        enhanceNode(document.body);
      });
    });

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach(enhanceNode);
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const onPointerDown = (event) => {
      const target = event.target instanceof Element
        ? event.target.closest('button:not(:disabled), a, [role="button"]')
        : null;
      if (!(target instanceof HTMLElement)) return;
      target.classList.add('motion-pressed');
    };

    const clearPressed = () => {
      document.querySelectorAll('.motion-pressed').forEach((element) => {
        element.classList.remove('motion-pressed');
      });
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointerup', clearPressed, true);
    document.addEventListener('pointercancel', clearPressed, true);
    window.addEventListener('blur', clearPressed);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(readyFrame);
      window.cancelAnimationFrame(secondFrame);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('pointerup', clearPressed, true);
      document.removeEventListener('pointercancel', clearPressed, true);
      window.removeEventListener('blur', clearPressed);
      delete root.dataset.motion;
    };
  }, []);

  return null;
}
