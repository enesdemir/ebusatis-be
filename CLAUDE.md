# EBusatis Backend - AI Development Rules

## Proje Hakkinda
Tekstil sektorune ozel multi-tenant SaaS ERP/WMS/CRM. NestJS + MikroORM + PostgreSQL.
Master plan: `docs/master-plan-kademeli-gelistirme.md`

## Zorunlu Kurallar

### Multi-Tenant
- Tum tenant-scoped entity'ler `BaseTenantEntity`'den turemeli
- MikroORM `@Filter('tenant')` her tenant entity'sinde aktif olmali
- Service'lerde ek `TenantContext.getTenantId()` kontrolu (defense-in-depth)
- Tenant-scoped unique alanlar `(tenant_id, field)` composite unique kullanmali
- SuperAdmin cross-tenant islem disinda filtre asla devre disi birakilmamali

### Kod Yazim
- Her entity `BaseEntity`, `BaseTenantEntity` veya `BaseDefinitionEntity`'den turemeli
- Her controller endpoint'i uygun Guard ile korunmali (JwtAuthGuard, PermissionsGuard, TenantGuard)
- API response'lar `TransformInterceptor` envelope formatini korumali
- DTO'lar class-validator ile valide edilmeli
- Her service metodu icin unit test yazilmali

### Test Zorunluluklari
Her yeni feature icin:
1. **Unit test** - Service metotlari (Jest, ≥%80 coverage)
2. **Integration test** - Controller + DB (Jest + MikroORM test utils)
3. **Tenant izolasyon testi** - Tenant A verisi Tenant B'de gorunmemeli
4. **Senaryo dokumani** - `docs/test-scenarios/` altinda, adim adim:
   - On kosullar
   - Her adimda: islem -> beklenen sonuc -> nereye bakilir
   - Tenant izolasyon kontrolu
   - Edge case'ler

### i18n
- Hardcoded Turkce/Ingilizce string YASAK
- Tum mesajlar backend'den hata kodu olarak donmeli, frontend cevirecek
- Validation hata mesajlari da i18n destekli olmali

### Dosya Organizasyonu
```
src/modules/{module-name}/
├── {module-name}.module.ts
├── controllers/
├── services/
├── entities/
├── dto/
├── guards/ (varsa)
└── tests/
    ├── {service}.service.spec.ts
    └── {controller}.controller.spec.ts
```
