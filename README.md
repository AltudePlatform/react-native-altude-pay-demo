# AltudePay – Solana USDC Payment Demo

A standalone React Native app that demonstrates on-device USDC payments on Solana Devnet.

## Architecture

- Single root-level mobile app (no backend service)
- Wallet keys, history, recipients, preferences, and cache stored locally on-device
- Balance checks, transaction signing, sending, and confirmation done directly from the app through Solana RPC

## Tech Stack

| Library | Purpose |
|---|---|
| React Native 0.76 | Mobile framework |
| TypeScript | Type safety |
| React Navigation | Screen navigation |
| Zustand | Local wallet state |
| TanStack Query | Solana RPC caching |
| `@solana/web3.js` | Solana RPC, signing, broadcast |
| `@solana/spl-token` | SPL token transfers |
| `react-native-vision-camera` | QR code scanning |
| `react-native-svg` / `react-native-qrcode-svg` | QR rendering |
| AsyncStorage | Local persistence |

## Getting Started

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

## Features

- Local demo wallet generation and storage
- SOL/USDC balance reads from Solana Devnet RPC
- Direct on-device USDC transaction build, sign, send, and confirmation flow
- Local transaction history and recent recipients
- Solana Pay QR generation and scan flow

## Network

- Solana cluster: **Devnet**
- Devnet USDC mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
