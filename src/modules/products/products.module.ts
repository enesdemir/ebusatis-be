import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { Attribute } from './entities/attribute.entity';
import { ProductAttributeValue } from './entities/product-attribute-value.entity';
import { ProductVariantAttributeValue } from './entities/product-variant-attribute-value.entity';
import { AttributesController } from './controllers/attributes.controller';
import { AttributesService } from './services/attributes.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      Product, 
      ProductVariant, 
      Attribute, 
      ProductAttributeValue, 
      ProductVariantAttributeValue
    ])
  ],
  controllers: [AttributesController],
  providers: [AttributesService],
  exports: [MikroOrmModule, AttributesService],
})
export class ProductsModule {}
