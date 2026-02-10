# Super Admin Panel — API Tasarım Dokümanı

> **Tarih:** 2026-02-10  
> **Amaç:** EbuSatış platformunun Super Admin panelindeki tüm ekranlar için gerekli backend API'ların kapsamlı tanımı.  
> **Hedef Kitle:** Backend geliştirici  
> **Stack:** NestJS + MikroORM + PostgreSQL

---

## İçindekiler

1. [Mevcut Durum Analizi](#1-mevcut-durum-analizi)
2. [Platform Dashboard API](#2-platform-dashboard-api)
3. [Tenant Yönetimi API](#3-tenant-yönetimi-api)
4. [Erişim & Yetki (IAM) API](#4-erişim--yetki-iam-api)
5. [Platform Kullanıcıları API](#5-platform-kullanıcıları-api)
6. [Platform Ayarları API](#6-platform-ayarları-api)
7. [Platform Raporları API](#7-platform-raporları-api)
8. [Auth Güncellemeleri](#8-auth-güncellemeleri)
9. [Yeni Entity Gereksinimleri](#9-yeni-entity-gereksinimleri)
10. [Permission Seed Verileri](#10-permission-seed-verileri)
11. [Uygulama Sırası (Roadmap)](#11-uygulama-sırası-roadmap)

---

## 1. Mevcut Durum Analizi

### Var Olan Modüller
| Modül | Controller | Service | Entity | Durum |
|-------|-----------|---------|--------|-------|
| Auth | `AuthController` | `AuthService` | - | ✅ Login, JWT, Impersonate |
| Tenants | `TenantsController` | `TenantsService` | `Tenant` | ✅ CRUD + Impersonate |
| IAM/Permissions | `PermissionsController` | `PermissionsService` | `Permission` | ✅ findAll(scope?) |
| IAM/SystemRoles | `SystemRolesController` | `RolesService` | `Role` | ✅ System Role CRUD |
| IAM/TenantRoles | `RolesController` | `RolesService` | `Role` | ✅ Tenant Role CRUD |
| Users | `UsersController` | `UsersService` | `User` | ✅ Tenant User CRUD |

### Var Olan Entity'ler
- `BaseEntity`: `id (uuid)`, `createdAt`, `updatedAt`, `deletedAt`
- `Tenant`: `name`, `domain`, `type (SAAS|ON_PREM)`, `subscriptionStatus (ACTIVE|SUSPENDED|TRIAL)`, `features (json)`, `users[]`
- `User`: `email`, `passwordHash`, `isTenantOwner`, `locale`, `tenant`, `roles[]`
- `Role`: `name`, `isSystemRole`, `tenant?`, `permissions[]`, `users[]`
- `Permission`: `slug`, `category`, `assignableScope (PLATFORM|TENANT)`, `description?`

### Eksik Olanlar
- Platform Dashboard istatistik endpointleri
- Tenant detay sayfası ek endpointleri (kullanıcı sayısı, modül yönetimi)
- Platform kullanıcıları (cross-tenant user listing)
- Audit log sistemi
- Platform ayarları (config, modüller, planlar)
- Platform raporları

---

## 2. Platform Dashboard API

> **Sidebar:** Platform Dashboard  
> **Frontend Route:** `/dashboard` (Super Admin görünümü)

### 2.1 `GET /api/admin/dashboard/stats`

Platform genelindeki KPI metrikleri.

**Response:**
```json
{
  "totalTenants": 12,
  "activeTenants": 10,
  "trialTenants": 2,
  "suspendedTenants": 0,
  "totalUsers": 156,
  "mrr": 45200,
  "mrrCurrency": "TRY",
  "mrrGrowthPercent": 8.2,
  "newTenantsLast30Days": 3,
  "activeUsersLast7Days": 89
}
```

**İş mantığı:**
- `totalTenants`: Tüm aktif + trial tenant'ların sayısı
- `mrr`: Hesaplama → her tenant'ın plan fiyatı × aktif tenant sayısı (başlangıçta mock, sonra plan entity'sine bağlanır)
- Karşılaştırma metriklerini hesaplamak için önceki dönemle kıyas yapılabilir

### 2.2 `GET /api/admin/dashboard/recent-tenants`

Son eklenen tenant'ların listesi (max 10).

**Query Params:**
- `limit` (optional, default: 10)

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "ACME Tekstil A.Ş.",
    "domain": "acme.ebusatis.com",
    "subscriptionStatus": "ACTIVE",
    "type": "SAAS",
    "userCount": 24,
    "plan": "Enterprise",
    "createdAt": "2026-02-01T10:00:00Z"
  }
]
```

### 2.3 `GET /api/admin/dashboard/activity-feed`

Platform genelindeki son aktiviteler (login, tenant oluşturma vb.)

**Response:**
```json
[
  {
    "id": "uuid",
    "action": "TENANT_CREATED",
    "actorEmail": "superadmin@ebusatis.com",
    "details": "Star Kumaş Ltd. tenant created",
    "createdAt": "2026-02-08T15:30:00Z"
  }
]
```

**NestJS Yapısı:**
```
src/modules/admin/
├── admin.module.ts
├── controllers/
│   └── admin-dashboard.controller.ts
└── services/
    └── admin-dashboard.service.ts
```

---

## 3. Tenant Yönetimi API

> **Sidebar:** Tenant Yönetimi → Tenant Listesi, Yeni Tenant  
> **Frontend Routes:** `/tenants`, `/tenants/new`, `/tenants/:id`

### 3.1 Var Olan Endpointler (Güncelleme Gereken)

| Method | Path | Açıklama | Durum |
|--------|------|----------|-------|
| `GET` | `/api/tenants` | Tüm tenant'lar | ✅ Var, güncellenmeli |
| `POST` | `/api/tenants` | Yeni tenant oluştur | ✅ Var |
| `GET` | `/api/tenants/:id` | Tenant detay | ✅ Var |
| `PATCH` | `/api/tenants/:id` | Tenant güncelle | ✅ Var |
| `DELETE` | `/api/tenants/:id` | Tenant sil (soft) | ✅ Var |
| `POST` | `/api/tenants/:id/impersonate` | Firmanın admin'i olarak giriş yap | ✅ Var |

### 3.2 Yeni / Güncellenecek Endpointler

#### `GET /api/tenants` (Güncelleme)

**Eklenmesi gereken query parametreleri:**
```
?search=acme              // name veya domain'de arama
&status=ACTIVE            // filtre: ACTIVE | SUSPENDED | TRIAL
&type=SAAS                // filtre: SAAS | ON_PREM_LICENSE
&sortBy=createdAt         // sıralama alanı
&sortOrder=DESC           // sıralama yönü
&page=1                   // sayfalama
&limit=20                 // sayfa başına kayıt
```

**Response (sayfalı):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "ACME Tekstil A.Ş.",
      "domain": "acme",
      "type": "SAAS",
      "subscriptionStatus": "ACTIVE",
      "features": { "stock": true, "b2b": false, "production": true },
      "userCount": 24,
      "createdAt": "2026-02-01T10:00:00Z"
    }
  ],
  "meta": {
    "total": 12,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

#### `PATCH /api/tenants/:id/subscription` (Yeni)

Abonelik durumunu değiştir (Aktifle / Askıya Al / Denemeye Dön).

**Body:**
```json
{
  "subscriptionStatus": "SUSPENDED"
}
```

**İş mantığı:**
- `SUSPENDED` yapıldığında tenant kullanıcılarının login'i engellenecek (guard'da kontrol)
- `ACTIVE` / `TRIAL` arası geçişlere izin verilecek

#### `PATCH /api/tenants/:id/features` (Yeni)

Tenant'ın modüllerini aç/kapa.

**Body:**
```json
{
  "features": {
    "stock": true,
    "b2b": true,
    "production": true,
    "invoice": false,
    "logistics": true,
    "crm": false
  }
}
```

#### `GET /api/tenants/:id/statistics` (Yeni)

Belirli bir tenant'ın detaylı istatistikleri.

**Response:**
```json
{
  "tenantId": "uuid",
  "userCount": 24,
  "roleCount": 5,
  "activeUserCountLast30Days": 18,
  "storageUsedMB": 256,
  "lastLoginAt": "2026-02-10T14:23:00Z",
  "createdAt": "2026-01-15T10:00:00Z"
}
```

---

## 4. Erişim & Yetki (IAM) API

> **Sidebar:** Erişim & Yetki → İzin Tanımları, Rol Şablonları  
> **Frontend Routes:** `/admin/permissions`, `/admin/global-roles`

### 4.1 İzin Tanımları (Permissions)

| Method | Path | Açıklama | Durum |
|--------|------|----------|-------|
| `GET` | `/api/permissions` | Tüm izinleri listele | ✅ Var |
| `POST` | `/api/permissions` | Yeni izin oluştur | ❌ Yeni |
| `PATCH` | `/api/permissions/:id` | İzin güncelle | ❌ Yeni |
| `DELETE` | `/api/permissions/:id` | İzin sil | ❌ Yeni |
| `GET` | `/api/permissions/categories` | Benzersiz kategorileri listele | ❌ Yeni |

#### `POST /api/permissions` (Yeni)

**Body:**
```json
{
  "slug": "logistics.create",
  "category": "Lojistik",
  "assignableScope": "TENANT",
  "description": "Sevkiyat oluşturma yetkisi"
}
```

**Validasyonlar:**
- `slug` benzersiz olmalı
- `slug` formatı: `category.action` (regex: `/^[a-z_]+\.[a-z_]+$/`)
- `assignableScope`: sadece `PLATFORM` veya `TENANT`

#### `GET /api/permissions/categories` (Yeni)

**Response:**
```json
["Envanter", "Lojistik", "Muhasebe", "Kullanıcı Yönetimi", "Sipariş", "Üretim"]
```

### 4.2 Rol Şablonları (System Roles)

| Method | Path | Açıklama | Durum |
|--------|------|----------|-------|
| `GET` | `/api/system-roles` | Tüm sistem rollerini listele | ✅ Var |
| `GET` | `/api/system-roles/:id` | Sistem rolü detay | ✅ Var |
| `POST` | `/api/system-roles` | Yeni sistem rolü oluştur | ✅ Var |
| `PUT` | `/api/system-roles/:id` | Sistem rolünü güncelle | ✅ Var |
| `DELETE` | `/api/system-roles/:id` | Sistem rolünü sil | ✅ Var |

**Güncelleme gerekli:**
- Guard ekle: `@UseGuards(JwtAuthGuard, PermissionsGuard)`
- Permission check: `@RequirePermissions('platform.roles.manage')`
- DTO validasyonu: `class-validator` ile doğrulama ekle

---

## 5. Platform Kullanıcıları API

> **Sidebar:** Platform Kullanıcıları → Tüm Kullanıcılar, Oturum Logları  
> **Frontend Routes:** `/admin/users`, `/admin/audit-logs`

### 5.1 Tüm Kullanıcılar (Cross-Tenant)

| Method | Path | Açıklama |
|--------|------|----------|
| `GET` | `/api/admin/users` | Tüm platform kullanıcılarını listele |
| `GET` | `/api/admin/users/:id` | Kullanıcı detayı |
| `PATCH` | `/api/admin/users/:id/status` | Kullanıcı aktif/pasif yap |
| `POST` | `/api/admin/users/:id/reset-password` | Şifre sıfırlama bağlantısı gönder |

#### `GET /api/admin/users`

**Query Params:**
```
?search=admin@acme.com    // email'de arama
&tenantId=uuid            // belirli tenant'ın kullanıcıları
&isTenantOwner=true       // sadece firma sahiplerini getir
&isActive=true            // aktif/pasif filtre
&page=1
&limit=20
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "admin@acme-tekstil.com",
      "isTenantOwner": true,
      "isActive": true,
      "locale": "tr",
      "tenant": {
        "id": "uuid",
        "name": "ACME Tekstil A.Ş.",
        "domain": "acme"
      },
      "roles": [
        { "id": "uuid", "name": "Firma Yöneticisi" }
      ],
      "lastLoginAt": "2026-02-10T14:23:00Z",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ],
  "meta": { "total": 156, "page": 1, "limit": 20, "totalPages": 8 }
}
```

### 5.2 Oturum / Audit Logları

| Method | Path | Açıklama |
|--------|------|----------|
| `GET` | `/api/admin/audit-logs` | Platform geneli audit logları |
| `GET` | `/api/admin/audit-logs/:id` | Log detayı |

#### `GET /api/admin/audit-logs`

**Query Params:**
```
?action=LOGIN             // filtre: LOGIN | LOGOUT | IMPERSONATE | TENANT_CREATED | ...
&actorId=uuid             // belirli kullanıcının aksiyonları
&tenantId=uuid            // belirli tenant'taki aksiyonlar  
&dateFrom=2026-02-01
&dateTo=2026-02-10
&page=1
&limit=50
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "action": "LOGIN",
      "actorId": "uuid",
      "actorEmail": "admin@acme-tekstil.com",
      "tenantId": "uuid",
      "tenantName": "ACME Tekstil A.Ş.",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "details": {},
      "createdAt": "2026-02-10T14:23:00Z"
    }
  ],
  "meta": { "total": 1250, "page": 1, "limit": 50, "totalPages": 25 }
}
```

**NestJS Yapısı:**
```
src/modules/admin/
├── controllers/
│   ├── admin-dashboard.controller.ts   (§2)
│   ├── admin-users.controller.ts       (§5.1)
│   └── admin-audit-logs.controller.ts  (§5.2)
└── services/
    ├── admin-dashboard.service.ts
    ├── admin-users.service.ts
    └── admin-audit-logs.service.ts
```

---

## 6. Platform Ayarları API

> **Sidebar:** Platform Ayarları → Genel Ayarlar, Modül Yönetimi, Abonelik Planları  
> **Frontend Routes:** `/admin/config`, `/admin/modules`, `/admin/plans`

### 6.1 Genel Ayarlar

| Method | Path | Açıklama |
|--------|------|----------|
| `GET` | `/api/admin/config` | Platform ayarlarını getir |
| `PATCH` | `/api/admin/config` | Platform ayarlarını güncelle |

**Response:**
```json
{
  "platformName": "EbuSatış",
  "defaultLocale": "tr",
  "allowRegistration": false,
  "maxUsersPerTenant": 100,
  "defaultTrialDays": 14,
  "maintenanceMode": false,
  "smtp": {
    "host": "smtp.example.com",
    "port": 587,
    "from": "noreply@ebusatis.com"
  }
}
```

### 6.2 Modül Yönetimi

| Method | Path | Açıklama |
|--------|------|----------|
| `GET` | `/api/admin/modules` | Tüm modül tanımlarını listele |
| `POST` | `/api/admin/modules` | Yeni modül tanımla |
| `PATCH` | `/api/admin/modules/:id` | Modül tanımını güncelle |
| `DELETE` | `/api/admin/modules/:id` | Modül tanımını sil |

**Response (bir modül):**
```json
{
  "id": "uuid",
  "slug": "production",
  "name": "Üretim Takibi",
  "description": "Üretim emirleri, milestone ve kalite kontrol yönetimi",
  "isCore": false,
  "requiredPlan": "PRO",
  "isEnabled": true,
  "icon": "Factory",
  "sortOrder": 3
}
```

**İş mantığı:**
- `isCore: true` modüller silinemez ve deaktif edilemez
- `requiredPlan` ile hangi planın bu modüle erişimi olduğu tanımlanır
- Tenant'ın `features` JSON'ı bu modül slug'larına referans verir

### 6.3 Abonelik Planları

| Method | Path | Açıklama |
|--------|------|----------|
| `GET` | `/api/admin/plans` | Tüm planları listele |
| `POST` | `/api/admin/plans` | Yeni plan oluştur |
| `GET` | `/api/admin/plans/:id` | Plan detayı |
| `PATCH` | `/api/admin/plans/:id` | Plan güncelle |
| `DELETE` | `/api/admin/plans/:id` | Plan sil (soft) |

**Response (bir plan):**
```json
{
  "id": "uuid",
  "name": "Enterprise",
  "slug": "enterprise",
  "monthlyPrice": 4500,
  "yearlyPrice": 45000,
  "currency": "TRY",
  "maxUsers": 100,
  "maxStorageMB": 10240,
  "modules": ["stock", "b2b", "production", "invoice", "logistics", "crm"],
  "isTrial": false,
  "trialDays": 0,
  "isActive": true,
  "sortOrder": 3,
  "tenantCount": 5
}
```

**NestJS Yapısı:**
```
src/modules/admin/
├── controllers/
│   ├── admin-config.controller.ts
│   ├── admin-modules.controller.ts
│   └── admin-plans.controller.ts
└── services/
    ├── admin-config.service.ts
    ├── admin-modules.service.ts
    └── admin-plans.service.ts
```

---

## 7. Platform Raporları API

> **Sidebar:** Platform Raporları → Tenant İstatistikleri, Sistem Sağlığı, Kullanım Raporları  
> **Frontend Routes:** `/admin/reports/tenants`, `/admin/reports/health`, `/admin/reports/usage`

### 7.1 Tenant İstatistikleri

#### `GET /api/admin/reports/tenants`

**Response:**
```json
{
  "summary": {
    "totalTenants": 12,
    "activePercent": 83.3,
    "avgUsersPerTenant": 13,
    "avgStoragePerTenantMB": 180
  },
  "statusDistribution": {
    "ACTIVE": 10,
    "TRIAL": 2,
    "SUSPENDED": 0
  },
  "planDistribution": {
    "Enterprise": 3,
    "Pro": 7,
    "Trial": 2
  },
  "monthlyGrowth": [
    { "month": "2025-10", "count": 7 },
    { "month": "2025-11", "count": 9 },
    { "month": "2025-12", "count": 10 },
    { "month": "2026-01", "count": 11 },
    { "month": "2026-02", "count": 12 }
  ],
  "topTenantsByUsers": [
    { "tenantId": "uuid", "name": "Global Tekstil A.Ş.", "userCount": 31 },
    { "tenantId": "uuid", "name": "ACME Tekstil A.Ş.", "userCount": 24 }
  ]
}
```

### 7.2 Sistem Sağlığı

#### `GET /api/admin/reports/health`

**Response:**
```json
{
  "database": {
    "status": "healthy",
    "connectionPoolUsed": 5,
    "connectionPoolMax": 20,
    "avgQueryTimeMs": 12
  },
  "memory": {
    "usedMB": 256,
    "totalMB": 1024,
    "usagePercent": 25
  },
  "uptime": {
    "seconds": 864000,
    "formattedUptime": "10 gün"
  },
  "api": {
    "requestsLast24h": 45230,
    "avgResponseTimeMs": 85,
    "errorRate": 0.2
  }
}
```

### 7.3 Kullanım Raporları

#### `GET /api/admin/reports/usage`

**Query Params:**
```
?period=30d    // 7d | 30d | 90d | 12m
```

**Response:**
```json
{
  "period": "30d",
  "totalApiCalls": 145000,
  "totalLogins": 890,
  "uniqueActiveUsers": 89,
  "dailyActiveUsers": [
    { "date": "2026-02-01", "count": 67 },
    { "date": "2026-02-02", "count": 72 }
  ],
  "topEndpoints": [
    { "path": "GET /api/products", "count": 12500 },
    { "path": "GET /api/orders", "count": 8900 }
  ],
  "tenantUsage": [
    {
      "tenantId": "uuid",
      "tenantName": "ACME Tekstil A.Ş.",
      "apiCalls": 25000,
      "uniqueUsers": 18,
      "storageUsedMB": 320
    }
  ]
}
```

---

## 8. Auth Güncellemeleri

Mevcut `AuthService.login()` isSuperAdmin bilgisini döndürmüyor. Güncellenmeli:

### 8.1 Login Response Güncellemesi

**Mevcut:** login sadece `{ access_token, user: { id, email, tenant } }` döndürüyor.

**Yeni response:**
```json
{
  "access_token": "jwt...",
  "user": {
    "id": "uuid",
    "email": "superadmin@ebusatis.com",
    "isSuperAdmin": true,
    "isTenantOwner": false,
    "tenantId": null,
    "tenantName": null
  }
}
```

**Gerekli değişiklikler:**

1. `User` entity'sine `isSuperAdmin` property ekle (`default: false`)
2. JWT payload'a `isSuperAdmin` ekle
3. `AuthService.login()` response'unu zenginleştir
4. `AuthService.impersonate()` response'unu da aynı formata getir (impersonated session'da `isImpersonated: true` flag'i ek)

### 8.2 Super Admin Guard

Platform admin endpointlerini koruyacak yeni bir guard:

```typescript
// src/common/guards/super-admin.guard.ts
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.isSuperAdmin) {
      throw new ForbiddenException('Platform admin access required');
    }
    return true;
  }
}
```

**Kullanım:**
```typescript
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin')
export class AdminDashboardController { ... }
```

---

## 9. Yeni Entity Gereksinimleri

### 9.1 `AuditLog` Entity

```typescript
@Entity({ tableName: 'audit_logs' })
export class AuditLog extends BaseEntity {
  @Enum(() => AuditAction)
  action: AuditAction;

