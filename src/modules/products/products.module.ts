import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { Attribute } from './entities/attribute.entity';
import { ProductAttributeValue } from './entities/product-attribute-value.entity';
import { ProductVariantAttributeValue } from './entities/product-variant-attribute-value.entity';
import { DigitalCatalog } from './entities/digital-catalog.entity';
import { DigitalCatalogItem } from './entities/digital-catalog-item.entity';
import { SupplierPriceList } from './entities/supplier-price-list.entity';
import { SupplierPriceListItem } from './entities/supplier-price-list-item.entity';
import { ProductCollection } from './entities/product-collection.entity';
import { PhysicalSample } from './entities/physical-sample.entity';
import { SampleLoanHistory } from './entities/sample-loan-history.entity';

import { AttributesController } from './controllers/attributes.controller';
import { ProductController } from './controllers/product.controller';
import { AttributesService } from './services/attributes.service';
import { ProductService } from './services/product.service';

import { AuthModule } from '../auth/auth.module';

/**
 * Products module.
 *
 * Stage 0.C additions:
 * - ProductCollection entity (replaces the loose collectionName string)
 * - PhysicalSample + SampleLoanHistory (kartela tracking)
 * - ProductVariant.productionStatus enum
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([
      Product,
      ProductVariant,
      Attribute,
      ProductAttributeValue,
      ProductVariantAttributeValue,
      DigitalCatalog,
      DigitalCatalogItem,
      SupplierPriceList,
      SupplierPriceListItem,
      ProductCollection,
      PhysicalSample,
      SampleLoanHistory,
    ]),
    AuthModule,
  ],
  controllers: [AttributesController, ProductController],
  providers: [AttributesService, ProductService],
  exports: [MikroOrmModule, AttributesService, ProductService],
})
export class ProductsModule {}
