# EBusatış Platform – Altyapı Görevleri (Infrastructure Tasks)

**Tarih:** 20.03.2026  
**Durum:** Taslak  
**Öncelik:** İş modüllerine (PIM, Depo, Sipariş) geçmeden önce tamamlanması gereken tüm destekleyici sistemler.

---

## Mevcut Durum (Tamamlanan Altyapı)

| # | Alan | Durum |
|---|---|---|
| ✅ | NestJS + MikroORM + PostgreSQL kurulumu | Tamamlandı |
| ✅ | JWT Authentication (Login, Token) | Tamamlandı |
| ✅ | Multi-Tenant Mimari (Tenant Entity, TenantContext, Filtre) | Tamamlandı |
| ✅ | RBAC: Permission, Role, User yönetimi | Tamamlandı |
| ✅ | Platform Admin (SuperAdmin) & Tenant Owner ayrımı | Tamamlandı |
| ✅ | Çalışma Alanı Seçimi (Workspace Selection Page) | Tamamlandı |
| ✅ | Dinamik Menü Sistemi (DB-driven, MenuNode entity) | Tamamlandı |
| ✅ | x-tenant-id Header Injection (httpClient interceptor) | Tamamlandı |
| ✅ | EAV Attribute Sistemi (temel CRUD) | Tamamlandı |
| ✅ | Audit Log Entity & API (temel) | Tamamlandı |
| ✅ | Platform Config (key-value ayar yönetimi) | Tamamlandı |
| ✅ | Docker Compose (PostgreSQL + Redis) | Tamamlandı |
| ✅ | React Frontend (CRA, Zustand, TanStack Query, react-hot-toast) | Tamamlandı |

---

## BÖLÜM 1: Workspace & Navigation

### 1.1 Sidebar Workspace Switcher
**Öncelik:** 🔴 Yüksek  
**Tahmini Süre:** 2-3 saat  

SuperAdmin dashboard'dayken sidebar altındaki kullanıcı bilgisi alanına "Workspace Değiştir" butonu ekle. Tıklandığında küçük bir popover/modal ile mevcut tenant listesini göster. Seçim yapıldığında `setTenantContext()` çağır ve sayfayı yenile.

**Kabul Kriterleri:**
- [ ] Sidebar alt kısmında "Çalışma alanını değiştir" butonu
- [ ] Popover/Drawer içinde tenant listesi ve "Platform Yönetimi" seçeneği
- [ ] Seçim sonrası menü ağacı otomatik yenilenmeli (`queryClient.invalidateQueries`)
- [ ] Aktif workspace sidebar logo alanında görünmeli

### 1.2 Menü Yönetim UI'ı  
**Öncelik:** 🟡 Orta  
**Tahmini Süre:** 4-5 saat  

Platform Admin panelinde menü düğümlerini yönetebileceği bir sayfa. Drag & drop sıralama, yeni düğüm ekleme, scope/permission atama.

**Kabul Kriterleri:**
- [ ] `admin/menu` rotasında ağaç görünümü
- [ ] Sürükle-bırak ile sıralama (sortOrder güncelleme)
- [ ] Yeni düğüm ekleme (modal: label, code, icon, path, scope, permission)
- [ ] Düğüm düzenleme ve deaktive etme
- [ ] Menü düğümündeki `icon` seçimi için Lucide icon picker

---

## BÖLÜM 2: Bildirim Sistemi (Notification System)

### 2.1 Bildirim Altyapısı (Backend)
**Öncelik:** 🔴 Yüksek  
**Tahmini Süre:** 6-8 saat  

Çok kanallı bildirim altyapısı: In-App, E-posta, (ileride Push + SMS).

**Backend Entity'ler:**
```
Notification
├── id: UUID
├── tenantId: UUID (nullable – platform bildirimleri için null)
├── recipientId: UUID (User FK)
├── title: string
├── body: string
├── channel: 'IN_APP' | 'EMAIL' | 'PUSH' | 'SMS'
├── category: 'SYSTEM' | 'ORDER' | 'STOCK' | 'USER' | 'ALERT'
├── priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
├── isRead: boolean (default false)
├── readAt: datetime (nullable)
├── metadata: jsonb (ek veri, link vb.)
├── createdAt: datetime
└── expiresAt: datetime (nullable)

NotificationPreference (Kullanıcı tercihleri)
├── userId: UUID
├── category: string
├── inAppEnabled: boolean (default true)
├── emailEnabled: boolean (default true)
└── pushEnabled: boolean (default false)
```

