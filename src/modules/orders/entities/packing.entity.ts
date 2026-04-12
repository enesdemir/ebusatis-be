import {
  Entity,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
  Enum,
  Index,
} from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Picking } from './picking.entity';
import { User } from '../../users/entities/user.entity';

export enum PackingStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * Packing (Paketleme)
 *
 * One Packing header per Picking. The header groups PackingBoxes;
 * each box contains one or more PickingLines.
 */
@Entity({ tableName: 'packings' })
export class Packing extends BaseTenantEntity {
  @Property()
  @Index()
  packingNumber!: string; // "PK-PACK-2026-0001"

  @ManyToOne(() => Picking)
  @Index()
  picking!: Picking;

  @Enum(() => PackingStatus)
  status: PackingStatus = PackingStatus.PENDING;

  @ManyToOne(() => User, { nullable: true })
  packer?: User;

  @Property({ nullable: true, type: 'datetime' })
  startedAt?: Date;

  @Property({ nullable: true, type: 'datetime' })
  completedAt?: Date;

  @Property({ nullable: true, type: 'text' })
  notes?: string;

  @OneToMany('PackingBox', 'packing')
  boxes = new Collection<object>(this);
}
