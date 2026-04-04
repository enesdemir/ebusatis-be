import { Controller, UseGuards } from '@nestjs/common';
import { BaseDefinitionController } from '../../../common/controllers/base-definition.controller';
import { Tag } from '../entities/tag.entity';
import { TagService } from '../services/tag.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';

@Controller('definitions/tags')
@UseGuards(JwtAuthGuard, TenantGuard)
export class TagController extends BaseDefinitionController<Tag> {
  constructor(private readonly tagService: TagService) {
    super(tagService);
  }
}
