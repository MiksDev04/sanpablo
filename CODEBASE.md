# San Pablo City Tourism Demographics System — Codebase Guide

> **Purpose:** This document serves as a development reference for understanding the project structure, file responsibilities, data flow, and conventions. Always consult this before making changes.

---

## Project Overview

**"SA Mobile-based App Demographic Study and Data Gathering for Tourists"**  
A web application for San Pablo City, Laguna that allows accommodation establishments (hotels, resorts, inns) to record tourist demographic data, and lets the Tourism Office (admin) monitor, approve businesses, and generate reports.

- **Stack:** React 19 + TypeScript + Vite + Tailwind CSS
- **Routing:** React Router DOM v7
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts
- **PDF Export:** jsPDF + jspdf-autotable
- **Excel Export:** xlsx
- **Icons:** lucide-react
- **Data storage:** `localStorage` (no backend currently; MySQL schema is ready in `database/schema.sql`)

---

## Folder Structure

```
sanpablo/
├── database/
│   └── schema.sql              # MySQL schema (not yet connected; future backend)
├── public/                     # Static assets
├── src/
│   ├── main.tsx                # App entry point — wraps providers
│   ├── App.tsx                 # Route definitions + ProtectedRoute guard
│   ├── index.css               # Global Tailwind + custom styles
│   ├── vite-env.d.ts           # Vite type declarations
│   ├── contexts/
│   │   ├── AuthContext.tsx     # Auth state (login, logout, current user)
│   │   └── DataContext.tsx     # Global data state (all entities)
│   ├── data/
│   │   ├── storage.ts          # localStorage CRUD + seed data
│   │   ├── dummyData.ts        # Static nationality list
│   │   ├── analytics.ts        # Business-level analytics helpers
│   │   └── adminAnalytics.ts   # Admin-level analytics helpers
│   ├── layouts/
│   │   ├── AdminLayout.tsx     # Sidebar + mobile nav for admin role
│   │   └── BusinessLayout.tsx  # Sidebar + mobile nav for business role
│   ├── pages/
│   │   ├── LoginPage.tsx               # Public login page
│   │   ├── RegistrationRequestPage.tsx # Public registration form
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx      # Admin overview stats & charts
│   │   │   ├── RegistrationApproval.tsx # Approve/reject business registrations
│   │   │   ├── AdminReports.tsx        # Filter & export submitted monthly reports
│   │   │   └── AdminMessages.tsx       # Send messages/reminders to businesses
│   │   └── business/
│   │       ├── BusinessDashboard.tsx   # Business overview stats & charts
│   │       ├── GuestDataEntry.tsx      # Form to log guest check-ins (subgroups)
│   │       ├── BusinessReports.tsx     # View, submit, and export monthly reports
│   │       └── BusinessMessages.tsx   # Read messages from admin
│   └── types/
│       └── index.ts            # All shared TypeScript types and interfaces
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── postcss.config.js
```

---

## Entry Points

### `src/main.tsx`
Bootstraps the app. Provider order (outer → inner):
```
BrowserRouter → DataProvider → AuthProvider → App
```
`DataProvider` must wrap `AuthProvider` because `AuthContext` calls `storage.ts` functions that are also used by `DataContext`.

### `src/App.tsx`
Defines all routes. Contains `ProtectedRoute` component that checks `isAuthenticated` and `user.role` before rendering nested routes.

| Path | Component | Access |
|---|---|---|
| `/login` | `LoginPage` | Public |
| `/register` | `RegistrationRequestPage` | Public |
| `/business/*` | `BusinessLayout` + sub-routes | `role === 'business'` |
| `/admin/*` | `AdminLayout` + sub-routes | `role === 'admin'` |
| `/` | Redirects to `/login` | — |

---

## Contexts

### `src/contexts/AuthContext.tsx`
- **State:** `user: User | null` — persisted in `localStorage` under key `sanpablo_user`
- **`login(email, password)`** — looks up user via `storage.getUsers()`, only succeeds if `status === 'approved'`. Password is NOT verified (prototype stage).
- **`logout()`** — clears state and localStorage entry
- **Hook:** `useAuth()` — throws if used outside `AuthProvider`

