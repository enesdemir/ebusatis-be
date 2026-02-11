import { Entity, Property, Enum } from '@mikro-orm/core';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum ConfigCategory {
  GENERAL = 'GENERAL',
  SECURITY = 'SECURITY',
  NOTIFICATIONS = 'NOTIFICATIONS',
  BILLING = 'BILLING',
}

@Entity({ tableName: 'platform_configs' })
export class PlatformConfig extends BaseEntity {
  @Property({ unique: true })
  key: string;

  @Property({ type: 'text' })
  value: string;

  @Enum(() => ConfigCategory)
  category: ConfigCategory = ConfigCategory.GENERAL;

  @Property({ nullable: true })
  description?: string;

  @Property({ default: 'string' })
  valueType: string = 'string';

  constructor(key: string, value: string) {
    super();
    this.key = key;
    this.value = value;
  }
}
