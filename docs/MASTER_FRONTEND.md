# MASTER FRONTEND DOCUMENT

## 1. Implemented Pages (Phase 2)
| Route        | Component         | Auth     | Description              |
|--------------|-------------------|----------|--------------------------|
| /login       | Login.jsx         | Public   | Login form with Zod      |
| /dashboard   | DashboardPage.jsx | Protected| Stats + activity feed    |

## 2. Planned Pages (Phase 3+)
| Route        | Component          | Description              |
|--------------|--------------------|--------------------------|
| /customers   | CustomersPage.jsx  | CRUD + suspend/restore   |
| /billing     | BillingPage.jsx    | Invoices + payments      |
| /packages    | PackagesPage.jsx   | Plan management          |
| /routers     | RoutersPage.jsx    | MikroTik config          |
| /settings    | SettingsPage.jsx   | User & system settings   |

## 3. State Management (CONFIRMED)
- **Server State**: `@tanstack/react-query` for ALL API data.
- **Global UI/Auth**: `zustand` (authStore.js).
- **Forms**: `react-hook-form` + `zod` for validation.
- **Notifications**: `react-hot-toast`.
- **HTTP Client**: `axios` with interceptors (api.js).

## 4. UI Guidelines
- Mobile-first responsive design (Tailwind `sm:`, `md:`, `lg:` prefixes).
- Color palette: Primary `#2563eb`, Danger `#ef4444`, Success `#22c55e`.
- All API-triggering buttons must show spinner + disabled state.
- Sidebar collapses to hamburger menu on mobile (`lg:` breakpoint).

## 5. AI/Developer Rules
- NEVER put API calls directly in components. Use `src/services/` layer.
- ALWAYS handle loading + error states in React Query.
- Use `ProtectedRoute` wrapper for all authenticated pages.
- Toast notifications for all user actions (success/error).

## 6. Implemented Components
- `Modal.jsx`: Reusable modal with backdrop, size variants, and scroll handling
- `Button.jsx`: Button with variants (primary, secondary, danger, success, outline), sizes, and loading state
- `Badge.jsx`: Status badges with color variants
- `CustomerForm.jsx`: Form with Zod validation for customer CRUD
- `PackageForm.jsx`: Form with Zod validation for package CRUD

## 7. Features Implemented
- Customer list with search and pagination
- Customer CRUD (create, edit, delete)
- Customer suspend/restore (with MikroTik integration)
- Package list (card grid view)
- Package CRUD (create, edit, delete)
- Package deletion protection (cannot delete if customers are using it)
- Real-time data updates via React Query
- Toast notifications for all actions
- Form validation with error messages
