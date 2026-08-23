import { lazy, Suspense, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

const MessagingCenterV2 = lazy(() => import('./MessagingCenterV2.jsx'));
const MessagingKeyboardShortcut = lazy(() => import('./MessagingKeyboardShortcut.jsx'));
const GlobalApplicationsCenterV2 = lazy(() => import('./GlobalApplicationsCenterV2.jsx'));
const PlatformPresenceTracker = lazy(() => import('./PlatformPresenceTracker.jsx'));
const OfferLifecycleCenter = lazy(() => import('./OfferLifecycleCenter.jsx'));
const OfferLifecycleMobileTrigger = lazy(() => import('./OfferLifecycleMobileTrigger.jsx'));
const PrivacyComplianceExperience = lazy(() => import('./PrivacyComplianceExperience.jsx'));
const JobViewCounterExperience = lazy(() => import('./JobViewCounterExperience.jsx'));
const TalentMarketplaceExperience = lazy(() => import('./TalentMarketplaceExperience.jsx'));
const RecruiterTrustCenter = lazy(() => import('./RecruiterTrustCenter.jsx'));

export default function DeferredPlatformEnhancements() {
  const [ready, setReady] = useState(false);
  const nativeApp = Capacitor.isNativePlatform();

  useEffect(() => {
    const activate = () => setReady(true);

    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(activate, { timeout: 900 });
      return () => window.cancelIdleCallback?.(id);
    }

    const timer = window.setTimeout(activate, 120);
    return () => window.clearTimeout(timer);
  }, []);

  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <MessagingCenterV2 />
      <MessagingKeyboardShortcut />
      <GlobalApplicationsCenterV2 />
      <PlatformPresenceTracker />
      <OfferLifecycleCenter />
      <OfferLifecycleMobileTrigger />
      <JobViewCounterExperience />
      <TalentMarketplaceExperience />
      <RecruiterTrustCenter />
      {!nativeApp && <PrivacyComplianceExperience />}
    </Suspense>
  );
}
