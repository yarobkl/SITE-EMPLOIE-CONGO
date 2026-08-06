import { useEffect, useMemo, useRef, useState } from 'react';
import { Briefcase, Building2, Home, User } from 'lucide-react';
import './mobile-platform-shell.css';

export const PLATFORM_SECTIONS = [
  { id: 'home', label: 'Accueil', icon: Home },
  { id: 'jobs', label: 'Offres', icon: Briefcase },
  { id: 'immobilier', label: 'Immobilier', icon: Building2 },
  { id: 'profile', label: 'Profil', icon: User },
];

const SECTION_INDEX = new Map(PLATFORM_SECTIONS.map((item, index) => [item.id, index]));
const SWIPE_START_DISTANCE = 10;
const SWIPE_DURATION = 280;
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
    'input, textarea, select, [contenteditable="true"], [data-platform-swipe="ignore"], .nz2-thumbs',
  ));
}

function SectionPreview({ sectionId }) {
  const section = PLATFORM_SECTIONS.find((item) => item.id === sectionId) || PLATFORM_SECTIONS[0];
  const Icon = section.icon;

  return (
    <div className={`nz-platform-destination is-${section.id}`}>
      <div className="nz-platform-destination-kicker">
        <span><Icon size={19} /></span>
        {section.id === 'immobilier' ? 'Nzela Immobilier' : 'Nzela Jobs'}
      </div>
      <h2>
        {section.id === 'home' && "Trouvez l’emploi qui vous correspond"}
        {section.id === 'jobs' && "Les offres d’emploi disponibles"}
        {section.id === 'immobilier' && 'Un logement à trouver ou à publier, simplement.'}
        {section.id === 'profile' && 'Votre profil et votre espace personnel'}
      </h2>
      <div className="nz-platform-destination-card">
        <span />
        <span />
        <span />
      </div>
      <div className="nz-platform-destination-row">
        <span />
        <span />
      </div>
    </div>
  );
}

