# Atelier Haute Couture — Production React 19 Storefront & Admin Portal

[![Production](https://img.shields.io/badge/Production-Live-00E5FF.svg?style=flat&logo=vercel&logoColor=white)](https://www.youngsteav.site)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Bakong KHQR](https://img.shields.io/badge/Bakong-KHQR_EMVCo-E1251B.svg?style=flat)](https://bakong.nbc.gov.kh/)

A high-performance, mobile-first luxury fashion e-commerce storefront and enterprise management portal built with **React 19**, **Vite**, **TypeScript**, **Tailwind CSS v4**, **Framer Motion**, and **Supabase PostgreSQL**. Deployed and running live in production at **[youngsteav.site](https://www.youngsteav.site)**.

---

## 1. Key Production Capabilities

### 🛍️ Client Luxury Storefront

- **Architectural Runway Catalog**: Filter by category, price, sizes, and colors with sub-10ms UI updates.
- **Apple-Grade Page Transitions & Physics**: Silky route navigation and spring-animated shopping bag using `framer-motion` cubic-bezier easing (`[0.22, 1, 0.36, 1]`).
- **Multi-Step Checkout Flow**: Fluid 3-step checkout with GPS location auto-detection and Cambodia delivery presets (BKK1, Daun Penh, Tuol Kouk, Chroy Changvar, Siem Reap, Sihanoukville).
- **Live Order Logistics Tracker**: Real-time order progress timeline with sound alerts and instant order reference lookups.
- **Patron Sanctuary (VIP Tiering)**: Dynamic lifetime spend tracking with VIP tier status perks (Silver, Gold, Platinum).

### 💳 NBC Bakong KHQR EMVCo Payments

- **Direct Bakong App Launcher**: One-click instant deep-link (`bakong://`) to launch the native Bakong App directly on mobile.
- **Save QR Directly to Photos**: High-resolution HTML5 canvas rendering integrated with native Web Share API (`navigator.share`) to save payment QR directly to iPhone Camera Roll / Android Gallery.
- **Zero Quota Exhaustion**: Optimized PostgreSQL ledger queries eliminating redundant API polling loops to stay strictly within NBC API quotas.

### 🛡️ Executive Admin Suite (`/admin`)

- **Real-time Analytics Dashboard**: Total revenue metrics, live order statuses, sales breakdown, and low-stock alerts.
- **Full CRUD Management**: Products, Categories, Customer Accounts, Promo Coupons, and Orders with instant modal dialogs.
- **Point-of-Sale (POS) Integration**: Printable 80mm thermal receipt generator and official tax invoice modal.

---

## 2. Technology Stack

| Category             | Technology            | Description                                                                  |
| :------------------- | :-------------------- | :--------------------------------------------------------------------------- |
| **Framework**        | React 19.2            | Modern concurrent mode and hooks                                             |
| **Language**         | TypeScript 5.x        | Strict type safety across models and services                                |
| **Build Tool**       | Vite 6 / 8            | Sub-second HMR and production bundle optimization (983ms build)              |
| **Styling**          | Tailwind CSS v4       | High-performance compiled utility classes                                    |
| **Animations**       | Framer Motion         | 60 FPS GPU-accelerated page transitions and micro-interactions               |
| **State Management** | Zustand               | Lightweight persistent stores (`useCartStore`, `useAuthStore`, `useUIStore`) |
| **Database & Auth**  | Supabase PostgreSQL   | Cloud PostgreSQL with real-time replication and secure Auth                  |
| **Payments**         | Bakong KHQR EMVCo     | Universal Cambodian banking QR standard (USD & KHR)                          |
| **Form Handling**    | React Hook Form & Zod | Schema-based validation with instant field error handling                    |
| **Icons**            | Lucide React          | High-clarity geometric iconography                                           |

---

## 3. Project Structure

```text
frontend/
├── public/                 # Static assets, favicon, brand logos
├── src/
│   ├── components/
│   │   ├── checkout/       # KhqrPaymentModal, Payment selector
│   │   ├── common/         # Navbar, Footer, AnnouncementBar, ToastNotification, Modals
│   │   ├── product/        # ProductCard, ProductGrid, QuickViewModal
│   │   └── receipt/        # ThermalReceiptModal, 80mm print generator
│   ├── layouts/
│   │   ├── MainLayout.tsx  # Storefront layout with AnimatePresence page transitions
│   │   └── AdminLayout.tsx # Executive admin sidebar & management header
│   ├── pages/
│   │   ├── Home/           # Hero showcase, spotlight studio, category runways
│   │   ├── shop/           # Complete catalog, multi-filter drawer, sorting
│   │   ├── ProductDetails/ # Gallery zoom, size/color selectors, back navigation
│   │   ├── Cart/           # Spring-physics item list, free shipping goal bar
│   │   ├── Checkout/       # 3-Step animated checkout with Bakong KHQR
│   │   ├── TrackOrder/     # Real-time Supabase logistics tracker
│   │   ├── Orders/         # Customer order history & invoice reprints
│   │   ├── Profile/        # Account management & VIP spend progression
│   │   ├── Categories/     # Curated worlds and collections grid
│   │   ├── Wishlist/       # Saved designs with one-click move-to-bag
│   │   ├── About/          # Atelier manifesto, tailoring philosophy & pillars
│   │   ├── Contact/        # Concierge inquiry form & animated FAQs
│   │   └── admin/          # Dashboard, ManageProducts, ManageOrders, Settings
│   ├── services/
│   │   ├── supabase.ts     # Supabase client configuration
│   │   ├── khqrService.ts  # EMVCo Bakong QR generation and verification
│   │   ├── orderService.ts # Order placement and status sync
│   │   ├── productService.ts # Catalog fetching and caching
│   │   └── telegramService.ts # Automated concierge notification bot
│   ├── store/              # Zustand global state stores
│   └── types/              # Comprehensive TypeScript interfaces
├── .env.example            # Environment variables template
├── package.json
└── vite.config.ts
```

---

## 4. Local Development & Build

### Prerequisites

- **Node.js**: v18.x or v20.x
- **npm** or **pnpm**

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment Variables

Copy `.env.example` to `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_BAKONG_ACCOUNT_ID=rayou_va@bkrt
VITE_BAKONG_API_URL=https://api-bakong.nbc.gov.kh
```

### Step 3: Run Development Server

```bash
npm run dev
```

Access the application at `http://localhost:5173`.

### Step 4: Production Build

```bash
npm run build
```

Generates an optimized production bundle in `dist/` in under 1 second.

---

## 5. Security & Production Checklist

- [x] Sensitive API keys excluded from version control via `.gitignore`.
- [x] Client-side transitions run locally with zero added Egress.
- [x] NBC Bakong daily rate-limiting protections active.
- [x] Responsive layout tested for mobile Safari, Android Chrome, and desktop.
- [x] Dual-currency USD ($) and KHR (៛) support.
- [x] HTTPS enforced on production domain `https://www.youngsteav.site`.

---

## 6. License

Designed and developed for **Atelier Haute Couture Paris** — All Rights Reserved.
