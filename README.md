# 🏪 SB-DSS — Small Business Decision Support System

> **B.Com Final Year Project** | Full-Stack Web Application
> Stack: Node.js + Express.js + SQLite + Vanilla JS + Chart.js

---

## 📋 Project Overview

SB-DSS is a complete Decision Support System for kirana stores and small business owners in India. It helps owners move from **guesswork to data-driven decisions** using a simple web interface — no technical knowledge required.

---

## 🧱 Tech Stack

| Layer      | Technology              | Purpose                        |
|------------|-------------------------|--------------------------------|
| Frontend   | HTML5 + CSS3            | Structure & styling            |
| Frontend   | Vanilla JavaScript      | Dynamic UI, API calls          |
| Frontend   | Chart.js                | Sales & profit charts          |
| Backend    | Node.js + Express.js    | REST API server                |
| Database   | SQLite (better-sqlite3) | Local database (no setup)      |
| Auth       | JWT + bcryptjs          | Secure tokens                  |
| Styling    | Custom CSS Design System| Indian retail aesthetic        |

---

## 📁 Project Structure

```
sb-dss/
├── backend/
│   ├── config/
│   │   └── database.js       # SQLite setup + seed data
│   ├── routes/
│   │   ├── products.js       # Product CRUD + inventory
│   │   ├── sales.js          # Sales recording + analytics
│   │   ├── decisions.js      # Decision Engine + Health Score
│   │   └── extras.js         # Credits, Suppliers, Wastage etc.
│   ├── .env                  # Environment variables
│   ├── package.json
│   └── server.js             # Express entry point
│
└── frontend/
    └── public/
        ├── css/
        │   └── style.css     # Complete design system
        ├── js/
        │   ├── api.js        # API layer (all fetch calls)
        │   ├── app.js        # Navigation + modal + toast
        │   ├── dashboard.js  # Dashboard page
        │   ├── products.js   # Products page
        │   ├── sales.js      # Sales recording page
        │   ├── inventory.js  # Inventory tracker page
        │   ├── profit.js     # Profit & Loss page
        │   ├── credits.js    # Udhar tracker page
        │   └── extras.js     # All other pages
        └── index.html        # App shell (SPA)
```

---

## 🚀 How to Run

### Prerequisites
- Node.js v18+ (download from nodejs.org)

### Steps

```bash
# 1. Go to backend folder
cd sb-dss/backend

# 2. Install dependencies
npm install

# 3. Start the server
npm start

# 4. Open in browser
# Visit: http://localhost:3000
```

The app will auto-create the SQLite database and seed demo data on first run.

---

## 🔐 Firebase Login Setup

The frontend now includes Firebase Email/Password authentication.

### 1. Create a Firebase project
- Open Firebase Console and create/select a project.
- Enable **Authentication** -> **Sign-in method** -> **Email/Password**.
- Enable **Authentication** -> **Sign-in method** -> **Google**.

### 2. Add your Firebase keys
- Open [frontend/public/js/firebase-config.js](frontend/public/js/firebase-config.js)
- Replace placeholder values in `window.FIREBASE_CONFIG` with your real config from Firebase Project Settings.

### 3. Run the app
- Start backend with `npm start` inside `sb-dss/backend`.
- Visit `http://localhost:3000`.
- Use the login page to sign in, create account, or reset password.

---

## ☁️ Deploy Frontend To Firebase Hosting

This project can deploy the frontend to Firebase Hosting.
The backend (`Node.js + SQLite`) must be hosted separately (Render/Railway/VPS/etc.).

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login and select project

```bash
firebase login
firebase use sb-dss
```

### 3. Set production backend URL

- Open [frontend/public/js/app-config.js](frontend/public/js/app-config.js)
- Change `apiBaseUrl` from `/api` to your deployed backend URL, for example:

```javascript
window.SB_DSS_CONFIG = {
    apiBaseUrl: "https://your-backend-domain.com/api"
};
```

### 4. Deploy hosting

Run from the `sb-dss` folder:

```bash
firebase deploy --only hosting
```

### 5. CORS reminder for backend

Your backend must allow requests from your Firebase Hosting domain (`https://<project-id>.web.app` and `https://<project-id>.firebaseapp.com`).

