# EBusatis Backend — System Flow Documentation

## Architecture Overview

```
NestJS + MikroORM + PostgreSQL
Auth: JWT (Passport) + Guards (Role/Tenant/Permission)
Multi-Tenant: @Filter('tenant') + AsyncLocalStorage
Error Handling: ErrorCode enum → AppException → GlobalExceptionFilter
```

## 1. Request Pipeline

```
HTTP Request
  │
  ├─ Helmet (security headers)
  ├─ CORS (allowed origins, x-tenant-id header)
  ├─ ThrottlerGuard (60 req/60s per IP)
  │
  ├─ MikroORM RequestContext Middleware
  │   ├─ Creates isolated EntityManager per request
  │   ├─ Reads x-tenant-id header
  │   ├─ Sets em.setFilterParams('tenant', { tenantId })
  │   └─ Wraps in TenantContext.run(tenantId, next)
  │
  ├─ ValidationPipe (transform, whitelist, forbidNonWhitelisted)
  │
  ├─ Guards (per controller/method)
  │   ├─ JwtAuthGuard → validates JWT, populates req.user
  │   ├─ TenantGuard → ensures tenant context exists
  │   ├─ PermissionsGuard → checks @RequirePermissions
  │   └─ SuperAdminGuard → isSuperAdmin check
  │
  ├─ Controller → Service → Repository
  │
  ├─ TransformInterceptor
  │   └─ Wraps: { success: true, data, meta?, timestamp }
  │
  └─ GlobalExceptionFilter (on error)
      └─ Returns: { success: false, error, message, metadata?, statusCode, timestamp, path }
```

## 2. Authentication Flow

```
POST /api/auth/login { email, password }
  │
  ├─ AuthService.validateUser(email, password)
  │   ├─ Find user by email (populate tenant)
  │   └─ bcrypt.compare(password, user.passwordHash)
  │
  ├─ Check user.isActive → throw AccountDeactivatedException
  ├─ Update user.lastLoginAt
  │
  ├─ Build JWT Payload:
  │   { sub: userId, email, tenantId, isSuperAdmin }
  │
  ├─ Sign JWT (expiresIn: '1d')
  │
  └─ Return:
      {
        access_token: "eyJ...",
        user: { id, email, isSuperAdmin, isTenantOwner, tenantId, tenantName }
      }

POST /api/tenants/:id/impersonate (SuperAdmin only)
  ├─ Find user by ID
  ├─ Build JWT with user's tenantId
  └─ Return: { access_token, user: { ...user, isImpersonated: true } }
```

## 3. Multi-Tenant Architecture

```
Entity Hierarchy:
  BaseEntity { id, createdAt, updatedAt, deletedAt }
    └─ BaseTenantEntity extends BaseEntity
        ├─ @Filter('tenant') { cond: { tenant.id = tenantId }, default: true }
        ├─ @ManyToOne Tenant (indexed)
        └─ BaseDefinitionEntity extends BaseTenantEntity
            ├─ name, code (unique per tenant), description
            ├─ isActive, sortOrder, scope (SYSTEM_SEED | TENANT)
            └─ Used by: Unit, Currency, Category, Warehouse, TaxRate, Tag, Status, PaymentMethod, DeliveryMethod

Tenant Isolation (3 layers):
  1. ORM Filter: @Filter('tenant') on BaseTenantEntity → auto-applied to ALL queries
  2. Service Layer: TenantContext.getTenantId() verification (defense-in-depth)
  3. Guard Layer: TenantGuard ensures x-tenant-id header present

SuperAdmin Cross-Tenant:
  em.find(Entity, {}, { filters: { tenant: false } })
```

## 4. Module Map — Endpoints & Entity Relationships

### Auth Module
```
POST /api/auth/login → AuthService.login(LoginDto)
  Guards: None (public)
  Entities: User (read-only)
```

### Products Module (Kademe 3)
```
GET    /api/products                    → findAll(query)
GET    /api/products/:id                → findOne(id)
POST   /api/products                    → create(CreateProductDto)
PATCH  /api/products/:id                → update(id, UpdateProductDto)
DELETE /api/products/:id                → remove(id)
GET    /api/products/:id/variants       → getVariants(productId)
POST   /api/products/:id/variants       → createVariant(productId, dto)
PATCH  /api/products/variants/:id       → updateVariant(variantId, dto)
DELETE /api/products/variants/:id       → removeVariant(variantId)

Guards: JwtAuthGuard + TenantGuard

Entities:
  Product → ManyToOne(Category, UnitOfMeasure, TaxRate), ManyToMany(Tag, ProductCollection)
  ProductVariant → ManyToOne(Product, Currency)
  ProductAttributeValue → ManyToOne(Product, Attribute)
  Attribute → standalone
  ProductCollection → ManyToMany(Product)
  PhysicalSample → ManyToOne(Product, ProductVariant)
  SampleLoanHistory → ManyToOne(PhysicalSample, Partner, User)
  SupplierPriceList → ManyToOne(Currency, SalesChannel)
  SupplierPriceListItem → ManyToOne(SupplierPriceList, ProductVariant)
  ProductVariantAttributeValue → ManyToOne(ProductVariant, Attribute)
  DigitalCatalog → ManyToOne(Partner)
  DigitalCatalogItem → ManyToOne(DigitalCatalog, ProductVariant)
```

