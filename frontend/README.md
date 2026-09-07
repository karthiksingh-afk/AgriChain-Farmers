# AgriChain — Direct Farmer Mandi & Simulated Escrow Platform (MVP)

> **Mobile-First Agricultural Commerce Platform for Indian Farmers and Farmer Producer Organizations (FPOs)**

AgriChain empowers Indian farmers to list produce lots, compare prices against real APMC Mandi benchmarks, and track deals and payments through a simulated escrow-protected settlement flow.

---

## 🌟 Key Features

1. **Authentication & Security**
   - Mobile Number + OTP Login (Mock OTP: `123456`).
   - 6-Digit Security PIN for quick session re-auth.
   - "Forgot PIN" recovery flow via OTP verification.
   - **AgriStack / DigiLocker e-KYC stub** (pre-verified land records and farmer credentials).

2. **Market Intelligence & Live Mandi Rates**
   - Real APMC benchmark modal prices across Indian crops (*Sharbati Wheat, Basmati Rice, Soybean, Cotton, Onion, Potato, Mustard, Tomato*).
   - Market overview tracking arrivals in MT and active buyers count.
   - Agro-weather forecast & moisture advisory widget.

3. **Produce Lot Listing & Dynamic Price Comparison**
   - Crop & variety selection with Grade A (Premium) / Grade B (Standard) quality grading.
   - Real-time asking price comparison against APMC modal benchmark rate with percentage deviation indicator.
   - Quality certificate score (`AGRI-QC-2026-XXXX`) and cold-chain metrics (`18.2°C`, `62.5%` Humidity).

4. **Automated Buyer Match & Deal Flow**
   - Instant simulated buyer matching (*ITC Agri Business, Adani Wilmar, Cargill India, Reliance Fresh, BigBasket*) upon lot creation.
   - Unique transaction reference (`AGRI-TXN-XXXX`) and deal locking.
   - Interactive logistics progression (`PAYMENT_HELD` in Escrow → `DISPATCHED` In Transit → `COMPLETED` Settled).

5. **Simulated Escrow & Settlement**
   - Simulated Escrow Vault ensuring funds are safely secured before dispatch.
   - Instant disbursement to **Available Balance** upon delivery verification.
   - Instant withdrawal payout simulation to primary UPI / Bank Account.
   - Full transaction ledger tracking credits, debits, and escrow locks.

6. **In-App Notifications**
   - Real-time alerts for deal matches, escrow locks, truck dispatches, and payout receipts.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS 3.4 (locked) + Lucide Icons + Google Fonts (*Outfit & Inter*)
- **BaaS**: InsForge SDK (`@insforge/sdk@latest`) with PostgreSQL PostgREST API
- **Testing**: Bruno / Postman Collection + TypeScript Test Runner (`tsx`) + Browser Subagent

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Run backend integration tests
npm test

# Run Bruno / Postman API tests (28 endpoints)
npm run test:api

# Start local development server
npm run dev

# Build production bundle
npm run build
```

---

## 🌐 Production Deployment (Vercel & InsForge)

1. **Environment Variables**:
   Set in your Vercel / Production environment:
   ```env
   VITE_INSFORGE_URL=https://your-project.insforge.app
   VITE_INSFORGE_ANON_KEY=your-anon-key-here
   ```

2. **Database Migration**:
   Execute [`src/lib/db-schema.sql`](file:///c:/Users/sskul/OneDrive/Documents/SmartIndHackhathon/StitchFarmer/frontend/src/lib/db-schema.sql) in your InsForge PostgreSQL SQL Editor to create tables, constraints, indexes, and RLS policies.

3. **Vercel Deploy**:
   ```bash
   vercel --prod
   ```
   *`vercel.json` is pre-configured with SPA route rewrites and security headers.*
