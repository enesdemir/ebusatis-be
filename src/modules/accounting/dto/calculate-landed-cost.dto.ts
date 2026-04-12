import { IsUUID, IsOptional, IsString, IsBoolean } from 'class-validator';

/**
 * Payload for triggering a landed cost calculation.
 *
 * The calculator pulls all related cost components automatically; the
 * caller only needs to identify the purchase order and (optionally)
 * the shipment to scope freight, customs and storage costs to.
 *
 * Set `applyToLines = true` to write the per-line landed unit cost
 * back to `purchase_order_lines.landed_unit_cost` in the same
 * transaction. The default is `true` because the most common use case
 * is computing once and immediately freezing the result on the lines.
 */
export class CalculateLandedCostDto {
  @IsUUID()
  purchaseOrderId!: string;

  @IsOptional()
  @IsUUID()
  shipmentId?: string;

  @IsOptional()
  @IsBoolean()
  applyToLines?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
