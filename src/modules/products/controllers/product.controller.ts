import { Controller, UseGuards, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ProductService } from '../services/product.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';

@Controller('products')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // ─── Product CRUD ─────────────────────────────────────────

  @Get()
  async findAll(@Query() query: PaginatedQueryDto & { categoryId?: string }) {
    return this.productService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Post()
  async create(@Body() data: any) {
    return this.productService.create(data);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.productService.update(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  // ─── Variants ─────────────────────────────────────────────

  @Get(':id/variants')
  async getVariants(@Param('id') productId: string) {
    return this.productService.getVariants(productId);
  }

  @Post(':id/variants')
  async createVariant(@Param('id') productId: string, @Body() data: any) {
    return this.productService.createVariant(productId, data);
  }

  @Patch('variants/:variantId')
  async updateVariant(@Param('variantId') variantId: string, @Body() data: any) {
    return this.productService.updateVariant(variantId, data);
  }

  @Delete('variants/:variantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeVariant(@Param('variantId') variantId: string) {
    return this.productService.removeVariant(variantId);
  }
}
