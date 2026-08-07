# Expenso - React Native Mobile Application

This is the mobile application for **Expenso**, built with [**React Native CLI**](https://reactnative.dev), **React Navigation v7**, **Redux Toolkit**, **Axios**, and **React Native Vector Icons**.

---

## 📱 Features & Highlights

- **WhatsApp Group UI**:
  - Group Details screen with WhatsApp dark emerald header (`#075E54`), circular group profile avatar, and quick actions (➕ *Add*, 💸 *Split Bill*, ℹ️ *Info*).
  - WhatsApp tab switcher (`ACTIVITY`, `PARTICIPANTS`), green `Group Admin` tags for creators/admins, and chat bubble styled split expense cards.
- **UPI Deep Link Payment Flow**:
  - Seamless instant settlement via standard NPCI UPI links (`POST /api/upi/deeplink`).
  - Modern Material UI `PaymentBottomSheet` with options for **Google Pay**, **PhonePe**, **Paytm**, and **Other UPI Apps**.
  - Direct app launching via package intents (`package=com.phonepe.app`, `package=com.google.android.apps.nsetup`, `package=net.one97.paytm`) to prevent QR code gallery popups.
  - Floating `Snackbar` notification component for error messages and network failure retries.
- **Group Admin & Payment Authorization**:
  - Enforces strict rules: only group creators/admins can mark other members as paid; regular members can mark or pay their own share.
- **Profile Settings & UPI ID**:
  - Manage Full Name, Mobile Number, Age, Currency, and **UPI ID** (`upiId`) in obsidian-styled profile settings.

---

## 📂 Project Architecture

```text
src/
├── api/                        # Axios instance configuration & request/response interceptors
├── components/                 # Atomic UI component design system
│   ├── PaymentOptionCard.jsx   # Material UI UPI payment app option card
│   ├── PaymentBottomSheet.jsx  # Animated modal bottom sheet for app selection
│   └── Snackbar.jsx            # Toast & alert snackbar with action buttons
├── context/                    # Context providers (AuthContext, AlertContext)
├── hooks/                      # Custom hooks (useAuth, useGroups, useSplitRequests, useTransactions)
├── navigation/                 # Navigation stacks & tab bar configuration
├── screens/
│   ├── groups/                 # WhatsApp style group screens (GroupsList, GroupDetails, SplitRequestDetail)
│   ├── profile/                # User profile screen & settings modal (with UPI ID support)
│   └── ...                     # Dashboard, Transactions, Budget, Calendar screens
├── services/                   # Network services (upiService.js, transactionService, syncService)
├── store/                      # Redux Toolkit slices (authSlice, transactionSlice)
└── theme/                      # Styling design tokens (colors, spacing, typography, radius, shadow)
```

---

## 🚀 Getting Started

### Step 1: Start Metro Dev Server

Run Metro, the JavaScript build tool for React Native:

```sh
npm start
```

### Step 2: Build & Run Mobile App

#### Android
```sh
npm run android
```

#### iOS
```sh
bundle install
bundle exec pod install
npm run ios
```

---

## 🛠️ Network & API Troubleshooting

- **Base URL Configuration**: Base URL is automatically loaded from `.env` (`API_URL`) or falls back to your host machine's Wi-Fi IP address in `src/api/client.js`.
- **Android Deep Link Intent Queries**: Android 11+ (API 30+) requires deep link scheme intents declared under `<queries>` in `android/app/src/main/AndroidManifest.xml` (`upi`, `gpay`, `phonepe`, `paytmmp`, `paytm`).
