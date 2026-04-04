# EBusatis - Kademeli Gelistirme Master Plani

**Tarih:** 04.04.2026  
**Durum:** Onaylandi  
**Yaklasim:** Tanimlardan baslayip katman katman yukari cikan, modüler i18n destekli, progressive gelistirme plani.

---

## Felsefe

```
Tanimlar  ->  Ürünler  ->  Stok     ->  Siparis  ->  Finans   ->  Raporlama
   |             |           |            |            |             |
 "Nedir?"     "Ne var?"   "Nerede?"   "Kim ne      "Ne          "Ne
                                       istedi?"    borçlu?"    kazandik?"
```

Her kademe bir öncekinin üzerine oturur. Hiçbir kademe atlanmaz. Her kademenin kendi i18n dosyalari, kendi feature modülü ve kendi entity'leri olacak.

**Temel Prensipler:**
- **Inventory First:** Stok motoru çalismadan siparis ve finans anlamsiz kalir.
- **Definition First:** Tanimlar olmadan ürün, stok, siparis tanimlanamaz.
- **Multi-Tenant Native:** Her entity, her servis, her sorgu tenant-aware. Veri sizintisi mümkün degil.
- **i18n Native:** Sistem kökünden çok dilli. Her modülün kendi dil dosyasi.
- **Progressive Disclosure:** Ekranda sadece en gerekli alanlar. Gelismis seçenekler Drawer/Modal içinde.
- **Task-Based UX:** CRUD odakli degil, aksiyon odakli ekranlar ("Yeni Top Geldi", "Müsteriye Kumas Kes").
- **Self-Documenting UI:** Her özelligin yaninda "Bu ne ise yarar?" açiklamasi. Kullanici yardim menüsüne gitmeden ekranda ögrenebilmeli.
- **In-Context Education:** Her modülde "Nasil Çalisir?" egitim bölümü. Islem yapildiginda ne olacagi önceden açiklanir.

---

## UX ve Kullanici Egitimi Stratejisi

> *Sistem sadece güçlü degil, anlasilir da olmali. Kullanici "Bu ne?" diye sormamali.*

### Temel UX Kurallari (Her Kademe Için Geçerli)

1. **Basitlik Öncelikli:** Ekranda mümkün olan en az alan gösterilir. Gelismis seçenekler "Daha Fazla" / "Gelismis Ayarlar" altinda gizlenir (Progressive Disclosure).

2. **Her Alanin Yaninda Açiklama:**
   - Form alanlarinin altinda kisa `hint` metni (gri, küçük font): "Bu alan siparis olusturulurken otomatik doldurulur"
   - Karmasik alanlarin yaninda `InfoTooltip` ikonu (?): Hover/tikla ile detayli açiklama baloncugu
   - Tüm açiklamalar i18n destekli (dil dosyalarindan gelir)

3. **Kontextüel Yardim (Contextual Help):**
   Her sayfanin sag üst kösesinde `?` yardim butonu. Tiklandiginda o sayfaya özel:
   - "Bu sayfa ne ise yarar?" - 2-3 cümlelik açiklama
   - "Nasil kullanilir?" - Adim adim kisa rehber
   - "Iliskili sayfalar" - Ilgili diger modüllere linkler

4. **Islem Sonucu Bilgilendirme:**
   Bir islem yapildiginda (ör: "Top Kesimi Onayla") sadece "Basarili" demek yetmez:
   ```
   ✓ Kesim tamamlandi
   - R123 topundan 15m kesildi
   - Kalan miktar: 35m
   - Siparis SO-2026-0042'ye tahsis edildi
   → Siparisi görmek için tiklayin
   ```

5. **Bos Durum Egitimi (Empty State Education):**
   Henüz veri olmayan sayfalarda bos tablo yerine:
   ```
   [Illustration]
   Henüz hiç ürün tanimlanmamis.
   
   Ürünler, sattginiz kumas serilerini temsil eder.
   Her ürünün altinda renk/desen varyantlari bulunur.
   
   [+ Ilk Ürünü Olustur]   [Nasil çalisir? →]
   ```

6. **Ilk Kullanim Rehberi (First-Time Guidance):**
   Tenant ilk kez bir modüle girdiginde kisa bir onboarding wizard:
   - "Stok modülüne hos geldiniz! Bu modülde..."
   - 3-4 adimlik görsel anlatim
   - "Bir daha gösterme" seçenegi
   - Kullanici tercihi `TenantConfig`'de saklanir

7. **Islem Önizleme (Action Preview):**
   Kritik islemlerden önce "Bu islemi yaparsaniz su olacak" açiklamasi:
   ```
   ⚠️ Kesim Onayı
   
   Bu islemi onayladiginizda:
   • R123 topundan 15m düsülecek (kalan: 35m)
   • SO-2026-0042 siparisine tahsis edilecek
   • Stok hareketi kaydi olusturulacak
   • Bu islem geri alinamaz
   
   [Iptal]  [Onayla]
   ```

### Egitim Içerik Yapisi

Her modül için i18n dosyalarinda `_education` namespace'i:

```json
// wms/inventory.json
{
  "page_title": "Stok Yönetimi",
  "help": {
    "what": "Bu sayfa depodaki tüm kumaş toplarını listeler.",
    "how": "Filtreleri kullanarak varyant, depo veya metraj aralığına göre arama yapabilirsiniz.",
    "related": ["Mal Kabul", "Sipariş Oluştur", "Sayım"]
  },
  "fields": {
    "barcode": {
      "label": "Barkod",
      "hint": "Topun fiziksel barkod numarası. Mal kabulde otomatik atanır.",
      "tooltip": "Her topun benzersiz barkodu vardır. Barkod okuyucu ile taranabilir."
    },
    "batchCode": {
      "label": "Parti / Lot No",
      "hint": "Aynı boya kazanından çıkan toplar aynı lot numarasını taşır.",
      "tooltip": "Lot numarası renk tutarlılığı için kritiktir. Aynı müşteriye mümkünse aynı lottan satış yapılmalıdır."
    }
  },
  "empty_state": {
    "title": "Henüz stok kaydı yok",
    "description": "Toplar, mal kabul işlemiyle sisteme girer. İlk mal kabulünüzü yaparak başlayın.",
    "cta": "Mal Kabul Yap",
    "learn_more": "Stok nasıl çalışır?"
  },
  "actions": {
    "cut_confirm": {
      "title": "Kesim Onayı",
      "preview": "Bu işlemi onayladığınızda toptan {{amount}} {{unit}} düşülecek ve sipariş {{orderNumber}}'a tahsis edilecek.",
      "warning": "Bu işlem geri alınamaz."
    }
  }
}
```

### Bileşen Karşılıkları

| UX Kurali | Frontend Bileseni | Prop |
|-----------|------------------|------|
| Alan açiklamasi | `FormField` | `hint: string` |
| Detayli tooltip | `InfoTooltip` | `content: string` |
| Sayfa yardimi | `PageHelp` (yeni) | `what, how, related` |
| Bos durum egitimi | `EmptyState` | `title, description, cta, learnMore` |
| Islem önizleme | `ConfirmDialog` | `preview: string[], warning?: string` |
| Ilk kullanim rehberi | `OnboardingGuide` (yeni) | `steps: Step[], configKey: string` |
| Islem sonucu detayi | `ActionResult` (yeni) | `title, details: string[], link?` |

### Her Kademe Için UX Checklist

- [ ] Tüm form alanlarina `hint` ve gerekli olanlara `InfoTooltip` eklendi
- [ ] Sayfa `PageHelp` bileseni ile donatildi (ne ise yarar + nasil kullanilir)
- [ ] `EmptyState` bilesenleri egitici içerikle dolduruldu
- [ ] Kritik islemlerde `ConfirmDialog` ile önizleme var
- [ ] Islem sonuçlari detayli bilgi içeriyor (ne degisti, ne oldu)
- [ ] Tüm açiklama/egitim metinleri i18n dosyalarinda (hardcoded degil)
- [ ] `_education` key'leri TR ve EN dil dosyalarinda mevcut

---

## Multi-Tenant Mimari Stratejisi

> *Her kademenin uyacagi tenant izolasyon kurallari.*

### Veri Kapsam Siniflandirmasi (Data Scope)

Sistemdeki her veri 3 kapsamdan birine aittir:

| Kapsam | Açiklama | Örnek | Tenant FK | Filtreleme |
|--------|----------|-------|-----------|------------|
| **PLATFORM** | Platform geneli, tüm tenant'lar için ortaktir. Sadece SuperAdmin yönetir. | Sistem rolleri, Permission seed, PlatformConfig | `tenant = NULL` | Filtre yok |
| **SYSTEM_SEED** | Platform tarafindan tanimlanan ama tenant'a kopyalanan sablonlar. Tenant kendi kopyasini düzenleyebilir. | Varsayilan birimler (Metre, Kg), varsayilan vergi oranlari, varsayilan siparis durumlari | `tenant = tenantId` | Tenant filtresi uygulanir |
| **TENANT** | Tamamen tenant'a özel, diger tenant'lar göremez. | Ürünler, müsteriler, siparisler, stok, faturalar | `tenant = tenantId` | Tenant filtresi uygulanir |

### Otomatik Tenant Filtreleme (Her Kademe Için Geçerli)

Mevcut durumda tenant filtreleme **her serviste manuel** yapiliyor (`TenantContext.getTenantId()` ile). Bu yaklasim:
- Gelistirici bir sorguyu filtrelemeyi unutabilir (veri sizintisi riski)
- Her serviste tekrarlanan boilerplate kod
- Test edilmesi zor

**Hedef:** MikroORM `@Filter` dekoratörü ile **otomatik** tenant filtreleme:

```typescript
// Her tenant-scoped entity'de otomatik aktif olan global filtre
@Filter({
  name: 'tenant',
  cond: (args) => ({ tenant: args.tenantId }),
  default: true,
})
```

Bu filtre aktifken `em.find(Product, {})` çagirisi otomatik olarak
`SELECT * FROM products WHERE tenant_id = 'xxx' AND deleted_at IS NULL` üretir.
Gelistirici bunu yazmaz, unutamaz.

