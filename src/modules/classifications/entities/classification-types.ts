/**
 * Tum siniflandirma tipleri.
 * Her tip icin tek root node + altinda dugumler bulunur.
 */
export const ClassificationTypes = {
  // ── Urun & PIM ──
  PRODUCT_CATEGORY: 'PRODUCT_CATEGORY',
  FABRIC_TYPE: 'FABRIC_TYPE',
  COLOR_FAMILY: 'COLOR_FAMILY',
  COLLECTION: 'COLLECTION',
  QUALITY_GRADE: 'QUALITY_GRADE',

  // ── Olcu & Para ──
  UNIT_OF_MEASURE: 'UNIT_OF_MEASURE',
  CURRENCY: 'CURRENCY',

  // ── Ticari ──
  PAYMENT_METHOD: 'PAYMENT_METHOD',
  DELIVERY_METHOD: 'DELIVERY_METHOD',
  TAG: 'TAG',
  WAREHOUSE: 'WAREHOUSE',

  // ── Durum ──
  ORDER_STATUS: 'ORDER_STATUS',
  INVOICE_STATUS: 'INVOICE_STATUS',
  PURCHASE_STATUS: 'PURCHASE_STATUS',
  SHIPMENT_STATUS: 'SHIPMENT_STATUS',

  // ── Lokasyon (Platform-scoped, isSystem=true) ──
  REGION: 'REGION',
  SUBREGION: 'SUBREGION',
  COUNTRY: 'COUNTRY',
  STATE: 'STATE',
  CITY: 'CITY',
} as const;

export type ClassificationType = typeof ClassificationTypes[keyof typeof ClassificationTypes];

/**
 * Her tipin ait oldugu modul.
 */
export const ClassificationModules = {
  [ClassificationTypes.PRODUCT_CATEGORY]: 'pim',
  [ClassificationTypes.FABRIC_TYPE]: 'pim',
  [ClassificationTypes.COLOR_FAMILY]: 'pim',
  [ClassificationTypes.COLLECTION]: 'pim',
  [ClassificationTypes.QUALITY_GRADE]: 'pim',
  [ClassificationTypes.UNIT_OF_MEASURE]: 'definitions',
  [ClassificationTypes.CURRENCY]: 'definitions',
  [ClassificationTypes.PAYMENT_METHOD]: 'finance',
  [ClassificationTypes.DELIVERY_METHOD]: 'logistics',
  [ClassificationTypes.TAG]: 'common',
  [ClassificationTypes.WAREHOUSE]: 'wms',
  [ClassificationTypes.ORDER_STATUS]: 'orders',
  [ClassificationTypes.INVOICE_STATUS]: 'finance',
  [ClassificationTypes.PURCHASE_STATUS]: 'orders',
  [ClassificationTypes.SHIPMENT_STATUS]: 'logistics',
  [ClassificationTypes.REGION]: 'location',
  [ClassificationTypes.SUBREGION]: 'location',
  [ClassificationTypes.COUNTRY]: 'location',
  [ClassificationTypes.STATE]: 'location',
  [ClassificationTypes.CITY]: 'location',
} as const;
