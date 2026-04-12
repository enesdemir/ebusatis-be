import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Tenant } from '../entities/tenant.entity';
import { DefinitionScope } from '../../../common/entities/base-definition.entity';

// Definition entities
import {
  UnitOfMeasure,
  UnitCategory,
} from '../../definitions/entities/unit-of-measure.entity';
import {
  Currency,
  CurrencyPosition,
} from '../../definitions/entities/currency.entity';
import { Category } from '../../definitions/entities/category.entity';
import {
  Warehouse,
  WarehouseType,
} from '../../definitions/entities/warehouse.entity';
import { TaxRate, TaxType } from '../../definitions/entities/tax-rate.entity';
import {
  StatusDefinition,
  StatusEntityType,
} from '../../definitions/entities/status-definition.entity';
import {
  PaymentMethod,
  PaymentMethodType,
} from '../../definitions/entities/payment-method.entity';
import {
  DeliveryMethod,
  DeliveryMethodType,
} from '../../definitions/entities/delivery-method.entity';

/**
 * Yeni tenant oluşturulduğunda varsayılan verileri seed eden servis.
 * Tüm seed veriler scope: SYSTEM_SEED olarak işaretlenir.
 */
@Injectable()
export class TenantOnboardingService {
  private readonly logger = new Logger(TenantOnboardingService.name);

  constructor(private readonly em: EntityManager) {}

  async onboardTenant(tenant: Tenant): Promise<void> {
    this.logger.log(
      `Tenant onboarding başlatıldı: ${tenant.name} (${tenant.id})`,
    );

    try {
      await this.seedUnits(tenant);
      await this.seedCurrencies(tenant);
      await this.seedCategories(tenant);
      await this.seedWarehouses(tenant);
      await this.seedTaxRates(tenant);
      await this.seedOrderStatuses(tenant);
      await this.seedPaymentMethods(tenant);
      await this.seedDeliveryMethods(tenant);

      await this.em.flush();
      this.logger.log(`Tenant onboarding tamamlandı: ${tenant.name}`);
    } catch (error) {
      this.logger.error(`Tenant onboarding hatası: ${tenant.name}`, error);
      throw error;
    }
  }

  // ─── 1.1 Birimler ────────────────────────────────────────

  private async seedUnits(tenant: Tenant): Promise<void> {
    const units = [
      {
        name: 'Metre',
        code: 'm',
        symbol: 'm',
        category: UnitCategory.LENGTH,
        decimalPrecision: 2,
        isBaseUnit: true,
        sortOrder: 0,
      },
      {
        name: 'Santimetre',
        code: 'cm',
        symbol: 'cm',
        category: UnitCategory.LENGTH,
        decimalPrecision: 1,
        baseConversionFactor: 0.01,
        sortOrder: 1,
      },
      {
        name: 'Yard',
        code: 'yd',
        symbol: 'yd',
        category: UnitCategory.LENGTH,
        decimalPrecision: 2,
        baseConversionFactor: 0.9144,
        sortOrder: 2,
      },
      {
        name: 'Kilogram',
        code: 'kg',
        symbol: 'kg',
        category: UnitCategory.WEIGHT,
        decimalPrecision: 2,
        isBaseUnit: true,
        sortOrder: 3,
      },
      {
        name: 'Gram',
        code: 'g',
        symbol: 'g',
        category: UnitCategory.WEIGHT,
        decimalPrecision: 0,
        baseConversionFactor: 0.001,
        sortOrder: 4,
      },
      {
        name: 'Adet',
        code: 'pcs',
        symbol: 'adet',
        category: UnitCategory.PIECE,
        decimalPrecision: 0,
        isBaseUnit: true,
        sortOrder: 5,
      },
      {
        name: 'Top',
        code: 'roll',
        symbol: 'top',
        category: UnitCategory.PIECE,
        decimalPrecision: 0,
        sortOrder: 6,
      },
      {
        name: 'Metrekare',
        code: 'm2',
        symbol: 'm²',
        category: UnitCategory.AREA,
        decimalPrecision: 2,
        isBaseUnit: true,
        sortOrder: 7,
      },
    ];

    for (const data of units) {
      const unit = this.em.create(UnitOfMeasure, {
        ...data,
        tenant,
        scope: DefinitionScope.SYSTEM_SEED,
      });
      this.em.persist(unit);
    }
  }

  // ─── 1.2 Para Birimleri ──────────────────────────────────

