# LockPay — Capacitor (iOS / Android)

Native wrapper for the LockPay web app. The web build (Vite + React) runs
inside a Capacitor WebView on iOS and Android. Supabase, Twilio Verify,
and Stripe integrations all keep working unchanged.

> Lovable's hosted preview already serves the web app. Capacitor only
> matters when you want to compile a real `.ipa` / `.aab` for the App
> Store / Play Store (or for a TestFlight / internal track).

## One-time setup (on your machine)

1. Push this project to GitHub via Lovable (Plus → GitHub → Connect).
2. `git clone` your repo and `cd` into it.
3. `npm install`
4. Add the native shells:
   ```bash
   npx cap add ios
   npx cap add android
   ```
5. Build the web bundle and sync it into the native projects:
   ```bash
   npm run build
   npx cap sync
   ```

## Run on a device / simulator

- **iOS** (requires macOS + Xcode):
  ```bash
  npx cap run ios
  ```
- **Android** (requires Android Studio):
  ```bash
  npx cap run android
  ```

During development, `capacitor.config.ts` points the WebView at the
Lovable sandbox URL so you get hot-reload. **Comment out the `server`
block before producing a release build** so the app loads its bundled
`dist/` assets instead.

## App icons & splash screen

Drop a 1024×1024 `icon.png` and a 2732×2732 `splash.png` into
`resources/` (create the folder), then run:

```bash
npx capacitor-assets generate
```

This populates every required iOS / Android density automatically.

## Permissions already configured

| Capability        | Plugin                        | Notes                                           |
| ----------------- | ----------------------------- | ----------------------------------------------- |
| Push notifications | `@capacitor/push-notifications` | Auto-requests on first launch via `src/lib/native.ts`. Token is saved to `profiles.expo_push_token`. |
| Camera            | `@capacitor/camera`           | Call `takePhoto()` from `src/lib/native.ts`.    |
| Biometrics        | `capacitor-native-biometric`  | `biometricAuthenticate()` for Face ID / Touch ID. |
| Haptics           | `@capacitor/haptics`          | `haptic('light' | 'medium' | 'heavy')`.         |
| Status bar        | `@capacitor/status-bar`       | Light style, white background.                  |
| Splash            | `@capacitor/splash-screen`    | 1.5s, auto-hides.                               |

You will still need to add the matching usage strings on iOS:

`ios/App/App/Info.plist` — add **after** `npx cap add ios`:

```xml
<key>NSCameraUsageDescription</key>
<string>LockPay uses the camera to capture receipts and verify identity.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>LockPay needs access to attach images to your transactions.</string>
<key>NSFaceIDUsageDescription</key>
<string>LockPay uses Face ID to confirm payment unlocks.</string>
```

For push on iOS, enable **Push Notifications** + **Background Modes →
Remote notifications** in Xcode and configure your APNs key in Apple
Developer.

For push on Android, drop your `google-services.json` into
`android/app/`.

## Production push notifications

The current backend uses the **Expo Push API** (`send-push` edge
function). On a pure Capacitor build you have two options:

1. Keep a managed push provider (OneSignal, Firebase Cloud Messaging,
   APNs direct) and update `send-push` to call its API.
2. Continue routing through Expo Push by including the Expo
   notifications service in your native project.

For development, the existing flow already stores whatever token
`PushNotifications.register()` returns into `profiles.expo_push_token`,
so backend wiring can be swapped without touching the UI.

## EAS Build

EAS is Expo-specific — Capacitor projects don't use it. The equivalent
managed build services for Capacitor are:

- **Ionic Appflow** (`appflow.ionic.io`) — cloud builds + live updates
- **Codemagic** / **Bitrise** / **GitHub Actions** for CI builds
- Local builds via Xcode and Android Studio for App Store / Play Store
  submission

All three accept this project as-is (it's a standard Capacitor app).
