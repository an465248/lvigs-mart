# PHASE 7 — Mobile Release

Generated: 2026-09-08

---

## Current Mobile Status

| Component | Status | Evidence |
|-----------|--------|----------|
| Flutter SDK | BLOCKED_EXTERNAL | Not installed |
| Dart SDK | BLOCKED_EXTERNAL | Not installed |
| Firebase config | PASS | google-services.json present |
| API service | PASS | 15 API methods |
| Auth service | PASS | Firebase phone auth |
| Android config | PASS | minSdk 23, Firebase plugin |
| iOS config | NOT_CONFIGURED | No iOS setup |
| Release signing | NOT_CONFIGURED | Using debug keys |
| Production API | NEEDS_UPDATE | Hardcoded LAN IP |

## Flutter Installation

```bash
# Install Flutter SDK
git clone https://github.com/flutter/flutter.git -b stable
export PATH="$PATH:$(pwd)/flutter/bin"

# Verify installation
flutter doctor

# Expected output:
# [✓] Flutter (Channel stable, 3.x.x)
# [✓] Android toolchain
# [✗] Chrome (optional)
# [✓] Android Studio (if installed)
# [✓] VS Code (if installed)
# [!] Connected device
```

## Android Release Build

### Step 1: Configure Signing

```bash
# Generate release keystore
keytool -genkey -v -keystore /path/to/release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias lvigsmart

# Create key.properties
cat > android/key.properties << EOF
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=lvigsmart
storeFile=/path/to/release-key.jks
EOF
```

### Step 2: Update build.gradle

```gradle
// android/app/build.gradle
android {
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 3: Update API URL

```dart
// lib/config.dart
static const String baseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://api.YOUR_DOMAIN/api',  // Production URL
);
```

### Step 4: Build APK

```bash
# Debug APK
flutter build apk

# Release APK
flutter build apk --release

# Release AAB (for Play Store)
flutter build appbundle --release

# With custom API URL
flutter build apk --release --dart-define=API_BASE_URL=https://api.YOUR_DOMAIN/api
```

### Step 5: Output

```
build/app/outputs/flutter-apk/app-release.apk
build/app/outputs/bundle/release/app-release.aab
```

## iOS Release (Future)

### Prerequisites

- macOS with Xcode
- Apple Developer Account
- iOS signing certificates

### Steps

```bash
# Install CocoaPods
sudo gem install cocoapods

# Setup iOS
cd ios && pod install && cd ..

# Configure signing in Xcode
# 1. Open ios/Runner.xcworkspace
# 2. Select Runner target
# 3. Set Development Team
# 4. Set Bundle Identifier

# Build
flutter build ios --release
```

## Firebase Configuration

### Android

- File: `android/app/google-services.json`
- Status: Present and configured
- Package: `com.lvigsmart.app`

### iOS (When ready)

- File: `ios/Runner/GoogleService-Info.plist`
- Status: Not configured
- Bundle ID: `com.lvigsmart.app`

## Play Store Submission

### Requirements

1. Signed AAB file
2. Play Store listing (title, description, screenshots)
3. Privacy policy URL
4. Content rating questionnaire
5. Data safety form

### Command

```bash
# Build for Play Store
flutter build appbundle --release

# Upload to Play Console
# https://play.google.com/console
```

## Verification Checklist

- [ ] Flutter SDK installed
- [ ] Android Studio installed
- [ ] Release keystore generated
- [ ] key.properties configured
- [ ] build.gradle updated for release signing
- [ ] API URL updated for production
- [ ] Firebase config verified
- [ ] APK builds successfully
- [ ] AAB builds successfully
- [ ] App tested on physical device
- [ ] Play Store listing prepared