  @Property()
  actorId: string;

  @Property()
  actorEmail: string;

  @Property({ nullable: true })
  tenantId?: string;

  @Property({ nullable: true })
  tenantName?: string;

  @Property({ nullable: true })
  ipAddress?: string;

  @Property({ nullable: true })
  userAgent?: string;

  @Property({ type: 'json', nullable: true })
  details?: Record<string, any>;

  @Property({ nullable: true })
  entityType?: string;  // 'Tenant' | 'User' | 'Role' | ...

  @Property({ nullable: true })
  entityId?: string;
}

enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  IMPERSONATE = 'IMPERSONATE',
  TENANT_CREATED = 'TENANT_CREATED',
  TENANT_UPDATED = 'TENANT_UPDATED',
  TENANT_SUSPENDED = 'TENANT_SUSPENDED',
  TENANT_ACTIVATED = 'TENANT_ACTIVATED',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  ROLE_CREATED = 'ROLE_CREATED',
  ROLE_UPDATED = 'ROLE_UPDATED',
  ROLE_DELETED = 'ROLE_DELETED',
  PERMISSION_CREATED = 'PERMISSION_CREATED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  CONFIG_UPDATED = 'CONFIG_UPDATED',
}
```

### 9.2 `PlatformConfig` Entity

```typescript
@Entity({ tableName: 'platform_config' })
export class PlatformConfig extends BaseEntity {
  @Property({ unique: true })
  key: string;

