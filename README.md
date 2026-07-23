# AltudePay – Solana USDC Payment Demo

A React Native application demonstrating client-first USDC payments on Solana Devnet.

The mobile app is the primary application and owns all persisted state. The ASP.NET Core backend runs locally only as a stateless helper service for unsigned transaction creation and optional transaction broadcast.

---

## Architecture

```
React Native App  ←────────────────────────────→  Backend Helper (ASP.NET Core 9)
      │                                                   │
      │  1. Request unsigned transaction                  │
      │  ───────────────────────────────────────────────→ │
      │                                                   │  Build unsigned tx
      │  2. Receive base64 unsigned transaction           │  (no persistence)
      │  ←─────────────────────────────────────────────── │
      │
      │  3. Sign locally with connected wallet
      │
      │  4. Broadcast directly or via backend helper
      │
      │  5. Query Solana RPC for balances and confirmation
      │
      │  6. Save history, recipients, settings, and cache locally
```

### Design principles

- The mobile application owns application state.
- The blockchain is the source of truth for balances and confirmations.
- The backend is stateless and disposable.
- Private keys never leave the device.
- Features should keep working with minimal mobile changes if backend helpers are removed later.

---

## Tech Stack

### Mobile (`/mobile`)
| Library | Purpose |
|---|---|
| React Native 0.76 | Mobile framework |
| TypeScript | Type safety |
| React Navigation | Screen navigation |
| Zustand | Local wallet state |
| TanStack Query | Solana RPC caching |
| Axios | Backend helper client |
| `@solana/web3.js` | Solana RPC, signing, broadcast |
| `@solana/spl-token` | SPL token support |
| `react-native-vision-camera` | QR code scanning |
| `react-native-svg` / `react-native-qrcode-svg` | QR rendering |
| AsyncStorage | Local persistence |

### Backend (`/backend`)
| Library | Purpose |
|---|---|
| ASP.NET Core 9 | Web API framework |
| Solnet.Rpc | Solana JSON-RPC client |
| Solnet.Programs | SPL token instruction builder |
| Swashbuckle | Swagger/OpenAPI UI |

---

## Getting Started

### 1 – Start the backend helper

```bash
cd backend
dotnet run
```

The helper API is available at `http://localhost:5001` and Swagger UI at `http://localhost:5001`.

### 2 – Install mobile dependencies

```bash
cd mobile
npm install
```

For iOS, install CocoaPods:
```bash
cd ios && pod install
```

### 3 – Run the mobile app

```bash
# Android
npm run android

# iOS
npm run ios
```

> **Important for physical devices:** edit `mobile/src/services/api.ts` and change `localhost` to your machine's local IP address if you want to use backend helper endpoints from a device.

---

## Client-Owned State

Persisted locally with AsyncStorage:

- Connected wallet information
- Recent recipients
- Local transaction history
- App settings
- User preferences
- Theme
- Cached balances
- Cached token list

---

## Solana Source of Truth

The mobile app reads the following directly from Solana Devnet RPC:

- SOL balances
- USDC balances
- Transaction confirmation state

No blockchain data is duplicated in a server database.

---

## Backend Helper API

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/payment/create` | Build unsigned transaction |
| `POST` | `/api/payment/send` | Broadcast signed transaction |

The backend never stores user data and has no server-side persistence.

---

## Features

- **Local wallet flow** – generate and store a demo wallet on-device
- **Balances from Solana RPC** – live SOL and USDC balances from Devnet
- **Send USDC** – build → sign → broadcast → confirm flow
- **Recent recipients** – cached locally for quick repeat payments
- **QR Code** – generate a Solana Pay QR code for your wallet
- **QR Scan** – scan Solana Pay QR codes to pre-fill the send screen
- **Transaction History** – locally stored history with Solana Explorer links

---

## Security

- Private keys **never** leave the mobile device
- The backend only handles stateless helper operations
- No wallet, user, or transaction data is stored server-side

---

## Network

All transactions run on **Solana Devnet**. You can get free devnet SOL from the [Solana Faucet](https://faucet.solana.com/).

The USDC mint address used on Devnet is `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`.
