import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  EntityRepository,
  EntityManager,
  FilterQuery,
} from '@mikro-orm/postgresql';
import { ClassificationNode } from '../entities/classification-node.entity';
import { ClassificationModules } from '../entities/classification-types';
import {
  CreateClassificationNodeDto,
  UpdateClassificationNodeDto,
  MoveNodeDto,
  ReorderDto,
} from '../dto';
import { EntityNotFoundException } from '../../../common/errors/app.exceptions';

/** DTO shape returned by toDto / buildTree */
export interface ClassificationNodeDto {
  id: string;
  classificationType: string;
  module: string;
  parentId: string | null;
  path: string;
  depth: number;
  code: string;
  key: string;
  names: Record<string, string>;
  descriptions?: Record<string, string>;
  properties?: Record<string, unknown>;
  tags?: string[];
  icon?: string;
  color?: string;
  isRoot: boolean;
  isSystem: boolean;
  isActive: boolean;
  selectable: boolean;
  sortOrder: number;
  children: ClassificationNodeDto[];
}

@Injectable()
export class ClassificationService {
  constructor(
    @InjectRepository(ClassificationNode)
    private readonly repo: EntityRepository<ClassificationNode>,
    private readonly em: EntityManager,
  ) {}

  // ════════════════════════════════════════════════════════
  //  TREE QUERIES
  // ════════════════════════════════════════════════════════

  /** Tip bazinda tum agaci dondur */
  async getTree(classificationType: string): Promise<ClassificationNodeDto[]> {
    const all = await this.repo.find(
      { classificationType },
      { orderBy: { sortOrder: 'ASC', names: 'ASC' }, populate: ['parent'] },
    );
    return this.buildTree(all);
  }

  /** Moduldeki tum classification tiplerinin ozetini dondur */
  async getSummary(
    module?: string,
  ): Promise<Array<{ type: string; module: string; count: number }>> {
    const qb = this.em
      .createQueryBuilder(ClassificationNode, 'c')
      .select([
        'c.classification_type as type',
        'c.module as module',
        'count(*) as count',
      ])
      .groupBy(['c.classification_type', 'c.module']);

    if (module) {
      qb.where({ module });
    }

    return qb.execute();
  }

  /** Tek dugum getir */
  async findOne(id: string): Promise<ClassificationNode> {
    const node = await this.repo.findOne({ id }, { populate: ['parent'] });
    if (!node) throw new EntityNotFoundException('ClassificationNode', id);
    return node;
  }

  /** Bir dugumun tum cocuklarini getir (recursive) */
  async getChildren(
    id: string,
    recursive = false,
  ): Promise<ClassificationNodeDto[]> {
    if (!recursive) {
      const nodes = await this.repo.find(
        { parent: id } as FilterQuery<ClassificationNode>,
        {
          orderBy: { sortOrder: 'ASC' },
          populate: ['parent'],
        },
      );
      return nodes.map((n) => this.toDto(n));
    }
    // Path-based recursive query
    const parent = await this.findOne(id);
    const all = await this.repo.find(
      {
        classificationType: parent.classificationType,
        path: { $like: `${parent.path}.%` },
      },
      { orderBy: { path: 'ASC', sortOrder: 'ASC' }, populate: ['parent'] },
    );
    return all.map((n) => this.toDto(n));
  }

  // ════════════════════════════════════════════════════════
  //  CRUD
  // ════════════════════════════════════════════════════════