**SuperAdmin Istisna:** SuperAdmin cross-tenant islem yaparken filtre devre disi birakilir:
```typescript
em.find(Product, {}, { filters: { tenant: false } })
```

### Entity Hiyerarsisi (Her Kademe Için Geçerli)

```
BaseEntity (id, createdAt, updatedAt, deletedAt)
├── BaseTenantEntity (+ tenant FK + @Filter) .............. Tüm tenant-scoped entity'ler
│   ├── BaseDefinitionEntity (+ name, code, isActive, sortOrder, scope)
│   │   ├── UnitOfMeasure, Currency, Category, Warehouse, TaxRate, Tag, ...
│   │   └── StatusDefinition, PaymentMethod, DeliveryMethod, ...
│   ├── Partner, Counterparty, Interaction, ...
│   ├── Product, ProductVariant, DigitalCatalog, ...
│   ├── InventoryItem, InventoryTransaction, GoodsReceive, ...
│   ├── SalesOrder, PurchaseOrder, ...
│   └── Invoice, Payment, Shipment, ...
└── (Platform entity'ler - tenant FK yok)
    ├── Tenant, PlatformConfig, AuditLog, MenuNode
    └── Permission (platform-scoped)
```

### Tenant Onboarding (Her Kademe Için Geçerli)

Yeni bir tenant olusturuldugunda `TenantOnboardingService` devreye girer ve su verileri otomatik olusturur:

| Kademe | Seed Edilen Veri |
|--------|-----------------|
| Kademe 0 | Varsayilan roller (Admin, Satis, Depo, Muhasebe), menü konfigürasyonu |
| Kademe 1 | Varsayilan birimler (m, kg, adet), varsayilan para birimleri (TRY, USD, EUR), varsayilan vergi oranlari (KDV %1, %10, %20), varsayilan siparis durumlari, varsayilan ödeme/teslimat yöntemleri |
| Kademe 2 | (Bos - müsteri/tedarikçi verisi tenant tarafindan girilir) |
| Kademe 3 | Örnek kategori agaci (Perdelik > Fon/Tül, Döseemelik > Koltuk) |
| Kademe 4 | Varsayilan depo ("Ana Depo") + örnek lokasyonlar |
| Kademe 5+ | (Bos - islem verisi tenant tarafindan olusturulur) |

Bu seed veriler `SYSTEM_SEED` kapsamindadir: tenant bunlari düzenleyebilir, silebilir veya yenilerini ekleyebilir.

### Frontend Tenant Izolasyonu (Her Kademe Için Geçerli)

- `x-tenant-id` header'i httpClient interceptor ile otomatik eklenir (mevcut, çalisiyor).
- Tüm React Query cache key'leri `tenantId` içermelidir: `['products', { tenantId }]`.
- Tenant degistirildiginde (`setTenantContext()`) tüm cache invalidate edilir.
- SuperAdmin "Platform Modu"ndayken tenant-scoped sayfalar gizlenir.
- SuperAdmin bir tenant'a geçis yaptiginda sadece o tenant'in verisi görünür.

### Her Kademe Için Multi-Tenant Checklist

Her kademe tamamlandiginda su kontroller yapilmalidir:

- [ ] Tüm entity'ler `BaseTenantEntity`'den türüyor (veya bilinçli olarak platform-scoped)
- [ ] MikroORM `@Filter('tenant')` tüm tenant entity'lerine uygulanmis
- [ ] Service katmaninda `TenantContext.getTenantId()` ile ek kontrol var (defense-in-depth)
- [ ] SuperAdmin cross-tenant erisimi test edildi
- [ ] Tenant A'nin verisi Tenant B'de görünmüyor (izolasyon testi)
- [ ] Yeni tenant olusturuldugunda seed veri dogru olusturuluyor
- [ ] Frontend query key'lerinde `tenantId` bulunuyor
- [ ] Tenant degistirince cache temizleniyor

---

## KADEME 0: Altyapi Dönüsümü (Temel)

> *Tüm kademelerin üzerine oturacagi zemin. Bu kademe tamamlanmadan is modüllerine geçilmez.*

### 0.1 - i18n Modüler Yapiya Geçis

Mevcut tek `translation.json` yapisindan **namespace bazli modüler yapiya** geçis.

**Hedef Yapi:**
```
src/lib/i18n/locales/
├── tr/
│   ├── common.json              # Genel: butonlar, durumlar, tablolar, sayfalama
│   ├── auth.json                # Login, sifre, oturum
│   ├── navigation.json          # Sidebar, menü, breadcrumb
│   ├── validation.json          # Form hatalari, zorunlu alan mesajlari
│   ├── definitions.json         # Kademe 1: Tüm tanim modülleri (birim, döviz, kategori, depo, vergi, etiket, ödeme/teslimat yöntemi)
│   ├── partners.json            # Kademe 2: Müsteri, tedarikçi, cari, CRM
│   ├── pim/
│   │   ├── products.json        # Ürün karti, varyant
│   │   ├── attributes.json      # EAV attribute
│   │   └── catalogs.json        # Dijital kartela
│   ├── wms/
│   │   ├── inventory.json       # Top/rulo, stok
│   │   ├── warehouse.json       # Depo, raf, lokasyon
│   │   └── receiving.json       # Mal kabul
│   ├── orders/
│   │   ├── sales.json           # Satis siparisi
│   │   └── purchase.json        # Satinalma
│   ├── finance/
│   │   ├── invoices.json        # Fatura
│   │   ├── payments.json        # Ödeme, tahsilat
│   │   └── ledger.json          # Cari hesap
│   ├── reports.json             # Raporlama
│   └── admin/
│       ├── tenants.json         # Tenant yönetimi
│       ├── iam.json             # Rol, yetki
│       └── platform.json        # Platform ayarlari
├── en/
│   └── (ayni yapi)
└── ru/
    └── (ayni yapi - ileride Rusya pazari için)
```

**Teknik Detaylar:**
- i18next `ns` (namespace) destegi ile her sayfa sadece kendi dil dosyasini yükler (lazy loading).
- `useTranslation('pim/products')` seklinde kullanim.
- Fallback zinciri: `tr` -> `en`.
- Dil dosyalari büyüdükçe alt namespace'lere bölünebilir (ör: `wms/inventory-list.json`, `wms/inventory-detail.json`).

