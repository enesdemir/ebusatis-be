# Kademe 0: Multi-Tenant Izolasyon Test Senaryolari

## Senaryo 0.1: Tenant Context Middleware

**On Kosullar:** Iki tenant mevcut (Tenant A: "Alfa Tekstil", Tenant B: "Beta Kumas")
**Aktor:** Sistem

### Adimlar:
1. Tenant A kullanicisi ile login yap, token al
   -> JWT token'da `tenantId: A` bulunmali
   -> Nereye bakilir: `POST /auth/login` response body

2. `x-tenant-id: A` header'i ile `GET /definitions/units` cagir
   -> Sadece Tenant A'nin birimleri donmeli
   -> Nereye bakilir: Response body'deki tum kayitlarda `tenant.id === A`

3. `x-tenant-id: B` header'i ile ayni endpoint'i cagir (Tenant A token'i ile)
   -> Tenant B'nin verileri donmeli (veya erisim engellenmeli)
   -> Nereye bakilir: Response body

4. `x-tenant-id` header'i gondermeden `GET /definitions/units` cagir
   -> TenantGuard aktifse 403 donmeli
   -> Nereye bakilir: Response status code

### Tenant Izolasyon Kontrolu:
- [ ] Tenant A'nin birimleri Tenant B'de gorunmuyor
- [ ] Header olmadan tenant-scoped endpoint'e erisilemez
- [ ] MikroORM @Filter('tenant') otomatik WHERE ekliyor

### Edge Case'ler:
- Gecersiz tenant ID (UUID format degil) -> 400 Bad Request
- Silinmis tenant ID -> 404 veya 403
- SuperAdmin `filters: { tenant: false }` ile cross-tenant erisim -> Basarili

---

## Senaryo 0.2: Tenant Onboarding (Yeni Tenant Seed)

**On Kosullar:** SuperAdmin olarak giris yapilmis
**Aktor:** SuperAdmin

### Adimlar:
1. `POST /tenants` ile yeni tenant olustur: `{ name: "Test Firma", domain: "test", adminEmail: "admin@test.com" }`
   -> Tenant olusturuldu
   -> Nereye bakilir: Response'da tenant ID

2. Olusturulan tenant'a gecis yap (`x-tenant-id` ile)

3. `GET /definitions/units` cagir
   -> 8 varsayilan birim donmeli (m, cm, yd, kg, g, pcs, roll, m2)
   -> Nereye bakilir: Response body, `scope: "SYSTEM_SEED"`

4. `GET /definitions/currencies` cagir
   -> 4 varsayilan para birimi (TRY, USD, EUR, RUB)
   -> Nereye bakilir: TRY'nin `isDefault: true` olmali

5. `GET /definitions/categories/tree` cagir
   -> Agac yapisi: Kumaslar > Perdelik > Fon/Tul, Doseemelik + Aksesuarlar
   -> Nereye bakilir: Parent-child iliskisi dogru mu

6. `GET /definitions/tax-rates` cagir
   -> 4 vergi orani (KDV %1, %10, %20, Muaf)
   -> Nereye bakilir: KDV %20'nin `isDefault: true` olmali

7. `GET /definitions/statuses` cagir
   -> 7 siparis durumu (Taslak > Onay > Hazirlik > Sevk > Teslim > Iade > Iptal)
   -> Nereye bakilir: `allowedTransitions` dizileri dogru mu

8. `GET /definitions/payment-methods` + `GET /definitions/delivery-methods`
   -> 6 odeme + 5 teslimat yontemi
   -> Nereye bakilir: Tum kayitlarda `scope: "SYSTEM_SEED"`

### Kabul Kriterleri:
- [ ] Toplam 42 seed kayit olusturulmus
- [ ] Tum kayitlarin `scope` alani `SYSTEM_SEED`
- [ ] Tum kayitlarin `tenant` FK'si yeni tenant'a isaret ediyor
- [ ] Varsayilan isretlenmis kayitlar dogru (`isDefault: true`)
- [ ] Kategori agaci 3 seviye derinlikte

---

## Senaryo 0.3: BaseTenantEntity @Filter Testi

**On Kosullar:** Tenant A'da 3 urun, Tenant B'de 2 urun mevcut
**Aktor:** Tenant A kullanicisi

### Adimlar:
1. Tenant A context'inde `GET /products` cagir
   -> Sadece 3 urun donmeli
   -> Nereye bakilir: `data.length === 3`

2. Tenant B context'inde `GET /products` cagir
   -> Sadece 2 urun donmeli
   -> Nereye bakilir: `data.length === 2`

3. Tenant A'dan Tenant B'nin urun ID'si ile `GET /products/:id` cagir
   -> 404 donmeli (filter engeller)
   -> Nereye bakilir: Response status code

4. Tenant A'dan Tenant B'nin urun ID'si ile `PATCH /products/:id` cagir
   -> 404 donmeli
   -> Nereye bakilir: Response status code

5. Tenant A'dan Tenant B'nin urun ID'si ile `DELETE /products/:id` cagir
   -> 404 donmeli
   -> Nereye bakilir: Response status code

### Tenant Izolasyon:
- [ ] Okuma izolasyonu: Baska tenant'in verisi goruntulenemez
- [ ] Guncelleme izolasyonu: Baska tenant'in verisi duzenlenemez
- [ ] Silme izolasyonu: Baska tenant'in verisi silinemez
- [ ] ID tahmin edilse bile erisim engellenir (filter seviyesinde)

---

## Senaryo 0.4: QueryBuilderHelper Sayfalama Testi

**On Kosullar:** Tenant'ta 25 birim tanimi mevcut
**Aktor:** Tenant kullanicisi

### Adimlar:
1. `GET /definitions/units?page=1&limit=10` cagir
   -> 10 kayit + `meta: { total: 25, page: 1, limit: 10, totalPages: 3 }`
   -> Nereye bakilir: meta objesi

2. `GET /definitions/units?page=3&limit=10` cagir
   -> 5 kayit donmeli (son sayfa)
   -> Nereye bakilir: `data.length === 5`

3. `GET /definitions/units?search=metre` cagir
   -> Sadece "Metre" ve "Metrekare" donmeli
   -> Nereye bakilir: Arama sonuclari

4. `GET /definitions/units?sortBy=name&sortOrder=ASC` cagir
   -> Isme gore sirali donmeli
   -> Nereye bakilir: Ilk kayit A ile baslamali

### Edge Case'ler:
- page=0 -> Varsayilan page=1 donmeli
- limit=200 -> Max 100'e sinirlanmali (DTO validation)
- search="" (bos) -> Tum kayitlar donmeli
- Gecersiz sortBy alani -> Varsayilan createdAt kullanilmali
