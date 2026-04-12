import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';
import { ClaimStatus, ClaimType } from '../entities/supplier-claim.entity';

/**
 * Query DTO for listing supplier claims.
 */
export class SupplierClaimQueryDto extends PaginatedQueryDto {
  @IsOptional()
  @IsEnum(ClaimStatus)
  status?: ClaimStatus;

  @IsOptional()
  @IsEnum(ClaimType)
  claimType?: ClaimType;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;

  @IsOptional()
  @IsUUID()
  goodsReceiveId?: string;
}