**Kabul Kriterleri:**
- [ ] i18next config namespace destegi ile güncellendi
- [ ] Mevcut `common` ve `auth` keyleri yeni dosyalara tasindilar
- [ ] `navigation.json` ve `validation.json` eklendi
- [ ] Tüm mevcut sabit stringler `t()` ile çagiriliyor
- [ ] Dil degistirme toggle çalisiyor (Header'da veya kullanici profili)

---

### 0.2 - Ortak UI Bilesen Kiti Tamamlama

Tüm kademelerde kullanilacak temel bilesenler:

| Bilesen | Açiklama | Nerede Kullanilacak |
|---------|----------|-------------------|
| `ConfirmDialog` | "Emin misiniz?" onay diyalogu | Her silme/iptal islemi |
| `EmptyState` | Veri yokken gösterilen güzel ekran | Bos listeler |
| `PageHeader` | Baslik + açiklama + aksiyon butonlari | Tüm sayfa basliklari |
| `FormField` | Label + input + error + hint birlesik | Tüm formlar |
| `StatusBadge` | Renkli durum etiketi | Siparis, stok, fatura durumlari |
| `FilterPanel` | Gelismis filtreleme paneli | Tüm liste sayfalari |
| `Drawer` | Sag/sol panel | Detay panelleri, gelismis filtreler |
| `Tabs` | Sekme navigasyonu | Detay sayfalari (ürün, müsteri, siparis) |
| `InfoTooltip` | "Bu alan ne ise yarar?" açiklamalari | Form alanlari, tablo basliklari |
| `SearchableSelect` | Aranabilir dropdown | Müsteri seç, depo seç, birim seç |
| `MultiSelect` | Çoklu seçim | Yetki ata, etiket ekle |
| `DatePicker` | Tarih seçici | Siparis tarihi, geçerlilik tarihi |
| `MoneyInput` | Para birimi destekli sayi girisi | Fiyat, tutar alanlari |

**Kabul Kriterleri:**
- [ ] Tüm bilesenler `src/components/common/` altinda
- [ ] Her bilesen TypeScript props interface'i ile tanimli
- [ ] Her bilesen i18n destekli (sabit string yok)
- [ ] Tailwind ile tutarli tema (primary, secondary, danger renkleri)

---

### 0.3 - Multi-Tenant Altyapi Güçlendirme

Mevcut durumda tenant filtreleme her serviste manuel yapiliyor. Bu adimda otomatik ve güvenli hale getirilir.

**Yapilacaklar:**

| # | Is | Açiklama |
|---|---|----------|
| 1 | `BaseTenantEntity` abstract class | `BaseEntity` + `tenant` FK + `@Filter('tenant')` dekoratörü. Tüm tenant-scoped entity'lerin base class'i |
| 2 | MikroORM Global Tenant Filter | `orm.config` içinde global filtre tanimi. Her sorguya otomatik `WHERE tenant_id = x` ekler |
| 3 | `TenantContextMiddleware` güçlendirme | Tenant erisim dogrulamasi: kullanicinin o tenant'a yetkisi var mi kontrolü (su an TODO) |
| 4 | `TenantGuard` | Controller seviyesinde tenant zorunluluk guard'i. Tenant-scoped endpoint'lere tenant'siz erisimi engeller |
| 5 | `TenantOnboardingService` | Yeni tenant olusturuldugunda varsayilan verileri seed eden servis. Her kademe kendi seed'ini buraya kaydeder |
| 6 | Mevcut entity'leri migrate et | `Product`, `ProductVariant`, `InventoryItem`, `Attribute` entity'lerini `BaseTenantEntity`'ye geçir |

**BaseTenantEntity Yapisi:**
```typescript
@Filter({
  name: 'tenant',
  cond: (args) => ({ tenant: args.tenantId }),
  default: true,
})
@Entity({ abstract: true })
export abstract class BaseTenantEntity extends BaseEntity {
  @ManyToOne(() => Tenant)
  tenant: Tenant;
}
```

**BaseDefinitionEntity Yapisi (BaseTenantEntity'den türer):**
```typescript
@Entity({ abstract: true })
export abstract class BaseDefinitionEntity extends BaseTenantEntity {
  @Property()
  name: string;

  @Property()
  code: string;                    // Tenant içinde unique (composite unique: tenant + code)

  @Property({ nullable: true })
  description?: string;

  @Property({ default: true })
  isActive: boolean = true;

  @Property({ default: 0 })
  sortOrder: number = 0;

  @Enum(() => DefinitionScope)
  scope: DefinitionScope = DefinitionScope.TENANT;
  // SYSTEM_SEED: Platform tarafindan olusturulan, tenant'in düzenleyebildigi sablon
  // TENANT: Tenant'in kendi olusturdugu tanim
}
```

**Kabul Kriterleri:**
- [ ] `BaseTenantEntity` olusturuldu, `@Filter('tenant')` aktif
- [ ] MikroORM config'de global filtre tanimlandi
- [ ] `TenantContextMiddleware` tenant erisim dogrulamasi yapiyor
- [ ] `TenantGuard` tenant-scoped endpoint'lerde aktif
- [ ] `TenantOnboardingService` altyapisi hazir (bos seed, her kademe dolduracak)
- [ ] Mevcut entity'ler (`Product`, `Attribute`, `InventoryItem`) `BaseTenantEntity`'ye migrate edildi
- [ ] Tenant A verisi Tenant B'de görünmüyor (izolasyon testi geçti)

---

### 0.4 - Backend Ortak Altyapi

| Altyapi | Açiklama |
|---------|----------|
| `BaseDefinitionService<T>` | Generic CRUD service (tenant-scoped): `findAll`, `findOne`, `create`, `update`, `softDelete`, `reorder` |
| `BaseDefinitionController<T>` | Generic CRUD controller: `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`, `PATCH /reorder` |
| `QueryBuilderHelper` | Ortak filtreleme, sayfalama, siralama servisi (MikroORM QueryBuilder ile uyumlu). Tenant filtresi otomatik. |
| `FileUpload` modülü | Dosya yükleme altyapisi (PIM ürün görselleri için sart). `BaseTenantEntity`'den türer, tenant izolasyonu saglar. |
| Error Pages (FE) | 404, 403, 500 sayfalari |
| Error Boundary (FE) | React Error Boundary bileseni |

**Kabul Kriterleri:**
- [ ] `BaseDefinitionService`, `BaseDefinitionController` olusturuldu (tenant filtresi otomatik)
- [ ] `QueryBuilderHelper` tüm list endpoint'lerinde kullaniliyor
- [ ] `FileUpload` modülü çalisir durumda (disk storage, ileride S3), tenant izolasyonlu
- [ ] Frontend Error Boundary ve hata sayfalari mevcut

---

## KADEME 1: Temel Tanimlar (Master Data)

> *"Sistem hangi kavramlarla çalisacak?" - Diger her seyin referans noktasi.*
> *Bu tanimlar olmadan ürün, stok, siparis tanimlanamaz.*

Her tanim entity'si `BaseDefinitionEntity`'den türer ve su ortak alanlari tasir:
`name`, `code`, `description`, `isActive`, `sortOrder`, `tenant`, `scope`

### Multi-Tenant Tanim Stratejisi

Her tanim entity'sinde `scope` alani bulunur:

| Scope | Açiklama | Kim Olusturur | Kim Düzenler | Silinebilir mi? |
|-------|----------|--------------|-------------|----------------|
| `SYSTEM_SEED` | Tenant olusturuldugunda otomatik kopyalanan sablon veriler | `TenantOnboardingService` | Tenant Admin | Evet (kendi kopyasini) |
| `TENANT` | Tenant'in kendi olusturdugu tanimlar | Tenant Admin / Kullanici | Tenant Admin | Evet |

**Unique Constraint:** `(tenant_id, code)` composite unique - ayni tenant içinde ayni code olamaz, ama farkli tenant'lar ayni code'u kullanabilir.

**SuperAdmin Görünümü:** SuperAdmin bir tenant'a geçis yaptiginda sadece o tenant'in tanimlarini görür. Platform modunda ise "Tanim Sablonlari"ni yönetir (yeni tenant açildiginda kopyalanacak veriler).

### Kademe 1 Onboarding Seed

Yeni tenant olusturuldugunda `TenantOnboardingService` su tanimlari otomatik olusturur:

```typescript
// TenantOnboardingService.seedDefinitions(tenantId)
async seedDefinitions(tenant: Tenant) {
  // 1.1 Birimler
  await this.seedUnits(tenant);      // Metre, Kg, Adet, Top, Yard, m2
  // 1.2 Para Birimleri
  await this.seedCurrencies(tenant);  // TRY (varsayilan), USD, EUR, RUB
  // 1.3 Kategoriler
  await this.seedCategories(tenant);  // Perdelik > Fon/Tül, Döseemelik > Koltuk
  // 1.4 Depolar
  await this.seedWarehouses(tenant);  // "Ana Depo" (varsayilan)
  // 1.5 Vergi Oranlari
  await this.seedTaxRates(tenant);    // KDV %1, %10, %20 (varsayilan), Muaf
  // 1.6 Durum Tanimlari
  await this.seedStatuses(tenant);    // Siparis: Taslak > Onay > Hazirlik > Sevk > Teslim
  // 1.7 Ödeme/Teslimat
  await this.seedPaymentMethods(tenant);   // Nakit, Havale, Kredi Karti, Vadeli
  await this.seedDeliveryMethods(tenant);  // Kargo, Teslim Alacak, Firma Araci
}
// Tüm seed veriler scope: SYSTEM_SEED olarak isaretlenir
```

---

### 1.1 - Birim Tanimlari (Units of Measure)

**Ne ise yarar:** Ürünlerin ölçü birimi. Tekstilde "Metre", "Kilogram", "Yard", "Adet", "Top" gibi birimler kullanilir.

**Nerede kullanilir:**
- `Product.baseUnit` -> Ürünün temel ölçü birimi
- `InventoryItem.quantity` -> Stok miktari birimi
- `OrderLine.quantity` -> Siparis miktari birimi
- Raporlama -> Birim dönüsümü

**Entity:**
```
UnitOfMeasure extends BaseDefinitionEntity
├── (inherited) tenant, name, code, description, isActive, sortOrder, scope
├── category: LENGTH | WEIGHT | AREA | PIECE | VOLUME
├── symbol: "m" | "kg" | "yd" | "adet"
├── baseConversionFactor: number   # 1 yard = 0.9144 metre gibi dönüsümler
├── decimalPrecision: number       # Kaç ondalik basamak (metre=2, adet=0)
└── isBaseUnit: boolean            # Kategorisindeki temel birim mi?
# Unique: (tenant_id, code) composite
```

**Onboarding Seed (scope: SYSTEM_SEED):** Metre (m), Santimetre (cm), Kilogram (kg), Gram (g), Yard (yd), Adet (pcs), Top (roll), Metrekare (m2)

---

### 1.2 - Para Birimi Tanimlari (Currencies)

**Ne ise yarar:** Çoklu döviz destegi. Alis USD, satis TRY olabilir. Her islem kendi kur degeriyle saklanir.

**Nerede kullanilir:**
- `ProductVariant.price` + `currency` -> Ürün fiyatlari
- `SalesOrder.currency` -> Siparis dövizi
- `Invoice.currency` -> Fatura dövizi
- `SupplierPriceList.currency` -> Tedarikçi fiyat listesi
- Raporlama -> Kur farki kar/zarar hesaplama

**Entity'ler:**
```
Currency extends BaseDefinitionEntity
├── symbol: "₺" | "$" | "€" | "₽"
├── decimalPlaces: number (default: 2)
├── isDefault: boolean             # Tenant'in varsayilan para birimi
└── position: PREFIX | SUFFIX      # Sembol konumu: $100 vs 100₺

ExchangeRate
├── fromCurrency -> Currency
├── toCurrency -> Currency
├── rate: number (decimal)         # Örn: 1 USD = 34.50 TRY
├── effectiveDate: date            # Geçerlilik tarihi
└── source: MANUAL | API           # Manuel giris veya otomatik çekme
```

**Seed Data:** TRY (varsayilan), USD, EUR, RUB, GBP

---

### 1.3 - Kategori Tanimlari (Product Categories)

**Ne ise yarar:** Ürün siniflandirmasi. Agaç yapisinda (parent-child). Her kategorinin kendine ait EAV attribute grubu olabilir.

**Nerede kullanilir:**
- `Product.category` -> Ürünün kategorisi
- Filtreleme -> "Perdelik kumaslari göster"
- Raporlama -> Kategori bazli satis
- EAV -> Kategori bazli dinamik alanlar (dösemeliklerde "Martindale" alani, perdeliklerde "Isik geçirgenlik" alani)

**Entity:**
```
Category extends BaseDefinitionEntity
├── parent -> Category (nullable)          # Üst kategori (agaç yapisi)
├── icon: string (Lucide icon adi)
├── color: string (hex renk kodu)
├── depth: number (computed)               # Agaç derinligi (0=kök)
├── attributeGroup -> AttributeGroup       # Bu kategoriye ait EAV alanlari
└── children -> Category[] (OneToMany)

AttributeGroup
├── name: "Perdelik Kumaş Özellikleri"
├── category -> Category
└── attributes -> Attribute[] (ManyToMany)  # Hangi EAV attribute'lari bu gruba ait
```

**Seed Data (Agaç):**
```
Kumaslar
├── Perdelik
│   ├── Fon Perde
│   ├── Tül Perde
│   └── Stor Perde
├── Döseemelik
│   ├── Koltuk Kumasi
│   └── Yastik Kumasi
└── Aksesuarlar
    ├── Bant / Sirit
    ├── Korniş
    └── Klips
```

---

### 1.4 - Depo ve Lokasyon Tanimlari (Warehouses & Locations)

**Ne ise yarar:** Fiziksel depo adresleri ve raf/bölge yapisi. Çoklu depolu operasyonlar (Kazan, Ufa, Moskova) için zorunlu.

**Nerede kullanilir:**
- `InventoryItem.warehouse` + `location` -> Topun fiziksel konumu
- `SalesOrder.warehouse` -> Siparisin çikacagi depo
- `GoodsReceive.warehouse` -> Mal kabulün yapilacagi depo
- Transfer -> Depolar arasi stok transferi
- Raporlama -> Depo bazli stok matrisi

**Entity'ler:**
```
Warehouse extends BaseDefinitionEntity
├── address: string
├── city: string
├── country: string
├── type: MAIN | TRANSIT | RETURN | PRODUCTION | CONSIGNMENT
├── isDefault: boolean                     # Varsayilan depo
├── legalEntity: string                    # Depoya ait sirket kimilgi (Çoklu Alt Sirket)
├── manager -> User (nullable)             # Depo sorumlusu
└── locations -> WarehouseLocation[]

WarehouseLocation
├── warehouse -> Warehouse
├── name: "A Koridoru - Raf 12"
├── code: "A-12"
├── type: ZONE | AISLE | SHELF | BIN | FLOOR
├── parent -> WarehouseLocation (nullable) # Agaç yapisi
├── capacity: jsonb                        # { maxRolls: 50, maxWeight: 1000 }
└── isActive: boolean
```

**Seed Data:** "Ana Depo" (MAIN, varsayilan) + örnek lokasyonlar (A-01, A-02, B-01)

---

### 1.5 - Vergi Tanimlari (Tax Definitions)

**Ne ise yarar:** KDV oranlari, vergi gruplari. Fatura ve fiyatlandirmada kullanilir.

**Nerede kullanilir:**
- `Product.taxRate` -> Ürünün varsayilan vergi orani
- `InvoiceLine.taxRate` -> Fatura satirindaki vergi
- `OrderLine.taxRate` -> Siparis satirindaki vergi
- Finans raporlari -> Vergi beyannameleri

**Entity:**
```
TaxRate extends BaseDefinitionEntity
├── rate: number (decimal)                 # Oran: 20.00 (%)
├── type: VAT | WITHHOLDING | CUSTOMS | EXEMPT
├── isDefault: boolean                     # Varsayilan KDV orani
└── isInclusive: boolean                   # Fiyata dahil mi? (KDV dahil/hariç)
```

**Seed Data:** KDV %1, KDV %10, KDV %20 (varsayilan), KDV Muaf (%0)

---

### 1.6 - Etiketler ve Durum Tanimlari (Tags & Status Definitions)

**Ne ise yarar:** Kullanicinin kendi etiketlerini ve is akisi durumlarini tanimlayabilmesi. Durum tanimlari hangi durumdan hangisine geçis yapilagibegini de belirler.

**Nerede kullanilir:**
- Etiketler -> Ürün, siparis, müsteri üzerine etiket atama (filtreleme, gruplama)
- Durum tanimlari -> Siparis, fatura, üretim emri durum akisi
- Raporlama -> Etiket ve durum bazli filtreleme

**Entity'ler:**
```
Tag extends BaseDefinitionEntity
├── color: string (hex)
├── icon: string (nullable, Lucide)
└── entityTypes: string[]                  # ['PRODUCT', 'ORDER', 'PARTNER', 'ROLL']

StatusDefinition extends BaseDefinitionEntity
├── entityType: ORDER | INVOICE | PURCHASE | PRODUCTION | SHIPMENT
├── color: string (hex)
├── icon: string (nullable)
├── isFinal: boolean                       # Son durum mu? (Tamamlandi, Iptal)
├── isDefault: boolean                     # Yeni kayitlarda varsayilan durum
└── allowedTransitions: string[]           # Geçis yapabilecegi durum code'lari

# Örnek: ORDER durumlari
# DRAFT -> [CONFIRMED, CANCELLED]
# CONFIRMED -> [PROCESSING, CANCELLED]
# PROCESSING -> [SHIPPED, CANCELLED]
# SHIPPED -> [DELIVERED]
# DELIVERED -> [RETURNED]
```

**Seed Data:**
- Etiketler: "Yeni Sezon", "Kampanya", "VIP Müsteri", "Acil"
- Siparis Durumlari: Taslak, Onaylandi, Hazirlaniyor, Sevk Edildi, Teslim Edildi, Iptal

---

### 1.7 - Ödeme Yöntemi ve Teslimat Yöntemi Tanimlari

**Ne ise yarar:** Siparis ve faturalarda kullanilacak ödeme ve teslimat sekilleri.

**Nerede kullanilir:**
- `SalesOrder.paymentMethod` -> Siparisin ödeme yöntemi
- `SalesOrder.deliveryMethod` -> Siparisin teslimat yöntemi
- `Invoice.paymentMethod` -> Faturanin ödeme yöntemi
- `Payment.method` -> Tahsilat/ödeme yöntemi

**Entity'ler:**
```
PaymentMethod extends BaseDefinitionEntity
├── type: CASH | BANK_TRANSFER | CREDIT_CARD | CHECK | DEFERRED | OFFSET
├── icon: string
├── requiresReference: boolean             # Referans no zorunlu mu? (havale dekontu vb.)
└── defaultDueDays: number                 # Vadeli satislarda varsayilan gün (ör: 30)

DeliveryMethod extends BaseDefinitionEntity
├── type: CARGO | PICKUP | OWN_VEHICLE | COURIER | FREIGHT
├── icon: string
├── defaultCost: number (nullable)         # Varsayilan teslimat ücreti
└── estimatedDays: number (nullable)       # Tahmini teslimat süresi
```

**Seed Data:**
- Ödeme: Nakit, Banka Havalesi, Kredi Karti, Çek, Vadeli (30 gün), Vadeli (60 gün)
- Teslimat: Kargo (Aras), Kargo (Yurtici), Müsteri Teslim Alacak, Firma Araci, Nakliye

---

### Kademe 1 - Frontend Yapisi

Her tanim için **ayni kaliptan** üretilen sayfalar. DRY prensibiyle generic bir `DefinitionListPage` ve `DefinitionFormModal` kullanilir.

**Rota Yapisi:**
```
/settings/definitions/
├── units                    # Birimler
├── currencies               # Para birimleri
│   └── exchange-rates       # Kur tanimlari
├── categories               # Kategoriler (agaç görünüm)
├── warehouses               # Depolar
│   └── :id/locations        # Depo lokasyonlari (agaç görünüm)
├── tax-rates                # Vergi oranlari
├── tags                     # Etiketler
├── statuses                 # Durum tanimlari (entity type bazli tab)
├── payment-methods          # Ödeme yöntemleri
└── delivery-methods         # Teslimat yöntemleri
```

**Her Tanim Sayfasindaki Ortak Özellikler:**
- DataTable ile listeleme (siralama, filtreleme, sayfalama)
- Modal veya Drawer içinde form (yeni / düzenle)
- "Bu tanim nerede kullanilir?" InfoTooltip açiklamalari
- Aktif/Pasif toggle
- Sürükle-birak ile siralama (sortOrder)
- Toplu islemler (çoklu seçim + sil/pasif yap)

**i18n Dosyasi:** `definitions.json` - Tüm tanim modüllerinin çevirileri

**Multi-Tenant Kontrol:**
- [ ] Tüm tanim entity'leri `BaseDefinitionEntity` > `BaseTenantEntity`'den türüyor
- [ ] `(tenant_id, code)` composite unique her tanim tablosunda var
- [ ] `scope: SYSTEM_SEED | TENANT` alani çalisiyor
- [ ] `TenantOnboardingService.seedDefinitions()` tüm varsayilan tanimlari oluşturuyor
- [ ] SuperAdmin platform modunda "Tanim Sablonlari"ni görebiliyor
- [ ] Tenant A'nin özel tanimlari Tenant B'de görünmüyor
- [ ] Tenant kendi SYSTEM_SEED verilerini düzenleyebiliyor/silebiliyor

---

## KADEME 2: Is Ortaklari (Partners / CRM Temeli)

> *"Kimlerle çalisiyoruz?" - Eski sistemdeki Partner vs Counterparty ayrimi.*
> *Bagimlilik: Kademe 1 (Currency, Tag, PaymentMethod)*
> *Tenant Izolasyon: Tüm entity'ler `BaseTenantEntity`'den türer. Bir tenant'in müsterileri/tedarikçileri baska tenant'da görünmez.*

### 2.1 - Partner (Ana Firma Karti)

**Ne ise yarar:** Tek bir firma karti. Ayni firma hem müsteri hem tedarikçi hem rakip olarak isaretlenebilir. CRM'in temeli.

**Nerede kullanilir:**
- `SalesOrder.partner` -> Siparisi veren müsteri
- `PurchaseOrder.supplier` -> Siparis verilen tedarikçi
- `Invoice.partner` -> Fatura kesilen/kesildigi firma
- `SupplierPriceList.supplier` -> Tedarikçi fiyat listesi
- `GoodsReceive.supplier` -> Mal kabul yapilan tedarikçi
- CRM -> Etkilesim geçmisi, teklif takibi

**Entity:**
```
Partner extends BaseTenantEntity
├── (inherited) tenant + @Filter('tenant')
├── name: "ABC Tekstil Ltd."
├── code: "ABC-001" (auto veya manuel)
├── types: PartnerType[]                   # [CUSTOMER, SUPPLIER, COMPETITOR] - Çoklu seçim
├── taxId: string (nullable)
├── email: string (nullable)
├── phone: string (nullable)
├── website: string (nullable)
├── defaultCurrency -> Currency
├── creditLimit: number (decimal)          # Müsterinin kredi limiti
├── riskScore: LOW | MEDIUM | HIGH | BLOCKED
├── isActive: boolean
├── note: string (nullable)
├── tags -> Tag[] (ManyToMany)
├── addresses -> PartnerAddress[] (OneToMany)
├── contacts -> PartnerContact[] (OneToMany)
├── counterparties -> Counterparty[] (OneToMany)
├── assignedReps -> PartnerRep[] (OneToMany)
└── interactions -> Interaction[] (OneToMany)

PartnerAddress
├── partner -> Partner
├── type: BILLING | SHIPPING | BOTH
├── label: "Merkez Ofis"
├── addressLine1, addressLine2
├── city, district, postalCode, country
├── isDefault: boolean
└── coordinates: { lat, lng } (nullable)

PartnerContact
├── partner -> Partner
├── fullName: string
├── title: string (nullable)               # "Satin Alma Müdürü"
├── phone: string
├── email: string (nullable)
├── isPrimary: boolean
└── note: string (nullable)
```

### 2.2 - Cari Hesap (Counterparty / Legal Entity)

**Ne ise yarar:** Ayni firmanin farkli fatura kimlikleri. "ABC Tekstil" firmasinin "ABC Ithalat A.S." ve "ABC Perakende Ltd." gibi iki ayri cari hesabi olabilir.

**Nerede kullanilir:**
- `Invoice.counterparty` -> Faturanin kesildigi tüzel kisilik
- `Payment.counterparty` -> Ödemenin/tahsilatin yapildigi cari
- Cari hesap ekstresi -> Borç/alacak bakiye takibi

**Entity:**
```
Counterparty extends BaseTenantEntity
├── (inherited) tenant + @Filter('tenant')
├── partner -> Partner
├── legalName: "ABC Ithalat A.S."
├── taxId: string
├── taxOffice: string
├── type: INDIVIDUAL | COMPANY
├── isDefault: boolean                     # Partner'in varsayilan carisi
├── bankAccounts -> BankAccount[] (OneToMany)
└── isActive: boolean

BankAccount
├── counterparty -> Counterparty
├── bankName: string
├── iban: string
├── currency -> Currency
├── accountHolder: string
└── isDefault: boolean
```

### 2.3 - Temsilci Atamasi (Partner Representatives)

**Ne ise yarar:** Eski sistemdeki "Türev Bazli Satis Temsilcisi Atamasi". Tek bir müsteriye ürün satis sekline göre üç ayri plasiyer atanabilir.

**Entity:**
```
PartnerRep
├── partner -> Partner
├── user -> User                           # Atanan satis temsilcisi
├── role: METRAJ_REP | KESIM_REP | HAZIR_URUN_REP | GENERAL
└── isPrimary: boolean
```

### 2.4 - Etkilesim Geçmisi (Interaction Log)

**Ne ise yarar:** CRM'in temel tasi. Müsteriyle yapilan görüsmelerin loglanmasi.

**Entity:**
```
Interaction extends BaseTenantEntity
├── (inherited) tenant + @Filter('tenant')
├── partner -> Partner
├── type: CALL | EMAIL | MEETING | NOTE | VISIT | OFFER
├── summary: string                        # Kisa özet
├── details: text (nullable)               # Detayli notlar
├── contactPerson: string (nullable)       # Görüsülen kisi
├── nextActionDate: date (nullable)        # Bir sonraki aksiyon tarihi
├── nextActionNote: string (nullable)
├── createdBy -> User
└── attachments -> FileUpload[] (nullable)
```

### Kademe 2 - Frontend Yapisi

**Rota Yapisi:**
```
/partners/
├── /                          # Partner listesi (tab: Müsteriler / Tedarikçiler / Tümü)
├── /new                       # Yeni partner formu (wizard: Genel -> Adresler -> Iletisim -> Cari)
├── /:id                       # Partner detay sayfasi
│   ├── tab: Genel Bilgi       # Firma karti
│   ├── tab: Adresler          # Fatura/teslimat adresleri
│   ├── tab: Cariler           # Alt cari hesaplar (Counterparty)
│   ├── tab: Iletisim          # Kisiler + Etkilesim geçmisi
│   ├── tab: Siparisler        # (Kademe 5'te aktif olacak)
│   ├── tab: Finansal          # (Kademe 6'da aktif olacak)
│   └── tab: Belgeler          # (Kademe 6'da aktif olacak)
└── /:id/edit                  # Partner düzenleme
```

**i18n Dosyasi:** `partners.json`

**Multi-Tenant Kontrol:**
- [ ] `Partner`, `Counterparty`, `PartnerAddress`, `PartnerContact`, `PartnerRep`, `BankAccount`, `Interaction` -> `BaseTenantEntity`
- [ ] Partner listesi sadece aktif tenant'in verilerini döndürüyor
- [ ] SuperAdmin tenant'a geçis yapinca sadece o tenant'in müsterilerini görüyor
- [ ] Tenant A'nin müsterisi Tenant B'de araninca bulunamiyor

---

## KADEME 3: PIM Genisleme (Ürün Bilgi Yönetimi)

> *"Ne satiyoruz?" - Mevcut entity'lerin güçlendirilmesi ve yeni yetenekler.*
> *Bagimlilik: Kademe 1 (Category, UnitOfMeasure, Currency, TaxRate), Kademe 0 (FileUpload)*
> *Tenant Izolasyon: Ürünler, varyantlar, kartelalar tamamen tenant-scoped. Mevcut `Product`/`ProductVariant` entity'leri `BaseTenantEntity`'ye migrate edilir.*

### 3.1 - Product Entity Genisletme

Mevcut `Product` ve `ProductVariant` entity'lerine eklenmesi gerekenler:

```
Product (güncelleme)
├── + category -> Category
├── + trackingStrategy: SERIAL | BULK      # Top takibi mi, dökme mi?
├── + fabricComposition: string            # "%80 Pamuk, %20 Polyester"
├── + washingInstructions: string
├── + collectionName: string               # "SS26 Collection"
├── + moq: number (decimal)               # Minimum siparis miktari
├── + unit -> UnitOfMeasure                # Temel ölçü birimi
├── + taxRate -> TaxRate                   # Varsayilan vergi orani
├── + images -> FileUpload[] (OneToMany)
├── + tags -> Tag[] (ManyToMany)
├── + isActive: boolean
└── + origin: string (nullable)            # Mensei: "Türkiye", "Italya"

ProductVariant (güncelleme)
├── + colorCode: string                    # Pantone/Hex renk kodu
├── + width: number (decimal, cm)          # En: 280.0 cm
├── + weight: number (decimal, gr/m2)      # Gramaj: 450 gr/m2
├── + martindale: number (nullable)        # Sürtünme katsayisi (döseemelik)
├── + currency -> Currency
├── + costPrice: number (decimal)          # Maliyet fiyati (kârlilik hesabi için)
├── + minOrderQuantity: number (decimal)   # Bu varyant için minimum siparis
├── + primaryImage -> FileUpload
├── + barcode: string (nullable)           # Varyant barkodu
└── + isActive: boolean
```

### 3.2 - Dijital Kartela

**Ne ise yarar:** Satis temsilcisinin B2B müsteriye gönderdigi online ürün katalogu. Filtreleyip seçilen varyantlardan tek tikla link olusturulur.

**Entity'ler:**
```
DigitalCatalog extends BaseTenantEntity
├── (inherited) tenant + @Filter('tenant')
├── title: "Hilton Otel Projesi Kumaslari"
├── token: string (unique, public link)
├── partner -> Partner (nullable)          # Hangi müsteri için hazirlandigi
├── showPrices: boolean                    # Fiyatlari göster/gizle
├── showStock: boolean                     # Stok durumunu göster/gizle
├── expiresAt: datetime (nullable)
├── viewCount: number (default: 0)
├── items -> DigitalCatalogItem[] (OneToMany)
├── createdBy -> User
└── isActive: boolean

DigitalCatalogItem
├── catalog -> DigitalCatalog
├── variant -> ProductVariant
├── customPrice: number (nullable)         # Müsteriye özel fiyat
├── note: string (nullable)
└── sortOrder: number
```

### 3.3 - Tedarikçi Fiyat Listesi

**Ne ise yarar:** Tedarikçilerin fiyat listelerinin sisteme yüklenebilmesi. Satinalma siparislerinde referans.

**Entity'ler:**
```
SupplierPriceList extends BaseTenantEntity
├── (inherited) tenant + @Filter('tenant')
├── supplier -> Partner (type=SUPPLIER)
├── name: "2026 Ilkbahar Listesi"
├── currency -> Currency
├── validFrom: date
├── validTo: date (nullable)
├── isActive: boolean
└── items -> SupplierPriceListItem[] (OneToMany)

SupplierPriceListItem
├── priceList -> SupplierPriceList
├── variant -> ProductVariant
├── unitPrice: number (decimal)
├── moq: number (decimal, nullable)        # Minimum siparis miktari
├── leadTimeDays: number (nullable)        # Teslim süresi
└── note: string (nullable)
```

### Kademe 3 - Frontend Yapisi

**Rota Yapisi:**
```
/pim/
├── products/                  # Ürün listesi (gelismis filtreleme: kategori, koleksiyon, aktiflik)
│   ├── /new                   # Ürün ekleme sihirbazi (wizard)
│   └── /:id                   # Ürün detay
│       ├── tab: Genel         # Ürün karti (ad, kod, kategori, açiklama)
│       ├── tab: Teknik        # Kompozisyon, yikama talimati, sertifikalar
│       ├── tab: Varyantlar    # Renk/desen listesi + hizli ekleme
│       ├── tab: Görseller     # Sürükle-birak görsel yükleme
│       ├── tab: Fiyatlar      # Varyant bazli fiyat listesi
│       └── tab: Stok          # (Kademe 4'te aktif) Varyanta ait toplar
├── catalogs/                  # Dijital kartelalar
│   ├── /new                   # Yeni kartela (varyant seçim + ayarlar)
│   └── /:id                   # Kartela detay + paylaşim linki
├── supplier-prices/           # Tedarikçi fiyat listeleri
└── attributes/                # (Mevcut) EAV attribute yönetimi
```

**i18n Dosyalari:** `pim/products.json`, `pim/attributes.json`, `pim/catalogs.json`

**Multi-Tenant Kontrol:**
- [ ] Mevcut `Product`, `ProductVariant`, `Attribute` entity'leri `BaseTenantEntity`'ye migrate edildi
- [ ] `DigitalCatalog`, `SupplierPriceList` -> `BaseTenantEntity`
- [ ] Dijital kartela public link'i tenant bilgisi içermiyor (güvenlik: token-based erisim)
- [ ] Ürün SKU tenant içinde unique (composite: tenant + sku)

---

## KADEME 4: WMS - Depo & Stok Yönetimi (Dimensional Inventory)

> *"Stok nerede, ne kadar?" - Sistemin kalbi.*
> *Bagimlilik: Kademe 1 (Warehouse, UnitOfMeasure), Kademe 3 (Product, Variant)*
> *Tenant Izolasyon: Stok verileri en kritik izolasyon alanidir. Bir tenant'in stogu baska tenant'da kesinlikle görünmemeli. Mevcut `InventoryItem`/`InventoryTransaction` entity'leri `BaseTenantEntity`'ye migrate edilir.*

### 4.1 - Inventory API (Mevcut entity'leri canlandirma)

Entity'ler (`InventoryItem`, `InventoryTransaction`) mevcut, controller ve service yok. Implement edilecek endpoint'ler:

| Endpoint | Açiklama |
|----------|----------|
| `POST /inventory/rolls` | Top girisi (barkod + lot + metraj + depo + lokasyon) |
| `GET /inventory/rolls` | Top listeleme (filtre: varyant, depo, durum, metraj araligi, lot) |
| `GET /inventory/rolls/:id` | Top detay + hareket tarihçesi |
| `POST /inventory/cut` | Kesim emri (topId, miktar, siparisRef) |
| `POST /inventory/adjust` | Sayim düzeltme (topId, yeniMiktar, açiklama) |
| `POST /inventory/transfer` | Depolar arasi transfer |
| `POST /inventory/scrap` | Fire kaydi |
| `GET /inventory/movements/:rollId` | Topun tüm hareket tarihçesi |
| `GET /inventory/summary` | Varyant bazli toplam stok özeti |

### 4.2 - InventoryItem Entity Genisletme

```
InventoryItem (güncelleme)
├── + warehouse -> Warehouse
├── + location -> WarehouseLocation (nullable)
├── + receivedAt: datetime                 # Depoya giris tarihi
├── + receivedFrom -> Partner (nullable)   # Hangi tedarikçiden geldi
├── + goodsReceive -> GoodsReceive         # Hangi mal kabul fisinden
├── + costPrice: number (decimal)          # Topun birim maliyeti
├── + costCurrency -> Currency
├── + reservedQuantity: number (default: 0) # Siparise tahsis edilen miktar
├── + availableQuantity: computed           # currentQuantity - reservedQuantity
├── + expiresAt: datetime (nullable)        # Son kullanma (bazi kumaslar için)
└── + tags -> Tag[] (nullable)
```

### 4.3 - Mal Kabul (Goods Receiving)

**Ne ise yarar:** Tedarikçiden gelen malin sisteme kaydi. Her mal kabul birden fazla topu içerir.

```
GoodsReceive extends BaseTenantEntity
├── (inherited) tenant + @Filter('tenant')
├── receiveNumber: "GR-2026-0001"
├── supplier -> Partner
├── purchaseOrder -> PurchaseOrder (nullable)
├── warehouse -> Warehouse
├── receivedAt: datetime
├── status: DRAFT | COMPLETED | CANCELLED
├── note: string (nullable)
├── lines -> GoodsReceiveLine[] (OneToMany)
└── createdBy -> User

GoodsReceiveLine
├── goodsReceive -> GoodsReceive
├── variant -> ProductVariant
├── expectedQuantity: number (nullable)    # PO'daki beklenen miktar
├── receivedRollCount: number              # Gelen top sayisi
├── totalReceivedQuantity: number          # Toplam gelen metraj
├── rolls -> InventoryItem[] (OneToMany)   # Olusturulan toplar
└── note: string (nullable)
```

### 4.4 - Allocation & Fire Algoritmalari

Siparis karsilama algoritmalari (InventoryAllocationService):

| Strateji | Açiklama | Ne Zaman |
|----------|----------|----------|
| **Exact Match** | Tam metrajli top varsa onu öner | Her zaman ilk kontrol |
| **Best Fit** | En az fire verecek topu öner | Varsayilan |
| **FIFO** | En eski topu öner | Lot/parti yönetimi gerektiren durumlar |
| **Manual** | Kullanici kendisi seçer (pop-up ile) | Müsteri belirli lot istediginde |

**Esik Kontrolü (Threshold Check):**
```
scrap_threshold = TenantConfig'den okunur (varsayilan: 1.0 metre)

if (roll.currentQuantity - requestedAmount < scrap_threshold) {
    // Uyari: "Kalan 0.5m parça satilamaz niteliktedir."
    // Seçenek A: Tüm topu sat (currentQuantity kadar)
    // Seçenek B: Kalani fire olarak isaretle
}
```

### 4.5 - Barkod & Etiket Servisi

- Code128 / QR barkod üretimi
- Zebra ZPL veya PDF etiket sablonu
- Toplu etiket yazdirma (mal kabulde)

### Kademe 4 - Frontend Yapisi

**Rota Yapisi:**
```
/wms/
├── inventory/                 # Stok listesi (gelismis filtre: varyant, depo, durum, metraj, lot)
│   └── /:id                  # Top detay (bilgi + hareket tarihçesi timeline)
├── receiving/                 # Mal kabul listesi
│   ├── /new                   # Yeni mal kabul (wizard: Tedarikçi -> Ürünler -> Toplar -> Onay)
│   └── /:id                  # Mal kabul detay
├── transfer/                  # Depolar arasi transfer
│   └── /new                   # Yeni transfer emri
├── adjustments/               # Sayim düzeltmeleri
└── labels/                    # Barkod/etiket yazdirma
```

**i18n Dosyalari:** `wms/inventory.json`, `wms/warehouse.json`, `wms/receiving.json`

**Multi-Tenant Kontrol:**
- [ ] Mevcut `InventoryItem`, `InventoryTransaction` entity'leri `BaseTenantEntity`'ye migrate edildi
- [ ] `GoodsReceive`, `GoodsReceiveLine` -> `BaseTenantEntity`
- [ ] Barkod tenant içinde unique (composite: tenant + barcode)
- [ ] Stok allocation sadece tenant'in kendi stogunu kullanir
- [ ] `TenantOnboardingService.seedWarehouses()`: "Ana Depo" + örnek lokasyonlar

---

## KADEME 5: Siparis Motoru

> *"Kim ne istedi?" - Satis ve satinalma süreçleri.*
> *Bagimlilik: Kademe 1-4 tümü*
> *Tenant Izolasyon: Siparisler, tahsisler tamamen tenant-scoped. Siparis numaralari tenant içinde unique ve auto-increment (her tenant kendi "SO-0001"den baslar).*

### 5.1 - Satis Siparisi (Sales Order)

```
SalesOrder extends BaseTenantEntity
├── (inherited) tenant + @Filter('tenant')
├── orderNumber: "SO-2026-0001" (tenant-scoped auto-increment)
├── partner -> Partner
├── counterparty -> Counterparty (nullable)
├── warehouse -> Warehouse                 # Çikis deposu
├── currency -> Currency
├── exchangeRate: number                   # Siparis anindaki kur
├── status -> StatusDefinition
├── orderDate: date
├── expectedDeliveryDate: date (nullable)
├── paymentMethod -> PaymentMethod
├── deliveryMethod -> DeliveryMethod
├── deliveryAddress -> PartnerAddress (nullable)
├── lines -> SalesOrderLine[] (OneToMany)
├── totalAmount: number (decimal)
├── discountAmount: number (decimal)
├── taxAmount: number (decimal)
├── grandTotal: number (decimal)
├── note: string (nullable)
├── internalNote: string (nullable)        # Sadece iç kullanim
├── assignedTo -> User (nullable)          # Sorumlu satis temsilcisi
├── tags -> Tag[] (nullable)
├── createdBy -> User
└── linkedDocuments -> DocumentLink[]      # Bagli belgeler (Kademe 6)

SalesOrderLine
├── order -> SalesOrder
├── lineNumber: number
├── variant -> ProductVariant
├── requestedQuantity: number (decimal)    # Istenen miktar (20m)
├── allocatedRolls -> OrderRollAllocation[] # Tahsis edilen toplar
├── unitPrice: number (decimal)
├── discount: number (decimal, %)
├── taxRate -> TaxRate
├── lineTotal: number (decimal)
└── note: string (nullable)

OrderRollAllocation
├── orderLine -> SalesOrderLine
├── roll -> InventoryItem
├── allocatedQuantity: number (decimal)    # Bu toptan tahsis edilen miktar
├── status: RESERVED | CUT | CANCELLED
└── cutAt: datetime (nullable)
```

### 5.2 - Satinalma Siparisi (Purchase Order)

```
PurchaseOrder extends BaseTenantEntity
├── (inherited) tenant + @Filter('tenant')
├── orderNumber: "PO-2026-0001" (tenant-scoped auto-increment)
├── supplier -> Partner (type=SUPPLIER)
├── counterparty -> Counterparty (nullable)
├── currency -> Currency
├── exchangeRate: number
├── status -> StatusDefinition
├── expectedDeliveryDate: date
├── lines -> PurchaseOrderLine[] (OneToMany)
├── totalAmount, taxAmount, grandTotal
├── containerInfo: jsonb (nullable)        # { containerNo, vessel, customsRef (GTD) }
├── note: string (nullable)
└── createdBy -> User

PurchaseOrderLine
├── order -> PurchaseOrder
├── variant -> ProductVariant
├── quantity: number (decimal)
├── unitPrice: number (decimal)
├── taxRate -> TaxRate
├── lineTotal: number (decimal)
├── receivedQuantity: number (default: 0)  # Teslim alinan miktar (mal kabulden güncellenir)
└── note: string (nullable)
```

### 5.3 - Rulo Seçim Pop-up'i (Roll Selection)

Siparis satiri eklerken çalisan UI akisi:
1. Kullanici varyant seçer ve miktar girer (ör: 20m Kirmizi Kadife)
2. Sistem `findBestMatchRolls()` çalistirir
3. Pop-up açilir: Uygun toplar listelenir (barkod, lot, kalan metraj, depo, lokasyon)
4. Kullanici manuel seçebilir veya "Otomatik Dagit" butonuyla sistem tahsis eder
5. Fire uyarisi: Kalan < threshold ise uyari gösterilir

### Kademe 5 - Frontend Yapisi

**Rota Yapisi:**
```
/orders/
├── sales/                     # Satis siparisleri listesi
│   ├── /new                   # Yeni siparis (wizard veya tek sayfa form)
│   └── /:id                  # Siparis detay
│       ├── tab: Genel         # Siparis bilgileri
│       ├── tab: Kalemler      # Siparis satirlari + rulo tahsisi
│       ├── tab: Sevkiyat      # Teslimat/kargo bilgisi
│       ├── tab: Belgeler      # Bagli belgeler (irsaliye, fatura)
│       └── tab: Tarihçe       # Durum degisiklik logu
├── purchase/                  # Satinalma siparisleri
│   ├── /new
│   └── /:id
│       ├── tab: Genel
│       ├── tab: Kalemler
│       ├── tab: Teslimat      # Beklenen teslimat + konteyner bilgisi
│       └── tab: Mal Kabul     # Bagli mal kabul fisleri
```

**i18n Dosyalari:** `orders/sales.json`, `orders/purchase.json`

**Multi-Tenant Kontrol:**
- [ ] `SalesOrder`, `SalesOrderLine`, `OrderRollAllocation` -> `BaseTenantEntity`
- [ ] `PurchaseOrder`, `PurchaseOrderLine` -> `BaseTenantEntity`
- [ ] Siparis numarasi tenant-scoped auto-increment (TenantSequenceService)
- [ ] Rulo seçim/tahsis sadece tenant'in kendi stogunu gösteriyor
- [ ] Siparis aninda müsteri cari bakiyesi sadece tenant'in kendi verisiyle hesaplaniyor

---

## KADEME 6: Belge Akisi & Finans

> *"Ne borçluyuz, ne alacagiz?" - Finansal süreçler.*
> *Bagimlilik: Kademe 1-5 tümü*
> *Tenant Izolasyon: Finansal veriler en hassas izolasyon gerektiren alandir. Faturalar, ödemeler, cari bakiyeler kesinlikle tenant-scoped. Fatura numaralari tenant-scoped auto-increment.*

### 6.1 - Belge Grafigi (Document Graph / Linked Documents)

**Ne ise yarar:** Herhangi bir belgenin içinde, o belgeye bagli tüm evraklarin ata-soy iliskisiyle görüntülenmesi.

```
DocumentLink extends BaseTenantEntity
├── (inherited) tenant + @Filter('tenant')
├── sourceType: string                     # 'SalesOrder', 'Invoice', 'Payment', 'Shipment'
├── sourceId: UUID
├── targetType: string
├── targetId: UUID
├── linkType: CREATED_FROM | PARTIAL | RETURN | CORRECTION
└── createdAt: datetime

# Örnek Zincir:
# SalesOrder -> Shipment -> Invoice -> Payment
# PurchaseOrder -> GoodsReceive -> PurchaseInvoice -> Payment
```

### 6.2 - Irsaliye / Sevkiyat (Shipment)

```
Shipment extends BaseTenantEntity
├── (inherited) tenant + @Filter('tenant')
├── shipmentNumber: "SH-2026-0001" (tenant-scoped auto-increment)
├── salesOrder -> SalesOrder
├── warehouse -> Warehouse
├── deliveryMethod -> DeliveryMethod
├── status: PREPARING | SHIPPED | DELIVERED | RETURNED
├── trackingNumber: string (nullable)
├── shippedAt: datetime (nullable)
├── deliveredAt: datetime (nullable)
├── lines -> ShipmentLine[] (OneToMany)
└── note: string (nullable)

ShipmentLine
├── shipment -> Shipment
├── orderLine -> SalesOrderLine
├── variant -> ProductVariant
├── rolls -> InventoryItem[]               # Sevk edilen toplar
├── quantity: number (decimal)
└── note: string (nullable)
```

### 6.3 - Fatura (Invoice)

```
Invoice extends BaseTenantEntity
├── (inherited) tenant + @Filter('tenant')
├── invoiceNumber: string (tenant-scoped auto-increment)
├── type: SALES | PURCHASE | RETURN_SALES | RETURN_PURCHASE
├── partner -> Partner
├── counterparty -> Counterparty
├── currency -> Currency
├── exchangeRate: number
├── issueDate: date
├── dueDate: date
├── status: DRAFT | ISSUED | PARTIALLY_PAID | PAID | CANCELLED | OVERDUE
├── lines -> InvoiceLine[] (OneToMany)
├── subtotal: number (decimal)
├── discountAmount: number (decimal)
├── taxAmount: number (decimal)
├── grandTotal: number (decimal)
├── paidAmount: number (decimal, computed)
├── remainingAmount: number (decimal, computed)
├── paymentMethod -> PaymentMethod
└── note: string (nullable)

InvoiceLine
├── invoice -> Invoice
├── description: string
├── variant -> ProductVariant (nullable)
├── quantity: number (decimal)
├── unitPrice: number (decimal)
├── discount: number (decimal, %)
├── taxRate -> TaxRate
├── lineTotal: number (decimal)
└── sourceOrderLine -> SalesOrderLine | PurchaseOrderLine (nullable)
```

### 6.4 - Ödeme & Tahsilat (Payment)

```
Payment extends BaseTenantEntity
├── (inherited) tenant + @Filter('tenant')
├── paymentNumber: "PAY-2026-0001" (tenant-scoped auto-increment)
├── type: INCOMING | OUTGOING              # Tahsilat / Ödeme
├── partner -> Partner
├── counterparty -> Counterparty
├── amount: number (decimal)
├── currency -> Currency
├── exchangeRate: number
├── paymentDate: date
├── method -> PaymentMethod
├── reference: string (nullable)           # Dekont no, çek no vb.
├── bankAccount: string (nullable)
├── status: PENDING | COMPLETED | CANCELLED
├── matchedInvoices -> PaymentInvoiceMatch[] (OneToMany)
├── note: string (nullable)
└── createdBy -> User

PaymentInvoiceMatch
├── payment -> Payment
├── invoice -> Invoice
├── matchedAmount: number (decimal)        # Bu ödemeden faturaya eslesen tutar
└── matchedAt: datetime
```

### 6.5 - Cari Hesap Ekstresi (Ledger)

Otomatik hesaplanan bakiye. Ayri bir entity degil, fatura ve ödeme hareketlerinden türetilen computed view.

```
# API Endpoint:
GET /finance/ledger/:counterpartyId?from=...&to=...

# Response:
{
  openingBalance: -5000.00,
  movements: [
    { date, type: "INVOICE", ref: "INV-001", debit: 10000, credit: 0, balance: -15000 },
    { date, type: "PAYMENT", ref: "PAY-001", debit: 0, credit: 8000, balance: -7000 }
  ],
  closingBalance: -7000.00
}
```

### Kademe 6 - Frontend Yapisi

**Rota Yapisi:**
```
/finance/
├── invoices/                  # Fatura listesi (tab: Satis / Satin Alma / Tümü)
│   ├── /new                   # Yeni fatura (siparisten veya serbest)
│   └── /:id                  # Fatura detay + bagli belgeler
├── payments/                  # Ödeme/tahsilat listesi
│   ├── /new                   # Yeni ödeme
│   └── /:id                  # Ödeme detay + eslestirilen faturalar
├── ledger/                    # Cari hesap ekstresi
│   └── /:counterpartyId      # Belirli carinin ekstresi
└── shipments/                 # Irsaliye/sevkiyat listesi
    ├── /new
    └── /:id
```

**i18n Dosyalari:** `finance/invoices.json`, `finance/payments.json`, `finance/ledger.json`

**Multi-Tenant Kontrol:**
- [ ] `Shipment`, `Invoice`, `Payment`, `DocumentLink` -> `BaseTenantEntity`
- [ ] Belge numaralari (SH, INV, PAY) tenant-scoped auto-increment (`TenantSequenceService`)
- [ ] Cari ekstre sadece tenant'in kendi fatura/ödemelerini içeriyor
- [ ] Belge grafigi (Document Graph) tenant sinirini asamiyor
- [ ] Fatura-ödeme eslestirme sadece ayni tenant içinde yapilabiliyor

---

## KADEME 7: Raporlama & BI

> *"Ne kazandik?" - Yönetim raporlari.*
> *Bagimlilik: Kademe 1-6 tümü*
> *Tenant Izolasyon: Raporlar iki modda çalisir: (1) Tenant modu - sadece aktif tenant verileri, (2) SuperAdmin platform modu - tüm tenant'larin toplu verileri (cross-tenant aggregation).*

### 7.1 - Stok Raporlari
- **Stok Durum Raporu:** Varyant x Depo matrisi (kalan metraj, top sayisi)
- **Stok Hareket Raporu:** Belirli tarih araligindaki giris/çikis/fire hareketleri
- **Lot Bazli Stok:** Ayni varyantin farkli lot'lari ve bakiyeleri
- **Yaslandirma Raporu:** Depoda 90+ gün kalan toplar

### 7.2 - Satis Raporlari
- **Satis Performansi:** Temsilci, müsteri, kategori, dönem bazli satis
- **Kârlilik Raporu:** Satis fiyati - Maliyet - Fire = Net Kâr (satir bazinda)
- **En Çok Satan Ürünler / Varyantlar**
- **Müsteri Bazli Satis Analizi**

### 7.3 - Finans Raporlari
- **Cari Bakiye Raporu:** Tüm müsterilerin/tedarikçilerin güncel bakiyeleri
- **Vade Analizi:** Vadesi geçmis alacaklar/borçlar
- **Nakit Akis Raporu:** Dönem bazli gelir-gider
- **Kur Farki Raporu:** Dövizli islemlerdeki kur fark kar/zarar

### 7.4 - Çoklu Sube Matris Raporu
Eski sistemdeki "Cross-Branch Matrix": Tüm ürünlerin yatayda subelere göre stok ve satis verilerinin yan yana matriste sunulmasi.

### 7.5 - Dinamik Pivot ve Favori Raporlar
Kullanicinin esnek filtre ve kolonlarla kendi raporlarini kurup kaydedebilmesi (bookmark).

### Kademe 7 - Frontend Yapisi

**Rota Yapisi:**
```
/reports/
├── inventory/                 # Stok raporlari
│   ├── stock-status           # Stok durum matrisi
│   ├── movements              # Hareket raporu
│   └── aging                  # Yaslandirma
├── sales/                     # Satis raporlari
│   ├── performance            # Satis performansi
│   ├── profitability          # Kârlilik
│   └── top-products           # En çok satanlar
├── finance/                   # Finans raporlari
│   ├── balances               # Cari bakiyeler
│   ├── aging                  # Vade analizi
│   └── cash-flow              # Nakit akis
├── matrix/                    # Çoklu sube matrisi
└── custom/                    # Kullanicinin kayitli raporlari
    └── /new                   # Yeni rapor olustur (pivot builder)
```

**i18n Dosyasi:** `reports.json`

---

## KADEME 8: Ileri Modüller (Post-MVP)

> *Her biri bagimsiz olarak sonradan eklenebilir.*

| # | Modül | Açiklama | Bagimlilik |
|---|-------|----------|-----------|
| 8.1 | **Üretim / BOM** | Reçete, üretim is emri, ham -> mamül dönüsümü | Kademe 4 (Stok) |
| 8.2 | **POS / Kasiyer Ekrani** | Perakende satis, yazarkasa entegrasyonu | Kademe 5 (Siparis) |
| 8.3 | **Marketplace Entegrasyonu** | Ozon, Wildberries, Yandex Market, Trendyol | Kademe 3 (PIM) + Kademe 5 |
| 8.4 | **IK & Bordro** | Personel, prim, mesai, izin yönetimi | Kademe 1 (Tanimlar) |
| 8.5 | **Bütçeleme & Planlama** | Satis hedefleri, stok planlama | Kademe 7 (Raporlama) |
| 8.6 | **Bildirim Sistemi** | In-App, Email, Push, SMS | Kademe 0 (Altyapi) |
| 8.7 | **Real-time (WebSocket)** | Canli stok güncelleme, çakisma önleme | Kademe 4 (Stok) |
| 8.8 | **El Terminali (TSG) Entegrasyonu** | Mobil barkod okuyucu destegi | Kademe 4 (Stok) |
| 8.9 | **Banka Entegrasyonu** | Otomatik ekstre çekme, ödeme eslestirme | Kademe 6 (Finans) |
| 8.10 | **Yönetim Muhasebesi** | Gider dagitimi, yönetimsel bilanço, sirketler arasi | Kademe 6 (Finans) |

---

## Uygulama Siralamasi (Önerilen Yol Haritasi)

```
KADEME 0  ─── i18n dönüsümü + UI kit + backend altyapi ──────── ~1 hafta
KADEME 1  ─── Temel tanimlar (7 tanim modülü) ────────────────── ~1.5 hafta
KADEME 2  ─── Is ortaklari (Partner, Cari, CRM) ──────────────── ~1 hafta
KADEME 3  ─── PIM genisleme + Dijital Kartela ────────────────── ~1.5 hafta
KADEME 4  ─── WMS / Stok (Dimensional Inventory) ─────────────── ~2 hafta
KADEME 5  ─── Siparis motoru (Satis + Satinalma) ─────────────── ~2 hafta
KADEME 6  ─── Belge akisi + Finans ───────────────────────────── ~2 hafta
KADEME 7  ─── Raporlama ──────────────────────────────────────── ~1.5 hafta
KADEME 8  ─── Ileri modüller ─────────────────────────────────── Sürekli
```

**Her kademe içindeki is sirasi:**
1. Backend Entity + Migration
2. Backend Service + Controller + DTO
3. Frontend Feature (types, api, hooks)
4. Frontend Pages (list, form, detail)
5. i18n dosyalari (TR + EN)
6. Test + Validasyon

---

## Notlar

## Test ve Kalite Güvence Stratejisi

> *Her kademenin kabul kriterlerinde test senaryolari zorunlu. Unit test + senaryo bazli test + tenant izolasyon testi.*

### Test Katmanlari

| Katman | Araç | Kapsam | Ne Zaman |
|--------|------|--------|----------|
| **Unit Test** | Jest (BE) + Vitest/Jest (FE) | Service metotlari, utility fonksiyonlar, hook'lar | Her service/hook yazildiginda |
| **Integration Test** | Jest + MikroORM test utils | Controller + Service + DB birlikte | Her endpoint yazildiginda |
| **Tenant Izolasyon Testi** | Jest | Tenant A verisi Tenant B'de görünmemeli | Her kademe sonunda |
| **Senaryo Testi** | Manuel/Otomatik checklist | Is akisi adim adim (ör: "Siparis olustur > Top tahsis et > Kes > Sevk et") | Her kademe sonunda |
| **E2E Test** | Playwright (ileride) | Tam kullanici akisi browser üzerinden | MVP sonrasi |

### Senaryo Bazli Test Yapisi

Her kademe için is senaryolari yazilir. Her senaryo su formatta:

```markdown
## Senaryo: [Senaryo Adi]
**Ön Kosullar:** [Sistemde olmasi gereken veriler]
**Aktör:** [Kim yapiyor: Tenant Admin / Satis Temsilcisi / Depo Sorumlusu]

### Adimlar:
1. [Islem] -> [Beklenen Sonuç] -> [Nereye Bakilir]
2. [Islem] -> [Beklenen Sonuç] -> [Nereye Bakilir]
...

### Tenant Izolasyon Kontrolü:
- [ ] Ayni islemi Tenant B ile yap, Tenant A verisini görmedigini dogrula

### Edge Case'ler:
- [Beklenmeyen durum ve beklenen davranis]
```

**Örnek Senaryo (Kademe 4):**
```markdown
## Senaryo: Mal Kabul ve Top Girisi
**Ön Kosullar:** Ürün "Kadife Perde" ve varyant "Kirmizi" tanimli, "Ana Depo" mevcut
**Aktör:** Depo Sorumlusu

### Adimlar:
1. WMS > Mal Kabul > Yeni tikla
   -> Mal kabul formu açilir
   -> Tedarikçi seçimi zorunlu

2. Tedarikçi "ABC Tekstil" seç, depo "Ana Depo" seç
   -> Form dolmaya hazir

3. Ürün satiri ekle: Varyant "Kirmizi Kadife", 3 top
   -> 3 satirlik top giris alani açilir (barkod, metraj, lot)

4. Toplari doldur: R001/50m/LOT-A, R002/45m/LOT-A, R003/52m/LOT-B
   -> Toplam 147m gösterilir

5. "Tamamla" tikla
   -> 3 adet InventoryItem olusur (status: IN_STOCK)
   -> 3 adet InventoryTransaction olusur (type: PURCHASE)
   -> Stok listesinde 3 yeni top görünür

### Tenant Izolasyon:
- [ ] Tenant B ile giris yap, stok listesinde R001/R002/R003 görünmüyor
- [ ] Tenant B'nin kendi mal kabul islemi Tenant A stogunu etkilemiyor

### Edge Case:
- Ayni barkod ile tekrar giris -> Hata: "Bu barkod zaten kayitli"
- Sifir metrajli top girisi -> Validasyon hatasi
- Tedarikçi seçmeden devam -> Validasyon hatasi
```

### Her Kademe Için Test Checklist (Kabul Kriterlerine Eklenir)

- [ ] Unit test'ler yazildi (service metotlari, ≥%80 coverage)
- [ ] Integration test'ler yazildi (controller endpoint'leri)
- [ ] Tenant izolasyon testi geçti
- [ ] Senaryo testi dokümani yazildi (`docs/test-scenarios/kademe-X/`)
- [ ] Senaryo adimlarinda "nereye bakilir" belirtildi
- [ ] Edge case'ler tanimlandi ve test edildi

### Senaryo Dokümanlari Klasör Yapisi

```
docs/test-scenarios/
├── kademe-0/
│   └── 00-tenant-izolasyon.md
├── kademe-1/
│   ├── 01-birim-tanimlari.md
│   ├── 02-para-birimi.md
│   └── ...
├── kademe-2/
│   ├── 01-partner-crud.md
│   └── 02-cari-hesap.md
├── kademe-3/
│   ├── 01-urun-olusturma-wizard.md
│   └── 02-dijital-kartela.md
├── kademe-4/
│   ├── 01-mal-kabul.md
│   ├── 02-top-kesim.md
│   ├── 03-stok-allocation.md
│   └── 04-fire-yonetimi.md
├── kademe-5/
│   ├── 01-satis-siparisi.md
│   ├── 02-rulo-secim.md
│   └── 03-satinalma.md
└── kademe-6/
    ├── 01-fatura-olusturma.md
    ├── 02-odeme-eslestirme.md
    └── 03-cari-ekstre.md
```

---

### Genel Kurallar
- Her modül kendi `module.ts` dosyasinda bagimsiz olmali (NestJS modüler yapi).
- API response'lari mevcut `TransformInterceptor` envelope formatini korumali.
- Frontend'de tüm sabit stringler `t()` ile çagrilmali, hardcoded Türkçe string olmamali.
- Her form Zod validation ile korunmali.
- Her liste sayfasi `QueryBuilderHelper` altyapisini kullanmali.

### Multi-Tenant Kurallari (Her Kademe Için Geçerli)
- **Entity hiyerarsisi:** Platform entity'ler `BaseEntity`'den, tenant entity'ler `BaseTenantEntity`'den, tanim entity'leri `BaseDefinitionEntity`'den türer.
- **Otomatik filtreleme:** MikroORM `@Filter('tenant')` tüm tenant entity'lerinde aktif. Manuel filtre YAZILMAZ.
- **Defense-in-depth:** Service katmaninda ek `TenantContext.getTenantId()` kontrolü (filtre bypass edilse bile güvenlik).
- **Composite unique:** Tenant-scoped unique alanlar (code, sku, barcode, orderNumber) `(tenant_id, field)` composite unique ile korunur.
- **Belge numaralari:** Siparis, fatura, irsaliye numaralari `TenantSequenceService` ile tenant-scoped auto-increment.
- **Onboarding:** Her kademe `TenantOnboardingService`'e kendi seed verisini ekler.
- **SuperAdmin:** Cross-tenant islemler için `filters: { tenant: false }` kullanilir, normal kullanicilar bu seçenege erisemez.
- **Cache izolasyonu:** Frontend React Query key'lerinde `tenantId` bulunur, tenant degisince cache invalidate edilir.
- **Test zorunlulugu:** Her kademe sonunda "Tenant A verisi Tenant B'de görünmüyor" izolasyon testi yapilir.
