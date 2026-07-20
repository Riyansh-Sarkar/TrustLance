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
<img width="2525" height="1170" alt="image" src="https://github.com/user-attachments/assets/2c8e05a7-8062-4ccc-ae53-cec12489e582" />

<img width="2556" height="1309" alt="image" src="https://github.com/user-attachments/assets/e5b4ab3a-52f5-43d4-8ad0-06a2c6250bdf" />


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
# Smart Contract Details

| Property | Value |
|---|---|
| **Contract ID** | `CDJCCPM45OHRO6JDOZKSKVX3KO6AFYN5XEM3D5PF2L5WRNVWQV4X7HYG` |
| **Network** | Stellar Testnet |
| **Explorer** | https://stellar.expert/explorer/testnet/contract/CDJCCPM45OHRO6JDOZKSKVX3KO6AFYN5XEM3D5PF2L5WRNVWQV4X7HYG |

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
# EscrowContract — Testnet Testing Report

Milestone-based escrow smart contract for Soroban (Stellar), tested end-to-end on **Testnet**.

---

## 📋 Contract Info

| Item | Value |
|---|---|
| **Network** | Testnet |
| **🔐 Escrow Contract ID** | `CDJCCPM45OHRO6JDOZKSKVX3KO6AFYN5XEM3D5PF2L5WRNVWQV4X7HYG` |
| **💎 Token (Native XLM)** | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |

---

## ✅ Test Results — 7/7 Passed

| # | Function | Description | Status |
|---|-----------|-------------|:---:|
| 1 | `initialize` | Creates escrow, pulls funds from client into contract | ✅ |
| 2 | `get_state` | Reads back full escrow state | ✅ |
| 3 | `submit_milestone` | Freelancer submits milestone for review | ✅ |
| 4 | `approve_milestone` | Client approves, releases payment to freelancer | ✅ |
| 5 | `flag_dispute` | Client/freelancer flags project as disputed | ✅ |
| 6 | `resolve_dispute` | Admin resolves dispute, releases funds | ✅ |
| 7 | `cancel_contract` (negative) | Rejects cancel on progressed project | ✅ |
| 7 | `cancel_contract` (positive) | Refunds full amount on untouched project | ✅ |

📸 *Test screenshots:*
<img width="2264" height="922" alt="Screenshot 2026-07-20 101523" src="https://github.com/user-attachments/assets/eef4ab94-7570-43d4-aa71-ac08bd513238" />
<img width="2261" height="526" alt="Screenshot 2026-07-20 101629" src="https://github.com/user-attachments/assets/4fea6ca6-1377-42d5-80b4-fee4ea558634" />



---

## 🔁 CI/CD

<img width="2553" height="1058" alt="Screenshot 2026-07-20 101646" src="https://github.com/user-attachments/assets/369dc209-7347-4023-851c-f632671dc9fb" />

## Mobile Responsive UI 
<img width="694" height="1225" alt="image" src="https://github.com/user-attachments/assets/b967e2c7-e7a0-4f57-bdf4-207bce46317a" />

## 📦 Smart Contract Folder Structure

```text
contracts/
│
├── escrow/                                   # Main Soroban Escrow Smart Contract
│   ├── src/
│   │   ├── lib.rs                            # Milestone escrow contract logic
│   │   └── test.rs                           # Unit tests for escrow contract
│   ├── Cargo.toml                            # Rust package configuration
│   ├── Cargo.lock
│   ├── rust-toolchain.toml
│   └── target/                               # Build artifacts
│
└── liquidity_pool/                           # Liquidity Pool Smart Contract
    ├── src/
    │   ├── lib.rs                            # Liquidity pool implementation
    │   └── test.rs                           # Contract tests
    ├── Cargo.toml
    ├── Cargo.lock
    └── rust-toolchain.toml
```

---

## 💻 Frontend Structure

```text
src/
│
├── app/                                      # Next.js App Router
│   ├── page.tsx                              # Landing Page
│   ├── layout.tsx                            # Root Layout
│   ├── globals.css                           # Global Styles
│   │
│   ├── auth/                                 # Wallet onboarding
│   ├── api/                                  # API Routes
│   │   └── auth/
│   ├── dashboard/                            # Main Dashboard
│   ├── features/
│   ├── network/
│   ├── pricing/
│   ├── privacy/
│   ├── terms/
│   └── help/
│
├── components/                               # Shared UI Components
│
├── constants/
│   └── stellar.ts                            # Network & Contract Constants
│
├── hooks/
│   ├── useWallet.ts                          # Freighter wallet connection
│   ├── useEscrow.ts                          # Escrow contract transactions
│   ├── useAddUsdcTrustline.ts                # USDC trustline management
│   ├── useLiquidityPoolInfo.ts               # Liquidity pool data
│   ├── useProfile.ts                         # User profile management
│   ├── useAnalytics.ts                       # Dashboard analytics
│   ├── useDarkMode.ts                        # Theme management
│   └── useCountUp.ts                         # UI animations
│
├── lib/
│   ├── auth/                                 # Authentication helpers
│   ├── firebase/                             # Firebase services
│   ├── contracts/
│   │   └── escrow/                           # Escrow contract helper wrappers
│   │
│   ├── stellar/
│   │   ├── client.ts                         # Soroban RPC client
│   │   ├── sorobanView.ts                    # Read-only contract queries
│   │   ├── sorobanSwap.ts                    # Swap helpers
│   │   ├── swap.ts                           # Transaction builders
│   │   ├── anchor.ts                         # Asset helpers
│   │   ├── explorer.ts                       # Explorer utilities
│   │   └── utils.ts                          # Stellar helper utilities
│   │
│   ├── firebase.ts
│   ├── utils.ts
│   │
│   └── prices/
│       └── xlmPrice.ts                       # Live XLM price utilities
│
└── types/
    ├── index.ts
    └── growth.ts
```

