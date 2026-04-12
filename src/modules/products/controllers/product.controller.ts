import {
  Controller,
  UseGuards,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductService } from '../services/product.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  CreateVariantDto,
  UpdateVariantDto,
} from '../dto';

/**
 * Product controller.
 *
 * CLAUDE.md compliance:
 *   - JwtAuthGuard + TenantGuard on all endpoints.
 *   - Every @Body / @Query uses a class-validator DTO.
 *   - Errors returned as error code + i18n key by the service.
 */
@Controller('products')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // ── Product CRUD ──

  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.productService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  // ── Variants ──

  @Get(':id/variants')
  getVariants(@Param('id') productId: string) {
    return this.productService.getVariants(productId);
  }

  @Post(':id/variants')
  createVariant(@Param('id') productId: string, @Body() dto: CreateVariantDto) {
    return this.productService.createVariant(productId, dto);
  }

  @Patch('variants/:variantId')
  updateVariant(
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.productService.updateVariant(variantId, dto);
  }

  @Delete('variants/:variantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeVariant(@Param('variantId') variantId: string) {
    return this.productService.removeVariant(variantId);
  }
}
