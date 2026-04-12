import { PartialType } from '@nestjs/mapped-types';
import { CreateSalesOrderDto } from './create-sales-order.dto';

/**
 * Payload for updating a sales order. All fields optional.
 */
export class UpdateSalesOrderDto extends PartialType(CreateSalesOrderDto) {}