export default function MobilePlatformShell({
  activeId,
  children,
  contained = false,
  disabled = false,
  onNavigate,
  onPrepareNavigate,
  showNavigation = true,
  viewportClassName = '',
}) {
  const activeIndex = SECTION_INDEX.get(activeId) ?? 0;
  const [previewId, setPreviewId] = useState(null);
  const viewportRef = useRef(null);
  const railRef = useRef(null);
  const transitionTimerRef = useRef(0);
  const clickSuppressionTimerRef = useRef(0);
  const frameRef = useRef(0);
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
    targetId: null,
    suppressClick: false,
    captureElement: null,
  });

  const previewIndex = useMemo(() => (
    previewId ? SECTION_INDEX.get(previewId) : null
  ), [previewId]);

  const clearTransitionTimer = () => {
    window.clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = 0;
  };

  const clearClickSuppression = () => {
    window.clearTimeout(clickSuppressionTimerRef.current);
    clickSuppressionTimerRef.current = 0;
    gestureRef.current.suppressClick = false;
    delete document.documentElement.dataset.nzPlatformSuppressClick;
  };

  const scheduleClickSuppressionClear = () => {
    window.clearTimeout(clickSuppressionTimerRef.current);
    clickSuppressionTimerRef.current = window.setTimeout(
      clearClickSuppression,
      CLICK_SUPPRESSION_DURATION,
    );
  };

  const setIndicator = (position, immediate = false) => {
    const rail = railRef.current;
    if (!rail) return;
    const safePosition = clamp(position, 0, PLATFORM_SECTIONS.length - 1);
    rail.style.setProperty('--nz-platform-indicator-left', `${(safePosition * 100) / PLATFORM_SECTIONS.length}%`);
    rail.classList.toggle('is-direct-manipulation', immediate);
  };

  const setVisualPosition = (deltaX, targetId = gestureRef.current.targetId) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const width = Math.max(viewport.getBoundingClientRect().width, 1);
    const safeDeltaX = clamp(deltaX, -width, width);
    const targetIndex = targetId ? SECTION_INDEX.get(targetId) : null;
    const direction = targetIndex == null ? 0 : Math.sign(targetIndex - activeIndex);
    const progress = clamp(Math.abs(safeDeltaX) / width, 0, 1);

    viewport.style.setProperty('--nz-platform-page-x', `${safeDeltaX}px`);
    viewport.style.setProperty('--nz-platform-preview-origin', `${direction * width}px`);
    viewport.style.setProperty('--nz-platform-preview-opacity', String(clamp(progress * 1.35, 0, 1)));
    setIndicator(activeIndex + (-safeDeltaX / width), true);
  };

  const resetVisuals = (animate = false) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.classList.toggle('is-settling', animate && !prefersReducedMotion());
    setVisualPosition(0, null);
    setIndicator(activeIndex, !animate);
    if (!animate) {
      viewport.classList.remove('is-dragging', 'is-settling');
      setPreviewId(null);
    }
  };

  const completeNavigation = (targetId) => {
    Promise.resolve().then(() => onNavigate?.(targetId)).finally(() => {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = window.requestAnimationFrame(() => {
        const viewport = viewportRef.current;
        viewport?.classList.remove('is-dragging', 'is-settling');
        if (viewport) {
          viewport.style.setProperty('--nz-platform-page-x', '0px');
          viewport.style.setProperty('--nz-platform-preview-opacity', '0');
        }
        setPreviewId(null);
        setIndicator(SECTION_INDEX.get(targetId) ?? activeIndex, true);
      });
    });
  };

  const settleTo = (targetId) => {
    const viewport = viewportRef.current;
    if (!viewport || !targetId) return;
    clearTransitionTimer();
    const targetIndex = SECTION_INDEX.get(targetId);
    const direction = Math.sign(targetIndex - activeIndex);
    const width = Math.max(viewport.getBoundingClientRect().width, 1);

    if (prefersReducedMotion()) {
      completeNavigation(targetId);
      return;
    }

    viewport.classList.remove('is-dragging');
    viewport.classList.add('is-settling');
    setPreviewId(targetId);
    gestureRef.current.targetId = targetId;
    window.cancelAnimationFrame(frameRef.current);
    frameRef.current = window.requestAnimationFrame(() => {
      setVisualPosition(-direction * width, targetId);
      setIndicator(targetIndex);
    });
    transitionTimerRef.current = window.setTimeout(() => completeNavigation(targetId), SWIPE_DURATION + 25);
  };

  const requestNavigation = (targetId) => {
    if (
      !SECTION_INDEX.has(targetId)
      || gestureRef.current.pointerId != null
      || viewportRef.current?.classList.contains('is-settling')
    ) return;
    if (targetId === activeId) {
      onNavigate?.(targetId);
      return;
    }
    if (!isMobileViewport() || prefersReducedMotion()) {
      onNavigate?.(targetId);
      return;
    }

    clearTransitionTimer();
    resetVisuals(false);
    setPreviewId(targetId);
    gestureRef.current.targetId = targetId;
    onPrepareNavigate?.(targetId);
    window.cancelAnimationFrame(frameRef.current);
    frameRef.current = window.requestAnimationFrame(() => {
      setVisualPosition(0, targetId);
      frameRef.current = window.requestAnimationFrame(() => settleTo(targetId));
    });
  };

  const releasePointer = (pointerId) => {
    const captureElement = gestureRef.current.captureElement;
    try {
      if (captureElement?.hasPointerCapture?.(pointerId)) captureElement.releasePointerCapture(pointerId);
    } catch {
      // Safari peut perdre la capture lors d'un geste système. Le nettoyage reste identique.
    }
    gestureRef.current.pointerId = null;
    gestureRef.current.captureElement = null;
    delete document.documentElement.dataset.nzPlatformSwiping;
  };

  const onPointerDown = (event) => {
    if (
      disabled
      || !showNavigation
      || !isMobileViewport()
      || !event.isPrimary
      || event.button > 0
      || gestureRef.current.pointerId != null
      || viewportRef.current?.classList.contains('is-settling')
      || shouldIgnoreSwipe(event.target)
    ) return;

    clearTransitionTimer();
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
    gesture.targetId = null;
    gesture.suppressClick = false;
    gesture.captureElement = event.currentTarget;
  };

  const onPointerMove = (event) => {
    const gesture = gestureRef.current;
    if (gesture.pointerId !== event.pointerId) return;
    const rawX = event.clientX - gesture.startX;
    const rawY = event.clientY - gesture.startY;

    if (!gesture.axis) {
      if (Math.max(Math.abs(rawX), Math.abs(rawY)) < SWIPE_START_DISTANCE) return;
      if (Math.abs(rawY) >= Math.abs(rawX) * 0.9) {
        gesture.axis = 'vertical';
        releasePointer(event.pointerId);
        return;
      }
      gesture.axis = 'horizontal';
      gesture.dragging = true;
      gesture.suppressClick = true;
      document.documentElement.dataset.nzPlatformSuppressClick = 'true';
      document.documentElement.dataset.nzPlatformSwiping = 'true';
      viewportRef.current?.classList.add('is-dragging');
      try {
        gesture.captureElement?.setPointerCapture?.(event.pointerId);
      } catch {
        // Le déplacement continue sans capture si le navigateur la refuse.
      }
    }

    if (gesture.axis !== 'horizontal') return;
    if (event.cancelable) event.preventDefault();

    const direction = rawX < 0 ? 1 : -1;
    const targetIndex = activeIndex + direction;
    const hasTarget = targetIndex >= 0 && targetIndex < PLATFORM_SECTIONS.length;
    const deltaX = hasTarget ? rawX : rawX * 0.18;
    const nextTargetId = hasTarget ? PLATFORM_SECTIONS[targetIndex].id : null;
    const elapsed = Math.max(event.timeStamp - gesture.lastAt, 1);
    gesture.velocity = (event.clientX - gesture.lastX) / elapsed;
    gesture.lastX = event.clientX;
    gesture.lastAt = event.timeStamp;
    gesture.deltaX = deltaX;

    if (gesture.targetId !== nextTargetId) {
      gesture.targetId = nextTargetId;
      setPreviewId(nextTargetId);
      if (nextTargetId) onPrepareNavigate?.(nextTargetId);
    }
    setVisualPosition(deltaX, nextTargetId);
  };

  const finishGesture = (event, cancelled = false) => {
    const gesture = gestureRef.current;
    if (gesture.pointerId !== event.pointerId) return;
    const wasDragging = gesture.dragging;
    const targetId = gesture.targetId;
    const deltaX = gesture.deltaX;
    const velocity = gesture.velocity;
    const width = Math.max(viewportRef.current?.getBoundingClientRect().width || 1, 1);
    const threshold = Math.min(96, width * 0.22);
    const velocityCommits = Math.abs(velocity) > 0.42 && Math.sign(velocity) === Math.sign(deltaX);
    const shouldCommit = !cancelled && targetId && (Math.abs(deltaX) >= threshold || velocityCommits);

    releasePointer(event.pointerId);
    gesture.dragging = false;
    gesture.axis = '';

    // Un appui simple doit rester un clic normal. L'ancienne logique ajoutait ici
    // `is-settling`, puis le clic de la rubrique était rejeté juste après.
    if (!wasDragging) {
      gesture.targetId = null;
      gesture.deltaX = 0;
      gesture.velocity = 0;
      clearClickSuppression();
      resetVisuals(false);
      return;
    }

    if (shouldCommit) {
      scheduleClickSuppressionClear();
      settleTo(targetId);
      return;
    }

    const viewport = viewportRef.current;
    viewport?.classList.remove('is-dragging');
    viewport?.classList.add('is-settling');
    setVisualPosition(0, targetId);
    setIndicator(activeIndex);
    transitionTimerRef.current = window.setTimeout(() => {
      viewport?.classList.remove('is-settling');
      setPreviewId(null);
      gesture.targetId = null;
    }, SWIPE_DURATION + 10);

    scheduleClickSuppressionClear();
  };

  const onClickCapture = (event) => {
    const gesture = gestureRef.current;
    if (!gesture.suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
    clearClickSuppression();
  };

  useEffect(() => {
    resetVisuals(false);
  }, [activeId]);

  useEffect(() => () => {
    clearTransitionTimer();
    clearClickSuppression();
    window.cancelAnimationFrame(frameRef.current);
    delete document.documentElement.dataset.nzPlatformSwiping;
  }, []);

  return (
    <div className={`nz-platform-page-shell ${contained ? 'is-contained' : ''}`}>
      <div
        ref={viewportRef}
        className={`nz-platform-swipe-viewport ${viewportClassName}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => finishGesture(event)}
        onPointerCancel={(event) => finishGesture(event, true)}
        onLostPointerCapture={(event) => finishGesture(event, true)}
        onClickCapture={onClickCapture}
      >
        {previewId && previewIndex != null && (
          <div className="nz-platform-swipe-preview" aria-hidden="true" inert="">
            <SectionPreview sectionId={previewId} />
          </div>
        )}
        <div className="nz-platform-swipe-current">{children}</div>
      </div>

      {showNavigation && (
        <nav
          className="nz-mobile-platform-nav"
          aria-label={contained ? 'Navigation principale Nzela' : 'Navigation mobile'}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(event) => finishGesture(event)}
          onPointerCancel={(event) => finishGesture(event, true)}
          onLostPointerCapture={(event) => finishGesture(event, true)}
          onClickCapture={onClickCapture}
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
                  <Icon size={21} strokeWidth={active ? 2.35 : 1.85} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
