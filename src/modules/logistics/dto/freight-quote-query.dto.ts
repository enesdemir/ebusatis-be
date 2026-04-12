import { IsOptional, IsUUID } from 'class-validator';

/**
 * Query DTO for listing freight quotes.
 *
 * Quotes are typically scoped to a single shipment, so the only
 * supported filter is `shipmentId`. Pagination is not needed because
 * the number of quotes per shipment is small (typically < 10).
 */
export class FreightQuoteQueryDto {
  @IsOptional()
  @IsUUID()
  shipmentId?: string;
}
