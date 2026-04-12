# EBusatis — Test & Development Guide

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 10+
- Docker Desktop (for PostgreSQL, Redis, MinIO)

### 1. Start Infrastructure
```bash
cd ebusatis-be
docker compose up -d
```

Services started:
| Service | Container | Port | Purpose |
|---------|-----------|------|---------|
| PostgreSQL | ebusatis-postgres | localhost:7232 | Database |
| Redis | ebusatis-redis | localhost:7233 | Cache |
| MinIO | ebusatis-minio | localhost:9100 (API), 9101 (Console) | File storage |

### 2. Start Backend
```bash
cd ebusatis-be
pnpm install
pnpm exec mikro-orm migration:up    # Apply database migrations
pnpm exec mikro-orm seeder:run      # Seed demo data
pnpm start:dev                      # Start on http://localhost:3281
```

### 3. Start Frontend
```bash
cd ebusatis
npm install
npm start                            # Start on http://localhost:3900
```

---

## Login Credentials

### Super Admin (Full Platform Access)
| Field | Value |
|-------|-------|
| URL | http://localhost:3900/login |
| Email | `admin@ebusatis.com` |
| Password | `admin123` |
| Role | Super Admin |
| Access | All platform features + all tenant management |

> Login page has a "Demo Login (Super Admin)" quick button that auto-fills these credentials.

### Login Flow
1. Go to http://localhost:3900
2. Enter credentials or click "Demo Login (Super Admin)"
3. After login, you'll be redirected to **Workspace Selection**
4. Choose "Platform Management" for admin panel, or select a tenant workspace

---

## Test Scenarios

### Scenario 1: Platform Admin Panel
1. Login as Super Admin
2. Select "Platform Management" on workspace selection
3. You should see the **Platform Dashboard** with:
   - Total tenants count
   - Active/Trial tenant stats
   - Recent tenant list
   - Activity feed

**Pages to test:**
- `/admin/permissions` — Permission definitions
- `/admin/global-roles` — System-wide roles
- `/admin/users` — Platform user management
- `/admin/audit-logs` — Audit trail
- `/admin/config` — Platform configuration
- `/tenants` — Tenant list and management

### Scenario 2: Tenant Workspace
1. Login as Super Admin
2. Select "System Admin" tenant (or create a new one)
3. You should see the **Tenant Dashboard** with:
   - KPI cards (products, orders, revenue)
   - Recent orders table
   - Production tracking
   - Quick actions

**Pages to test:**
- `/pim/products` — Product list
- `/partners` — Partner/Supplier/Customer list
- `/orders/purchase` — Purchase orders
- `/orders/sales` — Sales orders
- `/wms/inventory` — Inventory/stock list
- `/wms/receiving` — Goods receive list
- `/logistics` — Shipment tracking
- `/production` — Production orders
- `/finance/invoices` — Invoices
- `/finance/payments` — Payments
- `/reports` — Reporting dashboard
- `/settings/definitions/*` — Master data (units, currencies, etc.)

### Scenario 3: Tenant Switching (Multi-Tenant)
1. Login as Super Admin
2. Select any tenant workspace
3. Click the workspace switcher (bottom-left sidebar)
4. Switch to a different tenant
5. **Verify:** Previous tenant's data is NOT visible
6. **Verify:** Cache is cleared (no stale data)

### Scenario 4: Language Switching
1. Login to any workspace
2. Click the language switcher in the header (TR/EN)
3. **Verify:** All UI labels change language immediately
4. **Verify:** No hardcoded Turkish text appears in English mode

### Scenario 5: Seeded Pilot Data
The seeder creates a complete international import scenario:

| Entity | Identifier | Details |
|--------|-----------|---------|
| Supplier | Shanghai Silk Factory Co. | Partner (SUPPLIER) |
| Customer | Moscow Textiles LLC | Partner (CUSTOMER) |
| Product | Premium Velvet (PRM-VLV) | With Emerald Green variant |
| Purchase Order | PO-2026-PILOT-001 | 100 units x 500 USD = 50,000 USD |
| Production | SPO-2026-PILOT-001 | 6 milestones, READY_TO_SHIP |
| Shipment | SH-2026-PILOT-001 | 3-leg (Factory→Port→Sea→Warehouse) |
| Customs | GTD-2026-PILOT-001 | Duty 5K + VAT 9K + Broker 500 |
| Goods Receive | GR-2026-PILOT-001 | 95 OK + 5 damaged |
| Supplier Claim | CLM-2026-PILOT-001 | 5 x 500 = 2,500 USD |
| Landed Cost | — | Total 75,000 / 100 = **750 USD/unit** |

