# MASTER DATABASE DOCUMENT

## 1. Setup Commands (Fedora)

```bash
sudo dnf install postgresql-server postgresql-contrib -y
sudo postgresql-setup --initdb
sudo systemctl start postgresql && sudo systemctl enable postgresql
# Edit /var/lib/pgsql/data/pg_hba.conf: change 'ident' to 'md5'
sudo systemctl restart postgresql
sudo -u postgres psql -c "CREATE USER isp_admin WITH PASSWORD 'isp_secure_pass_2026';"
sudo -u postgres psql -c "CREATE DATABASE isp_billing OWNER isp_admin;"
```

## 2. Prisma Commands

```bash
npx prisma migrate dev --name <description>   # Create & apply migration
npx prisma generate                           # Regenerate client after schema change
npx prisma db seed                            # Run seed.js
npx prisma studio                             # Visual DB browser (dev only)
```

## 3. Current Schema (as of Phase 2)
See `backend/prisma/schema.prisma` for the live schema.

### Tables:
| Table      | Purpose                          | Key Fields                    |
|------------|----------------------------------|-------------------------------|
| User       | System admins/staff              | username, password, role      |
| Customer   | ISP subscribers                  | pppoeUsername, status, pkg    |
| Package    | Internet plans                   | name, speed, price, validity  |
| Invoice    | Monthly bills                    | customerId, month, total      |
| Payment    | Money received                   | invoiceId, amount, method     |
| Router     | MikroTik devices                 | ipAddress, apiPort, creds     |
| AuditLog   | Immutable action log             | userId, action, details       |

## 4. Indexes
- `Customer.status`, `Customer.pppoeUsername`, `Customer.phone`
- `AuditLog.userId`, `AuditLog.action`
- `Invoice(customerId, month)` unique constraint

## 5. Seeded Data
- Admin user: `admin` / `admin123` (bcrypt hashed)
- Packages: Home Basic (10Mbps/500), Home Standard (20Mbps/1000), Home Premium (50Mbps/2000)
