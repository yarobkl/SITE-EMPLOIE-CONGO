import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Network } from '@capacitor/network';
import { PushNotifications } from '@capacitor/push-notifications';
import { Share } from '@capacitor/share';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

export const isNativeApp = Capacitor.isNativePlatform();
export const nativeRedirectUrl = 'com.nzela.app://auth/callback';

export function getPlatformRedirectUrl() {
  return isNativeApp ? nativeRedirectUrl : window.location.origin;
}

export async function openExternalAuth(url) {
  if (isNativeApp) {
    await Browser.open({ url, presentationStyle: 'fullscreen' });
    return;
  }
  window.location.assign(url);
}

export async function closeExternalAuth() {
  if (!isNativeApp) return;
  try {
    await Browser.close();
  } catch {
    // Browser may already be closed by iOS after the app link callback.
  }
}

export async function shareNzelaItem({ title, text, url }) {
  if (isNativeApp) {
    await Share.share({ title, text, url, dialogTitle: title });
    return;
  }
  if (navigator.share) {
    await navigator.share({ title, text, url });
    return;
  }
  await navigator.clipboard.writeText(`${text} ${url}`);
}

export async function nativeSuccessFeedback() {
  if (!isNativeApp) return;
  await Haptics.notification({ type: NotificationType.Success });
}

export async function nativeLightFeedback() {
  if (!isNativeApp) return;
  await Haptics.impact({ style: ImpactStyle.Light });
}

export async function pickPropertyPhotos() {
  if (!isNativeApp) return [];
  const result = await Camera.pickImages({
    quality: 78,
    limit: 10,
  });
  return result.photos || [];
}

export async function takePropertyPhoto() {
  if (!isNativeApp) return null;
  return Camera.getPhoto({
    quality: 78,
    resultType: CameraResultType.Uri,
    source: CameraSource.Camera,
  });
}

export async function registerPushNotifications() {
  if (!isNativeApp) return { status: 'web' };
  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== 'granted') return { status: 'denied' };
  await PushNotifications.register();
  return { status: 'requested' };
}

export function installNativeAppBridge({ onNetworkChange } = {}) {
  const removers = [];

  async function setup() {
    if (!isNativeApp) {
      onNetworkChange?.(navigator.onLine ? 'online' : 'offline');
      const updateWebNetwork = () => onNetworkChange?.(navigator.onLine ? 'online' : 'offline');
      window.addEventListener('online', updateWebNetwork);
      window.addEventListener('offline', updateWebNetwork);
      removers.push(() => {
        window.removeEventListener('online', updateWebNetwork);
        window.removeEventListener('offline', updateWebNetwork);
      });
      return;
    }

    await StatusBar.setStyle({ style: Style.Light });
    await SplashScreen.hide();

    const status = await Network.getStatus();
    onNetworkChange?.(status.connected ? 'online' : 'offline');

    const networkListener = await Network.addListener('networkStatusChange', (state) => {
      onNetworkChange?.(state.connected ? 'online' : 'offline');
    });
    removers.push(() => networkListener.remove());

    const appUrlListener = await CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
      await closeExternalAuth();
      window.dispatchEvent(new CustomEvent('nzela:native-url', { detail: { url } }));
    });
    removers.push(() => appUrlListener.remove());
  }

  setup();

  return () => {
    removers.forEach((remove) => remove());
  };
}