### `src/contexts/DataContext.tsx`
- **State:** All major entities: `users`, `businesses`, `guestRecords`, `monthlySubmissions`, `registrationRequests`, `messages`
- **`refresh()`** — reloads all data from `localStorage` into state
- Every mutation function calls its `storage.ts` counterpart then calls `refresh()`
- **Hook:** `useData()` — throws if used outside `DataProvider`

| Method | What it does |
|---|---|
| `addGuestRecords(records[])` | Adds one or more guest records for a business |
| `addRegistrationRequest(req)` | Submits a new registration application |
| `updateRegistrationRequest(id, updates)` | Admin approve/reject a registration |
| `addMessage(msg)` | Sends a message (admin → business) |
| `submitMonthlySubmission(bizId, month, year)` | Locks a monthly report as submitted |
| `resetGuestRecordsAndReports()` | Clears all guest records + monthly submissions (dev/demo use) |

---

## Data Layer

### `src/data/storage.ts`
Single source of truth for localStorage operations.

**Storage keys:**
| Key | Entity |
|---|---|
| `sanpablo_users` | Users |
| `sanpablo_businesses` | Businesses |
| `sanpablo_guest_records` | Guest records |
| `sanpablo_monthly_submissions` | Monthly submission statuses |
| `sanpablo_registration_requests` | Registration requests |
| `sanpablo_messages` | Messages |

**Seed data (on first load):**
- `admin@sanpablo.gov.ph` → role: `admin`, status: `approved`
- `resort@palmspring.com` → role: `business`, bizId: `biz-1`  
- `hotel@sevenlakes.com` → role: `business`, bizId: `biz-2`

> **Note:** No real authentication — any password works for seeded accounts. This must be replaced when connecting a backend.

### `src/data/dummyData.ts`
Exports static `nationalities` array (dropdown options). Not stored in localStorage.

### `src/data/analytics.ts`
Business-scoped analytics functions (used on Business Dashboard and Reports pages).

| Function | Returns |
|---|---|
| `getBusinessRecords(records, bizId)` | Guest records for one business |
| `getRecordsForMonth(records, bizId, month, year)` | Records filtered to a specific month |
| `getRecordsForYear(records, bizId, year)` | Records filtered to a year |
| `getTotalGuestsThisMonth(records, bizId)` | Total guest count for the current month |
| `getTotalGuestsThisYear(records, bizId)` | Total guest count for the current year |
| `getNationalityBreakdown(records, bizId, month?, year?)` | `[{name, value}]` for pie/bar charts |
| `getMonthlyTouristCount(records, bizId, year)` | `[{month, guests}]` for bar chart (12 months) |
| `getGenderDistribution(records, bizId)` | `[{name, value}]` — gender breakdown |
| `getAverageLengthOfStay(records, bizId)` | Average days between check-in and check-out |
| `getTransportationModeData(records, bizId)` | `[{name, value}]` — transport mode breakdown |

### `src/data/adminAnalytics.ts`
System-wide analytics functions (used on Admin Dashboard).

| Function | Returns |
|---|---|
| `getTotalActiveBusinesses(businesses)` | Count of registered businesses |
| `getTotalTouristsMonth(records)` | System-wide tourist count this month |
| `getTotalTouristsYear(records)` | System-wide tourist count this year |
| `getPendingRegistrations(requests)` | Count of pending registration requests |
| `getSubmissionComplianceRate(businesses, submissions)` | Percentage string (e.g., `"75%"`) |
| `getTopNationalities(records, count?)` | Top N nationalities by guest count |
| `getTouristTrendData(records, months?)` | Last N months trend `[{month, guests}]` |

---

## Types (`src/types/index.ts`)