### Partners Module (Kademe 2)
```
GET    /api/partners                          → findAll(query)
GET    /api/partners/:id                      → findOne(id)
POST   /api/partners                          → create(dto)
PATCH  /api/partners/:id                      → update(id, dto)
DELETE /api/partners/:id                      → remove(id)
GET    /api/partners/:id/addresses              → getAddresses(partnerId)
POST   /api/partners/:id/addresses              → createAddress(dto)
PATCH  /api/partners/:id/addresses/:addressId   → updateAddress(addressId, dto)
DELETE /api/partners/:id/addresses/:addressId   → removeAddress(addressId)
GET    /api/partners/:id/contacts               → getContacts(partnerId)
POST   /api/partners/:id/contacts               → createContact(dto)
PATCH  /api/partners/:id/contacts/:contactId    → updateContact(contactId, dto)
DELETE /api/partners/:id/contacts/:contactId    → removeContact(contactId)
GET    /api/partners/:id/counterparties         → getCounterparties(partnerId)
POST   /api/partners/:id/counterparties         → createCounterparty(dto)
PATCH  /api/partners/:id/counterparties/:cpId   → updateCounterparty(cpId, dto)
DELETE /api/partners/:id/counterparties/:cpId   → removeCounterparty(cpId)
GET    /api/partners/:id/interactions         → getInteractions(partnerId)
POST   /api/partners/:id/interactions         → createInteraction(dto)

Guards: JwtAuthGuard + TenantGuard

Entities:
  Partner { types: SUPPLIER|CUSTOMER|CARRIER, supplierSubtype, customerSubtype }
    ├─ OneToMany → PartnerAddress, PartnerContact, PartnerRep
    ├─ OneToMany → Counterparty (cari hesap)
    ├─ OneToMany → Interaction (CRM activity)
    └─ ManyToMany → BankAccount
```

### Orders Module (Kademe 5)
```
Purchase Orders:
  GET/POST/DELETE /api/orders/purchase*
  PurchaseOrder → ManyToOne(Partner, Currency, StatusDefinition, User)
  PurchaseOrderLine → ManyToOne(PurchaseOrder, ProductVariant)
    Property: landedUnitCost (written by LandedCostCalculation)

Sales Orders:
  GET/POST/PATCH/DELETE /api/orders/sales*
  POST /api/orders/sales/lines/:lineId/allocate → allocateRoll
  SalesOrder → ManyToOne(Partner, Warehouse, Currency, PaymentMethod, DeliveryMethod)
  SalesOrderLine → ManyToOne(SalesOrder, ProductVariant)
  OrderRollAllocation → ManyToOne(SalesOrderLine, InventoryItem)
```

### Inventory Module (Kademe 4)
```
Inventory:
  GET /api/inventory/rolls            → findAll
  POST /api/inventory/cut             → cutRoll (creates InventoryTransaction)
  POST /api/inventory/waste           → markWaste
  POST /api/inventory/adjust          → adjustStock
  GET /api/inventory/movements/:id    → getMovements (transaction history)

Goods Receive:
  GET/POST /api/inventory/goods-receive*
  GoodsReceive → ManyToOne(Partner, Warehouse, PurchaseOrder, Shipment)
  GoodsReceiveLine → ManyToOne(GoodsReceive, ProductVariant)
    DiscrepancyType: NONE|MISSING|DAMAGED|SHORT_WEIGHT

Supplier Claims:
  GET/POST /api/inventory/supplier-claims*
  SupplierClaim → ManyToOne(Partner, GoodsReceive, PurchaseOrder)
  SupplierClaimLine → ManyToOne(SupplierClaim, GoodsReceiveLine, ProductVariant)

Entities:
  InventoryItem → ManyToOne(ProductVariant, Warehouse, GoodsReceiveLine)
  InventoryTransaction → ManyToOne(InventoryItem, User)
    Types: PURCHASE|SALE_CUT|WASTE|ADJUSTMENT|RETURN
  InventoryCount → ManyToOne(Warehouse, User)
  InventoryCountLine → ManyToOne(InventoryCount, InventoryItem)
```

