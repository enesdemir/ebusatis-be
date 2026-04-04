import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { BaseDefinitionService } from '../../../common/services/base-definition.service';
import { Tag } from '../entities/tag.entity';

@Injectable()
export class TagService extends BaseDefinitionService<Tag> {
  constructor(em: EntityManager) {
    super(em, Tag, ['name', 'code']);
  }
}