  @Property({ type: 'json' })
  value: any;

  @Property({ nullable: true })
  description?: string;

  @Property({ default: 'string' })
  valueType: string; // 'string' | 'number' | 'boolean' | 'json'
}
```

### 9.3 `PlatformModule` Entity

```typescript
@Entity({ tableName: 'platform_modules' })
export class PlatformModule extends BaseEntity {
  @Property({ unique: true })
  slug: string;

  @Property()
  name: string;

  @Property({ nullable: true })
  description?: string;

  @Property({ default: false })
  isCore: boolean;

  @Property({ nullable: true })
  requiredPlan?: string;

  @Property({ default: true })
  isEnabled: boolean;

  @Property({ nullable: true })
  icon?: string;

  @Property({ default: 0 })
  sortOrder: number;
}
```

### 9.4 `SubscriptionPlan` Entity

```typescript
@Entity({ tableName: 'subscription_plans' })
export class SubscriptionPlan extends BaseEntity {
  @Property()
  name: string;

  @Property({ unique: true })
  slug: string;

  @Property({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthlyPrice: number;

  @Property({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  yearlyPrice: number;

  @Property({ default: 'TRY' })
  currency: string;

  @Property({ default: 10 })
  maxUsers: number;

  @Property({ default: 1024 })
  maxStorageMB: number;

  @Property({ type: 'json', default: '[]' })
  modules: string[];

  @Property({ default: false })
  isTrial: boolean;

  @Property({ default: 0 })
  trialDays: number;

  @Property({ default: true })
  isActive: boolean;

  @Property({ default: 0 })
  sortOrder: number;

  // Tenant entity'sine @ManyToOne plan eklenecek
}
```

### 9.5 `User` Entity Güncellemesi

Mevcut user entity'sine eklenecek:

```typescript
@Property({ default: false })
isSuperAdmin: boolean = false;

@Property({ default: true })
isActive: boolean = true;

@Property({ nullable: true })
lastLoginAt?: Date;
```

### 9.6 `Tenant` Entity Güncellemesi

```typescript
@ManyToOne(() => SubscriptionPlan, { nullable: true })
plan?: SubscriptionPlan;
```

---

## 10. Permission Seed Verileri

Yeni platform seviyesindeki izinler (seed script ile oluşturulacak):

```typescript
const platformPermissions = [
  // Platform Yönetimi
  { slug: 'platform.dashboard.view', category: 'Platform', assignableScope: 'PLATFORM' },
  { slug: 'platform.config.manage', category: 'Platform', assignableScope: 'PLATFORM' },
  
  // Tenant Yönetimi
  { slug: 'tenants.view', category: 'Tenant Yönetimi', assignableScope: 'PLATFORM' },
  { slug: 'tenants.create', category: 'Tenant Yönetimi', assignableScope: 'PLATFORM' },
  { slug: 'tenants.update', category: 'Tenant Yönetimi', assignableScope: 'PLATFORM' },
  { slug: 'tenants.delete', category: 'Tenant Yönetimi', assignableScope: 'PLATFORM' },
  { slug: 'tenants.impersonate', category: 'Tenant Yönetimi', assignableScope: 'PLATFORM' },
  { slug: 'tenants.manage_subscription', category: 'Tenant Yönetimi', assignableScope: 'PLATFORM' },
  { slug: 'tenants.manage_features', category: 'Tenant Yönetimi', assignableScope: 'PLATFORM' },
  
  // IAM Platform
  { slug: 'platform.roles.manage', category: 'IAM', assignableScope: 'PLATFORM' },
  { slug: 'platform.permissions.manage', category: 'IAM', assignableScope: 'PLATFORM' },
  
  // Platform Kullanıcıları
  { slug: 'platform.users.view', category: 'Kullanıcı Yönetimi', assignableScope: 'PLATFORM' },
  { slug: 'platform.users.manage', category: 'Kullanıcı Yönetimi', assignableScope: 'PLATFORM' },
  
  // Audit
  { slug: 'platform.audit.view', category: 'Audit', assignableScope: 'PLATFORM' },
  
  // Plan & Modül
  { slug: 'platform.plans.manage', category: 'Platform', assignableScope: 'PLATFORM' },
  { slug: 'platform.modules.manage', category: 'Platform', assignableScope: 'PLATFORM' },
  
  // Raporlar
  { slug: 'platform.reports.view', category: 'Raporlama', assignableScope: 'PLATFORM' },
];
```

---

## 11. Uygulama Sırası (Roadmap)

Önerilen implementasyon sırası, bağımlılıklara göre düzenlenmiştir:

### Faz 1 — Temel Altyapı (Öncelik: Kritik)

| # | Görev | Açıklama |
|---|-------|----------|
| 1.1 | `User` entity → `isSuperAdmin`, `isActive`, `lastLoginAt` ekle | Tüm Super Admin guard'ları buna bağlı |
| 1.2 | `SuperAdminGuard` oluştur | Platform admin endpointlerini koru |
| 1.3 | `AuthService.login()` response güncelle | `isSuperAdmin`, `tenantId`, `tenantName` dön |
| 1.4 | `AuditLog` entity oluştur | Loglama altyapısı |
| 1.5 | `AuditService` oluştur | `logAction(action, actorId, details)` |
| 1.6 | Permission seed güncellemesi | Platform seviyesi izinleri ekle |

### Faz 2 — Dashboard & Tenant (Öncelik: Yüksek)

| # | Görev | Açıklama |
|---|-------|----------|
| 2.1 | `AdminModule` oluştur | Tüm admin controller ve service'leri barındıracak |
| 2.2 | `AdminDashboardController` + `Service` | Dashboard KPI'ları |
| 2.3 | `TenantsController` güncelle | Sayfalama, filtreleme, arama |
| 2.4 | `PATCH /tenants/:id/subscription` ekle | Abonelik durum yönetimi |
| 2.5 | `PATCH /tenants/:id/features` ekle | Modül açma/kapama |
| 2.6 | `GET /tenants/:id/statistics` ekle | Tenant istatistikleri |

### Faz 3 — IAM Güçlendirme (Öncelik: Yüksek)

| # | Görev | Açıklama |
|---|-------|----------|
| 3.1 | `PermissionsController` → full CRUD | Create, Update, Delete |
| 3.2 | `SystemRolesController` → Guard ekle | JwtAuth + SuperAdmin guard |
| 3.3 | DTO'ları `class-validator` ile doğrula | Hem permission hem role DTO'ları |

### Faz 4 — Kullanıcılar & Audit (Öncelik: Orta)

| # | Görev | Açıklama |
|---|-------|----------|
| 4.1 | `AdminUsersController` + `Service` | Cross-tenant kullanıcı listesi |
| 4.2 | `AdminAuditLogsController` + `Service` | Audit log listesi ve filtreleme |
| 4.3 | Auth aksiyonlarına audit log entegrasyonu | Login, logout, impersonate logları |

### Faz 5 — Ayarlar & Planlar (Öncelik: Orta-Düşük)

| # | Görev | Açıklama |
|---|-------|----------|
| 5.1 | `PlatformConfig` entity + CRUD | Genel platform ayarları |
| 5.2 | `PlatformModule` entity + CRUD | Modül tanımları yönetimi |
| 5.3 | `SubscriptionPlan` entity + CRUD | Plan yönetimi |
| 5.4 | `Tenant` → plan ilişkisi | Tenant-Plan M:1 ilişki |

### Faz 6 — Raporlar (Öncelik: Düşük)

| # | Görev | Açıklama |
|---|-------|----------|
| 6.1 | Tenant İstatistikleri raporu | Aggregation query'ler |
| 6.2 | Sistem Sağlığı raporu | Process memory + DB stats |
| 6.3 | Kullanım Raporu | API call / login metrikleri |

---

## Ekler

### Dosya Yapısı (Hedef)

```
src/modules/admin/
├── admin.module.ts
├── controllers/
│   ├── admin-dashboard.controller.ts
│   ├── admin-users.controller.ts
│   ├── admin-audit-logs.controller.ts
│   ├── admin-config.controller.ts
│   ├── admin-modules.controller.ts
│   └── admin-plans.controller.ts
├── dto/
│   ├── create-plan.dto.ts
│   ├── update-plan.dto.ts
│   ├── create-module.dto.ts
│   ├── update-module.dto.ts
│   ├── update-config.dto.ts
│   ├── admin-user-query.dto.ts
│   └── audit-log-query.dto.ts
├── entities/
│   ├── audit-log.entity.ts
│   ├── platform-config.entity.ts
│   ├── platform-module.entity.ts
│   └── subscription-plan.entity.ts
└── services/
    ├── admin-dashboard.service.ts
    ├── admin-users.service.ts
    ├── admin-audit-logs.service.ts
    ├── admin-config.service.ts
    ├── admin-modules.service.ts
    └── admin-plans.service.ts

src/common/
├── entities/
│   └── base.entity.ts          (mevcut)
├── guards/
│   └── super-admin.guard.ts    (yeni)
├── interceptors/
│   └── audit-log.interceptor.ts (yeni - otomatik loglama)
└── dto/
    └── paginated-query.dto.ts   (yeni - ortak sayfalama)
```

### Toplam API Endpoint Özeti

| Kategori | Endpoint Sayısı | Yeni | Güncelleme |
|----------|----------------|------|------------|
| Dashboard | 3 | 3 | 0 |
| Tenants | 9 | 3 | 1 |
| Permissions | 5 | 3 | 0 |
| System Roles | 5 | 0 | 5 (guard) |
| Platform Users | 4 | 4 | 0 |
| Audit Logs | 2 | 2 | 0 |
| Config | 2 | 2 | 0 |
| Modules | 4 | 4 | 0 |
| Plans | 5 | 5 | 0 |
| Reports | 3 | 3 | 0 |
| **TOPLAM** | **42** | **29** | **6** |
