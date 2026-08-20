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

## 8. Phase 4 Pages
| Route | Component | Description |
|-------|-----------|-------------|
| /billing | BillingPage.jsx | Invoice list, generate, collect payments |
| /payments | PaymentsPage.jsx | Payment history with filters |
| /reports | ReportsPage.jsx | Daily & monthly reports |

## 9. Phase 4 Components
- `GenerateInvoiceForm.jsx` - Month picker for invoice generation
- `PaymentForm.jsx` - Payment recording with method selector
- `InvoiceDetailsModal.jsx` - Printable invoice/receipt

## 10. Mobile Optimization (Phase 4)
- **Responsive Tables**: Desktop shows tables, mobile shows cards
- **Touch Targets**: All buttons min 44x44px on mobile
- **Spacing**: Reduced padding on mobile (`p-3 lg:p-4`)
- **Typography**: Smaller text on mobile, scales up on desktop
- **Filters**: Stack vertically on mobile, horizontal on desktop
- **Print Styles**: Hidden UI elements during receipt printing
- **Sidebar**: Slide-in drawer on mobile, fixed on desktop

## 11. Phase 5 Pages
| Route | Component | Description |
|-------|-----------|-------------|
| /routers | RoutersPage.jsx | Router CRUD with connection testing |
| /live-status | LiveStatusPage.jsx | Real-time customer status with bulk ops |

## 12. Phase 5 Components
- `RouterForm.jsx` - Router configuration form with validation
- Live status table with checkbox selection
- Bulk action buttons (suspend/restore)

## 13. UI Optimization (Phase 5)
- Dashboard: Real charts with Recharts (Area + Pie)
- Removed duplicate headings
- Improved stat cards with trend indicators
- Better sidebar with grouped navigation
- Welcome header with date display
- Activity feed with icons