### Logistics Module
```
Shipments (unified INBOUND/OUTBOUND):
  GET/POST/PATCH /api/logistics/shipments*
  PATCH /api/logistics/shipments/:id/status → updateStatus

Shipment Legs (multi-leg transit):
  GET/POST/PATCH/DELETE /api/logistics/shipments/:id/legs*
  ShipmentLeg → ManyToOne(Shipment, Warehouse)
  LegType: FACTORY_TO_PORT|SEA|AIR|RAIL|PORT_TO_WAREHOUSE|...

Container Events:
  GET/POST /api/logistics/shipments/:id/events
  ContainerEventType: LOADED_AT_FACTORY|AT_ORIGIN_PORT|LOADED_ON_VESSEL|...

Customs:
  GET/POST /api/logistics/customs*
  CustomsDeclaration → ManyToOne(Shipment, Currency)

Freight Quotes:
  GET/POST /api/logistics/quotes*
  FreightQuote → ManyToOne(Shipment)

Carrier Payments:
  GET/POST/PATCH/DELETE /api/logistics/legs/:id/carrier-payments*
  CarrierPaymentSchedule → ManyToOne(ShipmentLeg)
```

### Production Module
```
GET/POST /api/production/orders*                    → supplier production orders
PATCH /api/production/orders/:id/status             → update status
PATCH /api/production/milestones/:id                → update milestone
PATCH /api/production/milestones/:id/supplier-report → supplier self-report
POST /api/production/qc                             → create quality check
POST /api/production/media                          → add production media

Entities:
  SupplierProductionOrder → ManyToOne(PurchaseOrder, Partner, Product)
    Status: DRAFT → IN_PRODUCTION → QUALITY_CHECK → READY_TO_SHIP → SHIPPED → COMPLETED
  ProductionMilestone → ManyToOne(SupplierProductionOrder)
    Codes: DYEHOUSE|WEAVING|FINISHING|QC|PACKAGING|READY_FOR_PICKUP
  QualityCheck → ManyToOne(SupplierProductionOrder)
    QCType: SUPPLIER_PRE_SHIPMENT|OUR_INCOMING|OUR_RANDOM_AUDIT
  ProductionMedia → ManyToOne(SupplierProductionOrder)
```

### Finance Module (Kademe 6)
```
Invoices: GET/POST/DELETE /api/finance/invoices*
  Invoice → ManyToOne(SalesOrder, Partner, Currency, User)
  InvoiceLine → ManyToOne(Invoice, SalesOrderLine)

Payments: GET/POST /api/finance/payments*
  Payment → ManyToOne(Partner, Currency, User)
  PaymentInvoiceMatch → ManyToOne(Payment, Invoice)
  DocumentLink → ManyToOne polymorphic (Invoice|Payment|SalesOrder|PurchaseOrder)
```

### Accounting Module
```
Landed Cost:
  GET /api/accounting/landed-costs        → findAll
  POST /api/accounting/landed-costs/calculate → calculate(dto)

  LandedCostCalculation → ManyToOne(PurchaseOrder, Shipment, Currency, User)
    Aggregates: productCost + freightCost + customsDuty + customsVat + 
                brokerFee + insuranceCost + storageCost + inlandTransportCost
    Result: totalLandedCost / totalQuantity = landedUnitCost
    Writes back: PurchaseOrderLine.landedUnitCost
    Snapshot: lineAllocations (JSONB)
```

### Tenants Module (Platform)
```
POST   /api/tenants                    → create tenant
GET    /api/tenants                    → list all
GET    /api/tenants/:id                → detail
GET    /api/tenants/:id/statistics     → getStatistics(id)
PATCH  /api/tenants/:id                → update
PATCH  /api/tenants/:id/subscription   → change status (ACTIVE|SUSPENDED|TRIAL)
PATCH  /api/tenants/:id/features       → toggle features
DELETE /api/tenants/:id                → soft delete
POST   /api/tenants/:id/impersonate    → generate impersonation token

Guards: JwtAuthGuard + PermissionsGuard (@RequirePermissions('tenants.manage'))
```

### Admin Module (Platform)
```
Dashboard: GET /api/admin/dashboard → stats, recent tenants, activity
Users:     GET/PATCH/POST/DELETE /api/admin/users* → platform user management
Audit:     GET /api/admin/audit-logs → system audit trail
Config:    GET/PUT /api/admin/config* → platform configuration
Reports:   GET /api/admin/reports/{tenants,health,usage}

Guards: JwtAuthGuard + SuperAdminGuard (all endpoints)
```