  private async seedCurrencies(tenant: Tenant): Promise<void> {
    const currencies = [
      {
        name: 'Türk Lirası',
        code: 'TRY',
        symbol: '₺',
        isDefault: true,
        position: CurrencyPosition.SUFFIX,
        sortOrder: 0,
      },
      {
        name: 'ABD Doları',
        code: 'USD',
        symbol: '$',
        position: CurrencyPosition.PREFIX,
        sortOrder: 1,
      },
      {
        name: 'Euro',
        code: 'EUR',
        symbol: '€',
        position: CurrencyPosition.PREFIX,
        sortOrder: 2,
      },
      {
        name: 'Rus Rublesi',
        code: 'RUB',
        symbol: '₽',
        position: CurrencyPosition.SUFFIX,
        sortOrder: 3,
      },
    ];

    for (const data of currencies) {
      const currency = this.em.create(Currency, {
        ...data,
        tenant,
        scope: DefinitionScope.SYSTEM_SEED,
      });
      this.em.persist(currency);
    }
  }

  // ─── 1.3 Kategoriler ─────────────────────────────────────

  private async seedCategories(tenant: Tenant): Promise<void> {
    const base = { tenant, scope: DefinitionScope.SYSTEM_SEED };

    const kumaslar = this.em.create(Category, {
      ...base,
      name: 'Kumaşlar',
      code: 'fabrics',
      icon: 'Scissors',
      sortOrder: 0,
      depth: 0,
    });
    this.em.persist(kumaslar);

    const perdelik = this.em.create(Category, {
      ...base,
      name: 'Perdelik',
      code: 'curtain',
      parent: kumaslar,
      icon: 'Blinds',
      sortOrder: 0,
      depth: 1,
    });
    const doseemelik = this.em.create(Category, {
      ...base,
      name: 'Döşemelik',
      code: 'upholstery',
      parent: kumaslar,
      icon: 'Sofa',
      sortOrder: 1,
      depth: 1,
    });
    this.em.persist(perdelik);
    this.em.persist(doseemelik);

    const fonPerde = this.em.create(Category, {
      ...base,
      name: 'Fon Perde',
      code: 'blackout',
      parent: perdelik,
      sortOrder: 0,
      depth: 2,
    });
    const tulPerde = this.em.create(Category, {
      ...base,
      name: 'Tül Perde',
      code: 'sheer',
      parent: perdelik,
      sortOrder: 1,
      depth: 2,
    });
    this.em.persist(fonPerde);
    this.em.persist(tulPerde);

    const aksesuar = this.em.create(Category, {
      ...base,
      name: 'Aksesuarlar',
      code: 'accessories',
      icon: 'Wrench',
      sortOrder: 1,
      depth: 0,
    });
    this.em.persist(aksesuar);
  }

  // ─── 1.4 Depolar ─────────────────────────────────────────

  private async seedWarehouses(tenant: Tenant): Promise<void> {
    const warehouse = this.em.create(Warehouse, {
      tenant,
      scope: DefinitionScope.SYSTEM_SEED,
      name: 'Ana Depo',
      code: 'main',
      type: WarehouseType.MAIN,
      isDefault: true,
      sortOrder: 0,
    });
    this.em.persist(warehouse);
  }

  // ─── 1.5 Vergi Oranları ──────────────────────────────────

  private async seedTaxRates(tenant: Tenant): Promise<void> {
    const rates = [
      {
        name: 'KDV %1',
        code: 'vat-1',
        rate: 1,
        type: TaxType.VAT,
        sortOrder: 0,
      },
      {
        name: 'KDV %10',
        code: 'vat-10',
        rate: 10,
        type: TaxType.VAT,
        sortOrder: 1,
      },
      {
        name: 'KDV %20',
        code: 'vat-20',
        rate: 20,
        type: TaxType.VAT,
        isDefault: true,
        sortOrder: 2,
      },
      {
        name: 'KDV Muaf',
        code: 'vat-exempt',
        rate: 0,
        type: TaxType.EXEMPT,
        sortOrder: 3,
      },
    ];

    for (const data of rates) {
      const taxRate = this.em.create(TaxRate, {
        ...data,
        tenant,
        scope: DefinitionScope.SYSTEM_SEED,
      });
      this.em.persist(taxRate);
    }
  }

  // ─── 1.6 Sipariş Durumları ───────────────────────────────

