# AltudePay – Solana USDC Payment Demo

A React Native application demonstrating sending and receiving USDC on Solana.

The backend runs locally and acts **only** as a helper service. It never stores private keys or user funds. Everything runs on **Solana Devnet**.

---

## Architecture

```
Mobile App  ←──────────────────────→  Backend (ASP.NET Core 9)
  │                                         │
  │  1. Request unsigned transaction        │
  │  ────────────────────────────────────→  │
  │                                         │  Build transaction
  │  2. Return base64 unsigned tx           │  (no signing)
  │  ←────────────────────────────────────  │
  │                                         │
  │  Sign locally (private key stays here)  │
  │                                         │
  │  3. Send signed base64 transaction      │
  │  ────────────────────────────────────→  │
  │                                         │  Broadcast to Solana
  │  4. Return signature                    │
  │  ←────────────────────────────────────  │
```

---

## Tech Stack

### Mobile (`/mobile`)
| Library | Purpose |
|---|---|
| React Native 0.76 | Mobile framework |
| TypeScript | Type safety |
| React Navigation | Screen navigation |
| Zustand | Global state (auth, wallet) |
| TanStack Query | Server state & caching |
| Axios | HTTP client |
| `@solana/web3.js` | Transaction signing |
| `@solana/spl-token` | SPL token accounts |
| `react-native-vision-camera` | QR code scanning |
| `react-native-svg` / `react-native-qrcode-svg` | QR code generation |
| `tweetnacl` | Ed25519 signing |
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

### Prerequisites
- Node.js 18+
- .NET 9 SDK
- React Native environment (Android Studio / Xcode)

### 1 – Start the backend

```bash
cd backend
dotnet run
```

The API will be available at `http://localhost:5001` and Swagger UI at `http://localhost:5001`.

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

> **Important for physical devices:** Edit `mobile/src/services/api.ts` and change `localhost` to your machine's local IP address.

---

## Features

- **Authentication** – username-only login, no password required
- **Wallet** – generate a demo wallet or connect an existing one
- **Balances** – live SOL and USDC balances from Solana Devnet
- **Send USDC** – full payment flow: build → sign → broadcast
- **QR Code** – generate a Solana Pay QR code for your wallet
- **QR Scan** – scan Solana Pay QR codes to pre-fill the Send screen
- **Transaction History** – locally stored history with Solana Explorer links

---

## Backend API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/balance/{wallet}` | SOL + USDC balances |
| `POST` | `/api/payment/create` | Create unsigned transaction |
| `POST` | `/api/payment/send` | Broadcast signed transaction |
| `GET` | `/api/payment/{signature}` | Transaction status |

Full interactive documentation is available at the Swagger UI when the backend is running.

---

## Security

- Private keys **never** leave the mobile device
- The backend only builds unsigned transactions and broadcasts already-signed ones
- No wallet data is stored server-side

---

## Network

All transactions run on **Solana Devnet**. You can get free devnet SOL from the [Solana Faucet](https://faucet.solana.com/).

The USDC mint address used on devnet is `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`. This can be changed in `backend/appsettings.json`.

---

## Project Structure

```
.
├── backend/                  # ASP.NET Core 9 Web API
│   ├── Controllers/
│   │   ├── WalletController.cs
│   │   └── PaymentController.cs
│   ├── Services/
│   │   └── SolanaService.cs
│   ├── Models/
│   │   ├── BalanceResponse.cs
│   │   ├── PaymentCreateRequest.cs
│   │   ├── PaymentCreateResponse.cs
│   │   ├── PaymentSendRequest.cs
│   │   ├── PaymentSendResponse.cs
│   │   └── TransactionStatusResponse.cs
│   ├── Program.cs
│   └── appsettings.json
│
└── mobile/                   # React Native app
    ├── src/
    │   ├── screens/
    │   │   ├── LoginScreen.tsx
    │   │   ├── HomeScreen.tsx
    │   │   ├── SendScreen.tsx
    │   │   ├── HistoryScreen.tsx
    │   │   ├── QRScreen.tsx
    │   │   └── ScanScreen.tsx
    │   ├── components/
    │   │   ├── BalanceCard.tsx
    │   │   ├── TransactionItem.tsx
    │   │   ├── WalletAddress.tsx
    │   │   └── QRCodeMatrix.tsx
    │   ├── services/
    │   │   ├── api.ts
    │   │   ├── solana.ts
    │   │   └── storage.ts
    │   ├── hooks/
    │   │   ├── useBalance.ts
    │   │   └── usePayment.ts
    │   ├── navigation/
    │   │   └── AppNavigator.tsx
    │   ├── store/
    │   │   ├── authStore.ts
    │   │   └── walletStore.ts
    │   └── types/
    │       └── index.ts
    ├── __tests__/
    │   └── solana.test.ts
    ├── App.tsx
    └── package.json
```
