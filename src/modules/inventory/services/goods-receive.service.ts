import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { GoodsReceive, GoodsReceiveStatus } from '../entities/goods-receive.entity';
import { GoodsReceiveLine } from '../entities/goods-receive-line.entity';
import { InventoryService } from './inventory.service';
import { TenantContext } from '../../../common/context/tenant.context';
import { QueryBuilderHelper, PaginatedResponse } from '../../../common/helpers/query-builder.helper';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';
import { Tenant } from '../../tenants/entities/tenant.entity';

interface CreateGoodsReceiveDto {
  supplierId: string;
  warehouseId: string;
  note?: string;
  lines: Array<{
    variantId: string;
    rolls: Array<{
      barcode: string;
      quantity: number;
      batchCode?: string;
      locationId?: string;
      costPrice?: number;
    }>;
  }>;
}

@Injectable()
export class GoodsReceiveService {
  constructor(
    private readonly em: EntityManager,
    private readonly inventoryService: InventoryService,
  ) {}

  async findAll(query: PaginatedQueryDto): Promise<PaginatedResponse<GoodsReceive>> {
    return QueryBuilderHelper.paginate(this.em, GoodsReceive, query, {
      searchFields: ['receiveNumber'],
      defaultSortBy: 'receivedAt',
      populate: ['supplier', 'warehouse', 'createdBy'] as any,
    });
  }

  async findOne(id: string): Promise<GoodsReceive> {
    const gr = await this.em.findOne(GoodsReceive, { id }, {
      populate: ['supplier', 'warehouse', 'createdBy', 'lines', 'lines.variant'] as any,
    });
    if (!gr) throw new NotFoundException(`Mal kabul bulunamadı: ${id}`);
    return gr;
  }

  /**
   * Mal kabul oluştur ve topları sisteme kaydet.
   * Bu tek endpoint ile: GoodsReceive + GoodsReceiveLines + InventoryItems + InventoryTransactions hepsi oluşur.
   */
  async create(data: CreateGoodsReceiveDto, userId: string): Promise<GoodsReceive> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new BadRequestException('Tenant context bulunamadı');
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    // Numara üret (tenant-scoped)
    const count = await this.em.count(GoodsReceive, { tenant: tenantId } as any);
    const receiveNumber = `GR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const gr = this.em.create(GoodsReceive, {
      tenant,
      receiveNumber,
      supplier: this.em.getReference('Partner', data.supplierId),
      warehouse: this.em.getReference('Warehouse', data.warehouseId),
      note: data.note,
      createdBy: this.em.getReference('User', userId),
      status: GoodsReceiveStatus.COMPLETED,
      receivedAt: new Date(),
    } as any);
    this.em.persist(gr);

    // Her satır ve topları oluştur
    for (const lineData of data.lines) {
      let totalQty = 0;
      for (const rollData of lineData.rolls) {
        totalQty += rollData.quantity;
        // Top oluştur (InventoryItem + Transaction)
        await this.inventoryService.createRoll({
          variantId: lineData.variantId,
          barcode: rollData.barcode,
          quantity: rollData.quantity,
          batchCode: rollData.batchCode,
          warehouseId: data.warehouseId,
          locationId: rollData.locationId,
          costPrice: rollData.costPrice,
          receivedFromId: data.supplierId,
          goodsReceiveId: gr.id,
        }, userId);
      }

      const line = this.em.create(GoodsReceiveLine, {
        tenant,
        goodsReceive: gr,
        variant: this.em.getReference('ProductVariant', lineData.variantId),
        receivedRollCount: lineData.rolls.length,
        totalReceivedQuantity: totalQty,
      } as any);
      this.em.persist(line);
    }

    await this.em.flush();
    return gr;
  }
}
