# SA Mobile-based App Demographic Study and Data Gathering for Tourists

**San Pablo City, Laguna**

A mobile-responsive web application for collecting and analyzing demographic data of tourists staying in accommodation establishments (hotels, resorts, inns) in San Pablo City, Laguna.

## Tech Stack

- **React 19** (latest)
- **TypeScript**
- **Vite**
- **TailwindCSS**
- **React Router v7**
- **Recharts** (charts)
- **React Hook Form** + **Zod** (forms & validation)
- **jsPDF** (PDF export)

## Project Structure

```
sanpablo/
├── src/
│   ├── components/          # Shared components (if needed)
│   ├── contexts/
│   │   └── AuthContext.tsx  # Auth state & dummy login
│   ├── data/
│   │   ├── dummyData.ts     # Mock data for frontend
│   │   ├── analytics.ts     # Business analytics helpers
│   │   └── adminAnalytics.ts# Admin analytics helpers
│   ├── layouts/
│   │   ├── BusinessLayout.tsx  # Sidebar + bottom nav (accommodation)
│   │   └── AdminLayout.tsx     # Sidebar + bottom nav (admin)
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegistrationRequestPage.tsx
│   │   ├── business/
│   │   │   ├── BusinessDashboard.tsx
│   │   │   ├── GuestDataEntry.tsx
│   │   │   ├── MonthlySubmission.tsx
│   │   │   └── BusinessMessages.tsx
│   │   └── admin/
│   │       ├── AdminDashboard.tsx
│   │       ├── RegistrationApproval.tsx
│   │       ├── AdminReports.tsx
│   │       └── AdminMessages.tsx
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── database/
│   └── schema.sql           # MySQL schema (reference)
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── vite.config.ts
```

## Routing Structure

| Path | Description | Role |
|------|-------------|------|
| `/login` | Login | Public |
| `/register` | Registration request | Public |
| `/business` | Business dashboard | Accommodation |
| `/business/guest-entry` | Guest data entry | Accommodation |
| `/business/submission` | Monthly submission | Accommodation |
| `/business/messages` | Messages inbox | Accommodation |
| `/admin` | Admin dashboard | Admin |
| `/admin/registrations` | Registration approval panel | Admin |
| `/admin/reports` | Reports with filters & export | Admin |
| `/admin/messages` | Contact system | Admin |

## Dummy Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@sanpablo.gov.ph` | (any) |
| Business (Resort) | `resort@palmspring.com` | (any) |
| Business (Hotel) | `hotel@sevenlakes.com` | (any) |

> **Note:** Frontend only. Passwords are not validated. Select the correct user type before login.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Design Notes

- **Mobile-first** responsive layout
- **Government-style** UI (blue/gold theme)
- **Sidebar** navigation on desktop
- **Bottom nav** on mobile
- Suitable for **resorts**, **hotels**, and **tourism office**

## Deployment Suggestions

- **Vercel** – zero config, Vite support
- **Netlify** – SPA routing: `_redirects` with `/* /index.html 200`
- **Cloudflare Pages** – static build + SPA fallback
- **Nginx** – serve `dist/` and add `try_files $uri $uri/ /index.html;`

## Database

Use the `database/schema.sql` file for MySQL setup. Connect your future backend to this schema.

## Features Implemented

- ✅ Authentication (dummy JWT-like flow)
- ✅ Registration request form (no auto-activation)
- ✅ Accommodation dashboard with Recharts
- ✅ Guest data entry with subgroups (nationality/gender/age)
- ✅ Monthly submission status
- ✅ Admin dashboard & analytics
- ✅ Registration approval panel
- ✅ Reports with filters + PDF/CSV export
- ✅ Contact/messages system (dummy)