  async create(
    dto: CreateClassificationNodeDto,
    tenantId?: string,
  ): Promise<ClassificationNode> {
    const module =
      (ClassificationModules as Record<string, string>)[
        dto.classificationType
      ] || 'other';

    const node = new ClassificationNode(
      dto.classificationType,
      module,
      dto.code,
      dto.names,
    );
    node.descriptions = dto.descriptions;
    node.properties = dto.properties;
    node.tags = dto.tags;
    node.icon = dto.icon;
    node.color = dto.color;
    node.isRoot = dto.isRoot ?? false;
    node.isSystem = dto.isSystem ?? false;
    node.selectable = dto.selectable ?? true;
    node.sortOrder = dto.sortOrder ?? 0;

    // Tenant
    if (tenantId) {
      node.tenant = this.em.getReference(
        'Tenant',
        tenantId,
      ) as unknown as typeof node.tenant;
    }

    // Parent
    if (dto.parentId) {
      const parent = await this.repo.findOne({ id: dto.parentId });
      if (!parent)
        throw new EntityNotFoundException('ClassificationNode', dto.parentId);
      node.parent = parent;
      node.depth = parent.depth + 1;
      node.path = `${parent.path}.${dto.code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    } else {
      node.depth = 0;
      node.path = `${dto.classificationType.toLowerCase()}.${dto.code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    }

    this.em.persist(node);
    await this.em.flush();
    return node;
  }

  async update(
    id: string,
    dto: UpdateClassificationNodeDto,
  ): Promise<ClassificationNode> {
    const node = await this.findOne(id);
    if (node.isSystem && dto.isActive === false) {
      throw new BadRequestException({
        error: 'SYSTEM_NODE_CANNOT_DEACTIVATE',
        message: 'errors.classification.system_node_cannot_deactivate',
      });
    }

    if (dto.names !== undefined) node.names = dto.names;
    if (dto.descriptions !== undefined) node.descriptions = dto.descriptions;
    if (dto.properties !== undefined)
      node.properties = { ...node.properties, ...dto.properties };
    if (dto.tags !== undefined) node.tags = dto.tags;
    if (dto.icon !== undefined) node.icon = dto.icon;
    if (dto.color !== undefined) node.color = dto.color;
    if (dto.isActive !== undefined) node.isActive = dto.isActive;
    if (dto.selectable !== undefined) node.selectable = dto.selectable;
    if (dto.sortOrder !== undefined) node.sortOrder = dto.sortOrder;

    await this.em.flush();
    return node;
  }

  async remove(id: string): Promise<void> {
    const node = await this.findOne(id);
    if (node.isSystem)
      throw new BadRequestException({
        error: 'SYSTEM_NODE_CANNOT_DELETE',
        message: 'errors.classification.system_node_cannot_delete',
      });

    // Child var mi kontrol et
    const childCount = await this.repo.count({
      parent: id,
    } as FilterQuery<ClassificationNode>);
    if (childCount > 0) {
      throw new BadRequestException({
        error: 'NODE_HAS_CHILDREN',
        message: 'errors.classification.node_has_children',
        metadata: { childCount },
      });
    }

    node.deletedAt = new Date();
    await this.em.flush();
  }

  // ════════════════════════════════════════════════════════
  //  TREE OPERATIONS
  // ════════════════════════════════════════════════════════

  /** Dugumu baska parent'a tasi */
  async move(id: string, dto: MoveNodeDto): Promise<ClassificationNode> {
    const node = await this.findOne(id);
    const newParent = await this.findOne(dto.newParentId);

    // Dongusal referans kontrolu
    if (await this.isDescendant(id, dto.newParentId)) {
      throw new BadRequestException({
        error: 'NODE_CANNOT_MOVE_TO_DESCENDANT',
        message: 'errors.classification.node_cannot_move_to_descendant',
      });
    }

    // Ayni tip olmali
    if (node.classificationType !== newParent.classificationType) {
      throw new BadRequestException(
        'Cannot move between different classification types',
      );
    }

    const oldPath = node.path;
    node.parent = newParent;
    node.depth = newParent.depth + 1;
    node.path = `${newParent.path}.${node.code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    // Alt agacin path'lerini guncelle
    await this.updateChildPaths(oldPath, node.path, node.classificationType);

    await this.em.flush();
    return node;
  }

  /** Cascade deaktif: Bir dugumu pasif yapinca tum alt agac pasif olur */
  async deactivate(id: string): Promise<void> {
    const node = await this.findOne(id);
    if (node.isSystem)
      throw new BadRequestException({
        error: 'SYSTEM_NODE_CANNOT_DEACTIVATE',
        message: 'errors.classification.system_node_cannot_deactivate',
      });

    node.isActive = false;
    // Alt agaci da deaktif et
    const descendants = await this.getChildren(id, true);
    for (const child of descendants) {
      child.isActive = false;
    }
    await this.em.flush();
  }

  /** Tekrar aktif et (sadece kendisi, cocuklar manuel) */
  async activate(id: string): Promise<void> {
    const node = await this.findOne(id);
    node.isActive = true;
    await this.em.flush();
  }

  /** Sibling siralama */
  async reorder(dto: ReorderDto): Promise<void> {
    for (const item of dto.items) {
      const node = await this.repo.findOne({ id: item.id });
      if (node) {
        node.sortOrder = item.sortOrder;
      }
    }
    await this.em.flush();
  }

  // ════════════════════════════════════════════════════════
  //  HELPERS
  // ════════════════════════════════════════════════════════

  /** nodeId, potentialDescendantId'nin alt agacinda mi? */
  private async isDescendant(
    nodeId: string,
    potentialDescendantId: string,
  ): Promise<boolean> {
    let current = await this.repo.findOne(
      { id: potentialDescendantId },
      { populate: ['parent'] },
    );
    while (current?.parent) {
      if (
        (current.parent as { id?: string }).id === nodeId ||
        current.parent.id === nodeId
      )
        return true;
      current = await this.repo.findOne(
        { id: current.parent.id },
        { populate: ['parent'] },
      );
    }
    return false;
  }

  /** Alt agacin path'lerini toplu guncelle */
  private async updateChildPaths(
    oldPathPrefix: string,
    newPathPrefix: string,
    type: string,
  ): Promise<void> {
    const descendants = await this.repo.find({
      classificationType: type,
      path: { $like: `${oldPathPrefix}.%` },
    });
    for (const desc of descendants) {
      desc.path = desc.path.replace(oldPathPrefix, newPathPrefix);
      desc.depth = desc.path.split('.').length - 1;
    }
  }

  /** Entity'yi serialize edilebilir DTO'ya cevir */
  private toDto(node: ClassificationNode): ClassificationNodeDto {
    return {
      id: node.id,
      classificationType: node.classificationType,
      module: node.module,
      parentId: (node.parent as { id?: string } | undefined)?.id || null,
      path: node.path,
      depth: node.depth,
      code: node.code,
      key: node.key,
      names: node.names,
      descriptions: node.descriptions,
      properties: node.properties,
      tags: node.tags,
      icon: node.icon,
      color: node.color,
      isRoot: node.isRoot,
      isSystem: node.isSystem,
      isActive: node.isActive,
      selectable: node.selectable,
      sortOrder: node.sortOrder,
      children: [],
    };
  }

  /** Flat listeden agac olustur (DTO olarak — circular ref yok) */
  private buildTree(nodes: ClassificationNode[]): ClassificationNodeDto[] {
    const map = new Map<string, ClassificationNodeDto>();
    const roots: ClassificationNodeDto[] = [];

    for (const node of nodes) {
      map.set(node.id, this.toDto(node));
    }

    for (const node of nodes) {
      const dto = map.get(node.id)!;
      const parentId = (node.parent as { id?: string } | undefined)?.id;
      if (parentId && map.has(parentId)) {
        map.get(parentId)!.children.push(dto);
      } else {
        roots.push(dto);
      }
    }

    return roots;
  }
}
