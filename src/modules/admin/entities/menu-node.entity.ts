import { Entity, Property, ManyToOne, OneToMany, Collection, Enum } from '@mikro-orm/core';
import { BaseEntity } from '../../../common/entities/base.entity';

/** Which audience the menu node is visible to */
export enum MenuScope {
  PLATFORM = 'PLATFORM',
  TENANT = 'TENANT',
  BOTH = 'BOTH',
}

@Entity({ tableName: 'menu_nodes' })
export class MenuNode extends BaseEntity {
  /** Unique code for referencing (e.g. 'dashboard', 'settings.users') */
  @Property({ unique: true })
  code: string;

  /** Human readable label shown in the sidebar */
  @Property()
  label: string;

  /** Lucide icon name (e.g. 'LayoutDashboard', 'Users') */
  @Property({ nullable: true })
  icon?: string;

  /** Route path – if null this is a parent-only node */
  @Property({ nullable: true })
  path?: string;

  /** Sort order among siblings */
  @Property({ default: 0 })
  sortOrder: number = 0;

  /** Who can see this menu item */
  @Enum(() => MenuScope)
  scope: MenuScope = MenuScope.TENANT;

  /** Required permission slug – null means visible to everyone */
  @Property({ nullable: true })
  requiredPermission?: string;

  /** If true, a visual divider is rendered before this item */
  @Property({ default: false })
  hasDivider: boolean = false;

  /** Whether this menu node is active */
  @Property({ default: true })
  isActive: boolean = true;

  /** Self-referencing parent */
  @ManyToOne(() => MenuNode, { nullable: true })
  parent?: MenuNode;

  /** Children nodes */
  @OneToMany(() => MenuNode, node => node.parent)
  children = new Collection<MenuNode>(this);

  constructor(code: string, label: string, scope: MenuScope = MenuScope.TENANT) {
    super();
    this.code = code;
    this.label = label;
    this.scope = scope;
  }
}