### Sourcing Module
```
GET    /api/sourcing/rfqs              → getRFQs(query)
POST   /api/sourcing/rfqs              → createRFQ(dto)
GET    /api/sourcing/rfqs/:id          → getRFQ(id)
PATCH  /api/sourcing/rfqs/:id/status   → updateRFQStatus(id, status)
POST   /api/sourcing/rfqs/:id/responses → addResponse(rfqId, dto)
PATCH  /api/sourcing/responses/:id/select → selectResponse(id)
GET    /api/sourcing/rfqs/:id/compare  → compareResponses(rfqId)

Guards: JwtAuthGuard
Entities: RFQ, RFQResponse
```

### Classifications Module
```
GET    /api/classifications/tree?type={type} → getTree(type)
GET    /api/classifications/summary          → getSummary(module)
GET    /api/classifications/:id              → getById(id)
GET    /api/classifications/:id/children     → getChildren(id, recursive)
POST   /api/classifications                  → create(dto)
PATCH  /api/classifications/:id              → update(id, dto)
DELETE /api/classifications/:id              → remove(id)
PATCH  /api/classifications/:id/move         → move(id, newParentId)
PATCH  /api/classifications/:id/activate     → activate(id)
PATCH  /api/classifications/:id/deactivate   → deactivate(id)
POST   /api/classifications/reorder          → reorder(items)

Guards: JwtAuthGuard
Entities: ClassificationNode (extends BaseEntity with optional tenant — supports platform-scoped data)
```

### IAM Module
```
Tenant Roles:
  GET/POST/PUT/DELETE /api/roles*        → CRUD tenant roles
  Guards: JwtAuthGuard + TenantGuard

System Roles (SuperAdmin only):
  GET/POST/PUT/DELETE /api/system-roles* → CRUD global roles
  Guards: JwtAuthGuard + SuperAdminGuard

Permissions:
  GET/POST/PATCH/DELETE /api/permissions* → CRUD permissions + categories
  Guards: JwtAuthGuard + SuperAdminGuard

Entities: Role, Permission, UserGroup
```

### Users Module
```
GET    /api/users         → findAll(tenantId)
POST   /api/users         → create(tenantId, CreateUserDto)
PUT    /api/users/:id     → update(id, tenantId, UpdateUserDto)
DELETE /api/users/:id     → remove(id, tenantId)

Guards: JwtAuthGuard + TenantGuard
Entities: User (platform-scoped, no tenant filter — uses manual tenant check)
```

### Notifications Module
```
GET    /api/notifications              → findAll(userId, query)
GET    /api/notifications/unread-count → getUnreadCount(userId)
PATCH  /api/notifications/:id/read     → markAsRead(id, userId)
PATCH  /api/notifications/read-all     → markAllAsRead(userId)
DELETE /api/notifications/:id          → delete(id, userId)
DELETE /api/notifications/clear-read   → clearRead(userId)

Guards: JwtAuthGuard (user-scoped, no tenant guard)
Entities: Notification, NotificationTemplate, ScheduledNotificationTrigger
```

### Sales Channels Module
```
GET/POST/PATCH/DELETE /api/sales-channels*         → channel CRUD
GET/POST             /api/sales-channels/:id/mappings → product mappings
GET                  /api/sales-channels/orders     → channel orders

Guards: JwtAuthGuard + TenantGuard
Entities: SalesChannel, ChannelProductMapping, ChannelOrder
```

### Definitions Module (Kademe 1)
```
9 definition controllers, each with CRUD + toggleActive + reorder:
  /api/definitions/units
  /api/definitions/currencies
  /api/definitions/categories (+ getTree)
  /api/definitions/warehouses
  /api/definitions/tax-rates
  /api/definitions/tags
  /api/definitions/statuses
  /api/definitions/payment-methods
  /api/definitions/delivery-methods

Guards: JwtAuthGuard + TenantGuard (all)
Entities: UnitOfMeasure, Currency, Category, Warehouse, WarehouseLocation,
          TaxRate, Tag, StatusDefinition, PaymentMethod, DeliveryMethod, ExchangeRate
```

### Storage Module
```
POST   /api/storage/upload              → upload(file, folder)
POST   /api/storage/upload-multiple     → uploadMultiple(files, folder)
DELETE /api/storage/:key                → delete(key)
GET    /api/storage/presigned/:key      → getPresignedUrl(key)
GET    /api/storage/list?prefix=...     → listFiles(prefix)

Guards: JwtAuthGuard
```

