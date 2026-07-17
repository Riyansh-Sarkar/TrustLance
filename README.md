<div align="center">

# 🤝 TrustLance
### Programmable Trust for Global Freelancing
*A decentralized freelance marketplace on Stellar Soroban — milestone-based escrow, wallet-native identity, zero middlemen.*

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Stellar](https://img.shields.io/badge/Built%20on-Stellar-000000?logo=stellar)
![Soroban](https://img.shields.io/badge/Smart%20Contracts-Soroban-blueviolet)
![Next.js](https://img.shields.io/badge/Frontend-Next.js%20%2B%20TypeScript-000000?logo=next.js)
![Firebase](https://img.shields.io/badge/Backend-Firebase-FFCA28?logo=firebase)
![Status](https://img.shields.io/badge/Status-Level%203%20Complete-orange)

</div>

---

## 🌟 What is TrustLance?

**TrustLance** is a decentralized freelance marketplace built on the **Stellar Network** using **Soroban Smart Contracts**. It combines the best of:

- **Fiverr** — service marketplace UX
- **Upwork** — contract & milestone workflows
- **Escrow.com** — trusted fund holding
- **Web3 programmable escrow** — trustless, on-chain enforcement

Instead of trusting clients or freelancers, users trust **immutable blockchain smart contracts**. The project is built entirely around **milestone-based escrow payments**.

---

## 🏆 Stellar Journey to Master

### 🟠 Current Status: ORANGE BELT — LEVEL 3 COMPLETE

At Level 3, TrustLance ships a working mini dApp on Stellar Testnet: a deployed escrow Soroban contract, wallet-native authentication via Freighter, a full milestone-based job → contract → escrow → payout workflow wired to Firebase for metadata, and a premium Next.js dashboard across Client and Freelancer roles.

---
## 🚀 Deployed Contracts (Stellar Testnet)

**Network:** Stellar Testnet · **Passphrase:** `Test SDF Network ; September 2015`

| Contract | Deployed Address (Testnet) | Notes | Explorer |
|---|---|---|---|
| **Escrow Contract** | `CDJCCPM45OHRO6JDOZKSKVX3KO6AFYN5XEM3D5PF2L5WRNVWQV4X7HYG` | Milestone deposit / release / refund logic | [view](https://stellar.expert/explorer/testnet/contract/CDJCCPM45OHRO6JDOZKSKVX3KO6AFYN5XEM3D5PF2L5WRNVWQV4X7HYG) |

### Token Addresses (Stellar Testnet)

| Token | Type | Soroban Address (SAC) | Classic Issuer | Explorer |
|---|---|---|---|---|
| USDC | SEP-41 SAC over classic USDC | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` | `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` | [view](https://stellar.expert/explorer/testnet/contract/CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA) |

> USDC is a SAC wrapping the classic asset issued by the address above — the G-address is used only for building `change_trust` trustline transactions, never for Soroban token calls.

---



## ⚠️ Core Problem

Traditional freelance platforms suffer from:

- ❌ Client scams
- ❌ Freelancer scams
- ❌ Delayed payments
- ❌ High platform fees
- ❌ Centralized payment control
- ❌ Chargebacks
- ❌ Manual, slow dispute handling

## 💡 Core Solution

TrustLance creates **programmable escrow contracts on Stellar**. The middleman is removed — the smart contract itself holds funds until milestones are completed.

```
Client deposits USDC
        ↓
Funds become locked
        ↓
Freelancer completes milestone
        ↓
Client approves
        ↓
Smart contract releases funds automatically
```

> Nobody can steal funds. Nobody can release funds without authorization.

---


## 🏗 Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js (App Router) · React · TypeScript · TailwindCSS · Shadcn UI |
| **Backend** | Firebase |
| **Blockchain** | Stellar · Soroban Smart Contracts · Freighter Wallet |
| **Database** | Firebase Firestore |
| **Storage** | Firebase Storage |
| **Authentication** | Freighter Wallet Connection (wallet-native, no email/password) |
| **Payments** | Stellar USDC |

---

## ⚙️ Environment Setup

`.env.local` — never hardcode contract IDs, RPC URLs, or Firebase config:

```dotenv
# Network
NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_STELLAR_NETWORK=TESTNET

# Contracts
NEXT_PUBLIC_ESCROW_CONTRACT_ID=CDJCCPM45OHRO6JDOZKSKVX3KO6AFYN5XEM3D5PF2L5WRNVWQV4X7HYG

# Asset Contracts
NEXT_PUBLIC_USDC_CONTRACT_ID=CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA
NEXT_PUBLIC_USDC_ISSUER=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
NEXT_PUBLIC_USDC_ASSET_CODE=USDC

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Optional
NEXT_PUBLIC_EXPLORER_BASE_URL=https://stellar.expert/explorer/testnet
```

---

## 📦 Project Structure

```
trustlance/
├── contracts/
│   └── escrow/
│       └── src/
│           ├── lib.rs              # deposit, release, refund, milestone state
│           ├── storage.rs
│           ├── events.rs
│           └── errors.rs
│
└── frontend/
    └── src/
        ├── app/
        │   ├── dashboard/
        │   ├── jobs/
        │   ├── jobs/[id]/
        │   ├── applications/
        │   ├── contracts/
        │   ├── contracts/[id]/
        │   ├── payments/
        │   ├── transactions/
        │   ├── analytics/
        │   ├── notifications/
        │   ├── settings/
        │   ├── profile/
        │   └── wallet/
        ├── components/
        │   ├── jobs/
        │   ├── contracts/
        │   ├── milestones/
        │   └── wallet/
        ├── hooks/
        │   ├── useWallet.ts         # Freighter connection + signing
        │   ├── useEscrowContract.ts # Soroban escrow calls
        │   ├── useJobs.ts
        │   ├── useContracts.ts
        │   └── useTransactions.ts
        ├── lib/
        │   ├── stellar.config.ts    # RPC, passphrase, contract IDs
        │   ├── soroban.ts           # contract invocation helpers
        │   └── firebase.ts          # Firestore/Storage client init
        └── types/
            ├── job.ts
            ├── contract.ts
            ├── milestone.ts
            └── transaction.ts
```

---


### Authentication Flow

```
Connect Freighter
        ↓
Wallet Address
        ↓
Check Firestore
        ↓
   Existing Profile?
   ┌────────┴────────┐
  YES                NO
   │                  │
Dashboard        Create Profile
                       ↓
                  Choose Role
                       ↓
                  Dashboard
```

---

## 👤 User Roles

Only two roles exist.

| Client Can | Freelancer Can |
|---|---|
| Create Jobs | Browse Jobs |
| Hire Freelancers | Apply to Jobs |
| Fund Escrow | Accept Contracts |
| Approve Work | Submit Milestones |
| Release Funds | Receive Payments |
| View Contracts / Payments / Transactions | View Contracts / Transactions |
| Analytics | Analytics |

---

## 🧠 High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                      │
│  ┌──────────┐  ┌───────────┐  ┌────────────┐  ┌───────────┐ │
│  │ Dashboard│  │   Jobs    │  │ Contracts  │  │ Payments  │ │
│  └──────────┘  └───────────┘  └────────────┘  └───────────┘ │
│       │               │               │              │      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Freighter Wallet (Auth + Signing)             │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────┬───────────────────────────────┬──────────────────┘
            │ metadata reads/writes         │ signed transactions
            ▼                               ▼
┌───────────────────────────┐   ┌─────────────────────────────────┐
│   FIREBASE (off-chain)    │   │   STELLAR TESTNET (on-chain)     │
│                            │   │                                   │
│  Firestore Collections:    │   │  ┌─────────────────────────────┐ │
│  • profiles                │   │  │      Escrow Contract         │ │
│  • jobs                    │   │  │  deposit · release · refund  │ │
│  • applications             │   │  │  milestone state · auth      │ │
│  • contracts (metadata)     │   │  └───────────────┬───────────────┘ │
│  • transactions (index)     │   │                  │ token transfer   │
│  • notifications            │   │                  ▼                 │
│  • analytics                │   │        ┌───────────────────┐       │
│  • activity                 │   │        │  USDC SEP-41 SAC   │       │
│  • settings                 │   │        └───────────────────┘       │
└───────────────────────────┘   └─────────────────────────────────┘
```

### Division of Responsibility

| Layer | Responsibility |
|---|---|
| **Firestore (off-chain)** | Profiles, Jobs, Applications, Contract *metadata*, Analytics, Notifications, Activity, Settings, UI Metadata — **never controls money** |
| **Soroban (on-chain)** | Escrow, Funds, Milestone State, Contract State, Authorization, Release Payments, Refunds, Security — **the only source of financial truth** |

> ⚠️ Never trust Firestore for financial state. Blockchain always wins.

### Source of Truth

```
UI
 ↓
Firestore
 ↓
Blockchain  ← always wins
```

---

## 🔄 Project Workflow (End to End)

```
1.  Client connects wallet → creates profile → chooses "Client"

2.  Client creates Job
    (Title, Description, Budget, Skills, Deadline, Milestones, USDC Amount)
    → stored in Firestore

3.  Freelancer connects wallet → creates profile → chooses "Freelancer"

4.  Freelancer browses Jobs → opens Job → clicks Apply → proposal submitted

5.  Client reviews applications → accepts one Freelancer → rejects others

6.  Contract created
    (Client Wallet, Freelancer Wallet, Milestones, Budget, Status, Created Time)

7.  Freelancer accepts contract → Status: Accepted

8.  Client funds escrow → USDC transferred → Escrow locked → Contract funded

9.  Milestone begins → Status: In Progress

10. Freelancer submits work (Deliverable URL) → Status: Submitted

11. Client reviews → Approve OR Reject

12. On Approve:
    Smart Contract → Release Payment → Freelancer receives USDC
    → Milestone Completed

13. Final milestone completed → Contract Completed → Escrow Closed
```

---

## 📊 State Machines

### Contract States

```
Draft → Pending → Accepted → Funded → Active → Completed → Closed
                                                 ↘ Cancelled
                                                 ↘ Disputed
```

### Milestone States

```
Pending → In Progress → Submitted → Approved → Released
                                   ↘ Rejected
                                   ↘ Cancelled
```

### Job States

```
Open → Applied → Hired → Closed
                ↘ Cancelled
```

### Application States

```
Pending → Accepted
        ↘ Rejected
        ↘ Withdrawn
```

---



## 🗄️ Firebase Collections

| Collection | Purpose |
|---|---|
| `profiles` | Wallet-linked user identity + role |
| `jobs` | Job postings (title, budget, skills, milestones) |
| `applications` | Freelancer proposals against jobs |
| `contracts` | Contract metadata (mirrors on-chain escrow state) |
| `transactions` | Indexed record of every blockchain action |
| `notifications` | In-app alerts |
| `analytics` | Aggregated revenue / spend / earnings data |
| `activity` | Audit trail of user actions |
| `settings` | User preferences |

> Firestore **stores** data about the system. It never **controls** money — that responsibility belongs to the Soroban escrow contract alone.

---

## 💸 Transactions

Every blockchain action (**Deposit · Release · Refund · Funding · Completion**) creates a transaction record containing:

| Field | Description |
|---|---|
| `hash` | Transaction hash |
| `timestamp` | When it occurred |
| `contract` | Associated contract ID |
| `amount` | USDC amount |
| `wallets` | Client + Freelancer addresses |
| `explorerLink` | Direct link to `stellar.expert` |
| `status` | Success / Pending / Failed |

---

## 🖥️ Dashboard Pages

```
Landing · Dashboard · Jobs · Job Details · Applications
Contracts · Contract Details · Payments · Transactions
Analytics · Notifications · Settings · Profile · Wallet
```

---

## 📈 Analytics

- Revenue
- Pending / Escrow / Released
- Completed Contracts
- Average Completion Time
- Client Spending
- Freelancer Earnings


---

## 🔐 Security

- Wallet Authorization (Freighter)
- Smart Contract Authorization (`require_auth()` on every financial action)
- Firestore Security Rules
- Input Validation
- Escrow Verification before any state transition
---

## 🚨 Error Handling

Never show a generic `"Unknown Error"`. Always explain what happened:

- Wallet disconnected
- Insufficient USDC
- Escrow not funded
- Milestone already submitted
- Unauthorized
- Transaction rejected

---

## ⚡ Performance

- Lazy loading
- Pagination
- Caching
- Optimistic updates
- Realtime Firestore listeners where appropriate
- Avoid unnecessary blockchain reads

---

## 📱 Responsive & Accessibility

**Responsive Support:** Desktop · Tablet · Mobile

**Accessibility:** Keyboard navigation · ARIA labels · Focus states · Readable contrast

---

## 🛣️ Future Roadmap

- Multi-milestone contracts
- AI proposal generation
- Reputation system
- Reviews & ratings
- Dispute resolution
- Team workspaces
- DAO arbitration
- Multi-token support
- Invoice generation
- File uploads
- Notifications
- Real-time chat
- Organization accounts
- Public freelancer profiles
- Client verification
- Tax reports
- Cross-chain payments

---

## 🧭 Non-Negotiable Rules

1. Never remove Freighter wallet authentication.
2. Never replace blockchain logic with Firestore logic.
3. Never store financial state only in Firebase.
4. Blockchain is the source of truth for all escrow operations.
5. Firestore is used only for metadata, UI state, indexing, analytics, and fast queries.
6. Every financial action must be backed by a successful blockchain transaction.
7. Every transaction should have a transaction hash and explorer link.
8. Keep the UI clean, premium, modern, and responsive.
9. Maintain a clear separation between on-chain logic (Soroban) and off-chain metadata (Firebase).
10. Use environment variables for all configuration and never hardcode sensitive values.
11. Preserve the milestone-based escrow workflow and role-based permissions throughout the application.

---

## 🌌 Final Vision

TrustLance is not just another freelance marketplace. It is a **Web3-powered programmable trust infrastructure** where freelancers and clients collaborate globally with confidence. By combining Stellar's fast, low-cost blockchain, Soroban smart contracts, Firebase for rich application data, and a premium SaaS user experience, TrustLance delivers secure milestone-based escrow, transparent payments, and a frictionless workflow for the future of decentralized work.

The goal is to feel as polished as **Linear, Stripe, Notion, and Vercel** — while providing the trust guarantees that only blockchain can offer.

---

<div align="center">

*TrustLance — programmable trust, for everyone, everywhere.*

</div>
