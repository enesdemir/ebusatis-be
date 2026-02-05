# Çok Kiracılı (Multi-Tenant) Rol ve Yetki Yönetimi Mimarisi

**Tarih:** 05.02.2026
**Konu:** SaaS ve On-Premise Uyumlu Tenant Bazlı RBAC Tasarımı
**Durum:** Taslak

---

## 1. Genel Yaklaşım ve Vizyon

Bu sistem, hem bulut tabanlı (SaaS) birden fazla şirkete hizmet verebilecek hem de tek bir şirketin kendi sunucularına (On-Premise) kurulabilecek hibrit bir mimaride tasarlanacaktır.

**Temel Prensipler:**
1.  **Tenant İzolasyonu:** Her veri (Sipariş, Stok, Müşteri) mutlaka bir `tenant_id` ile işaretlenmelidir.
2.  **Esnek Yetkilendirme:** Yetkiler "Kod" (Hardcoded) içinde değil, veritabanında dinamik olarak yönetilebilir olmalıdır.
3.  **Hiyerarşik Yapı:** "Platform Yöneticisi" (SaaS Sahibi) ve "Tenant Yöneticisi" (Müşteri Firma Sahibi) ayrımı net olmalıdır.

---

## 2. Veritabanı Şeması (Database Schema)

PostgreSQL üzerinde ilişkisel bir yapı kurgulayacağız.

### 2.1. Tablo Yapıları

#### `Tenants` (Kiracılar / Firmalar)
Sistemi kullanan şirketleri tutar.
*   `id`: UUID (PK)
*   `name`: Firma Adı
*   `domain`: Özel domain (örn: `firma1.tekstilcrm.com`)
*   `type`: 'SAAS' | 'ON_PREM_LICENSE'
*   `subscription_status`: 'ACTIVE', 'SUSPENDED'

#### `Permissions` (İzin Tanımları)
Sistemdeki tüm eylemlerin atomik tanımıdır. Bu tablo genellikle geliştirici tarafından yönetilir (Seed edilir).
*   `id`: Integer (PK)
*   `slug`: String (Unique) -> Örn: `order.create`, `stock.view_cost_price`, `report.financial`
*   `category`: String -> 'Inventory', 'Finance', 'Settings'
*   `description`: Açıklama

#### `Roles` (Roller)
*   `id`: Integer (PK)
*   `tenant_id`: UUID (Nullable).
    *   *Eğer NULL ise:* Bu bir **Sistem Rolüdür** (Örn: Super Admin, SaaS Support). Tüm tenantlar için geçerli şablon rol olabilir.
    *   *Dolu ise:* Sadece o firmaya özel bir roldür (Örn: "Firma 1 Satış Müdürü").
*   `name`: Rol Adı (Admin, Depo Sorumlusu, Plasiyer)
*   `is_system_role`: Boolean (Silinemez roller için).

#### `RolePermissions` (Rol-İzin Eşleşmesi)
Hangi rolün hangi yetkileri olduğunu tutar.
*   `role_id`: FK
*   `permission_id`: FK

#### `Users` (Kullanıcılar)
*   `id`: UUID (PK)
*   `tenant_id`: UUID (FK) -> Hangi firmaya ait?
*   `email`: String
*   `password_hash`: String
*   `is_tenant_owner`: Boolean (Firma sahibi, tüm rollerin üstünde full yetkili).

#### `UserRoles`
Bir kullanıcının birden fazla rolü olabilir.
*   `user_id`: FK
*   `role_id`: FK

---

## 3. Rol ve Yetki Stratejisi

Sistemi iki katmanda ele alacağız:

### A. Platform Seviyesi (SaaS Yönetimi)
Bu yetkiler sadece SaaS platformunun sahiplerinde (yani sizde) bulunur.
*   **Platform Admin:** Yeni tenant oluşturabilir, lisansları yönetir, global ayarları değiştirir.
*   **Support:** Tenantların verilerine "ReadOnly" erişebilir (Destek vermek için).