**Servis Yapısı:**
```
NotificationModule
├── entities/
│   ├── notification.entity.ts
│   └── notification-preference.entity.ts
├── services/
│   ├── notification.service.ts        # CRUD + okundu işaretleme
│   ├── notification-dispatcher.ts     # Kanal yönlendirme (Strategy Pattern)
│   ├── channels/
│   │   ├── in-app.channel.ts          # DB'ye yaz
│   │   ├── email.channel.ts           # SMTP/Resend/SendGrid
│   │   └── push.channel.ts            # (ileride) Firebase/OneSignal
│   └── notification-template.service.ts  # Şablon motoru (Handlebars)
├── controllers/
│   └── notification.controller.ts     # GET /notifications, PATCH /:id/read
└── templates/
    ├── welcome.hbs
    ├── order-created.hbs
    └── stock-alert.hbs
```

**Kabul Kriterleri:**
- [ ] `POST /notifications/send` – bildirim gönderme
- [ ] `GET /notifications` – kullanıcının bildirimlerini listeleme (sayfalı)
- [ ] `PATCH /notifications/:id/read` – okundu işaretleme
- [ ] `PATCH /notifications/read-all` – tümünü okundu yap
- [ ] `GET /notifications/unread-count` – okunmamış sayısı
- [ ] Strategy Pattern ile kanal seçimi (in-app her zaman, email tercihe göre)

### 2.2 Bildirim UI (Frontend)
**Öncelik:** 🔴 Yüksek  
**Tahmini Süre:** 4-5 saat  

Header'da zil ikonu ile bildirim merkezi.

**Kabul Kriterleri:**
- [ ] Header'da 🔔 ikonu, üzerinde okunmamış badge
- [ ] Tıklandığında dropdown panel: son 20 bildirim
- [ ] Her bildirimde: başlık, özet, zaman damgası, okundu/okunmadı stili
- [ ] "Tümünü Okundu Yap" butonu
- [ ] "Tümünü Gör" → `/notifications` tam sayfa listesi
- [ ] Polling ile otomatik güncelleme (her 30sn) veya WebSocket (ileride)

### 2.3 E-posta Servisi Entegrasyonu
**Öncelik:** 🟡 Orta  
**Tahmini Süre:** 3-4 saat  

**Kabul Kriterleri:**
- [ ] Resend veya Nodemailer ile SMTP entegrasyonu
- [ ] `PlatformConfig` tablosundan SMTP ayarları okunmalı
- [ ] Handlebars şablon motoru ile HTML e-posta
- [ ] Hoş geldiniz, şifre sıfırlama, sipariş bildirimi şablonları

---

## BÖLÜM 3: Dosya & Medya Yönetimi

### 3.1 Dosya Yükleme Altyapısı
**Öncelik:** 🔴 Yüksek  
**Tahmini Süre:** 5-6 saat  

Ürün görselleri, dokümanlar için merkezi dosya yönetimi.

**Backend Yapısı:**
```
FileUpload Entity
├── id: UUID
├── tenantId: UUID
├── originalName: string
├── storagePath: string         # S3 key veya disk path
├── mimeType: string
├── sizeBytes: number
├── category: 'PRODUCT_IMAGE' | 'DOCUMENT' | 'AVATAR' | 'ATTACHMENT'
├── entityType: string          # 'Product', 'Order', 'Roll'
├── entityId: UUID (nullable)   # Polimorfik ilişki
├── uploadedBy: UUID (User FK)
├── isPublic: boolean
└── thumbnailPath: string (nullable)
```

**Depolama Stratejisi:**
- Geliştirme: Disk (local `/uploads`)
- Üretim: S3 uyumlu (MinIO dev için, AWS S3 prod için)
- `StorageProvider` interface → `DiskStorageProvider` ve `S3StorageProvider`

