import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { Briefcase, Building2, Home, User } from 'lucide-react';
import './mobile-platform-shell.css';

export const PLATFORM_SECTIONS = [
  { id: 'home', label: 'Accueil', icon: Home },
  { id: 'jobs', label: 'Offres', icon: Briefcase },
  { id: 'immobilier', label: 'Immobilier', icon: Building2 },
  { id: 'profile', label: 'Profil', icon: User },
];

const SECTION_INDEX = new Map(PLATFORM_SECTIONS.map((item, index) => [item.id, index]));
const SWIPE_START_DISTANCE = 9;
const SWIPE_DURATION = 300;
const CLICK_SUPPRESSION_DURATION = 420;

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function isMobileViewport() {
  return window.matchMedia('(max-width: 767.98px)').matches;
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function shouldIgnoreSwipe(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(
    'input, textarea, select, [contenteditable="true"], [data-platform-swipe="ignore"], .nz2-thumbs, .overflow-x-auto, [role="slider"]',
  ));
}

export default function MobilePlatformShell({
  activeId,
  children,
  contained = false,
  disabled = false,
  onBeforeNavigate,
  onNavigate,
  onPrepareNavigate,
  sections,
  showNavigation = true,
  viewportClassName = '',
}) {
  const activeIndex = SECTION_INDEX.get(activeId) ?? 0;
  const hasPanels = Boolean(sections);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const railRef = useRef(null);
  const paneRefs = useRef(new Map());
  const transitionTimerRef = useRef(0);
  const clickTimerRef = useRef(0);
  const frameRef = useRef(0);
  const previousIndexRef = useRef(activeIndex);
  const activeIndexRef = useRef(activeIndex);
  const activeIdRef = useRef(activeId);
  const navigationTargetRef = useRef('');
  const onBeforeNavigateRef = useRef(onBeforeNavigate);
  const onNavigateRef = useRef(onNavigate);
  const onPrepareNavigateRef = useRef(onPrepareNavigate);
  const suppressClickRef = useRef(false);
  const gestureRef = useRef({
    pointerId: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastAt: 0,
    velocity: 0,
    deltaX: 0,
    dragging: false,
    axis: '',
    targetId: '',
    captureElement: null,
  });

  activeIndexRef.current = activeIndex;
  activeIdRef.current = activeId;
  onBeforeNavigateRef.current = onBeforeNavigate;
  onNavigateRef.current = onNavigate;
  onPrepareNavigateRef.current = onPrepareNavigate;

  const clearTransition = useCallback(() => {
    window.clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = 0;
  }, []);

  const clearClickSuppression = useCallback(() => {
    window.clearTimeout(clickTimerRef.current);
    clickTimerRef.current = 0;
    suppressClickRef.current = false;
    delete document.documentElement.dataset.nzPlatformSuppressClick;
  }, []);

  const suppressNextClick = useCallback(() => {
    suppressClickRef.current = true;
    document.documentElement.dataset.nzPlatformSuppressClick = 'true';
    window.clearTimeout(clickTimerRef.current);
    clickTimerRef.current = window.setTimeout(clearClickSuppression, CLICK_SUPPRESSION_DURATION);
  }, [clearClickSuppression]);

  const setIndicator = useCallback((position, direct = false) => {
    const rail = railRef.current;
    if (!rail) return;
    const safePosition = clamp(position, 0, PLATFORM_SECTIONS.length - 1);
    rail.style.setProperty(
      '--nz-platform-indicator-left',
      `${(safePosition * 100) / PLATFORM_SECTIONS.length}%`,
    );
    rail.classList.toggle('is-direct-manipulation', direct);
  }, []);

  const setVisualIndex = useCallback((position, direct = false) => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    if (!isMobileViewport()) {
      track.style.transform = 'none';
      setIndicator(position, true);
      return;
    }
    const width = Math.max(viewport.getBoundingClientRect().width, 1);
    const safePosition = clamp(position, -0.18, PLATFORM_SECTIONS.length - 0.82);
    track.style.transform = `translate3d(${-safePosition * width}px, 0, 0)`;
    setIndicator(safePosition, direct);
  }, [setIndicator]);

  const finishTransition = useCallback((index = activeIndexRef.current) => {
    clearTransition();
    window.cancelAnimationFrame(frameRef.current);
    const viewport = viewportRef.current;
    viewport?.classList.remove('is-dragging', 'is-settling');
    delete document.documentElement.dataset.nzPlatformSwiping;
    setVisualIndex(index, true);
  }, [clearTransition, setVisualIndex]);

  const releasePointer = useCallback((pointerId) => {
    const gesture = gestureRef.current;
    const captureElement = gesture.captureElement;
    gesture.pointerId = null;
    gesture.captureElement = null;
    delete document.documentElement.dataset.nzPlatformSwiping;
    try {
      if (captureElement?.hasPointerCapture?.(pointerId)) {
        captureElement.releasePointerCapture(pointerId);
      }
    } catch {
      // Safari peut perdre la capture lorsque le geste système prend la main.
    }
  }, []);

  const navigationAllowed = useCallback((targetId) => {
    if (!targetId || targetId === activeIdRef.current) return true;
    return onBeforeNavigateRef.current?.(targetId) !== false;
  }, []);

  const animateTo = useCallback((targetId, commit) => {
    const targetIndex = SECTION_INDEX.get(targetId);
    if (targetIndex == null) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    clearTransition();
    const distance = Math.abs(targetIndex - activeIndexRef.current);
    const duration = prefersReducedMotion() ? 1 : Math.min(380, SWIPE_DURATION + Math.max(0, distance - 1) * 35);
    viewport.style.setProperty('--nz-platform-swipe-duration', `${duration}ms`);
    viewport.classList.remove('is-dragging');
    viewport.classList.add('is-settling');
    window.cancelAnimationFrame(frameRef.current);
    frameRef.current = window.requestAnimationFrame(() => setVisualIndex(targetIndex));

    transitionTimerRef.current = window.setTimeout(() => {
      if (!commit) {
        finishTransition(activeIndexRef.current);
        return;
      }

      navigationTargetRef.current = targetId;
      Promise.resolve(onNavigateRef.current?.(targetId)).finally(() => {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = window.requestAnimationFrame(() => {
          finishTransition(targetIndex);
          navigationTargetRef.current = '';
        });
      });
    }, duration + 18);
  }, [clearTransition, finishTransition, setVisualIndex]);

  const cancelGesture = useCallback(() => {
    animateTo(activeIdRef.current, false);
  }, [animateTo]);

  const requestNavigation = useCallback((targetId) => {
    if (!SECTION_INDEX.has(targetId)) return;
    if (targetId === activeIdRef.current) {
      paneRefs.current.get(targetId)?.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      onNavigateRef.current?.(targetId);
      return;
    }
    if (gestureRef.current.pointerId != null || viewportRef.current?.classList.contains('is-settling')) return;
    if (!navigationAllowed(targetId)) return;
    if (!isMobileViewport() || prefersReducedMotion() || !hasPanels) {
      onNavigateRef.current?.(targetId);
      return;
    }
    onPrepareNavigateRef.current?.(targetId);
    animateTo(targetId, true);
  }, [animateTo, hasPanels, navigationAllowed]);

  const onPointerDown = useCallback((event) => {
    if (
      disabled
      || !showNavigation
      || !hasPanels
      || !isMobileViewport()
      || !event.isPrimary
      || event.button > 0
      || gestureRef.current.pointerId != null
      || viewportRef.current?.classList.contains('is-settling')
      || shouldIgnoreSwipe(event.target)
    ) return;

    clearTransition();
    const gesture = gestureRef.current;
    gesture.pointerId = event.pointerId;
    gesture.startX = event.clientX;
    gesture.startY = event.clientY;
    gesture.lastX = event.clientX;
    gesture.lastAt = event.timeStamp;
    gesture.velocity = 0;
    gesture.deltaX = 0;
    gesture.dragging = false;
    gesture.axis = '';
    gesture.targetId = '';
    gesture.captureElement = event.currentTarget;
  }, [clearTransition, disabled, hasPanels, showNavigation]);

  const onPointerMove = useCallback((event) => {
    const gesture = gestureRef.current;
    if (gesture.pointerId !== event.pointerId) return;
    const rawX = event.clientX - gesture.startX;
    const rawY = event.clientY - gesture.startY;

    if (!gesture.axis) {
      if (Math.max(Math.abs(rawX), Math.abs(rawY)) < SWIPE_START_DISTANCE) return;
      if (Math.abs(rawY) >= Math.abs(rawX) * 0.92) {
        gesture.axis = 'vertical';
        releasePointer(event.pointerId);
        return;
      }

      gesture.axis = 'horizontal';
      gesture.dragging = true;
      document.documentElement.dataset.nzPlatformSwiping = 'true';
      viewportRef.current?.classList.add('is-dragging');
      try {
        gesture.captureElement?.setPointerCapture?.(event.pointerId);
      } catch {
        // Le geste reste fonctionnel si le navigateur refuse la capture.
      }
    }

    if (gesture.axis !== 'horizontal') return;
    if (event.cancelable) event.preventDefault();

    const direction = rawX < 0 ? 1 : -1;
    const targetIndex = activeIndexRef.current + direction;
    const hasTarget = targetIndex >= 0 && targetIndex < PLATFORM_SECTIONS.length;
    const deltaX = hasTarget ? rawX : rawX * 0.18;
    const targetId = hasTarget ? PLATFORM_SECTIONS[targetIndex].id : '';
    const elapsed = Math.max(event.timeStamp - gesture.lastAt, 1);
    gesture.velocity = (event.clientX - gesture.lastX) / elapsed;
    gesture.lastX = event.clientX;
    gesture.lastAt = event.timeStamp;
    gesture.deltaX = deltaX;

    if (gesture.targetId !== targetId) {
      gesture.targetId = targetId;
      if (targetId) onPrepareNavigateRef.current?.(targetId);
    }

    const width = Math.max(viewportRef.current?.getBoundingClientRect().width || 1, 1);
    setVisualIndex(activeIndexRef.current - (deltaX / width), true);
  }, [releasePointer, setVisualIndex]);

  const finishGesture = useCallback((event, cancelled = false) => {
    const gesture = gestureRef.current;
    if (gesture.pointerId !== event.pointerId) return;
    const wasDragging = gesture.dragging;
    const targetId = gesture.targetId;
    const deltaX = gesture.deltaX;
    const velocity = gesture.velocity;
    const width = Math.max(viewportRef.current?.getBoundingClientRect().width || 1, 1);
    const threshold = Math.min(92, width * 0.2);
    const velocityCommits = Math.abs(velocity) > 0.42 && Math.sign(velocity) === Math.sign(deltaX);
    const shouldCommit = !cancelled
      && targetId
      && (Math.abs(deltaX) >= threshold || velocityCommits)
      && navigationAllowed(targetId);

    releasePointer(event.pointerId);
    gesture.dragging = false;
    gesture.axis = '';

    if (!wasDragging) {
      gesture.targetId = '';
      gesture.deltaX = 0;
      gesture.velocity = 0;
      return;
    }

    suppressNextClick();
    if (shouldCommit) animateTo(targetId, true);
    else cancelGesture();
  }, [animateTo, cancelGesture, navigationAllowed, releasePointer, suppressNextClick]);

  const onClickCapture = useCallback((event) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    clearClickSuppression();
  }, [clearClickSuppression]);

  useLayoutEffect(() => {
    if (!hasPanels) return;
    const previousIndex = previousIndexRef.current;
    const wasInternalNavigation = navigationTargetRef.current === activeId;

    if (
      previousIndex !== activeIndex
      && !wasInternalNavigation
      && isMobileViewport()
      && showNavigation
      && !prefersReducedMotion()
    ) {
      const viewport = viewportRef.current;
      clearTransition();
      viewport?.classList.add('is-settling');
      viewport?.style.setProperty('--nz-platform-swipe-duration', `${SWIPE_DURATION}ms`);
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = window.requestAnimationFrame(() => setVisualIndex(activeIndex));
      transitionTimerRef.current = window.setTimeout(() => finishTransition(activeIndex), SWIPE_DURATION + 18);
    } else {
      setVisualIndex(activeIndex, true);
    }

    previousIndexRef.current = activeIndex;
  }, [activeId, activeIndex, clearTransition, finishTransition, hasPanels, setVisualIndex, showNavigation]);

  useEffect(() => {
    if (!hasPanels) return undefined;
    const syncWidth = () => {
      if (gestureRef.current.pointerId == null) setVisualIndex(activeIndexRef.current, true);
    };
    window.addEventListener('resize', syncWidth, { passive: true });
    window.addEventListener('orientationchange', syncWidth, { passive: true });
    return () => {
      window.removeEventListener('resize', syncWidth);
      window.removeEventListener('orientationchange', syncWidth);
    };
  }, [hasPanels, setVisualIndex]);

  useEffect(() => () => {
    clearTransition();
    clearClickSuppression();
    window.cancelAnimationFrame(frameRef.current);
    delete document.documentElement.dataset.nzPlatformSwiping;
  }, [clearClickSuppression, clearTransition]);

  const gestureHandlers = {
    onPointerDown,
    onPointerMove,
    onPointerUp: (event) => finishGesture(event),
    onPointerCancel: (event) => finishGesture(event, true),
    onLostPointerCapture: (event) => finishGesture(event, true),
    onClickCapture,
  };

  return (
    <div className={`nz-platform-page-shell ${contained ? 'is-contained' : ''} ${hasPanels ? 'has-platform-panels' : ''}`}>
      <div
        ref={viewportRef}
        className={`nz-platform-swipe-viewport ${viewportClassName}`}
        {...gestureHandlers}
      >
        {hasPanels ? (
          <div ref={trackRef} className="nz-platform-panels">
            {PLATFORM_SECTIONS.map((item) => {
              const active = item.id === activeId;
              return (
                <section
                  key={item.id}
                  ref={(node) => {
                    if (node) paneRefs.current.set(item.id, node);
                    else paneRefs.current.delete(item.id);
                  }}
                  className={`nz-platform-pane ${active ? 'is-active' : ''}`}
                  data-platform-section={item.id}
                  aria-label={item.label}
                  aria-hidden={!active}
                  inert={active ? undefined : ''}
                >
                  {sections[item.id]}
                </section>
              );
            })}
          </div>
        ) : (
          <div className="nz-platform-swipe-current">{children}</div>
        )}
      </div>

      {showNavigation ? (
        <nav
          className="nz-mobile-platform-nav"
          aria-label={contained ? 'Navigation principale Nzela' : 'Navigation mobile'}
          {...gestureHandlers}
        >
          <div
            ref={railRef}
            className="nz-mobile-platform-rail"
            data-active-index={activeIndex}
          >
            {PLATFORM_SECTIONS.map((item) => {
              const Icon = item.icon;
              const active = item.id === activeId;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Navigation ${item.label}`}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => requestNavigation(item.id)}
                  className={active ? 'is-active text-blue-700 nz-mobile-active' : ''}
                >
                  <Icon size={20} strokeWidth={active ? 2.35 : 1.85} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
