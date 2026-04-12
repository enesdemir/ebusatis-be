import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { MenuNode, MenuScope } from '../entities/menu-node.entity';

/** DTO returned by tree builder */
export interface MenuNodeDto {
  id: string;
  code: string;
  label: string;
  icon?: string;
  path?: string;
  sortOrder: number;
  scope: MenuScope;
  requiredPermission?: string;
  hasDivider: boolean;
  children: MenuNodeDto[];
}

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuNode)
    private readonly menuRepo: EntityRepository<MenuNode>,
  ) {}

  /**
   * Returns the full menu tree filtered by scope.
   * The tree is built in-memory from a flat list for performance.
   */
  async getTree(
    scope: 'PLATFORM' | 'TENANT' | 'ALL',
    userPermissions?: string[],
  ): Promise<MenuNodeDto[]> {
    const allNodes = await this.menuRepo.findAll({
      orderBy: { sortOrder: 'ASC' },
      populate: ['parent'],
    });

    const filtered = allNodes.filter((node) => {
      if (!node.isActive) return false;
      if (scope !== 'ALL') {
        if (node.scope !== MenuScope.BOTH && node.scope !== scope) return false;
      }
      if (node.requiredPermission && userPermissions) {
        return (
          userPermissions.includes(node.requiredPermission) ||
          userPermissions.includes('*')
        );
      }
      return true;
    });

    return this.buildTree(filtered);
  }

  /**
   * Builds a tree from a flat array of MenuNode entities.
   */
  private buildTree(nodes: MenuNode[]): MenuNodeDto[] {
    const map = new Map<string, MenuNodeDto>();
    const roots: MenuNodeDto[] = [];

    for (const node of nodes) {
      map.set(node.id, {
        id: node.id,
        code: node.code,
        label: node.label,
        icon: node.icon,
        path: node.path,
        sortOrder: node.sortOrder,
        scope: node.scope,
        requiredPermission: node.requiredPermission,
        hasDivider: node.hasDivider,
        children: [],
      });
    }

    for (const node of nodes) {
      const dto = map.get(node.id)!;
      const parentId = node.parent?.id;
      if (parentId && map.has(parentId)) {
        map.get(parentId)!.children.push(dto);
      } else {
        roots.push(dto);
      }
    }

    return roots;
  }

  /**
   * Returns all menu nodes (flat) for admin management.
   */
  async findAll(): Promise<MenuNode[]> {
    return this.menuRepo.findAll({
      orderBy: { sortOrder: 'ASC' },
      populate: ['parent'],
    });
  }

  /**
   * Creates a new menu node.
   */
  async create(data: {
    code: string;
    label: string;
    icon?: string;
    path?: string;
    sortOrder?: number;
    scope?: MenuScope;
    requiredPermission?: string;
    hasDivider?: boolean;
    parentId?: string;
  }): Promise<MenuNode> {
    const node = new MenuNode(
      data.code,
      data.label,
      data.scope ?? MenuScope.TENANT,
    );
    node.icon = data.icon;
    node.path = data.path;
    node.sortOrder = data.sortOrder ?? 0;
    node.requiredPermission = data.requiredPermission;
    node.hasDivider = data.hasDivider ?? false;
    if (data.parentId) {
      const parent = await this.menuRepo.findOne({ id: data.parentId });
      if (!parent) throw new NotFoundException('Parent menu node not found');
      node.parent = parent;
    }
    await this.menuRepo.getEntityManager().persistAndFlush(node);
    return node;
  }

  /**
   * Updates an existing menu node.
   */
  async update(
    id: string,
    data: Partial<{
      label: string;
      icon: string;
      path: string;
      sortOrder: number;
      scope: MenuScope;
      requiredPermission: string;
      hasDivider: boolean;
      isActive: boolean;
      parentId: string;
    }>,
  ): Promise<MenuNode> {
    const node = await this.menuRepo.findOne({ id });
    if (!node) throw new NotFoundException('Menu node not found');
    if (data.label !== undefined) node.label = data.label;
    if (data.icon !== undefined) node.icon = data.icon;
    if (data.path !== undefined) node.path = data.path;
    if (data.sortOrder !== undefined) node.sortOrder = data.sortOrder;
    if (data.scope !== undefined) node.scope = data.scope;
    if (data.requiredPermission !== undefined)
      node.requiredPermission = data.requiredPermission;
    if (data.hasDivider !== undefined) node.hasDivider = data.hasDivider;
    if (data.isActive !== undefined) node.isActive = data.isActive;
    if (data.parentId !== undefined) {
      const parent = await this.menuRepo.findOne({ id: data.parentId });
      node.parent = parent ?? undefined;
    }
    await this.menuRepo.getEntityManager().flush();
    return node;
  }

  /**
   * Soft-deletes a menu node by marking it inactive.
   */
  async remove(id: string): Promise<void> {
    const node = await this.menuRepo.findOne({ id });
    if (!node) throw new NotFoundException('Menu node not found');
    node.isActive = false;
    await this.menuRepo.getEntityManager().flush();
  }
}
