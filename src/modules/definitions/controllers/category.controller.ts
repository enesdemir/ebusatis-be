import { Controller, UseGuards, Get } from '@nestjs/common';
import { BaseDefinitionController } from '../../../common/controllers/base-definition.controller';
import { Category } from '../entities/category.entity';
import { CategoryService } from '../services/category.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';

@Controller('definitions/categories')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CategoryController extends BaseDefinitionController<Category> {
  constructor(private readonly categoryService: CategoryService) {
    super(categoryService);
  }

  @Get('tree')
  async getTree() {
    return this.categoryService.findTree();
  }
}