**Kabul Kriterleri:**
- [ ] `POST /files/upload` – multipart dosya yükleme
- [ ] `GET /files/:id` – dosya indirme / stream
- [ ] `DELETE /files/:id` – dosya silme
- [ ] Otomatik thumbnail oluşturma (sharp ile, sadece görseller için)
- [ ] Tenant izolasyonu (dosya yolunda tenantId prefix)
- [ ] Maksimum dosya boyutu kontrolü (PlatformConfig'den okunmalı)

---

## BÖLÜM 4: Event & Queue Sistemi

### 4.1 Domain Event Altyapısı
**Öncelik:** 🟡 Orta  
**Tahmini Süre:** 4-5 saat  

NestJS EventEmitter modülü ile senkron domain event'ler. İleride BullMQ ile asenkrona geçiş kolaylığı sağlar.

**Örnek Event'ler:**
```
UserCreated       → Hoş geldiniz e-postası gönder
OrderCreated      → Stok rezervasyonu yap, bildirim gönder
RollCut           → InventoryTransaction oluştur, stok uyarısı kontrol et  
TenantCreated     → Varsayılan roller ve ayarları oluştur
StockLow          → Yöneticiye bildirim gönder
```

**Kabul Kriterleri:**
- [ ] `@nestjs/event-emitter` kurulumu
- [ ] `DomainEvent` base class: `{ eventName, payload, tenantId, timestamp, actorId }`
- [ ] Her modül kendi listener'larını kaydeder
- [ ] Event'ler AuditLog'a otomatik yazılmalı (global listener)

### 4.2 Asenkron Kuyruk (BullMQ + Redis)
**Öncelik:** 🟠 Düşük-Orta  
**Tahmini Süre:** 4-5 saat  

Ağır işlemleri (e-posta gönderimi, rapor üretimi, Excel export) kuyruğa atma.

**Kabul Kriterleri:**
- [ ] `@nestjs/bullmq` kurulumu (Redis zaten Docker Compose'da mevcut)
- [ ] `EmailQueue` – e-posta gönderim kuyruğu
- [ ] `ExportQueue` – Excel/CSV export kuyruğu
- [ ] `NotificationQueue` – toplu bildirim kuyruğu
- [ ] Bull Board UI (isteğe bağlı) → `/admin/queues` ile kuyruk izleme

---

## BÖLÜM 5: Arama & Filtreleme Altyapısı

### 5.1 Dinamik Filtreleme & Sayfalama Altyapısı
**Öncelik:** 🔴 Yüksek  
**Tahmini Süre:** 3-4 saat  

Her liste endpoint'i için yeniden kullanılabilir filtreleme, sıralama, sayfalama altyapısı.

**Yapı:**
```typescript
// Ortak DTO
class PaginatedQueryDto {
  page?: number = 1;
  limit?: number = 20;
  sortBy?: string = 'createdAt';
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
  search?: string; // Full-text arama
}

// Ortak Response
class PaginatedResponse<T> {
  data: T[];
  meta: { total, page, limit, totalPages };
}

// Helper Service
class QueryBuilderHelper {
  applyFilters(qb, filters);
  applyPagination(qb, page, limit);
  applySorting(qb, sortBy, sortOrder);
  applySearch(qb, searchFields[], searchTerm);
}
```

**Kabul Kriterleri:**
- [ ] `PaginatedQueryDto` ve `PaginatedResponse<T>` ortak tipleri
- [ ] `QueryBuilderHelper` servisi (MikroORM QueryBuilder ile uyumlu)
- [ ] Mevcut tüm list endpoint'leri bu altyapıyı kullanmalı
- [ ] Frontend'de ortak `usePaginatedQuery` hook

### 5.2 Full-Text Search (PostgreSQL tsvector)
**Öncelik:** 🟠 Düşük-Orta  
**Tahmini Süre:** 3-4 saat  

Ürün, müşteri, sipariş araması için PostgreSQL'in dahili full-text search özelliği.

**Kabul Kriterleri:**
- [ ] Products tablosunda `search_vector` tsvector kolonu
- [ ] GIN index ile hızlı arama
- [ ] Türkçe tokenizer konfigürasyonu
- [ ] `GET /search?q=kırmızı+kadife` → cross-entity arama (ileride)

---

## BÖLÜM 6: Güvenlik & Rate Limiting

### 6.1 API Güvenlik Katmanı
**Öncelik:** 🔴 Yüksek  
**Tahmini Süre:** 2-3 saat  

**Kabul Kriterleri:**
- [ ] Helmet.js middleware (HTTP güvenlik headerları)
- [ ] CORS konfigürasyonu – sadece izin verilen originler (PlatformConfig'den)
- [ ] Rate Limiting – `@nestjs/throttler` (60 req/min default)
- [ ] Request body boyutu limiti (JSON: 1MB, multipart: 50MB)
- [ ] SQL Injection koruması (MikroORM parametrize query – zaten var)
- [ ] XSS koruması (input sanitization)

### 6.2 Şifre Güvenliği & Hesap Koruma
**Öncelik:** 🟡 Orta  
**Tahmini Süre:** 3-4 saat  

**Kabul Kriterleri:**
- [ ] Şifre politikası (min 8 karakter, harf+rakam, PlatformConfig'den yönetilebilir)
- [ ] Şifre sıfırlama akışı (token tabanlı e-posta)
- [ ] Hesap kilitleme (5 başarısız giriş → 15dk kilit)
- [ ] Giriş denemeleri AuditLog'a yazılmalı
- [ ] Refresh Token mekanizması (access_token süresi kısaltılmalı)

---

## BÖLÜM 7: İçe/Dışa Aktarma (Import/Export)

### 7.1 Excel & CSV Export Altyapısı
**Öncelik:** 🟡 Orta  
**Tahmini Süre:** 3-4 saat  

**Kabul Kriterleri:**
- [ ] `ExcelJS` veya `xlsx` kütüphanesi ile Excel export
- [ ] Ortak `ExportService` → entity listesini dosyaya dönüştür
- [ ] Frontend'de "Dışa Aktar" butonu → dosya indirme
- [ ] Büyük veri setleri için stream tabanlı export (BullMQ ile)

### 7.2 Toplu Veri İçe Aktarma (Import)
**Öncelik:** 🟠 Düşük-Orta  
**Tahmini Süre:** 5-6 saat  

**Kabul Kriterleri:**
- [ ] Excel/CSV dosya yükleme
- [ ] Satır satır validasyon (hata raporu)
- [ ] Ön izleme ekranı (kaç satır başarılı, kaç hatalı)
- [ ] Onay sonrası toplu kayıt (transaction)
- [ ] Ürün, müşteri, stok girişi için import şablonları

---

## BÖLÜM 8: Tenant Yaşam Döngüsü

### 8.1 Tenant Onboarding & Setup Wizard
**Öncelik:** 🟡 Orta  
**Tahmini Süre:** 4-5 saat  

Yeni tenant oluşturulduğunda otomatik varsayılan verilerin oluşturulması.

**Kabul Kriterleri:**
- [ ] Tenant yaratıldığında otomatik:
  - Varsayılan roller (Admin, Satış, Depo, Muhasebe)
  - Varsayılan menü konfigürasyonu
  - Hoş geldiniz bildirimi
  - Tenant sahibine davet e-postası
- [ ] Tenant ayarları sayfası (Logo, adres, vergi bilgileri, dil)
- [ ] Tenant suspend/activate akışı (billing entegrasyonu için hazırlık)

### 8.2 Tenant-Specific Konfigürasyon
**Öncelik:** 🟡 Orta  
**Tahmini Süre:** 2-3 saat  

```
TenantConfig Entity
├── tenantId: UUID
├── key: string           # 'currency', 'timezone', 'scrap_threshold'
├── value: string
├── valueType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON'
└── description: string
```

**Kabul Kriterleri:**
- [ ] TenantConfig entity ve CRUD API
- [ ] Varsayılan konfigürasyon seed'i
- [ ] Frontend'de Tenant Ayarları sayfası (tab bazlı: Genel, Stok, Finans)

---

## BÖLÜM 9: Loglama & İzleme (Observability)

### 9.1 Yapısal Loglama (Structured Logging)
**Öncelik:** 🟡 Orta  
**Tahmini Süre:** 2-3 saat  

**Kabul Kriterleri:**
- [ ] Pino veya Winston logger entegrasyonu
- [ ] Her log satırında: `{ timestamp, level, tenantId, userId, requestId, module, message }`
- [ ] Request/Response loglama (body hariç, sensible data maskeleme)
- [ ] Hata loglarında stack trace
- [ ] Log seviyesi ortam değişkeninden yönetilebilir

### 9.2 Sağlık Kontrolü (Health Check)
**Öncelik:** 🟢 Düşük  
**Tahmini Süre:** 1-2 saat  

**Kabul Kriterleri:**
- [ ] `@nestjs/terminus` ile health check endpoint'leri
- [ ] `/health` → DB bağlantısı, Redis bağlantısı, disk alanı
- [ ] Docker/Kubernetes readiness/liveness probe desteği

---

## BÖLÜM 10: Çekirdek Frontend Altyapısı

### 10.1 Ortak UI Bileşenleri
**Öncelik:** 🔴 Yüksek  
**Tahmini Süre:** 4-5 saat  

**Kabul Kriterleri:**
- [ ] `DataTable` bileşeni: sayfalama, sıralama, seçim, inline aksiyonlar
- [ ] `ConfirmDialog` bileşeni (window.confirm yerine)
- [ ] `EmptyState` bileşeni (veri yokken gösterilecek güzel ekran)
- [ ] `LoadingSkeleton` bileşeni (sayfa yüklenirken iskelet görünüm)
- [ ] `FormField` bileşeni (label + input + hata mesajı birleşik)
- [ ] `StatusBadge` bileşeni (aktif/pasif/bekliyor vb. renkli etiketler)
- [ ] `PageHeader` bileşeni (başlık + açıklama + aksiyon butonları)

### 10.2 Error Boundary & Global Error Handler
**Öncelik:** 🟡 Orta  
**Tahmini Süre:** 2-3 saat  

**Kabul Kriterleri:**
- [ ] React Error Boundary bileşeni (crash durumunda kullanıcıya mesaj)
- [ ] 404 Not Found sayfası (güzel tasarım)
- [ ] 403 Forbidden sayfası (yetki yoksa güzel tasarım)
- [ ] 500 Server Error sayfası
- [ ] Global Axios error interceptor iyileştirmesi (toast + logging)

### 10.3 i18n (Çoklu Dil Desteği)
**Öncelik:** 🟢 Düşük  
**Tahmini Süre:** 3-4 saat  

**Kabul Kriterleri:**
- [ ] `react-i18next` kurulumu
- [ ] TR (varsayılan) + EN dil dosyaları
- [ ] Tüm sabit stringlerin `t()` fonksiyonu ile çağrılması
- [ ] Dil değiştirme (kullanıcı profili veya header)

---

## UYGULAMA ÖNCELİK SIRASI

### Faz 1 – Kritik Altyapı (1 hafta)
> Bu faz tamamlanmadan iş modüllerine geçilmemeli.

1. **§1.1** Sidebar Workspace Switcher
2. **§6.1** API Güvenlik Katmanı (Helmet, CORS, Rate Limiting)
3. **§5.1** Dinamik Filtreleme & Sayfalama Altyapısı
4. **§10.1** Ortak UI Bileşenleri (DataTable, FormField, vb.)
5. **§3.1** Dosya Yükleme Altyapısı (PIM ürün görselleri için şart)

### Faz 2 – Temel Destekleyici Sistemler (1 hafta)
> İş modüllerini zenginleştirir.

6. **§2.1** Bildirim Altyapısı (Backend)
7. **§2.2** Bildirim UI (Frontend – zil ikonu)
8. **§4.1** Domain Event Altyapısı
9. **§6.2** Şifre Güvenliği & Hesap Koruma
10. **§10.2** Error Boundary & Global Error Handler

### Faz 3 – Operasyonel Hazırlık (1 hafta)
> Üretime yaklaşırken gerekli.

11. **§2.3** E-posta Servisi Entegrasyonu  
12. **§7.1** Excel & CSV Export
13. **§8.1** Tenant Onboarding & Setup Wizard
14. **§8.2** Tenant-Specific Konfigürasyon
15. **§9.1** Yapısal Loglama

### Faz 4 – İleri Seviye (İş modülleri sonrası)
> PIM, Depo, Sipariş modülleri çalışır hale geldikten sonra.

16. **§1.2** Menü Yönetim UI
17. **§4.2** Asenkron Kuyruk (BullMQ)
18. **§5.2** Full-Text Search
19. **§7.2** Toplu Veri İçe Aktarma
20. **§10.3** i18n (Çoklu Dil)
21. **§9.2** Sağlık Kontrolü

---

## NOTLAR

- Her modül kendi `module.ts` dosyasında bağımsız olmalı (NestJS modüler yapı).
- Tüm entity'ler `BaseEntity`'den türemeli (id, createdAt, updatedAt, deletedAt).
- Tenant-scoped entity'ler `tenant` FK'sı taşımalı ve MikroORM filtresi ile izole edilmeli.
- Her servis için minimum bir unit test yazılmalı.
- API response'ları mevcut `ResponseInterceptor` envelope formatını korumalı.