| Type / Interface | Description |
|---|---|
| `UserRole` | `'business' \| 'admin'` |
| `UserStatus` | `'pending' \| 'approved' \| 'rejected'` |
| `TransportationMode` | `'private_car' \| 'bus' \| 'van' \| 'motorcycle' \| 'plane' \| 'other'` |
| `PurposeOfVisit` | `'leisure' \| 'business' \| 'event' \| 'others'` |
| `AgeGroup` | `'1-9' \| '10-17' \| '18-25' \| '26-35' \| '36-45' \| '46-55' \| '56+' \| 'prefer_not_to_say'` |
| `Gender` | `'male' \| 'female' \| 'lgbt' \| 'prefer_not_to_say'` |
| `User` | `id, email, role, status, business?` |
| `Business` | `id, userId, businessName, permitNumber, address, contactNumber, ownerName, permitFileUrl?, validIdUrl?` |
| `GuestRecord` | Single demographic entry: `id, businessId, checkIn, checkOut, nationality, gender, age, transportationMode, purpose, numberOfGuests, createdAt` |
| `GuestSubgroup` | Sub-entry within a guest check-in: `nationality, gender, age, count` |
| `GuestEntryForm` | Form shape for `GuestDataEntry.tsx` |
| `MonthlySubmission` | `id, businessId, month, year, status, submittedAt?` |
| `Message` | `id, senderId, receiverId, subject, message, readStatus, createdAt` |
| `RegistrationRequest` | Like `Business` but with `status` and `remarks?`, no `userId` until approved |

---

## Layouts

### `src/layouts/AdminLayout.tsx`
- Renders a fixed **left sidebar** on `lg+` screens
- Renders a **bottom tab bar** on mobile screens
- Nav items: Dashboard, Registrations, Reports, Messages
- Shows `user.email` in the footer; includes logout button
- Uses `gov-blue` / `gov-gold` Tailwind custom colors

### `src/layouts/BusinessLayout.tsx`
- Same responsive pattern as `AdminLayout`
- Nav items: Dashboard, Guest Entry, Reports, Messages
- Shows `user.business.businessName` (or email as fallback) in sidebar footer

---

## Pages

### Public Pages

#### `LoginPage.tsx`
- Role selector (radio: Business / Admin)  
- Email + password form  
- On submit: calls `useAuth().login()`, validates role match, redirects to `/admin` or `/business`  
- Link to `/register`

#### `RegistrationRequestPage.tsx`
- Public form for new accommodation businesses  
- Validates with `zod` schema (business name, permit, owner, email, contact, address, password + confirm)  
- Calls `addRegistrationRequest()` → status defaults to `'pending'`  
- Shows success screen after submit

---

### Business Pages

#### `BusinessDashboard.tsx`
- KPI cards: Total Guests This Month, Total Guests This Year, Avg. Length of Stay, Most Common Transport
- Charts: Nationality Pie Chart, Monthly Bar Chart, Gender Pie Chart, Transport Mode Bar Chart
- All data from `analytics.ts` filtered by `user.business.id`

#### `GuestDataEntry.tsx` — **Most complex form**
- Multi-subgroup form: each entry contains `nationality`, `gender`, `age`, `count`
- Dynamic field array via `react-hook-form` `useFieldArray`
- Top-level fields: `checkIn`, `checkOut`, `transportationMode`, `purpose`
- Searchable nationality dropdown (filters the `nationalities` list from `dummyData.ts`)
- Live preview panel showing all subgroups before submission
- On submit: creates one `GuestRecord` per subgroup, calls `addGuestRecords()`
- Also shows a paginated **Recent Entries** table of existing records for this business

#### `BusinessReports.tsx`
- Groups guest records by month/year
- Displays submission status per month (submitted / not submitted)
- **Submit Monthly Report** button — calls `submitMonthlySubmission()`, locks the month
- **Preview** — shows detailed breakdown for the selected month-year
- **Export to PDF** — detailed guest table via jsPDF + autoTable
- **Export to Excel** — via xlsx
- **Reset Records** — calls `resetGuestRecordsAndReports()` (clears all guest data; for demo)

#### `BusinessMessages.tsx`
- Reads messages from `DataContext` filtered by `receiverId === user.id`
- Sorted newest-first; unread messages styled in blue
- Read-only — businesses cannot send messages

---

### Admin Pages

