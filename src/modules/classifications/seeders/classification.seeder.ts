import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { ClassificationNode } from '../entities/classification-node.entity';
import { ClassificationTypes } from '../entities/classification-types';
import * as countriesData from './data/countries.json';
import * as statesData from './data/states.json';
import * as turkeyData from './data/turkey.json';

interface NodeSeed {
  code: string;
  names: Record<string, string>;
  properties?: Record<string, any>;
  icon?: string;
  color?: string;
  selectable?: boolean;
  children?: NodeSeed[];
}

export class ClassificationSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const existing = await em.count(ClassificationNode, {});
    if (existing > 0) {
      console.log(`ClassificationSeeder: ${existing} nodes already exist — skipping.`);
      return;
    }

    console.log('ClassificationSeeder: Starting...');

    // ── Tekstil tanimlari ──
    await this.seedTextileData(em);

    // ── Lokasyon verileri (platform-scoped, tenant=null) ──
    await this.seedCountries(em);
    await this.seedStates(em);
    await this.seedTurkeyCities(em);

    await em.flush();
    console.log('ClassificationSeeder: Done!');
  }

  // ════════════════════════════════════════════════════════
  //  TEKSTIL TANIMLARI
  // ════════════════════════════════════════════════════════

  private async seedTextileData(em: EntityManager): Promise<void> {
    // ── Urun Kategorileri (AGAC) ──
    await this.seedType(em, ClassificationTypes.PRODUCT_CATEGORY, 'pim', [
      { code: 'KUMASLAR', names: { tr: 'Kumaşlar', en: 'Fabrics' }, icon: 'Shirt', selectable: false, children: [
        { code: 'PERDELIK', names: { tr: 'Perdelik', en: 'Curtain Fabrics' }, icon: 'Blinds', color: '#8B5CF6', children: [
          { code: 'FON_PERDE', names: { tr: 'Fon Perde', en: 'Blackout Curtain' } },
          { code: 'TUL_PERDE', names: { tr: 'Tül Perde', en: 'Sheer Curtain' } },
          { code: 'STOR_PERDE', names: { tr: 'Stor Perde', en: 'Roller Blind' } },
        ]},
        { code: 'DOSEMELIK', names: { tr: 'Döşemelik', en: 'Upholstery' }, icon: 'Sofa', color: '#F59E0B', children: [
          { code: 'KOLTUK', names: { tr: 'Koltuk Kumaşı', en: 'Sofa Fabric' } },
          { code: 'YASTIK', names: { tr: 'Yastık Kumaşı', en: 'Cushion Fabric' } },
        ]},
        { code: 'AKSESUARLAR', names: { tr: 'Aksesuarlar', en: 'Accessories' }, icon: 'Scissors', color: '#EC4899', children: [
          { code: 'BANT_SERIT', names: { tr: 'Bant / Şerit', en: 'Tape / Band' } },
          { code: 'KORNIS', names: { tr: 'Korniş', en: 'Curtain Rod' } },
          { code: 'KLIPS', names: { tr: 'Klips', en: 'Clip' } },
        ]},
      ]},
    ]);

    // ── Birimler ──
    await this.seedType(em, ClassificationTypes.UNIT_OF_MEASURE, 'definitions', [
      { code: 'M', names: { tr: 'Metre', en: 'Meter' }, properties: { symbol: 'm', category: 'LENGTH', baseConversionFactor: 1, decimalPrecision: 2, isBaseUnit: true } },
      { code: 'CM', names: { tr: 'Santimetre', en: 'Centimeter' }, properties: { symbol: 'cm', category: 'LENGTH', baseConversionFactor: 0.01, decimalPrecision: 0 } },
      { code: 'KG', names: { tr: 'Kilogram', en: 'Kilogram' }, properties: { symbol: 'kg', category: 'WEIGHT', baseConversionFactor: 1, decimalPrecision: 2, isBaseUnit: true } },
      { code: 'G', names: { tr: 'Gram', en: 'Gram' }, properties: { symbol: 'g', category: 'WEIGHT', baseConversionFactor: 0.001, decimalPrecision: 0 } },
      { code: 'YD', names: { tr: 'Yard', en: 'Yard' }, properties: { symbol: 'yd', category: 'LENGTH', baseConversionFactor: 0.9144, decimalPrecision: 2 } },
      { code: 'PCS', names: { tr: 'Adet', en: 'Piece' }, properties: { symbol: 'adet', category: 'PIECE', baseConversionFactor: 1, decimalPrecision: 0, isBaseUnit: true } },
      { code: 'ROLL', names: { tr: 'Top', en: 'Roll' }, properties: { symbol: 'top', category: 'PIECE', baseConversionFactor: 1, decimalPrecision: 0 } },
      { code: 'M2', names: { tr: 'Metrekare', en: 'Square Meter' }, properties: { symbol: 'm²', category: 'AREA', baseConversionFactor: 1, decimalPrecision: 2, isBaseUnit: true } },
    ]);

    // ── Para Birimleri ──
    await this.seedType(em, ClassificationTypes.CURRENCY, 'definitions', [
      { code: 'TRY', names: { tr: 'Türk Lirası', en: 'Turkish Lira' }, properties: { symbol: '₺', decimalPlaces: 2, position: 'SUFFIX', isDefault: true } },
      { code: 'USD', names: { tr: 'ABD Doları', en: 'US Dollar' }, properties: { symbol: '$', decimalPlaces: 2, position: 'PREFIX' } },
      { code: 'EUR', names: { tr: 'Euro', en: 'Euro' }, properties: { symbol: '€', decimalPlaces: 2, position: 'PREFIX' } },
      { code: 'GBP', names: { tr: 'İngiliz Sterlini', en: 'British Pound' }, properties: { symbol: '£', decimalPlaces: 2, position: 'PREFIX' } },
      { code: 'RUB', names: { tr: 'Rus Rublesi', en: 'Russian Ruble' }, properties: { symbol: '₽', decimalPlaces: 2, position: 'SUFFIX' } },
    ]);

    // ── Odeme Yontemleri ──
    await this.seedType(em, ClassificationTypes.PAYMENT_METHOD, 'finance', [
      { code: 'CASH', names: { tr: 'Nakit', en: 'Cash' }, icon: 'Banknote', properties: { type: 'CASH', requiresReference: false } },
      { code: 'BANK_TRANSFER', names: { tr: 'Banka Havalesi', en: 'Bank Transfer' }, icon: 'Building', properties: { type: 'BANK_TRANSFER', requiresReference: true } },
      { code: 'CREDIT_CARD', names: { tr: 'Kredi Kartı', en: 'Credit Card' }, icon: 'CreditCard', properties: { type: 'CREDIT_CARD', requiresReference: true } },
      { code: 'CHECK', names: { tr: 'Çek', en: 'Check' }, icon: 'FileText', properties: { type: 'CHECK', requiresReference: true } },
      { code: 'DEFERRED_30', names: { tr: 'Vadeli (30 gün)', en: 'Deferred (30 days)' }, properties: { type: 'DEFERRED', requiresReference: false, defaultDueDays: 30 } },
      { code: 'DEFERRED_60', names: { tr: 'Vadeli (60 gün)', en: 'Deferred (60 days)' }, properties: { type: 'DEFERRED', requiresReference: false, defaultDueDays: 60 } },
    ]);

    // ── Teslimat Yontemleri ──
    await this.seedType(em, ClassificationTypes.DELIVERY_METHOD, 'logistics', [
      { code: 'CARGO', names: { tr: 'Kargo', en: 'Cargo' }, icon: 'Truck', properties: { type: 'CARGO', estimatedDays: 3 } },
      { code: 'PICKUP', names: { tr: 'Müşteri Teslim Alacak', en: 'Customer Pickup' }, icon: 'Store', properties: { type: 'PICKUP', estimatedDays: 0 } },
      { code: 'OWN_VEHICLE', names: { tr: 'Firma Aracı', en: 'Own Vehicle' }, icon: 'Car', properties: { type: 'OWN_VEHICLE', estimatedDays: 1 } },
      { code: 'COURIER', names: { tr: 'Kurye', en: 'Courier' }, icon: 'Bike', properties: { type: 'COURIER', estimatedDays: 1 } },
      { code: 'FREIGHT', names: { tr: 'Nakliye', en: 'Freight' }, icon: 'Container', properties: { type: 'FREIGHT', estimatedDays: 7 } },
    ]);

    // ── Etiketler ──
    await this.seedType(em, ClassificationTypes.TAG, 'common', [
      { code: 'NEW_SEASON', names: { tr: 'Yeni Sezon', en: 'New Season' }, color: '#22C55E', properties: { entityTypes: ['PRODUCT', 'ORDER'] } },
      { code: 'CAMPAIGN', names: { tr: 'Kampanya', en: 'Campaign' }, color: '#EF4444', properties: { entityTypes: ['PRODUCT', 'ORDER'] } },
      { code: 'VIP', names: { tr: 'VIP Müşteri', en: 'VIP Customer' }, color: '#F59E0B', properties: { entityTypes: ['PARTNER'] } },
      { code: 'URGENT', names: { tr: 'Acil', en: 'Urgent' }, color: '#DC2626', properties: { entityTypes: ['ORDER', 'PARTNER'] } },
    ]);

    // ── Siparis Durumlari ──
    await this.seedType(em, ClassificationTypes.ORDER_STATUS, 'orders', [
      { code: 'DRAFT', names: { tr: 'Taslak', en: 'Draft' }, color: '#9CA3AF', properties: { isDefault: true, isFinal: false, allowedTransitions: ['CONFIRMED', 'CANCELLED'] } },
      { code: 'CONFIRMED', names: { tr: 'Onaylandı', en: 'Confirmed' }, color: '#3B82F6', properties: { isFinal: false, allowedTransitions: ['PROCESSING', 'CANCELLED'] } },
      { code: 'PROCESSING', names: { tr: 'Hazırlanıyor', en: 'Processing' }, color: '#F59E0B', properties: { isFinal: false, allowedTransitions: ['SHIPPED', 'CANCELLED'] } },
      { code: 'SHIPPED', names: { tr: 'Sevk Edildi', en: 'Shipped' }, color: '#8B5CF6', properties: { isFinal: false, allowedTransitions: ['DELIVERED'] } },
      { code: 'DELIVERED', names: { tr: 'Teslim Edildi', en: 'Delivered' }, color: '#22C55E', properties: { isFinal: true, allowedTransitions: ['RETURNED'] } },
      { code: 'CANCELLED', names: { tr: 'İptal', en: 'Cancelled' }, color: '#EF4444', properties: { isFinal: true, allowedTransitions: [] } },
    ]);

    // ── Fatura Durumlari ──
    await this.seedType(em, ClassificationTypes.INVOICE_STATUS, 'finance', [
      { code: 'DRAFT', names: { tr: 'Taslak', en: 'Draft' }, color: '#9CA3AF', properties: { isDefault: true, isFinal: false } },
      { code: 'ISSUED', names: { tr: 'Kesildi', en: 'Issued' }, color: '#3B82F6', properties: { isFinal: false } },
      { code: 'PARTIALLY_PAID', names: { tr: 'Kısmen Ödendi', en: 'Partially Paid' }, color: '#F59E0B', properties: { isFinal: false } },
      { code: 'PAID', names: { tr: 'Ödendi', en: 'Paid' }, color: '#22C55E', properties: { isFinal: true } },
      { code: 'OVERDUE', names: { tr: 'Vadesi Geçmiş', en: 'Overdue' }, color: '#EF4444', properties: { isFinal: false } },
      { code: 'CANCELLED', names: { tr: 'İptal', en: 'Cancelled' }, color: '#EF4444', properties: { isFinal: true } },
    ]);

    console.log('  ✓ Textile definitions seeded');
  }

  // ════════════════════════════════════════════════════════
  //  LOKASYON VERILERI
  // ════════════════════════════════════════════════════════

  private async seedCountries(em: EntityManager): Promise<void> {
    const countries = countriesData as any[];
    for (const c of countries) {
      const node = new ClassificationNode(
        ClassificationTypes.COUNTRY,
        'location',
        c.iso2,
        { tr: c.translations?.tr || c.name, en: c.name, native: c.native || c.name },
      );
      node.path = `country.${c.iso2.toLowerCase()}`;
      node.depth = 0;
      node.isSystem = true;
      node.isRoot = false;
      node.icon = c.emoji || undefined;
      node.properties = {
        iso2: c.iso2,
        iso3: c.iso3,
        numericCode: c.numeric_code,
        phonecode: c.phonecode,
        currency: c.currency,
        currencyName: c.currency_name,
        currencySymbol: c.currency_symbol,
        region: c.region,
        subregion: c.subregion,
        latitude: c.latitude,
        longitude: c.longitude,
        emoji: c.emoji,
        postalCodeFormat: c.postal_code_format,
      };
      em.persist(node);
    }
    console.log(`  ✓ ${countries.length} countries seeded`);
  }

  private async seedStates(em: EntityManager): Promise<void> {
    const states = statesData as any[];
    // Once ulke node'larini bul
    const countryNodes = await em.find(ClassificationNode, { classificationType: ClassificationTypes.COUNTRY });
    const countryMap = new Map(countryNodes.map((n) => [n.code, n]));

    for (const s of states) {
      const parentCountry = countryMap.get(s.country_code);
      if (!parentCountry) continue;

      const stateCode = `${s.country_code}-${s.iso2 || s.id}`;
      const node = new ClassificationNode(
        ClassificationTypes.STATE,
        'location',
        stateCode,
        { tr: s.translations?.tr || s.name, en: s.name, native: s.native || s.name },
      );
      node.parent = parentCountry;
      node.path = `${parentCountry.path}.${(s.iso2 || String(s.id)).toLowerCase()}`;
      node.depth = 1;
      node.isSystem = true;
      node.properties = {
        iso2: s.iso2,
        iso3166_2: s.iso3166_2 || `${s.country_code}-${s.iso2}`,
        type: s.type,
        latitude: s.latitude,
        longitude: s.longitude,
        timezone: s.timezone,
        countryCode: s.country_code,
        sourceId: s.id,
      };
      em.persist(node);
    }
    // Flush countries + states
    await em.flush();
    console.log(`  ✓ ${states.length} states seeded`);
  }

  private async seedTurkeyCities(em: EntityManager): Promise<void> {
    const turkey = turkeyData as any;
    const trStates = turkey.states || [];

    // Turkiye state node'larini bul
    const stateNodes = await em.find(ClassificationNode, {
      classificationType: ClassificationTypes.STATE,
      code: { $like: 'TR-%' },
    });
    const stateMap = new Map(stateNodes.map((n) => [n.properties?.sourceId, n]));

    let cityCount = 0;
    for (const state of trStates) {
      const parentState = stateMap.get(state.id);
      if (!parentState) continue;

      for (const city of (state.cities || [])) {
        const cityCode = `TR-${state.iso2}-${city.id}`;
        const node = new ClassificationNode(
          ClassificationTypes.CITY,
          'location',
          cityCode,
          { tr: city.translations?.tr || city.name, en: city.name, native: city.native || city.name },
        );
        node.parent = parentState;
        node.path = `${parentState.path}.${String(city.id)}`;
        node.depth = 2;
        node.isSystem = true;
        node.properties = {
          latitude: city.latitude,
          longitude: city.longitude,
          timezone: city.timezone,
          sourceId: city.id,
        };
        em.persist(node);
        cityCount++;
      }
    }
    await em.flush();
    console.log(`  ✓ ${cityCount} Turkey cities seeded`);
  }

  // ════════════════════════════════════════════════════════
  //  HELPERS
  // ════════════════════════════════════════════════════════

  private async seedType(
    em: EntityManager,
    classificationType: string,
    module: string,
    items: NodeSeed[],
    parent?: ClassificationNode,
  ): Promise<void> {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const codeSlug = item.code.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const path = parent
        ? `${parent.path}.${codeSlug}`
        : `${classificationType.toLowerCase()}.${codeSlug}`;

      const node = new ClassificationNode(classificationType, module, item.code, item.names);
      node.path = path;
      node.depth = parent ? parent.depth + 1 : 0;
      node.parent = parent;
      node.icon = item.icon;
      node.color = item.color;
      node.properties = item.properties;
      node.selectable = item.selectable ?? true;
      node.isSystem = true;
      node.sortOrder = i;
      em.persist(node);

      if (item.children?.length) {
        await this.seedType(em, classificationType, module, item.children, node);
      }
    }
  }
}