---

## 🔗 Smart Contract ↔ Frontend Integration Mapping

```text
                    Freighter Wallet
                           │
                           ▼
               src/hooks/useWallet.ts
                           │
                           ▼
               src/hooks/useEscrow.ts
                           │
                           ▼
             src/lib/stellar/client.ts
                           │
                           ▼
                  Soroban RPC Server
                           │
                           ▼
         contracts/escrow/src/lib.rs
                           │
                           ▼
              Escrow Smart Contract
                           │
                           ▼
                  Transaction Result
                     ┌───────────────┐
                     │               │
                     ▼               ▼
         Dashboard UI Refresh   Firestore Metadata
                                     │
                                     ▼
                          src/lib/firebase/
```
## 🔗 Frontend ↔ Smart Contract Integration

The frontend communicates directly with the deployed **Soroban Escrow Smart Contract** using the **Stellar SDK**, **Freighter Wallet**, and **Soroban RPC**. Financial transactions are executed on-chain, while application metadata is synchronized with Firebase Firestore.

| Frontend Module | Responsibility |
|-----------------|---------------|
| `src/hooks/useWallet.ts` | Connects the user's **Freighter Wallet**, manages wallet state, and signs blockchain transactions. |
| `src/hooks/useEscrow.ts` | Main integration layer responsible for creating contracts, funding escrow, milestone submission, approvals, payment releases, refunds, and contract lifecycle management. |
| `src/lib/stellar/client.ts` | Initializes the **Soroban RPC client**, builds transactions, simulates contract calls, and submits signed transactions to the Stellar Testnet. |
| `src/lib/stellar/sorobanView.ts` | Executes read-only contract queries without requiring transaction signing. |
| `src/constants/stellar.ts` | Stores Stellar network configuration, contract IDs, RPC endpoints, asset information, and shared blockchain constants. |
| `src/lib/contracts/escrow/` | Shared helper functions and reusable utilities for interacting with the escrow smart contract. |
| `src/lib/firebase/` | Synchronizes off-chain metadata including jobs, users, contracts, applications, milestones, and transaction history with Firestore. |

---

## 📜 Smart Contract Function Mapping

| Smart Contract Function (Rust) | Frontend Caller | Purpose |
|--------------------------------|-----------------|---------|
| `initialize_contract()` | `src/hooks/useEscrow.ts` | Initializes a new escrow contract instance. |
| `create_contract()` | `src/hooks/useEscrow.ts` | Creates a milestone-based escrow contract after a freelancer is hired. |
| `fund_contract()` | `src/hooks/useEscrow.ts` | Locks the client's USDC into the escrow smart contract. |
| `submit_milestone()` | `src/hooks/useEscrow.ts` | Allows the freelancer to submit completed milestone work. |
| `approve_milestone()` | `src/hooks/useEscrow.ts` | Allows the client to approve submitted work. |
| `release_payment()` | `src/hooks/useEscrow.ts` | Releases escrowed USDC from the smart contract to the freelancer. |
| `refund_contract()` | `src/hooks/useEscrow.ts` | Returns escrowed funds back to the client if required. |
| `close_contract()` | `src/hooks/useEscrow.ts` | Marks the contract as completed and closes the escrow. |
| Read-only Contract Methods | `src/lib/stellar/sorobanView.ts` | Fetches contract state, milestone status, balances, and contract metadata without sending transactions. |

---

## 🔗 Contract ↔ Frontend Function Mapping

| Smart Contract (Rust) | Frontend File | User Action |
|------------------------|---------------|------------|
| `initialize_contract()` | `src/hooks/useEscrow.ts` | Initializes a new escrow instance. |
| `create_contract()` | `src/hooks/useEscrow.ts` | Client creates an escrow contract after hiring a freelancer. |
| `fund_contract()` | `src/hooks/useEscrow.ts` | Client deposits and locks USDC into escrow. |
| `submit_milestone()` | `src/hooks/useEscrow.ts` | Freelancer submits completed milestone work for review. |
| `approve_milestone()` | `src/hooks/useEscrow.ts` | Client reviews and approves the submitted milestone. |
| `release_payment()` | `src/hooks/useEscrow.ts` | Client releases escrowed payment to the freelancer. |
| `refund_contract()` | `src/hooks/useEscrow.ts` | Client requests a refund when applicable. |
| `close_contract()` | `src/hooks/useEscrow.ts` | Finalizes and closes the escrow contract. |
| Contract View Functions | `src/lib/stellar/sorobanView.ts` | Reads on-chain contract state without modifying blockchain data. |
| Wallet Authentication | `src/hooks/useWallet.ts` | Connects and authenticates users through Freighter Wallet. |
| Soroban RPC Communication | `src/lib/stellar/client.ts` | Builds, simulates, signs, and submits Stellar transactions. |
| Network & Contract Configuration | `src/constants/stellar.ts` | Provides deployed contract IDs, network settings, RPC URLs, and asset constants used across the application. |


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