**To verify pilot data:**
- Go to `/orders/purchase` — should see PO-2026-PILOT-001
- Go to `/production` — should see SPO-2026-PILOT-001
- Go to `/logistics` — should see SH-2026-PILOT-001
- Go to `/wms/receiving` — should see GR-2026-PILOT-001

---

## API Testing

### Base URL
```
http://localhost:3281/api
```

### Get Auth Token
```bash
curl -X POST http://localhost:3281/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ebusatis.com","password":"admin123"}'
```

Response:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "user": {
      "id": "...",
      "email": "admin@ebusatis.com",
      "isSuperAdmin": true,
      "tenantId": "...",
      "tenantName": "System Admin"
    }
  }
}
```

### Example API Calls
```bash
# Set token
TOKEN="eyJ..."

# List products (needs x-tenant-id)
curl -H "Authorization: Bearer $TOKEN" \
     -H "x-tenant-id: TENANT_ID_HERE" \
     http://localhost:3281/api/products

# List tenants (SuperAdmin, no tenant header needed)
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3281/api/tenants

# List partners
curl -H "Authorization: Bearer $TOKEN" \
     -H "x-tenant-id: TENANT_ID_HERE" \
     http://localhost:3281/api/partners
```

### Response Envelope
All API responses follow this format:
```json
// Success
{ "success": true, "data": {...}, "meta": {...}, "timestamp": "..." }

// Error
{ "success": false, "error": "ERROR_CODE", "message": "errors.i18n.key", "statusCode": 404 }
```

---

## Running Tests

### Backend Unit Tests
```bash
cd ebusatis-be
pnpm test                    # All unit tests
pnpm test -- --watch         # Watch mode
pnpm test -- --coverage      # With coverage report
```

### Backend E2E Tests (requires running DB)
```bash
cd ebusatis-be
pnpm exec jest test/integration/ --config test/jest-e2e.json --forceExit
```

### Frontend Tests
```bash
cd ebusatis
npm test                     # Interactive test runner
npm test -- --coverage       # With coverage
```

### Lint Checks
```bash
# Backend (must be 0 errors, 0 warnings)
cd ebusatis-be && pnpm lint

# Frontend (must be 0 errors, 0 warnings)
cd ebusatis && npx eslint src/ --ext .ts,.tsx

# TypeScript compilation
cd ebusatis-be && pnpm exec tsc --noEmit -p tsconfig.build.json
cd ebusatis && npx tsc --noEmit
```

---

## Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3900 | React application |
| Backend API | http://localhost:3281/api | NestJS REST API |
| MinIO Console | http://localhost:9101 | File storage admin (ebusatis_minio / ebusatis_minio_secret) |
| PostgreSQL | localhost:7232 | Database (ebusatis_user / ebusatis_pass / ebusatis_db) |
| Redis | localhost:7233 | Cache |

---

## Stopping Services

```bash
# Stop backend (Ctrl+C if running in foreground, or)
pkill -f "nest start"

# Stop frontend (Ctrl+C if running in foreground, or)
pkill -f "react-scripts start"

# Stop infrastructure
cd ebusatis-be && docker compose down

# Stop and remove all data
cd ebusatis-be && docker compose down -v
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3281 already in use | `lsof -i :3281` then `kill PID` |
| Port 3900 already in use | `lsof -i :3900` then `kill PID` |
| Database connection failed | Ensure `docker compose up -d` ran, check port 7232 |
| Migration error | `pnpm exec mikro-orm migration:fresh` (drops all tables + re-runs) |
| Seed data missing | `pnpm exec mikro-orm seeder:run` |
| MinIO connection error | Check port 9100 (not 9000, remapped due to conflict) |
| Frontend can't reach API | Check `.env` has `REACT_APP_API_URL=http://localhost:3281/api` |