---

## ✅ Features Built

### Core (6 Features)
| # | Feature | Description |
|---|---------|-------------|
| 1 | **Product Master** | Add/edit products with buy/sell price, GST%, expiry date |
| 2 | **Daily Sales Tracker** | Record sales with payment mode (Cash/UPI/Udhar) |
| 3 | **Inventory Tracker** | Auto-calculated closing stock with low/out alerts |
| 4 | **Profit & Loss Dashboard** | Daily, weekly profit with charts |
| 5 | **Decision Engine** | BUY NOW / WAIT / TRY SMALL / STOP per product |
| 6 | **Business Health Score** | Overall score /10 from stock, profit, demand |

### Smart (5 Features)
| # | Feature | Description |
|---|---------|-------------|
| 7 | **Credit (Udhar) Tracker** | Track who owes money with due dates |
| 8 | **Purchase / Stock-In** | Record incoming stock, auto-updates inventory |
| 9 | **Wastage Log** | Track damaged/expired goods + loss calculation |
| 10 | **Trend Detection** | Week-on-week profit trend with % change |
| 11 | **Category Analysis** | Which category earns most profit |

### Advanced (4 Features)
| # | Feature | Description |
|---|---------|-------------|
| 12 | **Supplier Tracker** | Manage suppliers with delivery times |
| 13 | **Competitor Price Tracker** | Compare your prices vs nearby shops |
| 14 | **Customer Request Log** | Track repeated demands for new products |
| 15 | **Festival & Seasonal Planner** | Pre-loaded with Diwali, Holi, Summer etc. |

### Research Additions
| # | Feature | Description |
|---|---------|-------------|
| 16 | **Expiry Date Tracker** | Red alert for expired/soon-to-expire items |
| 17 | **GST-Aware Billing** | GST % per product, auto-calculated on each sale |
| 18 | **Payment Mode Split** | Cash vs UPI vs Udhar breakdown |
| 19 | **Reorder Prediction** | Days until stockout = current stock ÷ avg daily sales |

---

## 🗄️ Database Schema (9 Tables)

1. `products` — Master product list
2. `sales` — All daily sales records
3. `purchases` — Stock-in / purchase entries
4. `credits` — Udhar (credit) entries
5. `suppliers` — Supplier details
6. `customer_requests` — Customer demand log
7. `competitor_prices` — Competitor price comparisons
8. `wastage` — Damage/expiry records
9. `seasonal_planner` — Festival demand calendar

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | All products |
| POST | /api/products | Add product |
| PUT | /api/products/:id | Update product |
| DELETE | /api/products/:id | Delete product |
| GET | /api/products/inventory/status | Inventory with alerts |
| GET | /api/sales | All sales (with filters) |
| POST | /api/sales | Record a sale |
| GET | /api/sales/summary/daily | Today's summary |
| GET | /api/sales/summary/weekly | 7-day trend |
| GET | /api/sales/analysis/performance | Product performance |
| GET | /api/sales/analysis/categories | Category P&L |
| GET | /api/decisions/engine | Full decision output |
| GET | /api/decisions/health-score | Business health score |
| GET/POST | /api/credits | Credit tracker |
| PUT | /api/credits/:id/pay | Record payment |
| GET/POST | /api/suppliers | Supplier tracker |
| GET/POST | /api/wastage | Wastage log |
| GET/POST | /api/requests | Customer requests |
| GET/POST | /api/competitors | Competitor prices |
| GET/POST | /api/purchases | Purchase records |
| GET | /api/seasonal | Seasonal planner |

---

## 🎤 Viva Answer

> *"SB-DSS is a full-stack web application that converts small business decisions from guesswork into data-driven actions. The frontend is built with HTML, CSS, and JavaScript; the backend uses Node.js and Express.js; and data is stored in SQLite — a zero-setup local database. The system has 19 features across 4 categories: Core, Smart, Advanced, and Research-based additions like expiry tracking and GST-aware billing. The Decision Engine analyses each product's sales speed and stock level to output a clear recommendation: BUY NOW, WAIT, TRY SMALL, or STOP ORDERING."*

---

**Student:** _______________________________ | **Guide:** _______________________________ | **Year:** 2024–2025
