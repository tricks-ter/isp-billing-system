# MASTER BACKEND DOCUMENT

## 1. Implemented Endpoints (Phase 2)
| Method | Endpoint              | Auth   | Description              |
|--------|-----------------------|--------|--------------------------|
| POST   | /api/auth/login       | Public | Login, returns JWT       |
| GET    | /api/auth/profile     | JWT    | Get current user info    |
| GET    | /api/health           | Public | Health check             |

## 2. Planned Endpoints (Phase 3+)
| Method | Endpoint                    | Auth   | Description                    |
|--------|-----------------------------|--------|--------------------------------|
| GET    | /api/customers              | JWT    | List customers (paginated)     |
| POST   | /api/customers              | JWT    | Create customer + PPPoE secret |
| POST   | /api/customers/:id/suspend  | JWT    | Suspend + disable on MikroTik  |
| POST   | /api/customers/:id/restore  | JWT    | Restore + enable on MikroTik   |
| POST   | /api/billing/generate       | JWT    | Generate monthly invoices      |
| POST   | /api/payments               | JWT    | Record payment                 |

## 3. Response Format (MANDATORY)

Success:
```json
{ "success": true, "data": { ... } }
```

Error:
```json
{ "success": false, "message": "Human-readable error" }
```

## 4. Middleware Chain
`Request → helmet → cors → express.json → morgan → authMiddleware → roleMiddleware → controller → service → prisma → Response`

## 5. MikroTik Service (TO BE IMPLEMENTED)
Will use `routeros-api` npm package. Functions needed:
- `addPppoeSecret(username, password, profile, routerId)`
- `disablePppoeSecret(username, routerId)`
- `enablePppoeSecret(username, routerId)`
- `removePppoeSecret(username, routerId)`
All wrapped in try/catch. Router unreachable = log error, don't crash.

## 6. AI/Developer Rules
- Use try/catch in ALL controllers.
- Use `prisma.$transaction` for multi-table writes.
- NEVER store plain-text passwords.
- Log all critical actions to AuditLog table.

## 7. MikroTik Mock Mode (IMPLEMENTED)
- Set `MIKROTIK_MOCK_MODE=true` in `.env` to enable mock mode
- All operations are logged to `backend/logs/mikrotik-operations.log`
- When you get a real router, set to `false` and add router details to the `Router` table
- Mock mode simulates all PPPoE operations without requiring actual hardware

## 8. Implemented Services
- `mikrotikService.js`: Handles all MikroTik RouterOS API operations (mock + real)
- `customerService.js`: Customer CRUD + suspend/restore with MikroTik integration
- `packageService.js`: Package CRUD with customer count validation

## 9. Billing & Payment Services (Phase 4)

### InvoiceService
- `generateMonthlyInvoices(month, userId, routerId)` - Generates invoices for all ACTIVE customers
- `getAllInvoices(page, limit, filters)` - List with pagination and filters
- `getInvoiceById(id)` - Get with customer and payment details
- `getMonthlySummary(month)` - Aggregated monthly stats

### PaymentService
- `recordPayment(data, userId)` - Record payment, update invoice status, auto-restore suspended customers
- `getAllPayments(page, limit, filters)` - List with date range filters
- `getDailyCollection(date)` - Daily collection breakdown by method

### SmsService (Mock Mode)
- `sendSms(phone, message)` - Logs SMS to file in mock mode
- `sendDueReminders()` - Sends Bengali reminder SMS to due customers

### New API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/invoices | JWT | List invoices |
| GET | /api/invoices/summary | JWT | Monthly summary |
| GET | /api/invoices/:id | JWT | Invoice details |
| POST | /api/invoices/generate | JWT+ADMIN | Generate monthly |
| GET | /api/payments | JWT | List payments |
| GET | /api/payments/daily | JWT | Daily collection |
| POST | /api/payments | JWT | Record payment |

## 10. Router Management (Phase 5)

### RouterService
- `getAllRouters()` - List all routers with customer counts
- `createRouter(data, userId)` - Add new MikroTik router
- `updateRouter(id, data, userId)` - Update router config
- `deleteRouter(id, userId)` - Delete (only if no customers assigned)
- `testConnection(id)` - Test API connectivity to router
- `getLiveStatus()` - Get real-time online/offline status
- `bulkSuspend(customerIds, userId)` - Suspend multiple customers
- `bulkRestore(customerIds, userId)` - Restore multiple customers

### New API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/routers | JWT | List routers |
| GET | /api/routers/live-status | JWT | Live customer status |
| GET | /api/routers/:id | JWT | Router details |
| POST | /api/routers | JWT+ADMIN | Add router |
| PUT | /api/routers/:id | JWT+ADMIN | Update router |
| DELETE | /api/routers/:id | JWT+ADMIN | Delete router |
| POST | /api/routers/:id/test | JWT | Test connection |
| POST | /api/routers/bulk/suspend | JWT+ADMIN | Bulk suspend |
| POST | /api/routers/bulk/restore | JWT+ADMIN | Bulk restore |