### B. Tenant Seviyesi (Müşteri Firma)
Müşterinin kendi içinde yöneteceği rollerdir.
*   **Tenant Owner (Firma Sahibi):** `tenant_id`'ye bağlı her şeye erişir. Lisans ödemesini yapar.
*   **Admin:** Firma içi kullanıcı açar, rol tanımlar.
*   **Sales Manager (Satış Müdürü):** Fiyatları görür, iskonto yapar, sipariş onaylar.
*   **Sales Representative (Plasiyer):** Sadece kendi müşterilerini ve siparişlerini görür. **Maliyet fiyatlarını göremez.**
*   **Warehouse Staff (Depo Görevlisi):** Fiyat göremez. Sadece stok adetlerini görür, irsaliye/rezerv işlemleri yapar.

---

## 4. Kritik "Data Scope" (Veri Kapsamı) Yönetimi

Klasik RBAC (Bunu yapabilir mi?) sorusuna cevap verirken, bizim ek olarak **"Hangi veride yapabilir?"** sorusunu çözmemiz gerekir.

**Senaryo:** Plasiyer Ahmet siparişleri listeleyebilir (`order.view`). Ama hepsini mi? Hayır, sadece kendi oluşturduklarını.

Bunu çözmek için `Permissions` tablosu yetmez, kod tarafında **Policy** veya **Scope** mantığı gerekir.

**Çözüm Önerisi (NestJS Guard + Interceptor):**

1.  **Permission Check:** Kullanıcının `order.view` yetkisi var mı? (Evet/Hayır)
2.  **Scope Check:** Kullanıcının rolü "Global View" mi yoksa "Own Data Only" mi?

Veritabanında Roller tablosuna veya User-Role ilişkisine `data_access_scope` alanı eklenebilir:
*   `ALL`: Tüm firma verisi.
*   `BRANCH`: Kendi şubesi.
*   `OWN`: Sadece kendi oluşturduğu kayıtlar.

---

## 5. Uygulama Adımları (Implementation Roadmap)

### Faz 1: Temel Guard ve Decorator Yapısı
NestJS tarafında yetki kontrolü için özel Decorator'lar yazılacak.

```typescript
// Örnek Kullanım
@Controller('products')
export class ProductController {

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product.create')
  create(@Body() dto: CreateProductDto) {
    // ...
  }

  @Get('costs')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product.view_cost') // Maliyet görme yetkisi
  getProductCosts() {
    // ...
  }
}
```

### Faz 2: Middleware ve Tenant Context
Her gelen istekte (`Request`), kullanıcının `tenant_id`'sini çıkartıp, veritabanı sorgularına otomatik enjekte eden bir yapı kurulmalı.

*   ORM (TypeORM/Prisma) kullanıyorsak, "Global Scope" veya "Repository Wrapper" kullanılarak her `find` sorgusuna `where: { tenant_id: user.tenantId }` eklenmesi garanti altına alınmalı. Bu, veri sızıntısını önlemek için en kritik adımdır.

### Faz 3: Ön Yüz (Frontend) Entegrasyonu
Backend'den login sonrası kullanıcıya yetki listesi (array of strings) dönülür:
`permissions: ['start.view', 'order.create', 'stock.view']`

Frontend'de (React) bir `Can` komponenti ile butonlar gizlenir/gösterilir:

```tsx
<Can perform="order.delete">
  <Button color="red">Siparişi Sil</Button>
</Can>
```

---

## 6. Özet Tablo Örneği

| Rol | Dashboard | Stok Görüntüle | Maliyet Görüntüle | Sipariş Oluştur | Sipariş Onayla | Fire Gir |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Tenant Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Satış Müdürü** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Plasiyer** | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Depocu** | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |

Bu yapı, projenin ölçeklenebilirliği ve güvenliği için sağlam bir temel oluşturacaktır.
