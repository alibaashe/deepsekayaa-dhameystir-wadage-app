# Wadaage Mobility — Apple App Store Release Guide (iOS)

**Prepared for:** Wadaage Mobility (Hargeisa, Somaliland)
**Apps:** `Wadaage Taxi` (Rider App - `com.wadaage.rider`) · `Wadaage Driver` (Driver Partner App - `com.wadaage.driver`)

---

## 📱 Overview of iOS App Store Publishing

Because iOS app building (`.ipa` and Xcode archiving) strictly requires macOS and Xcode (Apple's proprietary build toolchain), this guide details the exact step-by-step instructions and Capacitor configuration to build, sign, and submit both **Wadaage Taxi** and **Wadaage Driver** to the Apple App Store via App Store Connect.

---

## 1. Prerequisites (macOS Environment)
1. **Mac computer** running macOS Sequoia or Sonoma.
2. **Xcode** (latest version from the Mac App Store).
3. **Apple Developer Program Account** ($99/year individual or organization) at [developer.apple.com](https://developer.apple.com).
4. **Node.js & npm** installed on macOS.

---

## 2. Preparing the Project for iOS

If you have downloaded the project source code on your Mac:

```bash
# 1. Install dependencies
npm install

# 2. Build web bundle for Rider and Driver
npm run build:rider
# or npm run build:driver
```

### Capacitor iOS Setup

Capacitor supports multi-app or single-project iOS builds. You can initialize Capacitor iOS projects for rider and driver:

```bash
# Add Capacitor iOS plugin (if not already added)
npx cap add ios

# For Rider App:
cp capacitor-rider.config.json capacitor.config.json
npx cap sync ios
npx cap open ios

# For Driver App:
cp capacitor-driver.config.json capacitor.config.json
npx cap sync ios
npx cap open ios
```

---

## 3. Configuring App Store Connect & Xcode

1. Log in to [App Store Connect](https://appstoreconnect.apple.com).
2. Go to **My Apps** → **+** → **New App**:
   - **App 1 (Rider):**
     - Platform: iOS
     - Name: Wadaage Taxi
     - Primary Language: English (US) / Somali
     - Bundle ID: `com.wadaage.rider`
     - SKU: `WADAAGE_RIDER_IOS`
   - **App 2 (Driver):**
     - Platform: iOS
     - Name: Wadaage Driver
     - Primary Language: English (US) / Somali
     - Bundle ID: `com.wadaage.driver`
     - SKU: `WADAAGE_DRIVER_IOS`

3. **In Xcode:**
   - Open `ios/App/App.xcodeproj`.
   - Select the **Signing & Capabilities** tab.
   - Select your Apple Developer Team.
   - Ensure **Automatically manage signing** is checked.
   - Verify Bundle Identifier matches `com.wadaage.rider` (or `com.wadaage.driver`).

---

## 4. Required Privacy & Permission Strings (`Info.plist`)

Ensure your `ios/App/App/Info.plist` includes the mandatory permission descriptions required by Apple App Store review:

```xml
<!-- Location Permissions -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>Wadaage uses your location to show your pickup spot and nearby captains in Hargeisa.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Wadaage Driver needs background location to track your route and meter active trips while driving.</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>Wadaage Driver needs location access to receive ride requests near you.</string>

<!-- Camera & Photo Library (for KYC Driver Documents & Profile Pictures) -->
<key>NSCameraUsageDescription</key>
<string>Wadaage requires camera access to scan your Somaliland ID and Driver's License for KYC verification.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Wadaage requires photo library access to upload profile pictures and vehicle documents.</string>
```

---

## 5. Archiving and Uploading to App Store Connect

1. In Xcode, select **Any iOS Device (arm64)** as the build target.
2. Go to menu: **Product** → **Archive**.
3. Once the archive finishes compiling, the **Organizer** window will open.
4. Click **Distribute App** → **App Store Connect** → **Upload**.
5. Follow the prompts to sign and upload the build.
6. Repeat for both Rider and Driver apps.

---

## 6. App Store Listing Metadata (Ready to Paste)

### Wadaage Taxi (Rider App)
- **App Name:** Wadaage Taxi
- **Subtitle:** Hargeisa Ride-Hailing & Metered Taxis
- **Promotional Text:** Book safe, metered rides across Hargeisa instantly with fair pricing and live tracking.
- **Description:**
  Wadaage Taxi is the premier ride-hailing and smart transport app built for Hargeisa, Somaliland.
  
  Features:
  • Live Digital Taximeter: Watch your distance and fare update in real time with transparent standard rates.
  • Wadaage Share: Carpool with others traveling your direction and split the fare.
  • Mobile Money Payments: Pay securely via Zaad (+252 63), eDahab (+252 65), or Cash.
  • Safety First: Verified drivers, trip sharing with family, SOS emergency button, and boarding PINs.
  • Bilingual: Full support for English and Somali.

### Wadaage Driver (Driver Partner App)
- **App Name:** Wadaage Driver
- **Subtitle:** Earn on your schedule with Wadaage
- **Promotional Text:** Accept ride requests in Hargeisa, run the digital taximeter, and manage your daily earnings.
- **Description:**
  Wadaage Driver empowers professional drivers and vehicle owners in Hargeisa to earn a stable income.
  
  Features:
  • Live Ride Dispatch: Receive ride requests near your current location instantly.
  • Digital Taximeter: Run metered street hails with precise GPS distance calculation.
  • Commission & Wallet Tracking: Real-time ledger logs, top-up requests, and payout history.
  • Secure KYC Onboarding: Simple digital verification for your Somaliland ID, driver license, and vehicle registration.
