import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Tenant } from '../entities/tenant.entity';

/**
 * Yeni tenant oluşturulduğunda varsayılan verileri seed eden servis.
 *
 * Her kademe kendi seed metodunu bu servise ekler:
 * - Kademe 1: seedDefinitions() → Birimler, para birimleri, kategoriler, depolar, vergi oranları, durumlar, ödeme/teslimat yöntemleri
 * - Kademe 2: (boş - partner verisi tenant tarafından girilir)
 * - Kademe 3: seedCategories() → Örnek kategori ağacı
 * - Kademe 4: seedWarehouses() → Varsayılan depo
 *
 * Tüm seed veriler scope: SYSTEM_SEED olarak işaretlenir.
 * Tenant bu verileri düzenleyebilir/silebilir.
 */
@Injectable()
export class TenantOnboardingService {
  private readonly logger = new Logger(TenantOnboardingService.name);

  constructor(private readonly em: EntityManager) {}

  /**
   * Yeni tenant için tüm varsayılan verileri oluşturur.
   * TenantsService.create() içinden çağrılır.
   */
  async onboardTenant(tenant: Tenant): Promise<void> {
    this.logger.log(`Tenant onboarding başlatıldı: ${tenant.name} (${tenant.id})`);

    try {
      // Kademe 1: Temel tanımlar (ileride her kademe kendi seed'ini ekleyecek)
      // await this.seedUnits(tenant);
      // await this.seedCurrencies(tenant);
      // await this.seedTaxRates(tenant);
      // await this.seedStatuses(tenant);
      // await this.seedPaymentMethods(tenant);
      // await this.seedDeliveryMethods(tenant);

      // Kademe 3: Kategoriler
      // await this.seedCategories(tenant);

      // Kademe 4: Depolar
      // await this.seedWarehouses(tenant);

      await this.em.flush();
      this.logger.log(`Tenant onboarding tamamlandı: ${tenant.name}`);
    } catch (error) {
      this.logger.error(`Tenant onboarding hatası: ${tenant.name}`, error);
      throw error;
    }
  }

  // ──────────────────────────────────────────────────────────
  // Kademe 1'de doldurulacak seed metotları (şimdilik placeholder)
  // ──────────────────────────────────────────────────────────

  // Her yeni kademe burada kendi seed metodunu implement edecek.
  // Örnek:
  //
  // private async seedUnits(tenant: Tenant): Promise<void> {
  //   const units = [
  //     { name: 'Metre', code: 'm', category: 'LENGTH', symbol: 'm', ... },
  //     { name: 'Kilogram', code: 'kg', category: 'WEIGHT', symbol: 'kg', ... },
  //   ];
  //   for (const unit of units) {
  //     const entity = new UnitOfMeasure();
  //     Object.assign(entity, { ...unit, tenant, scope: DefinitionScope.SYSTEM_SEED });
  //     this.em.persist(entity);
  //   }
  // }
}
