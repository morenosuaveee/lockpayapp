/**
 * Native bridge — safe to call from the web build.
 * Every helper no-ops when running outside a Capacitor shell.
 */
import { Capacitor } from '@capacitor/core';

export const isNative = () => Capacitor.isNativePlatform();
export const platform = () => Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

/* ---------- Status bar + splash ---------- */
export async function initNativeChrome() {
  if (!isNative()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Light });
    if (platform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#ffffff' });
    }
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide({ fadeOutDuration: 250 });
  } catch (e) {
    console.warn('[native] chrome init failed', e);
  }
}

/* ---------- Haptics ---------- */
export async function haptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
    await Haptics.impact({ style: map[style] });
  } catch {}
}

/* ---------- Push notifications ---------- */
export async function registerPushNotifications(
  onToken?: (token: string) => void,
  onNotification?: (n: unknown) => void,
) {
  if (!isNative()) return null;
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== 'granted') return null;

    PushNotifications.addListener('registration', (t) => onToken?.(t.value));
    PushNotifications.addListener('registrationError', (e) =>
      console.error('[push] registration error', e),
    );
    if (onNotification) {
      PushNotifications.addListener('pushNotificationReceived', onNotification);
      PushNotifications.addListener('pushNotificationActionPerformed', onNotification);
    }
    await PushNotifications.register();
    return true;
  } catch (e) {
    console.warn('[push] register failed', e);
    return null;
  }
}

/* ---------- Camera ---------- */
export async function takePhoto() {
  if (!isNative()) throw new Error('Camera only available on device');
  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
  return Camera.getPhoto({
    quality: 85,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Prompt,
  });
}

/* ---------- Biometrics ---------- */
export async function biometricAvailable() {
  if (!isNative()) return false;
  try {
    const { NativeBiometric } = await import('capacitor-native-biometric');
    const r = await NativeBiometric.isAvailable();
    return r.isAvailable;
  } catch {
    return false;
  }
}

export async function biometricAuthenticate(reason = 'Confirm it’s you') {
  if (!isNative()) throw new Error('Biometrics only available on device');
  const { NativeBiometric } = await import('capacitor-native-biometric');
  await NativeBiometric.verifyIdentity({
    reason,
    title: 'LockPay',
    subtitle: 'Authentication required',
    description: reason,
  });
  return true;
}
