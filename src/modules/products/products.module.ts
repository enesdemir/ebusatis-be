import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Product, ProductVariant])],
  exports: [MikroOrmModule],
})
export class ProductsModule {}