### Reports Module
```
GET /api/reports/inventory/stock-status  → stockStatus(warehouseId)
GET /api/reports/inventory/movements     → movementReport(from, to)
GET /api/reports/inventory/aging         → agingReport(days)
GET /api/reports/sales/performance       → salesPerformance(from, to)
GET /api/reports/sales/top-products      → topProducts(from, to)
GET /api/reports/sales/profitability     → profitability(from, to)
GET /api/reports/finance/balances        → balanceReport()
GET /api/reports/finance/aging           → agingAnalysis()
GET /api/reports/finance/cash-flow       → cashFlow(from, to)

Guards: JwtAuthGuard + TenantGuard
```

## 5. International Import Pipeline (End-to-End)

```
1. PURCHASE ORDER (PO)
   └─ Partner (supplier) + ProductVariant + quantity + unitPrice
       ├─ downPaymentAmount, paymentTerms
       └─ deliveryWarningConfig (alert days)

2. SUPPLIER PRODUCTION ORDER (SPO)
   └─ Links to PO + supplier
       ├─ 6 milestones: DYEHOUSE → WEAVING → FINISHING → QC → PACKAGING → READY_FOR_PICKUP
       ├─ Quality checks (SUPPLIER_PRE_SHIPMENT, OUR_INCOMING)
       └─ Production media (photos, documents)

3. SHIPMENT (INBOUND)
   └─ Links to PO
       ├─ Multi-leg transit: Factory→Port→Sea→Port→Warehouse
       ├─ Container events: LOADED → ORIGIN_PORT → ON_VESSEL → DEST_PORT → DELIVERED
       ├─ Carrier payment schedule: 50% booking + 50% delivery
       └─ Freight quotes (competitive bidding)

4. CUSTOMS DECLARATION
   └─ Links to Shipment
       ├─ Duty, VAT, broker fee, insurance
       └─ Status: DRAFT → APPROVED → CLEARED

5. GOODS RECEIVE (GR)
   └─ Links to PO + Shipment + Warehouse
       ├─ Lines: expectedQuantity vs receivedQuantity
       ├─ Discrepancy detection: MISSING, DAMAGED, SHORT_WEIGHT
       └─ Creates InventoryItems (rolls) on completion

6. SUPPLIER CLAIM
   └─ Links to GR + PO + Supplier
       ├─ Claim lines per damaged/missing GR line
       ├─ Status: OPEN → UNDER_REVIEW → APPROVED → RESOLVED
       └─ Claimed amount tracking

7. LANDED COST CALCULATION
   └─ Links to PO + Shipment
       ├─ Aggregates: product + freight + customs + broker + insurance + storage + transport
       ├─ Allocation: proportional by line value
       ├─ Writes landedUnitCost back to PO lines
       └─ JSONB snapshot for audit trail
```

## 6. Error Handling Architecture

```
ErrorCode enum (src/common/errors/error-codes.ts)
  └─ ~30 codes: TENANT_CONTEXT_MISSING, ENTITY_NOT_FOUND, AUTH_INVALID_CREDENTIALS, etc.

AppException classes (src/common/errors/app.exceptions.ts)
  └─ Each carries: { error: ErrorCode, message: 'errors.xxx.yyy', metadata? }
  └─ No hardcoded EN/TR strings — only error codes and i18n keys

GlobalExceptionFilter (src/common/filters/global-exception.filter.ts)
  └─ Validates error code format (UPPERCASE_SNAKE)
  └─ Validates message format (errors.* or validation.*)
  └─ Falls back to STATUS_CODE_DEFAULTS if validation fails
  └─ Returns standardized envelope

Frontend errors.json maps error codes to localized messages:
  errors.entity.not_found → "Record not found ({{entity}} #{{id}})"
  errors.auth.invalid_credentials → "Invalid email or password."
```

## 7. Guard & Permission Matrix

| Guard | Purpose | Where Used |
|-------|---------|------------|
| JwtAuthGuard | JWT validation, populate req.user | ALL protected endpoints |
| TenantGuard | Ensure tenant context (x-tenant-id) | All tenant-scoped controllers |
| SuperAdminGuard | isSuperAdmin check | Admin module only |
| PermissionsGuard | @RequirePermissions check | TenantsController |

## 8. Database Schema Notes

```
Primary Keys: UUID (auto-generated)
Soft Deletes: deletedAt nullable field
Tenant FK: Every BaseTenantEntity has tenant_id (indexed)
Timestamps: createdAt, updatedAt (auto-managed by MikroORM)
Money Fields: DECIMAL(18,6) for precision
JSONB Fields: containerInfo, deliveryWarningConfig, lineAllocations, features
Composite Uniques: (tenant_id, code) on definition entities
```
