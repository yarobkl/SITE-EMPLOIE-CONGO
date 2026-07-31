import { useEffect } from 'react';
import './mobile-glass-navigation.css';

const NAV_SELECTOR = 'nav[aria-label="Navigation mobile"]';

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function getActiveIndex(buttons) {
  const index = buttons.findIndex((button) => (
    button.classList.contains('nz-mobile-active')
    || button.classList.contains('text-blue-700')
    || button.getAttribute('aria-current') === 'page'
  ));
  return index >= 0 ? index : 0;
}

function setIndicatorPosition(rail, position, count, immediate = false) {
  if (!rail || !count) return;
  rail.style.setProperty('--nz-nav-left', `${(clamp(position, 0, count - 1) * 100) / count}%`);
  rail.classList.toggle('nz-nav-immediate', immediate);
  if (immediate) {
    window.requestAnimationFrame(() => rail.classList.remove('nz-nav-immediate'));
  }
}

export default function MobileGlassNavigation() {
  useEffect(() => {
    let installedNav = null;
    let cleanupInstalledNav = null;

    const install = () => {
      const nav = document.querySelector(NAV_SELECTOR);
      if (!(nav instanceof HTMLElement) || nav === installedNav) return;

      cleanupInstalledNav?.();
      installedNav = nav;
      nav.classList.add('nz-glass-navigation');
      nav.dataset.glassNavigation = 'ready';

      const rail = nav.firstElementChild;
      if (!(rail instanceof HTMLElement)) return;
      rail.classList.add('nz-glass-navigation-rail');

      const buttons = Array.from(rail.querySelectorAll(':scope > button'));
      if (buttons.length < 2) return;

      rail.style.setProperty('--nz-nav-count', String(buttons.length));
      buttons.forEach((button) => button.classList.add('nz-glass-navigation-item'));
      setIndicatorPosition(rail, getActiveIndex(buttons), buttons.length, true);

      let pointerId = null;
      let startX = 0;
      let startY = 0;
      let dragging = false;
      let suppressNextNativeClick = false;
      let manualClick = false;

      const syncActive = () => {
        if (dragging) return;
        setIndicatorPosition(rail, getActiveIndex(buttons), buttons.length);
      };

      const activeObserver = new MutationObserver(syncActive);
      buttons.forEach((button) => {
        activeObserver.observe(button, {
          attributes: true,
          attributeFilter: ['class', 'aria-current'],
        });
      });

      const positionFromPointer = (clientX) => {
        const rect = rail.getBoundingClientRect();
        const cellWidth = rect.width / buttons.length;
        return clamp((clientX - rect.left - (cellWidth / 2)) / cellWidth, 0, buttons.length - 1);
      };

      const finishGesture = (event, cancelled = false) => {
        if (pointerId !== event.pointerId) return;
        const wasDragging = dragging;
        const position = positionFromPointer(event.clientX);
        const targetIndex = cancelled ? getActiveIndex(buttons) : Math.round(position);

        if (rail.hasPointerCapture?.(pointerId)) rail.releasePointerCapture(pointerId);
        pointerId = null;
        dragging = false;
        rail.classList.remove('nz-nav-dragging');
        setIndicatorPosition(rail, targetIndex, buttons.length);

        if (!cancelled && wasDragging) {
          event.preventDefault();
          event.stopPropagation();
          suppressNextNativeClick = true;
          manualClick = true;
          buttons[targetIndex]?.click();
          manualClick = false;
          window.setTimeout(() => {
            suppressNextNativeClick = false;
          }, 420);
        }
      };

      const onPointerDown = (event) => {
        if (!event.isPrimary || event.button > 0) return;
        pointerId = event.pointerId;
        startX = event.clientX;
        startY = event.clientY;
        dragging = false;
        rail.setPointerCapture?.(pointerId);
      };

      const onPointerMove = (event) => {
        if (pointerId !== event.pointerId) return;
        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;

        if (!dragging) {
          if (Math.abs(deltaX) < 7) return;
          if (Math.abs(deltaY) > Math.abs(deltaX) * 1.15) {
            finishGesture(event, true);
            return;
          }
          dragging = true;
          rail.classList.add('nz-nav-dragging');
        }

        event.preventDefault();
        setIndicatorPosition(rail, positionFromPointer(event.clientX), buttons.length);
      };

      const onPointerUp = (event) => finishGesture(event, false);
      const onPointerCancel = (event) => finishGesture(event, true);

      const onClickCapture = (event) => {
        if (manualClick || !suppressNextNativeClick) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        suppressNextNativeClick = false;
      };

      rail.addEventListener('pointerdown', onPointerDown);
      rail.addEventListener('pointermove', onPointerMove, { passive: false });
      rail.addEventListener('pointerup', onPointerUp);
      rail.addEventListener('pointercancel', onPointerCancel);
      rail.addEventListener('click', onClickCapture, true);

      cleanupInstalledNav = () => {
        activeObserver.disconnect();
        rail.removeEventListener('pointerdown', onPointerDown);
        rail.removeEventListener('pointermove', onPointerMove);
        rail.removeEventListener('pointerup', onPointerUp);
        rail.removeEventListener('pointercancel', onPointerCancel);
        rail.removeEventListener('click', onClickCapture, true);
      };
    };

    install();
    const root = document.getElementById('root');
    const observer = new MutationObserver(install);
    if (root) observer.observe(root, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cleanupInstalledNav?.();
    };
  }, []);

  return null;
}
