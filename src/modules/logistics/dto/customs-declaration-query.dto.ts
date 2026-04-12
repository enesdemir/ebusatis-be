import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';
import { CustomsStatus } from '../entities/customs-declaration.entity';

/**
 * Query DTO for listing customs declarations.
 */
export class CustomsDeclarationQueryDto extends PaginatedQueryDto {
  @IsOptional()
  @IsEnum(CustomsStatus)
  status?: CustomsStatus;

  @IsOptional()
  @IsUUID()
  shipmentId?: string;
}