  private async seedOrderStatuses(tenant: Tenant): Promise<void> {
    const statuses = [
      {
        name: 'Taslak',
        code: 'draft',
        color: '#6B7280',
        isDefault: true,
        allowedTransitions: ['confirmed', 'cancelled'],
        sortOrder: 0,
      },
      {
        name: 'Onaylandı',
        code: 'confirmed',
        color: '#3B82F6',
        allowedTransitions: ['processing', 'cancelled'],
        sortOrder: 1,
      },
      {
        name: 'Hazırlanıyor',
        code: 'processing',
        color: '#F59E0B',
        allowedTransitions: ['shipped', 'cancelled'],
        sortOrder: 2,
      },
      {
        name: 'Sevk Edildi',
        code: 'shipped',
        color: '#8B5CF6',
        allowedTransitions: ['delivered'],
        sortOrder: 3,
      },
      {
        name: 'Teslim Edildi',
        code: 'delivered',
        color: '#10B981',
        isFinal: true,
        allowedTransitions: ['returned'],
        sortOrder: 4,
      },
      {
        name: 'İade',
        code: 'returned',
        color: '#EF4444',
        isFinal: true,
        allowedTransitions: [],
        sortOrder: 5,
      },
      {
        name: 'İptal',
        code: 'cancelled',
        color: '#EF4444',
        isFinal: true,
        allowedTransitions: [],
        sortOrder: 6,
      },
    ];

    for (const data of statuses) {
      const status = this.em.create(StatusDefinition, {
        ...data,
        entityType: StatusEntityType.ORDER,
        tenant,
        scope: DefinitionScope.SYSTEM_SEED,
      });
      this.em.persist(status);
    }
  }

  // ─── 1.7 Ödeme Yöntemleri ────────────────────────────────

  private async seedPaymentMethods(tenant: Tenant): Promise<void> {
    const methods = [
      {
        name: 'Nakit',
        code: 'cash',
        type: PaymentMethodType.CASH,
        icon: 'Banknote',
        sortOrder: 0,
      },
      {
        name: 'Banka Havalesi',
        code: 'bank-transfer',
        type: PaymentMethodType.BANK_TRANSFER,
        icon: 'Building2',
        requiresReference: true,
        sortOrder: 1,
      },
      {
        name: 'Kredi Kartı',
        code: 'credit-card',
        type: PaymentMethodType.CREDIT_CARD,
        icon: 'CreditCard',
        sortOrder: 2,
      },
      {
        name: 'Çek',
        code: 'check',
        type: PaymentMethodType.CHECK,
        icon: 'FileText',
        requiresReference: true,
        sortOrder: 3,
      },
      {
        name: 'Vadeli (30 Gün)',
        code: 'deferred-30',
        type: PaymentMethodType.DEFERRED,
        icon: 'Clock',
        defaultDueDays: 30,
        sortOrder: 4,
      },
      {
        name: 'Vadeli (60 Gün)',
        code: 'deferred-60',
        type: PaymentMethodType.DEFERRED,
        icon: 'Clock',
        defaultDueDays: 60,
        sortOrder: 5,
      },
    ];

    for (const data of methods) {
      const method = this.em.create(PaymentMethod, {
        ...data,
        tenant,
        scope: DefinitionScope.SYSTEM_SEED,
      });
      this.em.persist(method);
    }
  }

  // ─── 1.7 Teslimat Yöntemleri ─────────────────────────────

  private async seedDeliveryMethods(tenant: Tenant): Promise<void> {
    const methods = [
      {
        name: 'Kargo',
        code: 'cargo',
        type: DeliveryMethodType.CARGO,
        icon: 'Truck',
        estimatedDays: 3,
        sortOrder: 0,
      },
      {
        name: 'Müşteri Teslim Alacak',
        code: 'pickup',
        type: DeliveryMethodType.PICKUP,
        icon: 'MapPin',
        sortOrder: 1,
      },
      {
        name: 'Firma Aracı',
        code: 'own-vehicle',
        type: DeliveryMethodType.OWN_VEHICLE,
        icon: 'Car',
        sortOrder: 2,
      },
      {
        name: 'Kurye',
        code: 'courier',
        type: DeliveryMethodType.COURIER,
        icon: 'Bike',
        estimatedDays: 1,
        sortOrder: 3,
      },
      {
        name: 'Nakliye',
        code: 'freight',
        type: DeliveryMethodType.FREIGHT,
        icon: 'Container',
        estimatedDays: 7,
        sortOrder: 4,
      },
    ];

    for (const data of methods) {
      const method = this.em.create(DeliveryMethod, {
        ...data,
        tenant,
        scope: DefinitionScope.SYSTEM_SEED,
      });
      this.em.persist(method);
    }
  }
}
