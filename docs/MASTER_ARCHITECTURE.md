# MASTER ARCHITECTURE DOCUMENT

## 1. System Overview
Full-stack ISP Billing and Network Management System for Bangladesh ISPs.
Manages customers, automates billing, controls MikroTik routers (PPPoE suspend/restore).

## 2. Tech Stack (CONFIRMED & IMPLEMENTED)
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, React Query, Zustand, React Hook Form + Zod, Axios, React Hot Toast, React Router DOM v6.
- **Backend**: Node.js, Express.js, Prisma ORM, bcryptjs, jsonwebtoken, helmet, morgan, cors.
- **Database**: PostgreSQL 15+ (installed via `dnf` on Fedora).
- **Network**: `routeros-api` (to be implemented in Phase 3).

## 3. Project Structure (ACTUAL)

```
isp-billing-system/
├── docs/                          # Master documentation (THIS FOLDER)
├── database/seeds/                # SQL seed files (if needed outside Prisma)
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Single source of truth for DB schema
│   │   └── seed.js                # Seeds admin user + sample packages
│   ├── src/
│   │   ├── index.js               # Express entry point
│   │   ├── config/db.js           # Prisma singleton
│   │   ├── controllers/           # HTTP request handlers
│   │   │   └── authController.js
│   │   ├── services/              # Business logic
│   │   │   └── authService.js
│   │   ├── routes/                # API route definitions
│   │   │   └── authRoutes.js
│   │   ├── middleware/            # Auth & role guards
│   │   │   ├── authMiddleware.js
│   │   │   └── roleMiddleware.js
│   │   └── utils/                 # Helpers (to be added)
│   ├── .env                       # Environment variables (NOT committed)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Router + QueryClient + Toaster
│   │   ├── components/
│   │   │   ├── Login.jsx          # Login form with Zod validation
│   │   │   ├── Layout.jsx         # Sidebar + Header shell
│   │   │   └── ProtectedRoute.jsx # Auth guard
│   │   ├── pages/
│   │   │   └── DashboardPage.jsx  # Main dashboard with stats
│   │   ├── services/
│   │   │   ├── api.js             # Axios instance with interceptors
│   │   │   └── authApi.js         # Auth-specific API calls
│   │   ├── store/
│   │   │   └── authStore.js       # Zustand auth state
│   │   └── utils/                 # Helpers (to be added)
│   ├── .env                       # VITE_API_URL
│   └── package.json
├── .gitignore
└── README.md
```

## 4. Data Flow (Authentication - IMPLEMENTED)
1. User enters credentials in React Login form (validated by Zod).
2. `authApi.login()` sends `POST /api/auth/login` via Axios.
3. Express `authController.login()` validates input, calls `authService.login()`.
4. `authService` finds user via Prisma, compares password with bcrypt.
5. On success: generates JWT, creates AuditLog, returns token + user info.
6. Frontend stores token in localStorage + Zustand, redirects to `/dashboard`.
7. All subsequent API calls include `Authorization: Bearer <token>` header.
8. `authMiddleware` verifies JWT on protected routes.

## 5. Running the System

```bash
# Terminal 1: Backend
cd backend && node src/index.js    # Runs on port 3001

# Terminal 2: Frontend
cd frontend && npm run dev         # Runs on port 5173

# Default login: admin / admin123
```

## 6. AI/Developer Rules (DO NOT VIOLATE)
- NEVER remove MikroTik/OLT integration logic (Phase 3).
- ALWAYS use Prisma ORM. No raw SQL unless performance-critical.
- ALWAYS validate input on Backend AND Frontend.
- Admin UI = English. Customer portal/receipts = Bengali support required.
- Passwords = bcrypt. NEVER commit .env files.
- ALL multi-table DB operations must use `prisma.$transaction`.
- API responses must follow: `{ success: boolean, data?: any, message?: string }`.
