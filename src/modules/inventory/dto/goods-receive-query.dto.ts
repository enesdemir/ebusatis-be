import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';
import { GoodsReceiveStatus } from '../entities/goods-receive.entity';

/**
 * Query DTO for listing goods receives.
 */
export class GoodsReceiveQueryDto extends PaginatedQueryDto {
  @IsOptional()
  @IsEnum(GoodsReceiveStatus)
  status?: GoodsReceiveStatus;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;

  @IsOptional()
  @IsUUID()
  shipmentId?: string;
}
