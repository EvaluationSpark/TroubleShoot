# FixIntel AI - EAS Build Guide

## Prerequisites

1. **Install EAS CLI globally:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Link the project (first time only):**
   ```bash
   cd /app/frontend
   eas build:configure
   ```

---

## Build Profiles

### 1. Development Build
For testing on physical devices with development features enabled.

```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

**Features:**
- Development client enabled
- Internal distribution
- Can connect to Metro bundler for live reload

### 2. Preview Build
For internal testing without development client.

```bash
eas build --profile preview --platform ios
eas build --profile preview --platform android
```

**Features:**
- Internal distribution
- Android: APK format (for easy sharing)
- No development client
- Production-like environment

### 3. Production Build
For App Store/Play Store submission.

```bash
eas build --profile production --platform ios
eas build --profile production --platform android
```

**Features:**
- Production environment variables
- Optimized bundles
- Ready for store submission

---

## Environment Variables

The following environment variables are automatically included in builds:

- `EXPO_PUBLIC_BACKEND_URL`: https://fixgenius-4.preview.emergentagent.com
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`: (from .env)
- `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`: (from .env)

**Note:** Only variables prefixed with `EXPO_PUBLIC_` are available at runtime.

---

## Step-by-Step Build Process

### iOS Build

1. **First Time Setup:**
   ```bash
   eas build:configure --platform ios
   ```

2. **Generate Credentials (if needed):**
   ```bash
   eas credentials
   ```
   - Select iOS
   - Choose "Build Credentials"
   - Let EAS manage certificates automatically

3. **Build for iOS:**
   ```bash
   eas build --profile production --platform ios
   ```

4. **Submit to App Store:**
   ```bash
   eas submit --platform ios
   ```

### Android Build

1. **First Time Setup:**
   ```bash
   eas build:configure --platform android
   ```

2. **Generate Keystore (if needed):**
   ```bash
   eas credentials
   ```
   - Select Android
   - Choose "Build Credentials"
   - Let EAS generate keystore automatically

3. **Build for Android:**
   ```bash
   eas build --profile production --platform android
   ```

4. **Submit to Play Store:**
   ```bash
   eas submit --platform android
   ```

---

## Build Configuration Details

### app.json Configuration
- **App Name**: FixIntel AI
- **Slug**: fixintel-ai
- **Bundle Identifier (iOS)**: com.fixintel.ai
- **Package Name (Android)**: com.fixintel.ai
- **Version**: 1.0.0

### Permissions
- Camera (for repair image analysis)
- Photo Library (for selecting images)
- Location (for finding local repair shops)
- Notifications (for repair reminders)

---

## Testing Builds

### Install Development Build:
```bash
eas build:run --profile development --platform ios
# or
eas build:run --profile development --platform android
```

### Install Preview Build:
After build completes, EAS provides:
- QR code to download
- Direct download link
- Can share with testers via email

---

## Common Issues & Solutions

### Issue 1: "Build failed - missing credentials"
**Solution:** Run `eas credentials` and let EAS generate them automatically.

### Issue 2: "Environment variable not available"
**Solution:** Ensure variable is prefixed with `EXPO_PUBLIC_` in .env file.

### Issue 3: "Bundle identifier/package name conflict"
**Solution:** Change values in app.json under `ios.bundleIdentifier` and `android.package`.

### Issue 4: "Native modules not working"
**Solution:** Use development build profile, not Expo Go app.

---

## Post-Build Checklist

- [ ] Test all core features (AI analysis, videos, local vendors)
- [ ] Verify GPS location works on real device
- [ ] Test camera and photo library permissions
- [ ] Verify backend API connectivity
- [ ] Test offline functionality
- [ ] Verify in-app purchases (if using Stripe)
- [ ] Test push notifications
- [ ] Check app icons and splash screen

---

## Monitoring Builds

View all builds in Expo dashboard:
```bash
eas build:list
```

Or visit: https://expo.dev/accounts/[your-username]/projects/fixintel-ai/builds

---

## Update Configuration (OTA Updates)

After initial build, you can push code updates without rebuilding:

```bash
eas update --branch production --message "Fix: Updated repair analysis"
```

**Note:** Only works for JavaScript changes, not native code changes.

---

## Support

- EAS Documentation: https://docs.expo.dev/build/introduction/
- Expo Forums: https://forums.expo.dev/
- Discord: https://chat.expo.dev/

---

## Next Steps

1. Run `eas build:configure` to initialize
2. Choose a build profile (development/preview/production)
3. Run the build command
4. Wait for build to complete (~15-30 minutes)
5. Download and test on device
6. Submit to stores when ready

Good luck with your build! 🚀
