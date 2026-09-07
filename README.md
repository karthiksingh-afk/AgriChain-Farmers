# 🌾 AgriChain — Farmer-Side Marketplace MVP

AgriChain is a mobile-first agricultural commerce platform built for a hackathon, designed to connect Indian farmers and Farmer Producer Organizations (FPOs) directly to buyers — reducing dependency on traditional multi-layered mandi intermediaries through direct listing, price discovery, escrow-protected trades, and instant (simulated) settlement.

This repository contains the **Farmer-Side MVP**: a single-role (Farmer) application covering the full journey from registration to payment.

---

## ✨ Features

- **Authentication** — Mobile number + OTP login, 6-digit security PIN, PIN recovery flow
- **Home Dashboard** — Live mandi arrival stats, active buyer count, escrow balance, weather overview
- **List Produce Lot** — Multilingual crop selection, quantity + pricing vs. mandi benchmark rates, quality grading (Grade A/B)
- **Simulated Deal Engine** — Auto-matches listed lots to a simulated buyer; deal status progresses through `PROPOSED → PAYMENT_HELD → DISPATCHED → COMPLETED`
- **Price Negotiation** — Farmers can accept or counter-offer the proposed price before escrow locks
- **Escrow & Wallet** — Simulated fund locking, release on deal completion, real-time wallet balance (available / locked / settled)
- **Inventory Tracking** — Status tracking for active lots (Stock Held, Awaiting Truck, In Transit)
- **AI Route Optimization** — Rule-based decision layer recommending whether to retain or skip a supply-chain intermediary, based on MOQ, spoilage risk, and buyer reliability scoring
- **Bilingual UI** — Instant-switch English / Hindi support, no page reload
- **₹100 Value Distribution** — Illustrative visual comparing farmer earnings under a traditional mandi chain vs. AgriChain's direct model

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Backend / Database | [InsForge](https://insforge.dev) (Backend-as-a-Service — Postgres + Auth + REST APIs) |
| UI Design Source | [Stitch](https://stitch.withgoogle.com) (Google AI design tool) |
| Development | Built with [Antigravity](https://antigravity.google) (AI coding agent), connected to Stitch via MCP |
| Deployment | Vercel (frontend) + InsForge (backend, hosted) |
| API Testing | Bruno / Postman collections (see `/frontend` test suite) |

---

## 📁 Project Structure

```
StitchFarmer/
├── frontend/          # React + Vite application (the actual deployable app)
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── vercel.json
├── AGENTS.md          # Notes/instructions used by the Antigravity coding agent
└── .gitignore
```

> **Note:** The deployable app lives inside `/frontend`. When deploying to Vercel, set the **Root Directory** to `frontend`.

---

## ⚙️ Local Setup

```bash
cd frontend
npm install
cp .env.example .env   # then fill in your InsForge credentials
npm run dev
```

The app will run at `http://localhost:5173`.

### Environment Variables

Create a `.env` file inside `/frontend` (never commit this file — it's already covered by `.gitignore`):

```env
VITE_INSFORGE_URL=your_insforge_project_url
VITE_INSFORGE_ANON_KEY=your_insforge_anon_key
```

---

## 🧪 Testing

- Backend integration suite: `phase1-backend.test.ts`
- API test suite (Bruno/Postman): `bruno-postman-suite.test.ts`
- Full end-to-end user journeys tested manually in-browser, covering registration → lot listing → deal matching → negotiation → escrow → payout → inventory update

---

## 🚀 Deployment

The frontend is deployed on **Vercel**, connected to this GitHub repository for automatic redeploys on push. The backend runs on **InsForge**, which hosts the database, authentication, and REST API layer independently.

**Live demo:** https://frontend-two-chi-23.vercel.app/

---

## 🎯 Hackathon Scope Notes

This MVP intentionally simplifies several real-world components for demo purposes:

- OTP and payment/escrow flows are **simulated** (no real SMS gateway or payment processor)
- Buyer matching is **simulated** (auto-generated counterpart, not a live buyer network)
- Government integrations (AgriStack, DigiLocker e-KYC) are **stubbed**, returning mock verification responses
- The AI Route Optimization engine uses **deterministic rule-based logic**, not a trained ML model

These are documented trade-offs made to fit a hackathon timeline — the architecture is designed so each stub can be replaced with a real integration later without restructuring the core app.

---

## 👥 Team

Karthik Singh,
Meer Fariya and
Aditya Kanthal
