import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

// Entities
import { UnitOfMeasure } from './entities/unit-of-measure.entity';
import { Currency } from './entities/currency.entity';
import { ExchangeRate } from './entities/exchange-rate.entity';
import { Category } from './entities/category.entity';
import { Warehouse } from './entities/warehouse.entity';
import { WarehouseLocation } from './entities/warehouse-location.entity';
import { TaxRate } from './entities/tax-rate.entity';
import { Tag } from './entities/tag.entity';
import { StatusDefinition } from './entities/status-definition.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { DeliveryMethod } from './entities/delivery-method.entity';

// Services
import { UnitOfMeasureService } from './services/unit-of-measure.service';
import { CurrencyService } from './services/currency.service';
import { CategoryService } from './services/category.service';
import { WarehouseService } from './services/warehouse.service';
import { TaxRateService } from './services/tax-rate.service';
import { TagService } from './services/tag.service';
import { StatusDefinitionService } from './services/status-definition.service';
import { PaymentMethodService } from './services/payment-method.service';
import { DeliveryMethodService } from './services/delivery-method.service';
import { WarehouseLocationService } from './services/warehouse-location.service';
import { WarehouseLocationController } from './controllers/warehouse-location.controller';
import { ExchangeRateService } from './services/exchange-rate.service';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';

// Controllers
import { UnitOfMeasureController } from './controllers/unit-of-measure.controller';
import { CurrencyController } from './controllers/currency.controller';
import { CategoryController } from './controllers/category.controller';
import { WarehouseController } from './controllers/warehouse.controller';
import { TaxRateController } from './controllers/tax-rate.controller';
import { TagController } from './controllers/tag.controller';
import { StatusDefinitionController } from './controllers/status-definition.controller';
import { PaymentMethodController } from './controllers/payment-method.controller';
import { DeliveryMethodController } from './controllers/delivery-method.controller';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      UnitOfMeasure,
      Currency,
      ExchangeRate,
      Category,
      Warehouse,
      WarehouseLocation,
      TaxRate,
      Tag,
      StatusDefinition,
      PaymentMethod,
      DeliveryMethod,
      InventoryItem,
    ]),
    AuthModule,
  ],
  controllers: [
    UnitOfMeasureController,
    CurrencyController,
    CategoryController,
    WarehouseController,
    TaxRateController,
    TagController,
    StatusDefinitionController,
    PaymentMethodController,
    DeliveryMethodController,
    WarehouseLocationController,
  ],
  providers: [
    UnitOfMeasureService,
    CurrencyService,
    CategoryService,
    WarehouseService,
    TaxRateService,
    TagService,
    StatusDefinitionService,
    PaymentMethodService,
    DeliveryMethodService,
    WarehouseLocationService,
    ExchangeRateService,
  ],
  exports: [
    MikroOrmModule,
    UnitOfMeasureService,
    CurrencyService,
    CategoryService,
    WarehouseService,
    TaxRateService,
    TagService,
    StatusDefinitionService,
    PaymentMethodService,
    DeliveryMethodService,
    WarehouseLocationService,
    ExchangeRateService,
  ],
})
export class DefinitionsModule {}