#### `AdminDashboard.tsx`
- KPI cards (4 across): Active Businesses, Tourists This Month, Tourists This Year, Pending Registrations
- Submission Compliance Rate display
- Top 5 Nationalities list
- Tourist Trend (last 12 months) bar chart — uses `getTouristTrendData()`

#### `RegistrationApproval.tsx`
- Lists all `registrationRequests` from `DataContext`
- Search by business name, owner name, or email
- Filter by status (all / pending / approved / rejected)
- Approve / Reject buttons — calls `updateRegistrationRequest(id, { status: '...' })`

#### `AdminReports.tsx`
- Filters monthly submissions by: **year**, **month**, **accommodation** (specific business or All)
- Expandable rows showing per-submission demographic breakdown
- Export to PDF — jsPDF table of all filtered submission data
- Includes nationality, gender, age, transport, purpose breakdowns per submission

#### `AdminMessages.tsx`
- Compose form: recipient (All businesses or a specific one), subject, message body
- Quick-template buttons: "Monthly Reminder" and "System Announcement" auto-fill the form
- Sends to one or all businesses via `addMessage()` in `DataContext`

---

## Database (`database/schema.sql`)

MySQL-compatible schema — **not yet connected**; currently all data is in localStorage.

| Table | Description |
|---|---|
| `users` | All user accounts (business + admin) |
| `businesses` | Accommodation establishment details |
| `guest_records` | Individual guest demographic entries |
| `guest_subgroups` | Breakdown per check-in (nationality, gender, age, count) |
| `monthly_submissions` | Month-level lock/status per business |
| `messages` | Admin-to-business messaging |

---

## Styling Conventions

- **Tailwind CSS v3** with custom color tokens defined in `tailwind.config.js`:
  - `gov-blue` — primary government blue (used for headers, nav, text)
  - `gov-gold` — accent gold (used for active nav state)
  - `primary-*` — extended palette for buttons and focus rings
- **Responsive:** all pages use `lg:` breakpoints for sidebar visibility and grid layouts
- **Mobile navigation:** bottom tab bar (fixed, z-50) replaces sidebar on small screens

---

## Development Notes

### Adding a New Business Page
1. Create the page component under `src/pages/business/`
2. Add its route in `App.tsx` under the `/business` nested route
3. Add a nav item to `BusinessLayout.tsx` `navItems` array

### Adding a New Admin Page
1. Create the page component under `src/pages/admin/`
2. Add its route in `App.tsx` under the `/admin` nested route
3. Add a nav item to `AdminLayout.tsx` `navItems` array

### Adding a New Data Field
1. Update the TypeScript type in `src/types/index.ts`
2. Update `storage.ts` CRUD functions and seed data
3. Update the relevant form/page components
4. Update the `schema.sql` for future backend migration

### Adding a New Analytics Function
- Business-scoped → add to `src/data/analytics.ts`
- System-wide (all businesses) → add to `src/data/adminAnalytics.ts`

### Connecting a Real Backend
- All localStorage read/write logic is isolated in `src/data/storage.ts`
- Replace the functions in `storage.ts` with API calls (fetch/axios)
- `DataContext.tsx` does not need to change — it only calls `storage.ts` functions
- Implement proper password hashing — currently **all passwords are accepted** in `AuthContext.login()`

---

## Known Prototype Limitations

| Limitation | Location | Notes |
|---|---|---|
| No password verification | `AuthContext.tsx` `login()` | Any string accepted; replace with bcrypt/JWT |
| No file uploads | `RegistrationRequestPage.tsx` | `permitFileUrl` / `validIdUrl` fields are present in types but not implemented in UI |
| localStorage only | `storage.ts` | No persistence across devices; limited storage size |
| No real-time updates | `DataContext.tsx` | `refresh()` is manual; no WebSocket or polling |
| No pagination in reports | `AdminReports.tsx`, `BusinessReports.tsx` | Large data sets may render slowly |
| Month-year hardcoded in `BusinessDashboard` | Line: `getMonthlyTouristCount(..., 2025)` | Should use `new Date().getFullYear()` |
