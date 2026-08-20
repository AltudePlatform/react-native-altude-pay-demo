# AltudePay – Solana USDC Payment Demo

A standalone React Native app that demonstrates USDC payments on Solana Devnet using Altude transaction APIs.

## Architecture

- Single root-level mobile app using Altude hosted backend APIs
- Wallet keys, history, recipients, preferences, and cache stored locally on-device
- Payment flow follows: Transaction config -> blockhash -> partially signed transaction -> Transaction send
- Balance checks and confirmation polling are performed through Solana RPC

## Tech Stack

| Library | Purpose |
|---|---|
| React Native 0.76 | Mobile framework |
| TypeScript | Type safety |
| React Navigation | Screen navigation |
| Zustand | Local wallet state |
| TanStack Query | Solana RPC caching |
| `@solana/kit` | Solana RPC, transactions and signing |
| `@solana-program/token` | SPL token / associated token accounts |
| `react-native-vision-camera` | QR code scanning |
| `react-native-svg` / `react-native-qrcode-svg` | QR rendering |
| AsyncStorage | Local persistence |

## Getting Started

### Request Altude Access

Before configuring the app, visit [Altude](https://altude.so) and complete the access-request form to receive an API key. Do not add the key to source code or commit it to the repository.

### Configure Local Environment

Create a `.env` file in the repository root using `.env.example` as a template:

```bash
ALTUDE_API_KEY=replace_with_your_key
```

Restart Metro after changing `.env`. The app checks for this key before allowing onboarding to continue when real services are enabled (`useMockData: false`). The default mock mode does not require an API key.

For Altude configuration, the API key is the only required value. The API key's
`/api/transaction/config` response determines the cluster, RPC URL, JWT, and
fee payer. Users should not need to enter a fee payer address or choose a
network manually.

Install dependencies from repository root:

```bash
npm install
```

Start Metro:

```bash
npm start
```

Run the app:

```bash
# Android
npm run android

# iOS
npm run ios
```

For iOS, install CocoaPods first:

```bash
cd ios && pod install
```

## Validation Commands

```bash
npm run lint
npm run type-check
npm test
```

## Android Altude SDK Integration

The Android app module is configured to use Altude AndroidSDK from JitPack with:

- `com.github.AltudePlatform.AndroidSDK:core:chen~pay-demo-02-SNAPSHOT`
- `com.github.AltudePlatform.AndroidSDK:gasstation:chen~pay-demo-02-SNAPSHOT`
- `com.github.AltudePlatform.AndroidSDK:vault:chen~pay-demo-02-SNAPSHOT`

JitPack is added in Android Gradle settings repositories.

### Instrumentation Tests (Setup / Create Account / Send USDC)

Implemented test class:

- `android/app/src/androidTest/java/com/altudepay/AltudeGasstationInstrumentedTest.kt`

Required values (set as environment variables or Gradle properties):

- `ALTUDE_ACCOUNT_PRIVATE_KEY_BASE64` (optional)

The instrumentation tests use a static demo API key constant in
`AltudeGasstationInstrumentedTest.kt`.

If `ALTUDE_ACCOUNT_PRIVATE_KEY_BASE64` is not provided, the send test generates a temporary sender account and attempts account creation before transfer.

Run test compilation:

```bash
cd android
./gradlew :app:compileDebugKotlin :app:compileDebugAndroidTestKotlin
```

Run instrumentation tests on a connected emulator/device:

```bash
cd android
./gradlew :app:connectedDebugAndroidTest
```

## Features

- Local demo wallet generation and storage
- SOL/USDC balance reads from Solana Devnet RPC
- Altude-backed USDC transaction build, partial sign serialization, send, and confirmation flow
- Local transaction history and recent recipients
- Solana Pay QR generation and scan flow

## Network

- Solana cluster: **Devnet**
- Devnet USDC mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
- Altude API base: `https://api.altude.so`
